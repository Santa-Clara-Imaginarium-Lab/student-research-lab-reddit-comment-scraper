const { Command } = require("discord.js-commando");
module.exports = class afkCommand extends Command {
    constructor(client) {
        super(client, {
            name: "afk",  
            description: "TA's use this command if they need to be away from their keyboard for a moment. If they are already online, warn them.",  
            group: "office-hours",
            memberName: "afk",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) { 
        const isOnline = (member) => member.id in this.client.onlineTAs;

        if (this.client.config.channels.tachannel !== message.channel.id) return;
        if (!isOnline(message.author)) {
          message.react(this.client.config.reactions.STOP);
          this.client.error("You are not online.", message); 
          return;
        }
    
        if (this.client.onlineTAs[message.author.id].afk) {
          this.client.onlineTAs[message.author.id].afk = true; // Moves TA to AFK
          message.reply(`You are now AFK. ${this.client.queue.length ? `Hurry back, there are ${this.client.queue.length} people left in the queue.` : ''}`);
          message.guild.channels.cache.get(this.client.config.channels.officehours).send(`${message.author} will be right back! :point_up:`);
          message.react(this.client.config.reactions.THUMBS);
        } else {
          this.client.onlineTAs[message.author.id].afk = false; // Removes TA from being AFK
          message.reply("You are no longer AFK. Now, let's go answer some questions!");
          message.guild.channels.cache.get(this.client.config.channels.officehours).send(`${message.author} is back and ready to answer questions! :wave:`);
          message.react(this.client.config.reactions.THUMBS);
        }
    }
}