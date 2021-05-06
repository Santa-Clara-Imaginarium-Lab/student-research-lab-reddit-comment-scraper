const { Command } = require("discord.js-commando");
module.exports = class offlineCommand extends Command {
    constructor(client) {
        super(client, {
            name: "offline",  
            description: "TA's use this command to make themselves appear offline, and notify the students. If they are already offline, warn them.",  
            group: "office-hours",
            memberName: "offline",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) { 
        if (this.client.config.channels.tachannel !== message.channel.id) return;

        const isOnline = (member) => member.id in this.onlineTAs;

        if (!isOnline(message.author)) {
          message.react(this.client.config.reactions.STOP);
          this.client.error("You are already offline.", message);
          return;
        }
    
        message.react(this.client.config.reactions.THUMBS);
    
        if (args.length > 0 && args[0] === 'partial') {
          this.client.onlineTAs[message.author.id].hidden = true; // Moves TA to hidden
          this.client.error("You are now marked as offline, but you are still able to use certain commands offline.", message);
          message.guild.channels.cache.get(this.client.config.channels.officehours).send(`${message.author} is no longer taking questions. :x:`);
          return;
        }
    
        delete this.client.onlineTAs[message.author.id];
        this.client.error(`You are now marked as offline. Some commands, like *ready, will not work.`, message);
        message.guild.channels.cache.get(this.client.config.channels.officehours).send(`${message.author} is now offline. :x:`);
    }
}