const { Command } = require("discord.js-commando");
const { getPatch } = require("../../functions/championFetch.js");

module.exports = class getPatchCommand extends Command {
    constructor(client) {
      super(client, {
            name: "patch",
            group: "league",
            memberName: "patch",
            description: "Get League of Legends information for  recent patches!",
            guildOnly: true,
            throttling: {
            usages: 2,
            duration: 5,
            },
        })
    }

    async run ( message ) {
        getPatch().then((data) => {
            if (!data) {
                return this.client.error("Could not retrieve latest patch!", message);
            }
            return message.channel.send({ embed: { title: `CURRENT PATCH!`, description: `The current patch is: [${data.patch}](https://na.leagueoflegends.com/en-us/news/game-updates/patch-${data.url_patch}-notes/)` }});
        });
    }
}