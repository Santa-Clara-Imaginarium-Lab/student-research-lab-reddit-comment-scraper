module.exports.run = async (client) => {
  const { MessageEmbed } = require("discord.js");
  const fs = require("fs");
  const request = require("request");
  const entities = require("entities");
  const validUrl = require("valid-url");
  const { log } = require(`./log.js`);
  const botReady = true;  
  const lastTimestamp = Math.floor(Date.now() / 1000);
  
  const feedMSG = {
    title: `r/${client.config.api.subreddit} Feed Ready!`,
    description: `[/r/${client.config.api.subreddit}](https://reddit.com/r/${client.config.api.subreddit}) feed works! ✅`,
    color: "GREEN", 
    timestamp: new Date()
  }
  
  console.log(feedMSG.title);
  log(client, client.config.channels.auditlogs, { embed: feedMSG });

   setInterval(() => {
    const sortBy = ["new", "top", "hot", "rising"];
    const getSortBy = sortBy[Math.floor(Math.random() * sortBy.length)];
    if (botReady) {
      request({
        url: `https://reddit.com/r/${client.config.api.subreddit}/${getSortBy}.json?limit=10`, //every time, randomize between new, random, top, or rising for more varied posts
        json: true,
      }, (error, response, body) => {
        if (!error && response.statusCode === 200) { 
          const redditEmbed = new MessageEmbed().setColor(client.config.school_color).setTitle(`**REDDIT POST!**`).setDescription(`Here's your new Reddit post attachment below!`).setFooter(lastTimestamp)

          for (const post of body.data.children.reverse()) {
            const lastTimestamp = post.data.created_utc;
            if (lastTimestamp <= post.data.created_utc) {
              lastTimestamp = post.data.create_utc;

              //The Reddit Template: [Time], [Subreddit Name], [[Subreddit Post Flair] [Post Title]], [Subreddit Post ID], [Subreddit Post Description], [Subreddit Post Thumbnail (defaults to "none" if none)], [Self post or Link Post by Subreddit Post Author]

              let redditPostTemplate = `[${new Date(post.data.created_utc * 1000)}], [${post.data.subreddit_name_prefixed}], [${post.data.link_flair_text ? `[${post.data.link_flair_text}] ` : ""}${entities.decodeHTML(post.data.title)}], `;
                redditPostTemplate += `[https://redm.it/${post.data.id}}], [${post.data.is_self ? entities.decodeHTML(post.data.selftext.length > 2048 ? post.data.selftext.slice(0, 2048).concat("...") : post.data.selftext) : ""}], `; 
                redditPostTemplate += `[${validUrl.isUri(post.data.thumbnail) ? entities.decodeHTML(post.data.thumbnail) : "no thumbnail shown"}], [${post.data.is_self ? "self post" : "link post"} by ${post.data.author}]`;

              const filePath = `./redditPosts/${post.data.id}.txt`; //gets post data id of the post and names it as such appended by ".txt" in my /redditPosts/ file directory on my Raspberry Pi

              fs.appendFileSync(filePath, redditPostTemplate, function (err) {
                if (err) console.log(err); 
              });

              redditEmbed.attachFiles(filePath);
              log(client, client.config.channels.reddit, redditEmbed);

              ++lastTimestamp;
            } 
          }
        } else {
            log(client, client.config.channels.auditlogs, { embed: { description: `Request failed - Reddit could be down or the subreddit doesn"t exist. Will continue.`, color: client.config.school_color}});
        }
      });
    }
  }, 600 * 1000); // get 10 new posts every 10 minutes! 
}