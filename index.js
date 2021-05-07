const { CommandoClient } = require("discord.js-commando");  
const path = require("path");     
const officehours = require("./officehours");

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

client.registry
  .registerDefaultTypes()
  .registerGroups([   
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

client.once("ready", () => {
  client.user.setPresence({activity: { name: `${client.config.prefix}help ⏯️ https://davidjeong.org` }, status: "online"});  

  log(client, client.config.channels.auditlogs, { embed: { title: "Hooray!", description: "All commands and events work! ✅", color: "GREEN"}});
});

client.on('message', (message) => {
  if (!message.content.startsWith(client.config.prefix) && message.channel.type !== "dm" || message.author.bot) return; 

  if (![client.config.channels.tachannel, client.config.channels.officehours].includes(message.channel.id)) return;

  const [cmd, ...args] = message.content.toLowerCase().split(" ");

  if (cmd in officehours.cmds) officehours.cmds[cmd].call(this, message, args);
}); 

client.on("error", (error) => { console.error(error); process.exit(1)}) 

client.login(client.config.token);  
