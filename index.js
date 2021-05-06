<<<<<<< HEAD
const { CommandoClient } = require("discord.js-commando");  
const path = require("path");    

const client = new CommandoClient({
  commandPrefix: `${require("./config.json").prefix}`,
  owner: `${require("./config.json").serverRoles.botOwner}`,
});

client.config = require("./config.json"); 
client.error = require("./functions/error.js");
const { log } = require("./functions/log.js");   

const SpotifyWebApi = require("spotify-web-api-node");
const spotifyApi = new SpotifyWebApi({
    clientId: client.config.api.spotifyClientID,
    clientSecret: client.config.api.spotifyClientSecret
});

client.spotifyApi = spotifyApi;
client.queue = [];
client.dequeue = [];
client.onlineTAs = {};

client.registry
  .registerDefaultTypes()
  .registerGroups([  
    ["office-hours", "Office Hours"], 
    ["fun", "Fun"],
    ["practicality", "Practicality"],
    ["music", "Music"]
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    unknownCommand: false,
    prefix: false, 
  })
  .registerCommandsIn(path.join(__dirname, "commands")); 

client.dispatcher.addInhibitor( (client, msg) => {
  try { 
    switch (msg.command.group.name) {
      case "Office Hours":
        if (!client.config.serverRoles.modRoles.forEach((modRole) => msg.member.roles.cache.has(modRole)) || !msg.author.id === client.config.serverRoles.owner) {
          client.error(`***<@${msg.author.id}>, You don't have permission to use this command***`, msg);
          msg.delete();
          return false
        }
        break;
      default:
        return true; 
    } 
  } catch(err) {
      if (err === "TypeError: Inhibitor \"\" had an invalid result; must be a string or an Inhibition object.") {
        return;
      }
  }
}); 

client.once("ready", () => {
  client.user.setPresence({activity: { name: `${client.config.prefix}help ⏯️ https://davidjeong.org` }, status: "online"});  

  log(client, client.config.channels.auditlogs, { embed: { title: "Hooray!", description: "All commands and events work! ✅", color: "GREEN"}});
});

client 
    .on("error", (error) => { console.error(error); process.exit(1)})
    .on("message", (message) => require("./events/message")(client, message)) 

=======
const { CommandoClient } = require("discord.js-commando");  
const path = require("path");    

const client = new CommandoClient({
  commandPrefix: `${require("./config.json").prefix}`,
  owner: `${require("./config.json").serverRoles.botOwner}`,
});

client.config = require("./config.json"); 
client.error = require("./functions/error.js");
const { log } = require("./functions/log.js");   

client.queue = [];
client.dequeue = [];
client.onlineTAs = {};

client.registry
  .registerDefaultTypes()
  .registerGroups([  
    ["office-hours", "Office Hours"], 
    ["fun", "Fun"],
    ["practiality", "Practicality"],
    ["music", "Music"]
  ])
  .registerDefaultGroups()
  .registerDefaultCommands({
    unknownCommand: false,
    prefix: false, 
  })
  .registerCommandsIn(path.join(__dirname, "commands")); 

client.dispatcher.addInhibitor( (client, msg) => {
  try { 
    switch (msg.command.group.name) {
      case "Office Hours":
        if (!client.config.serverRoles.modRoles.forEach((modRole) => msg.member.roles.cache.has(modRole)) || !msg.author.id === client.config.serverRoles.owner) {
          client.error(`***<@${msg.author.id}>, You don't have permission to use this command***`, msg);
          msg.delete();
          return false
        }
        break;
      default:
        return true; 
    } 
  } catch(err) {
      if (err === "TypeError: Inhibitor \"\" had an invalid result; must be a string or an Inhibition object.") {
        return;
      }
  }
}); 

client.once("ready", () => {
  client.user.setPresence({activity: { name: `${client.config.prefix}help ⏯️ https://davidjeong.org` }, status: "online"});  

  log(client, client.config.channels.auditlogs, { embed: { title: "Hooray!", description: "All commands and events work! ✅", color: "GREEN"}});
});

client 
    .on("error", (error) => { console.error(error); process.exit(1)})
    .on("message", (message) => require("./events/message")(client, message)) 

>>>>>>> fb4a4f504dcea792e47c3c995674822f39667500
client.login(client.config.token);  