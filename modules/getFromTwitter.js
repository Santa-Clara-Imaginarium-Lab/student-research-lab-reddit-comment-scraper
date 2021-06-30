module.exports.run = async (client) => {
    const { MessageEmbed } = require("discord.js");
    const { log } = require("../functions/log.js");

    setInterval(async () => {
        const Twit = require("twit"); 

        const TwitterInstance = new Twit({ //authenticating with secret keys provided with secret keys from developer account
            consumer_key:         client.config.api.twitter.consumer_key,
            consumer_secret:      client.config.api.twitter.consumer_secret,
            access_token:         client.config.api.twitter.access_token,
            access_token_secret:  client.config.api.twitter.access_token_secret
        }); 

        const params = {
            q: "Pat Bev", // search term
            count: 12 // how many tweets back
        }
    
        TwitterInstance.get("search/tweets", params, function (err, data, response) {
            if (!err && response.statusCode === 200) { 
                const redditPost = new MessageEmbed()
                .setDescription(data.statuses[0].text) // gets text
                .setFooter(data.statuses[0].created_at) //gets created date

                log(client, client.config.channels.twitter, redditPost) // sends messagee embed to #twitter-feed
            } else {
                console.log(err);
            }
        });
    }, 600 * 1000); // gets 10 posts every 10 minutes
}

// wouldn't be flagged for being bot  and/or hacker