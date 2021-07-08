module.exports.run = async (client) => {
  //packages, external libraries, and functions I need to properly garner information
  const { MessageEmbed } = require(`discord.js`); // powerful library for interacting with the Discord API
  const json2csv = require("json2csv"); // convert json to csv
  const dayjs = require("dayjs"); // JavaScript date library for parsing, validating, manipulating, and formatting dates
  const snoowrap = require("snoowrap"); // fully-featured JavaScript wrapper that provides a simple interface to access every reddit API endpoint
  const fs = require("fs"); // provides a lot of very useful functionality to access and interact with the file system
  const request = require("request"); // simplest way to make http calls [deprecated library but who cares xd - it works!]
  const entities = require("entities"); // decodes html entities (e.g. &amp; becomes &, &quot; becomes ", &lt becomes <, &gt; becomes >)
  const validUrl = require("valid-url"); // checks if a url is valid
  const { log } = require(`../functions/log.js`); // allows message embed to be sent to channel

  const botReady = true; 
  
  setInterval(async () => {
    try { 
      const sortBy = ["new", "top", "hot", "rising"];
      const getSortBy = sortBy[Math.floor(Math.random() * sortBy.length)];
      if (botReady) {
        request({
          url: `https://reddit.com/r/${client.config.api.subreddit.name}/${getSortBy}.json?limit=10`, //every time, randomize between new, random, top, or rising for more varied posts
          json: true,
        }, (error, response, body) => {
          if (!error && response.statusCode === 200) { // Means your request was successful and the server responded with the data you were requesting. Sometimes, you might want to use this information to make decisions in your code: if response
            for (const post of body.data.children.reverse()) { // runs for loop through elements nested under body.data.children (json object) for the subreddit post
              const lastTimestamp = post.data.created_utc;
              if (lastTimestamp <= post.data.created_utc) {

                /*
                  The Reddit Metadata Template: 
                    - [Day of Week, Month, Day Number, Year (Time Zone)]
                    - [Subreddit Name] | [Subreddit Subscriber Count]
                    - [[Subreddit Post Flair] [Post Title]]
                    - [Subreddit Post ID]
                    - [Subreddit Post Description]
                    - [Subreddit Comment Thread Replies]
                    - [Subreddit Post Thumbnail (defaults to "null" if none)]
                    - [Self post or Link Post by Subreddit Post Author] | [Amount of Upvotes] | [Amount of Downvotes] | [Amount of Comments]
                */

                // Pass in a username and password for script-type apps.
                const redditFetch = new snoowrap({
                  userAgent: client.config.api.subreddit.user_agent, // A user agent header is a string of text that is sent with HTTP requests to identify the program making the request (the program is called a "user agent"). Web browsers commonly send these in order to identify themselves (so the server can tell if you're using Chrome or Firefox, for example).
                  clientId: client.config.api.subreddit.client_id, // client id needed to access Reddit’s API as a script application
                  clientSecret: client.config.api.subreddit.client_secret, // client secret needed to access Reddit’s API as a script application
                  username: client.config.api.subreddit.username, // my reddit username 
                  password: client.config.api.subreddit.password // my reddit password
                });
    
                const redditPost = new MessageEmbed()
                  .setColor(client.config.school_color)
                  .setAuthor(`${post.data.subreddit_name_prefixed} | ${post.data.subreddit_subscribers} Subscribers`, client.user.displayAvatarURL()) // displays author's username
                  .setTitle(`${post.data.link_flair_text ? `[${post.data.link_flair_text}] ` : ""}${entities.decodeHTML(post.data.title.length > 256 ? post.data.title.slice(0, 256).concat("...") : post.data.title)}`) // gets the post's title; anything over 256 is appended with ellipses
                  .setURL(`https://redd.it/${post.data.id}`) // attaches URL of reddit post here
                  .setDescription(`${post.data.is_self ? entities.decodeHTML(post.data.selftext.length > 2048 ? post.data.selftext.slice(0, 2048).concat("...") : post.data.selftext) : ""}`) // posts descriptions; anything over 2048 is appended with ellipses            
                  .setThumbnail(validUrl.isUri(post.data.thumbnail) ? entities.decodeHTML(post.data.thumbnail) : null)
                  .setFooter(`[${post.data.is_self ? "Self Post" : "Link Post"} by /u/${post.data.author}] | [${post.data.ups} 👍] | [${post.data.downs} 👎 ] | [${post.data.num_comments} 📃]`) // determines if author's post is a self post or link post
                  .setTimestamp(new Date(post.data.created_utc * 1000)) // gets time relative to one's time zone (e.g. PST) when the author posted
                
                // gather submission comment thread's replies and console logs content of each comment assuming there is at least one comment
                  redditFetch.getSubmission(post.data.id).expandReplies()
                  .then(thread => {  // comment format: [ [author flair text] [comment body] by (comment author name) posted on (comment date) from (comment url)]
                    thread.comments.forEach((comment) => //attempts to loop through entire comment thread to no avail xd - will have to adjust to scan for all comments in respective post threads
                      console.log(`[[${comment.body.author_flair_text || "no flair"}] ${comment.body}] by ${comment.author.name} posted on ${dayjs(post.data.created_utc * 1000).format("YYYY-DD-MM")} from http://reddit.com${comment.permalink}`))
                  }).catch({statusCode: 429}, function() {}); //use snoowrap function and ignore all 429 errors  
                // gets post data id of the post and names it as such appended by ".csv" in my /redditPosts/ file directory on my Raspberry Pi   
                // get file name to be this format: [date_post-flair_post-data-id.csv]

                fs.writeFileSync(`./redditPosts/${dayjs(post.data.created_utc * 1000).format("YYYY-DD-MM")}_${post.data.link_flair_text || "no_flair"}_${post.data.id}.csv`, json2csv.parse(redditPost), {"encoding": "utf-8"});  // writes to text file ; made this a csv file for better file readability and organization
                redditPost.attachFiles(`./redditPosts/${dayjs(post.data.created_utc * 1000).format("YYYY-DD-MM")}_${post.data.link_flair_text || "no_flair"}_${post.data.id}.csv`); // attaches file to each respective redditPost embed that's sent every 10 minutes

                log(client, client.config.channels.reddit, redditPost); // sends to the #reddit-feed channel  
              };
            };
          } else {
              log(client, client.config.channels.auditlogs, { embed: { description: `Request failed - Reddit could be down or the subreddit doesn"t exist. Will continue.`, color: client.config.school_color}});
          }
        });
      }
    } catch (err) {
        if (err) return;
    };
  }, 600 * 1000); // get 10 new posts every 10 minutes!   
};