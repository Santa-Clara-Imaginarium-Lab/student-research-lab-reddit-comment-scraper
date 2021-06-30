module.exports.run = async (client) => {
    const { MessageEmbed } = require("discord.js");
    const { log } = require("../functions/log.js");

    setInterval(async () => {
        const Twit = require("twit"); 

        const TwitterInstance = new Twit({
            consumer_key:         client.config.api.twitter.consumer_key,
            consumer_secret:      client.config.api.twitter.consumer_secret,
            access_token:         client.config.api.twitter.access_token,
            access_token_secret:  client.config.api.twitter.access_token_secret
        }); 
    
        TwitterInstance.get("search/tweets", { q: "Pat Bev", count: 10 }, function (err, data, response) {
            if (!err && response.statusCode === 200) { 
                const redditPost = new MessageEmbed()
                .setDescription(data.statuses[0].text)
                .setTimestamp(data.statuses[0].created_at)

                log(client, client.config.channels.twitter, redditPost)
            } else {
                console.log(err);
            }
        });
    }, 600 * 1000); //gets 10 posts every 10 minutes
}