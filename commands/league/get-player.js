const { MessageEmbed } = require("discord.js");
const { Command } = require("discord.js-commando");
const { getUserInfo } = require("../../functions/championFetch.js");

module.exports = class getPlayerCommand extends Command {
    constructor(client) {
      super(client, {
        name: "get-player",
        group: "league",
        memberName: "get-player",
        description: "Get League of Legends information for a specific player username!",
        guildOnly: true,
        throttling: {
          usages: 2,
          duration: 5,
        },
        args: [
            {
              key: "summonerUsername",
              prompt: "Enter a player username to lookup",
              type: "string",
            },
        ],
      });
    }
    
    async run ( message, { summonerUsername }) {
        getUserInfo(summonerUsername)
            .then((userData) => {
                 const playerData = new MessageEmbed()
                 .setTitle("Basic Summoner Information")
                 .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/9.19.1/img/profileicon/${userData.profileIconId}.png`)
                 .addField("Summoner Name", userData.name, true )
                 .addField("Summoner Level", userData.summonerLevel, true ) 

                 message.channel.send(playerData);
            })
            .catch((err) => { 
                if (err.response.status === 404) {
                    this.client.error(`User Not Found: ${err}`, message);
                }
            });
    }
};