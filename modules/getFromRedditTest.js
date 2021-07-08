module.exports.run = async (client) => {
    const subreddits = require("../functions/subredditList.js"); 
    const snoowrap = require("snoowrap");
    const fs = require("fs");
    const moment = require("moment"); 
    const subredditsList = subreddits.array; 
    const getPostLimit = 50;
    const getCommentsLimit = 30;
    const requestDelay = 1200;

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

    async function userEmailVerified (username) {
        const emailIsVerified = false;

        const trophies = await redditFetch.getUser(username).getTrophies();
        
        for (const i = 0; i < trophies.trophies.length; i++) {
            if (trophies.trophies[i].award_id === "o") {
                emailIsVerified = true;
                break;
            }
        }
        return emailIsVerified;
    }

    async function karmaToCakedayRatio(username) {
        let now, createdMoment, createdDaysAgo, karma;

        let userCreatedUtc = await redditFetch.getUser(username).fetch().created_utc;

        now = moment();
        createdMoment = moment.unix(userCreatedUtc);
        //Converts UTC created time to days ago that account was created
        createdDaysAgo = now.diff(createdMoment, "days");

        karma = await redditFetch.getUser(username).comment_karma;

        if (karma < 0) {
            return 0;
        } else {
            return karma / createdDaysAgo;
        }
    }

    function usernameBreakdown(username) {
        let containsSex = false, containsGender = false;
    
        let s = username.toLowerCase()
    
        if (s.includes("boy") || s.includes("girl") || s.includes("man") || 
            s.includes("woman") || s.includes("men") || s.includes("women")) {
                containsSex = true;
        }

        if (s.includes("guy") || s.includes("male") || s.includes("female") || s.includes("gay") || s.includes("lesbian") || 
            s.includes("transs") || s.includes("transg") || s.includes("gender") || s.includes("queer") ||
            s.includes("sexual") || s.includes("binary") || s.includes("cis")) {
                containsGender = true;
        }
    
        let object = {
            containsSex: containsSex,
            containsGender: containsGender
        }
    
        return object;
    }

    async function anonScore (username) {
        //anonymous scores start at 10
        let score = 10, emailIsVerified = false, karmaRatio, usernameInfo;
        
        if (username === "[deleted]") {
            emailIsVerified = false;
        } else if (userEmailVerified (username)) {
            emailIsVerified = true;
            score -= 1;
        }

        //Can't use comment to cake day ratio because API limits comments to 25 posts

        if (username !== "[deleted]") {
            //instead, use karma to cake day ratio

            karmaRatio = karmaToCakedayRatio (username);

            if (karmaRatio >= 10) score -= 3;
            else if (karmaRatio >= 8) score -= 2.75;
            else if (karmaRatio >= 6) score -= 2.50;
            else if (karmaRatio >= 4) score -= 2.25;
            else if (karmaRatio >= 2) score -= 2.00;
            else if (karmaRatio >= 1.50) score -= 1.50;
            else if (karmaRatio >= 1.00) score -= 1.00;
            else if (karmaRatio >= 0.66) score -= 0.50;
            else if (karmaRatio >= 0.33) score -= 0.25;
            else if (karmaRatio > 0) score -= 0.10;

            usernameInfo = usernameBreakdown (username);

            if (usernameInfo.containsSex) {
                score -= 3;
            } 

            if (usernameInfo.containsGender) {
                score -= 3;
            }   
        }

        if (score < 0) score = 0;

        let object = {
            emailIsVerified: emailIsVerified,
            score: score
        };

        return object;
    } 

     async function scrapeSubreddit() {
        let scrapedPosts = [];
        let data = []; 
        let tempIndex;

        for (const i = 0; i < subredditsList.length; i++) {
            for (const j = 0; j < getPostLimit; j++) {
                // get random post from subreddit
                const post = await redditFetch.getRandomSubmission(subredditList[i]);

                if (!post.id) {
                    console.log(`Searching in subreddit: r/${subredditsList[i]}`);
                    continue;
                } else if (scrapedPosts.includes(post.id)) {
                    j--;
                    continue;
                } else {
                    let scrapedComments = []; 
                    const stream = fs.createWriteStream(`./redditComments/${dayjs(post.data.created_utc * 1000).format("YYYY-DD-MM")}_${post.data.link_flair_text || "no_flair"}_${post.data.id}.csv`, { flags: "a"});

                    //Now, we should grab all of the comments under that post
                    console.log(`Found random post ID: ${post.name}`);

                    for (const k = 0; k < post.num_comments; k++) {
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

                        userAnonScoreObj = anonScore (comment.author.name);
                        posScoreWeight = weightedScore (sentimentScores.pos, comment.score, post.score + post.num_comments);
                        
                        const results = {
                            POST_ID: post.name,
                            POST_URL: post.url,
                            POST_UPVOTES: post.score,
                            POST_TITLE: post.title,
                            SUBREDDIT_NAME: post.subreddit.display_name,
                            USER_NAME: comment.author.name,
                            USER_EMAIL_VERIFIED: userAnonScoreObj.emailIsVerified,
                            USER_ANON_SCORE: userAnonScoreObj.score,
                            COMMENT_ID: comment.name,
                            COMMENT_CREATED_UTC: comment.created_utc,
                            COMMENT_TEXT: commentText,
                            COMMENT_UPVOTES: comment.score,
                            COMMENT_NEG_SCORE: sentimentScores.neg,
                            COMMENT_NEU_SCORE: sentimentScores.neu,
                            COMMENT_POS_SCORE: sentimentScores.pos,
                            COMMENT_COMP_SCORE: sentimentScores.compound,
                            COMMENT_POS_SCORE_WEIGHTED: posScoreWeight
                        };

                        data.push(results);

                        let results_csv = post.name + "|||" + post.url + "|||" + post.score + "|||" + 
                            post.title + "|||" + post.subreddit.display_name + "|||" + comment.author.name + "|||" +
                            user_anon_score_obj.email_is_verified + "|||" + user_anon_score_obj.score + "|||" +
                            comment.name + "|||" + comment.created_utc + "|||" + comment_text + "|||" + 
                            comment.score + "|||" + sentiment_scores.neg + "|||" + sentiment_scores.neu + "|||" +
                            sentiment_scores.pos + "|||" + sentiment_scores.compound + "|||" + pos_score_weig + "\n";

                        stream.write(results_csv);
                    }
                } 

            j = 0;
            
            }   

            console.log(`... Done. Successfully scraped ${data.length} comments.`)
        }
    }
    scrapeSubreddit();
}