module.exports.run = async (client) => {
  const { MessageEmbed } = require(`discord.js`);
  const request = require("request");
  const entities = require("entities");
  const validUrl = require("valid-url");
  const { log } = require(`./log.js`);
  const botReady = true; 
  
  const feedMSG = {
    title: `r/${client.config.api.subreddit} Feed Ready!`,
    description: `[/r/${client.config.api.subreddit}](https://reddit.com/r/${client.config.api.subreddit}) feed works! ✅`,
    color: "GREEN", 
    timestamp: new Date()
  }
  
  console.log(feedMSG.title);
  log(client, client.config.channels.auditlogs, { embed: feedMSG });

  try {
    setInterval(() => {
      if (botReady) {
        request({
          url: `https://reddit.com/r/${client.config.api.subreddit}/new.json?limit=10`, //could switch to either new, random, top, or rising 
          json: true,
        }, (error, response, body) => {
          if (!error && response.statusCode === 200) {
            for (const post of body.data.children.reverse()) {
              const lastTimestamp = post.data.created_utc;
              if (lastTimestamp <= post.data.created_utc) {
                const redditPost = new MessageEmbed()
                .setColor(client.config.school_color)
                .setAuthor(`${post.data.subreddit_name_prefixed}`, client.user.displayAvatarURL()) //displays author's username
                .setTitle(`${post.data.link_flair_text ? `[${post.data.link_flair_text}] ` : ""}${entities.decodeHTML(post.data.title)}`) // gets the post's title
                .setURL(`https://redd.it/${post.data.id}`) //attaches URL of reddit post here
                .setDescription(`${post.data.is_self ? entities.decodeHTML(post.data.selftext.length > 2048 ? post.data.selftext.slice(0, 2048).concat("...") : post.data.selftext) : ""}`) // posts descriptions; anything over 2048 is appended with ellipses
                .setThumbnail(validUrl.isUri(post.data.thumbnail) ? entities.decodeHTML(post.data.thumbnail) : null)
                .setFooter(`${post.data.is_self ? "Self Post" : "Link Post"} by /u/${post.data.author}`) // determines if author's post is a self post or link post
                .setTimestamp(new Date(post.data.created_utc * 1000)) //gets time relative to one's time zone (e.g. PST) when the author posted
  
                log(client, client.config.channels.reddit, redditPost);
              } 
            }
          } else {
            log(client, client.config.channels.auditlogs, { embed: { description: `Request failed - Reddit could be down or the subreddit doesn"t exist. Will continue.`, color: client.config.school_color}});
          }
        });
      }
    }, 600 * 1000); // get 10 new posts every 10 minutes!
  } catch (err) {
      if (err) return this.client.error("Here is the error!", message);
  }
}