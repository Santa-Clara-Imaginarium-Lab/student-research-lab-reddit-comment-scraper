const { MessageEmbed } = require("discord.js");
const { Command } = require("discord.js-commando");
const { getChampMastery, champIDtoName, getPatch, getUserInfo } = require("../../functions/championFetch.js");

module.exports = class masteryCommand extends Command {
    constructor(client) { 
        super(client, {
            name: "mastery",
            group: "league",
            memberName: "mastery",
            description: "Get League of Legends mastery information for a specific player username!",
            guildOnly: true,
            throttling: {
            usages: 2,
            duration: 5,
            },
            args: [
                {
                    key: "summonerUsername",
                    prompt: "Enter a player username to look up",
                    type: "string",
                },
                {
                    key: "summonerChampion",
                    prompt: "Enter a League of Legends champion to look up",
                    type: "string",
                }
            ], 
        }); 
    } 

    async run ( message, { summonerUsername, summonerChampion } ) {

        let userIcon = "";
        let patch = await getPatch();
        getUserInfo(summonerUsername)
        .then((userData) => {
            userData.profileIconId;
            return getChampMastery(userData.id, summonerChampion);
        })
        .then(async (masteries) => {
            let namepromises = masteries.map((mastery) => {
                return champIDtoName(mastery.championId, patch.patch);
            });

            let names = await Promise.all(namepromises);
            return masteries.map((mastery, index) => {return {...mastery, ...names[index]}});
        })
        .then((masteries) => {
            for(let i = 0; i < masteries.length; i++) {
                const exampleEmbed = new MessageEmbed()
                .setColor("#0099ff")
                .setTitle(`${summonerUsername}'s Top Champion Masteries`) 
                .setThumbnail(`http://ddragon.leagueoflegends.com/cdn/${patch.patch}/img/profileicon/${userIcon}.png`)
                .setImage(`http://ddragon.leagueoflegends.com/cdn/${patch.patch}/img/champion/${masteries[i].image}`)
                .addFields(
                    { name: "Champion Mastery", value: masteries[i].championPoints},
                )
                .setFooter(`Mastery Level ${masteries[i].championLevel}` , `https://raw.githubusercontent.com/RiotAPI/Riot-Games-API-Developer-Assets/master/champion-mastery-icons/mastery-${masteries[i].championLevel}.png`);
                message.channel.send(exampleEmbed); 
            }
        })
        .catch((err) => console.log(err));
    }
};       