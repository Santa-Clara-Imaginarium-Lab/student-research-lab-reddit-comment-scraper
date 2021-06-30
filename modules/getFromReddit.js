module.exports.run = async (client) => {
  const { MessageEmbed } = require(`discord.js`); 
  const json2csv = require("json2csv");
  const moment = require("moment");
  const snoowrap = require("snoowrap");
  const fs = require("fs");
  const request = require("request");
  const entities = require("entities");
  const validUrl = require("valid-url");
  const { log } = require(`../functions/log.js`);
  const botReady = true; 
  
  const feedMSG = {
    title: `r/${client.config.api.subreddit.name} Feed Ready!`,
    description: `[/r/${client.config.api.subreddit.name}](https://reddit.com/r/${client.config.api.subreddit.name}) feed works! ✅`,
    color: "GREEN", 
    timestamp: new Date()
  }
  
  console.log(feedMSG.title);
  log(client, client.config.channels.auditlogs, { embed: feedMSG });
  
    setInterval(async () => {
      const sortBy = ["new", "top", "hot", "rising"];
      const getSortBy = sortBy[Math.floor(Math.random() * sortBy.length)];
      if (botReady) {
        try {
          request({
            url: `https://reddit.com/r/${client.config.api.subreddit.name}/${getSortBy}.json?limit=10`, //every time, randomize between new, random, top, or rising for more varied posts
            json: true,
          }, (error, response, body) => {
            if (!error && response.statusCode === 200) {
              for (const post of body.data.children.reverse()) {
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
                    userAgent: client.config.api.subreddit.user_agent,
                    clientId: client.config.api.subreddit.client_id,
                    clientSecret: client.config.api.subreddit.client_secret,
                    username: client.config.api.subreddit.username,
                    password: client.config.api.subreddit.password
                  })
     
                  const redditPost = new MessageEmbed()
                    .setColor(client.config.school_color)
                    .setAuthor(`${post.data.subreddit_name_prefixed} | ${post.data.subreddit_subscribers} Subscribers`, client.user.displayAvatarURL()) //displays author's username
                    .setTitle(`${post.data.link_flair_text ? `[${post.data.link_flair_text}] ` : ""}${entities.decodeHTML(post.data.title.length > 256 ? post.data.title.slice(0, 256).concat("...") : post.data.title)}`) // gets the post's title
                    .setURL(`https://redd.it/${post.data.id}`) //attaches URL of reddit post here
                    .setDescription(`${post.data.is_self ? entities.decodeHTML(post.data.selftext.length > 2048 ? post.data.selftext.slice(0, 2048).concat("...") : post.data.selftext) : ""}`) // posts descriptions; anything over 2048 is appended with ellipses            
                    .setThumbnail(validUrl.isUri(post.data.thumbnail) ? entities.decodeHTML(post.data.thumbnail) : null)
                    .setFooter(`[${post.data.is_self ? "Self Post" : "Link Post"} by /u/${post.data.author}] | [${post.data.ups} 👍] | [${post.data.downs} 👎 ] | [${post.data.num_comments} 📃]`) // determines if author's post is a self post or link post
                    .setTimestamp(new Date(post.data.created_utc * 1000)) //gets time relative to one's time zone (e.g. PST) when the author posted
                  
                  
                  setInterval(async () => {
                    //gather submission comment thread's replies and outputs content of each comment assuming there is at least one comment
                    redditFetch.getSubmission(post.data.id).expandReplies()
                    .then(thread => {  // comment format: [ [author flair text] [comment body] by (comment author name) posted on (comment date) from (comment permalink)]
                      thread.comments.forEach((comment) => console.log(`[ [${comment.body.author_flair_text || "none"}] ${comment.body}] by ${comment.author.name} posted on ${moment(post.data.created_utc * 1000).format("MM-DD-YYYY")} from ${comment.permalink}`))
                    }).catch(err => console.log(err));  
                  }, 5000 )
  
                  //gets post data id of the post and names it as such appended by ".csv" in my /redditPosts/ file directory on my Raspberry Pi   
                  // get file name to be this format: [date_post-flair_post-data-id.csv]
    
                  fs.writeFileSync(`./redditPosts/${moment(post.data.created_utc * 1000).format("MM-DD-YYYY")}_${post.data.link_flair_text}_${post.data.id}.csv`, json2csv.parse(redditPost), {"encoding": "utf-8"});  //writes to text file ; made this a csv file for better file readability and organization
                  redditPost.attachFiles(`./redditPosts/${moment(post.data.created_utc * 1000).format("MM-DD-YYYY")}_${post.data.link_flair_text}_${post.data.id}.csv`); //attaches file to each respective redditPost embed that's sent every 10 minutes
    
                  log(client, client.config.channels.reddit, redditPost); //sends to the #reddit-feed channel  
                } 
              }
            } else {
                log(client, client.config.channels.auditlogs, { embed: { description: `Request failed - Reddit could be down or the subreddit doesn"t exist. Will continue.`, color: client.config.school_color}});
            }
          });
        } catch (err) {
          if (err) return;
        } 
      }
    }, 600 * 1000); // get 10 new posts every 10 minutes!   
  }