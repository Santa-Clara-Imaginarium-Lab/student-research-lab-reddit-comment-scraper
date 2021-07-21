module.exports.run = async (client) => {
    const prompt = require("prompt-sync")(); // A sync prompt for node. very simple. no C++ bindings and no bash scripts. 
    const snoowrap = require("snoowrap"); // fully-featured JavaScript wrapper that provides a simple interface to access every reddit API endpoint
    const fs = require("fs"); // provides a lot of very useful functionality to access and interact with the file system
    const dayjs = require("dayjs"); // JavaScript date library for parsing, validating, manipulating, and formatting dates  
    const json2csv = require("json2csv"); // convert json to csv 

    const redditFetch = new snoowrap({ // Pass in a username and password for script-type apps.
        userAgent: client.config.api.subreddit.user_agent, // A user agent header is a string of text that is sent with HTTP requests to identify the program making the request (the program is called a "user agent"). Web browsers commonly send these in order to identify themselves (so the server can tell if you"re using Chrome or Firefox, for example).
        clientId: client.config.api.subreddit.client_id, // client id needed to access Reddit’s API as a script application
        clientSecret: client.config.api.subreddit.client_secret, // client secret needed to access Reddit’s API as a script application
        username: client.config.api.subreddit.username, // my reddit username 
        password: client.config.api.subreddit.password // my reddit password
    });

    redditFetch.config({ requestDelay: 10000}); // delay request to 10 seconds  
 
    async function scrapeSubreddit() {   
        let data = [];     
        const redditPostID = prompt("Enter your subreddit post ID: ");
        try {
            redditFetch.getSubmission(redditPostID).expandReplies()
            .then(thread => {   
                thread.comments.forEach((comment) => { //attempts to loop through entire comment thread to no avail xd - will have to adjust to scan for all comments in respective post threads
                    const results = { 
                        "SUBREDDIT NAME": comment.subreddit.display_name, // displayed name of subreddit
                        "USER NAME": comment.author.name,   // displayed reddit username of author 
                        "COMMENT ID": comment.name, // comment id
                        "COMMENT PERMALINK": `https://reddit.com/${comment.permalink}`,
                        "COMMENT CREATED": dayjs(comment.created_utc * 1000).format("YYYY-DD-MM h:mm:ss A"), // the date the comment was created in this format: 2021-09-07 11:41:00 PM
                        "COMMENT TEXT": comment.body, // comment body
                        "COMMENT UPVOTES": comment.score // amount of upvotes on comment 
                    }; 
    
                    for (let k = 0; k < comment.post_num; k++) {
                        if (comment.pos_num === 0) {
                            continue;
                        } else {
                            scrapeSubreddit();
                        }
    
                        if (comment.author.name === "AutoModerator" || comment.author.name === "[deleted]") continue;  
                    }  
    
                    data.push(results); //push object to array but change how I write code to push "results" object to the "data" array so that the respective Reddit comments on posts won't constantly duplicate the CSV headers in the "redditComments.csv."
    
                    const stream = fs.createWriteStream(`qualityRedditComments.csv`, {"flags": "a", "encoding": "utf-8"});  // "a" flag opens the file for writing, positioning the stream at the end of the file. The file is created if it does not exist
                    stream.write(json2csv.parse(results)); // writes to text file ; made this a csv file for better file readability and organization);  
                    
                    console.log(`... Done. Successfully scraped ${data.length} comments.`);
                });
            }).catch({statusCode: 429}, function() {}); // get your respective post from the subreddit and catch error 429 just in case  
        } catch (err) {
            if (err) return;
        }
    }; 
    scrapeSubreddit(); //scrapes across all posts and comments without triggering Reddit API limits - could potentially accommodate to increase amount without compromising thresholds 
}; 