<<<<<<< HEAD
const { log } = require("../functions/log.js");
const { MessageEmbed } = require("discord.js");

module.exports = async (client, member) => {
    if(member.user.bot)  return;   //ignore members who are bot users
  
    const guild = client.guilds.cache.get(client.config.guildID);
   
    let role = member.guild.roles.cache.find((role) => role.id === client.config.serverRoles.studentResearcher);
    await member.roles.add(role);
  
    log(client, client.config.channels.auditlogs, { embed: { title: "NEW JOIN ROLE ADDED!", description: `The **<@&${client.config.serverRoles.studentResearcher}>** role has been given to **<@${member.user.id}>** by **<@${client.user.id}>**!`, color: "GREEN"}});
    
    const welcomeEmbed = new MessageEmbed() // triggers when new users joins to specific channel in server
    .setTitle(`Welcome to the **${guild.name}** server!`) // Calling method setTitle on constructor.
    .setDescription("Glad to have you here to do research with Dr. Jeong!") //Setting embed description
    .setTimestamp() // Sets a timestamp at the end of the embed
    .setThumbnail("http://www.techbeat.ph/wp-content/uploads/2020/08/conflicting-copy-01001100-01001111-01001100-7-2-1024x536.png")
    .attachFiles(["./assets/davidjeong.png"])
    .setImage("attachment://davidjeong.png")
    .setColor(client.config.school_color)
    .setFooter(`Brought to you by the creators of the ${guild.name} server.`);
  
    await guild.systemChannel.send(`<@${member.user.id}>`, { embed: welcomeEmbed });
=======
const { log } = require("../functions/log.js");
const { MessageEmbed } = require("discord.js");

module.exports = async (client, member) => {
    if(member.user.bot)  return;   //ignore members who are bot users
  
    const guild = client.guilds.cache.get(client.config.guildID);
   
    let role = member.guild.roles.cache.find((role) => role.id === client.config.serverRoles.studentResearcher);
    await member.roles.add(role);
  
    log(client, client.config.channels.auditlogs, { embed: { title: "NEW JOIN ROLE ADDED!", description: `The **<@&${client.config.serverRoles.studentResearcher}>** role has been given to **<@${member.user.id}>** by **<@${client.user.id}>**!`, color: "GREEN"}});
    
    const welcomeEmbed = new MessageEmbed() // triggers when new users joins to specific channel in server
    .setTitle(`Welcome to the **${guild.name}** server!`) // Calling method setTitle on constructor.
    .setDescription("Glad to have you here to do research with Dr. Jeong!") //Setting embed description
    .setTimestamp() // Sets a timestamp at the end of the embed
    .setThumbnail("http://www.techbeat.ph/wp-content/uploads/2020/08/conflicting-copy-01001100-01001111-01001100-7-2-1024x536.png")
    .attachFiles(["./assets/davidjeong.png"])
    .setImage("attachment://davidjeong.png")
    .setColor(client.config.school_color)
    .setFooter(`Brought to you by the creators of the ${guild.name} server.`);
  
    await guild.systemChannel.send(`<@${member.user.id}>`, { embed: welcomeEmbed });
>>>>>>> f3fb4256572e68610ee3a447de3b122fe2707deb
};