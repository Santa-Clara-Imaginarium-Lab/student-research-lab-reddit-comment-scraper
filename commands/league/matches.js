const { MessageEmbed } = require("discord.js");
const { Command } = require("discord.js-commando");
const { getPatch, getMatchHistory, champIDtoName, getMatchDetails, getUserInfo } = require("../../functions/championFetch.js");
const dayjs = require("dayjs");

module.exports = class matchesCommand extends Command {
    constructor(client) {
      super(client, {
        name: "matches",
        group: "league",
        memberName: "matches",
        description: "Get League of Legends information for a specific summoneer's recent matches!",
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
      })
    }

    async run ( message, { summonerUsername } ) {
        let patch = await getPatch();

        getUserInfo(summonerUsername)
            .then((userData) => { 
                return getMatchHistory(userData.accountId);
            })
            .then(async (data) => {
                console.log(data);
                let championNamesPromise = data.matches.slice(0, 3).map((match) => champIDtoName(match.champion, patch.patch));
                let matchdetailsPromise = data.matches.slice(0, 3).map((match) => getMatchDetails(match.gameId, summonerUsername));
                let championNames = await Promise.all(championNamesPromise);
                let matchDetails = await Promise.all(matchdetailsPromise);
                return data.matches.slice(0, 3).map((match, index) => {return {...match, ...matchDetails[index], ...championNames[index]}});
            })
            .then((matchHistory) => {
                for(let i = 0; i < matchHistory.length; i++) { 
                    const matchData = new MessageEmbed()
                    .setColor(matchHistory[i].win ? "#00ed28" : "#d90000")
                    .setTitle(`${summonerUsername}'s Recent ${matchHistory[i].win ? "Victory" : "Loss"}`)
                    .setImage(`http://ddragon.leagueoflegends.com/cdn/${patch.patch}/img/champion/${matchHistory[i].image}`)
                    .addFields(
                        // { name: '\u200B', value: '\u200B' },
                        { name: "Region", value: matchHistory[i].platformId, inline: true },
                        { name: "Season", value: matchHistory[i].season, inline: true },
                        { name: "Role", value: matchHistory[i].role, inline: true },
                        { name: "Lane", value: matchHistory[i].lane, inline: true }, 
                        { name: "Kills/Death/Assists", value: `${matchHistory[i].kills}/${matchHistory[i].deaths}/${matchHistory[i].assists}`, inline: true },
                        { name: "Game Duration", value: `${matchHistory[i].length.minutes}:${matchHistory[i].length.seconds}`, inline: true }
                    )
                    .setFooter(dayjs(matchHistory[i].timestamp).format("MM-DD-YYYY h:mm A"),)

                    message.channel.send(matchData);
                }
            })
            .catch(err => {
                console.log(err);
            })
    }
}