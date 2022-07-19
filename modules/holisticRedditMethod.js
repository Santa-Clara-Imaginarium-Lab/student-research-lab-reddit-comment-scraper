require("dotenv").config();
const subreddits = require("../functions/subredditList.js"); //references list of wanted subreddits here
const snoowrap = require("snoowrap"); // fully-featured JavaScript wrapper that provides a simple interface to access every reddit API endpoint
const fs = require("fs"); // provides a lot of very useful functionality to access and interact with the file system
const dayjs = require("dayjs"); // JavaScript date library for parsing, validating, manipulating, and formatting dates 
const subredditsList = subreddits.array; 
const json2csv = require("json2csv"); // convert json to csv
const entities = require("entities"); // decodes html entities (e.g. &amp; becomes &, &quot; becomes ", &lt becomes <, &gt; becomes >)
const vader = require("vader-sentiment"); // Javascript port of the VADER sentiment analysis tool. Sentiment from text can be determined in-browser or in a Node.js app.
const getPostLimit = 2500; // limit to 2500 reddit posts
const getCommentsLimit = 1250; // limit to get 1250 comments per thread  

/*

redditFetch is a snoowrap object. snoowrap is a library that wraps the Reddit 
API. The snoowrap library is a wrapper around the Reddit API. The snoowrap 
library provides a simple interface to access every Reddit API endpoint.

*/

const redditFetch = new snoowrap({ // Pass in a username and password for script-type apps.
    userAgent: process.env.USER_AGENT, // A user agent header is a string of text that is sent with HTTP requests to identify the program making the request (the program is called a "user agent"). Web browsers commonly send these in order to identify themselves (so the server can tell if you"re using Chrome or Firefox, for example).
    clientId: process.env.CLIENT_ID, // client id needed to access Reddit’s API as a script application
    clientSecret: process.env.CLIENT_SECRET, // client secret needed to access Reddit’s API as a script application
    username: process.env.USER_NAME, // my reddit username 
    password: process.env.PASS_WORD // my reddit password
});

redditFetch.config({ requestDelay: 10000}); // delay request to 10 seconds  

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
};

function weightedScore ( positiveScore, upvotes, postImpressions) {
    let newScore, upvoteRatio;

    upvoteRatio = upvotes / postImpressions; // postImpressions are post.score + post.num_comments
    newScore = positiveScore * 10; // sentiment.pos * 10 

    if (upvoteRatio < 0.20) {
        newScore +=  1.5;
    } else if (upvoteRatio < 0.25) {
        newScore += 2;
    } else if (upvoteRatio < 0.30) {
        newScore += 2.5;
    } else if (upvoteRatio < 0.35) {
        newScore += 2.5;
    } else if (upvoteRatio < 0.45) {
        newScore += 3.0;
    } else if (upvoteRatio < 0.55) {
        newScore += 3.5;
    } else if (upvoteRatio < 0.65) {
        newScore += 4.0;
    } else {
        newScore += 5.0;
    } 
    
    if (newScore > 10) newScore = 10; // Maximum weighted score is 10

    return newScore;
}; 

/*

1. We loop through the subreddits defined in the module exports file.
2. We loop through the amount of posts defined in the module exports file.
3. We get a random post from the subreddit.
4. If the post is not found, we log the subreddit and continue to the next subreddit.
5. If the post is found, we log the subreddit and continue to the next subreddit.
6. We then check if the post id is already in the scraped posts array.
7. If the post id is already in the scraped posts array, we decrement the j counter and continue to the last control flow statement.
8. If the post id is not in the scraped posts array, we log the post id and continue to the next control flow statement.
9. We then grab all of the comments under that post in that subreddit.
10. We then loop through the amount of comments defined in the module exports file.
11. We get a random comment from the post.
12. If the comment is not found, we continue to the next comment.
13. If the comment is found, we log the comment and continue to the next comment.
14. We then check if the comment id is already in the scraped comments array.
15. If the comment id is already in the scraped comments array, we continue to the next comment.
16. If the comment id is not in the scraped comments array, we log the comment id and continue to the next control flow statement.
17. We then grab the sentiment scores of the comment.
18. We then calculate the weighted score of the comment.
19. We then create a results object.
20. We then push the results object to the data array.
21. We then create a stream.
22. We then write the results object to the stream.
23. We then log the results object.
24. We then increment the j counter.
25. We then continue to the next control flow statement.
26. We then log the amount of comments, posts, and subreddits scraped. 

*/
 
