module.exports.run = async (client) => {
    const subreddits = require("../functions/subredditList.js"); //references list of wanted subreddits here
    const snoowrap = require("snoowrap"); // fully-featured JavaScript wrapper that provides a simple interface to access every reddit API endpoint
    const fs = require("fs"); // provides a lot of very useful functionality to access and interact with the file system
    const dayjs = require("dayjs"); // JavaScript date library for parsing, validating, manipulating, and formatting dates 
    const subredditsList = subreddits.array; 
    const json2csv = require("json2csv"); // convert json to csv
    const entities = require("entities"); // decodes html entities (e.g. &amp; becomes &, &quot; becomes ", &lt becomes <, &gt; becomes >)
    const vader = require("vader-sentiment"); // Javascript port of the VADER sentiment analysis tool. Sentiment from text can be determined in-browser or in a Node.js app.
    const getPostLimit = 50; // limit to 50 reddit posts
    const getCommentsLimit = 30; // limit to get 30 comments per thread
    const requestDelay = 5000; // delay request to 5 seconds 

    // Pass in a username and password for script-type apps.
    const redditFetch = new snoowrap({
        userAgent: client.config.api.subreddit.user_agent, // A user agent header is a string of text that is sent with HTTP requests to identify the program making the request (the program is called a "user agent"). Web browsers commonly send these in order to identify themselves (so the server can tell if you"re using Chrome or Firefox, for example).
        clientId: client.config.api.subreddit.client_id, // client id needed to access Reddit’s API as a script application
        clientSecret: client.config.api.subreddit.client_secret, // client secret needed to access Reddit’s API as a script application
        username: client.config.api.subreddit.username, // my reddit username 
        password: client.config.api.subreddit.password // my reddit password
    });

    redditFetch.config({ requestDelay: requestDelay}); 

    function getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    function weightedScore ( positiveScore, upvotes, postImpressions) {
        let newScore, upvoteRatio;

        upvoteRatio = upvotes / postImpressions;
        newScore = positiveScore * 10;

        if (upvoteRatio < 0.20) {
            newScore = newScore + 1.5;
        } else if (upvoteRatio < 0.25) {
            newScore = newScore + 2;
        } else if (upvoteRatio < 0.30) {
            newScore = newScore + 2.5;
        } else if (upvoteRatio < 0.35) {
            newScore = newScore + 2.5;
        } else if (upvoteRatio < 0.45) {
            newScore = newScore + 3.0;
        } else if (upvoteRatio < 0.55) {
            newScore = newScore + 3.5;
        } else if (upvoteRatio < 0.65) {
            newScore = newScore + 4.0;
        } else {
            newScore = newScore + 5;
        }

        //Maximum weighted score is 10
        if (newScore > 10) newScore = 10;

        return newScore;
    } 
  
     async function scrapeSubreddit() {
        let scrapedPosts = [];
        let data = []; 
        let tempIndex;

        for (let i = 0; i < subredditsList.length; i++) {
            for (let j = 0; j < getPostLimit; j++) {
                // get random post from subreddit
                const post = await redditFetch.getRandomSubmission(subredditsList[i]);

                if (!post.id) {
                    console.log(`Searching in subreddit: r/${subredditsList[i]}`);
                    continue;
                } else if (scrapedPosts.includes(post.id)) {
                    j--;
                    continue;
                } else {
                    let scrapedComments = [];  

                    //Now, we should grab all of the comments under that post
                    console.log(`Found random post ID: ${post.name}`);

                    scrapedPosts.push(post.name);

                    for (let k = 0; k < post.num_comments; k++) {
                        tempIndex = getRandomInt(post.num_comments);

                        if (scrapedComments.includes(tempIndex)) continue;

                        scrapedComments.push(tempIndex);

                        if(!post.comments[tempIndex]) break;
                        // We take a maximum of 20 comments per post
                        else if (k == getCommentsLimit) break;
                        // It avoids comments from bots
                        else if (post.comments[tempIndex].author.name === "AutoModerator") continue;

                        let comment = post.comments[tempIndex];

                        const sentimentScores = vader.SentimentIntensityAnalyzer.polarity_scores(comment.body);
                        let commentText = comment.body.replace(/[\n\r]+/g, " ");

                        posScoreWeight = weightedScore (sentimentScores.pos, comment.score, post.score + post.num_comments);
                        
                        /* The pos, neu, and neg scores are ratios for proportions of text that fall in each category (so these should all add up to be 1... or close 
                        to it with float operation). These are the most useful metrics if you want multidimensional measures of sentiment for a given sentence. */
                        
                        const results = { 
                            SUBREDDIT_NAME: post.subreddit.display_name,
                            USER_NAME: comment.author.name,  
                            POST_TITLE: post.title,
                            POST_TEXT: entities.decodeHTML(post.selftext),
                            POST_ID: post.name,
                            POST_URL: post.url,
                            POST_UPVOTES: post.score,
                            COMMENT_ID: comment.name,
                            COMMENT_CREATED_UTC: dayjs(comment.created_utc * 1000).format("YYYY-DD-MM h:mm:ss A"),
                            COMMENT_TEXT: entities.decodeHTML(commentText),
                            COMMENT_UPVOTES: comment.score,
                            COMMENT_NEG_SCORE: sentimentScores.neg, // compound score <= -0.05
                            COMMENT_NEU_SCORE: sentimentScores.neu, // ( compound score > -0.05 ) and ( compound score < 0.05 )
                            COMMENT_POS_SCORE: sentimentScores.pos, // compound score >= 0.05
                            COMMENT_COMP_SCORE: sentimentScores.compound, // The compound score is computed by summing the valence scores of each word in the lexicon, adjusted according to the rules, and then normalized to be between -1 (most extreme negative) and +1 (most extreme positive).
                            COMMENT_POS_SCORE_WEIGHTED: posScoreWeight
                        }; 

                        data.push(results);


                        const stream = fs.createWriteStream(`redditComments.csv`, {"flags": "a", "encoding": "utf-8"});  // writes to text file ; made this a csv file for better file readability and organization); 
                        stream.write(json2csv.parse(results));
                    } 
                }   
            }    
            
            j = 0; 
        }
        
        console.log(`... Done. Successfully scraped ${data.length} comments.`)
    }
    scrapeSubreddit();
}