async function scrapeSubreddit() {
    let scrapedPosts = [];
    let data = []; 
    let tempIndex;

    for (let i = 0; i < subredditsList.length; i++) { // loop through amount of subreddits defined in module exports file
        for (let j = 0; j < getPostLimit; j++) {  // loop through amount of posts as specified by the static limit
            const post = await redditFetch.getRandomSubmission(subredditsList[i]).catch({statusCode: 429}, function() {}); // get random post from subreddit and catch error 429 just in case

            if (!post.id) {
                console.log(`Searching in subreddit: r/${subredditsList[i]}`);
                continue;
            } else if (scrapedPosts.includes(post.id)) { // if scraped posts array already includes the post id, decrement j then continue to last control flow  statement
                j--;
                continue;
            } else {
                let scrapedComments = [];  

                console.log(`Found random post ID [${post.name}] in /r/${post.subreddit.display_name}`);  // Now, we should grab all of the comments under that post in that subreddit

                scrapedPosts.push(post.name);

                for (let k = 0; k < post.num_comments; k++) {
                    tempIndex = getRandomInt(post.num_comments); 
                    if (scrapedComments.includes(tempIndex)) continue; 
                    scrapedComments.push(tempIndex);

                    if(!post.comments[tempIndex]) break; // We take a maximum of 2500 comments per post
                    else if (k === getCommentsLimit) break;
                    else if (post.comments[tempIndex].author.name === "AutoModerator" || post.comments[tempIndex].author.name === "[removed]" || post.comments[tempIndex].author.name === "[deleted]") continue; //authors who are "AutoModerator" bots, author comments that have been removed, or authors who deleted comments will be ignored

                    const sentimentScores = vader.SentimentIntensityAnalyzer.polarity_scores(post.comments[tempIndex].body);
                    let commentText = post.comments[tempIndex].body.replace(/[\n\r]+/g, " ");

                    posScoreWeight = weightedScore (sentimentScores.pos, post.comments[tempIndex].score, post.score + post.num_comments);
                    
                    /* The pos, neu, and neg scores are ratios for proportions of text that fall in each category (so these should all add up to be 1... or close 
                    to it with float operation). These are the most useful metrics if you want multidimensional measures of sentiment for a given sentence. */

                    const results = {  
                        "SUBREDDIT NAME": post.subreddit.display_name, // displayed name of subreddit
                        "USER NAME": post.comments[tempIndex].author.name,   // displayed reddit username of author
                        "POST TITLE": entities.decodeHTML(post.title), // post title
                        "POST CREATED": dayjs(post.created_utc * 1000).format("YYYY-DD-MM h:mm:ss A"), // the date the post was created in this format: 2021-09-07 11:41:00 PM
                        "POST TEXT": entities.decodeHTML(post.selftext), // post body
                        "POST ID": post.name, // post id
                        "POST URL": post.url, // post uniform resource locator
                        "POST UPVOTES": post.score,  // amount of upvotes on post
                        "POST COMMENT AMOUNT": post.num_comments, // amount of comments on the post
                        "COMMENT ID": post.comments[tempIndex].name, // comment id
                        "COMMENT CREATED": dayjs(post.comments[tempIndex].created_utc * 1000).format("YYYY-DD-MM h:mm:ss A"), // the date the comment was created in this format: 2021-09-07 11:41:00 PM
                        "COMMENT TEXT": entities.decodeHTML(commentText), // comment body
                        "COMMENT UPVOTES": post.comments[tempIndex].score, // amount of upvotes on comment
                        "NEG COMMENT SCORE": sentimentScores.neg, // compound score <= -0.05
                        "NEU COMMENT SCORE": sentimentScores.neu, // ( compound score > -0.05 ) and ( compound score < 0.05 )
                        "POS COMMENT SCORE": sentimentScores.pos, // compound score >= 0.05 
                        "COMP COMMENT SCORE": sentimentScores.compound, // The compound score is computed by summing the valence scores of each word in the lexicon, adjusted according to the rules, and then normalized to be between -1 (most extreme negative) and +1 (most extreme positive).
                        "WEIGHTED POS COMMENT SCORE": posScoreWeight, // calculate positive weighted comment score out of 10 points maximum
                    }; 

                    data.push(results); //push object to array but change how I write code to push "results" object to the "data" array so that the respective Reddit comments on posts won't constantly duplicate the CSV headers in the "redditComments.csv."

                    const stream = fs.createWriteStream(`./redditComments/holisticRedditComments.csv`, {"flags": "a", "encoding": "ascii"});  // "a" flag opens the file for writing, positioning the stream at the end of the file. The file is created if it does not exist
                    stream.write(json2csv.parse(results)); // writes to text file ; made this a csv file for better file readability and organization); 
                }; 
            };   
        };    
        
        j = 0; 
    };
    
    console.log(`... Done. Successfully scraped ${data.length} comments.`);
};
await scrapeSubreddit(); //scrapes across all posts and comments throughout the subreddits listed in the module export without triggering Reddit API limits - could potentially accommodate to increase amount without compromising thresholds