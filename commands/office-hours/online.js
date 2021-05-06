const { Command } = require("discord.js-commando");
module.exports = class onlineCommand extends Command {
    constructor(client) {
        super(client, {
            name: "online",  
            description: "TA's use this command to make themselves appear online, and notify the students. If they are already online, warn them.",  
            group: "office-hours",
            memberName: "online",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) {  
        if (this.client.config.channels.tachannel !== message.channel.id) return;

        const isOnline = (member) => member.id in this.client.onlineTAs;

        if (isOnline(message.author) && !this.client.onlineTAs[message.author.id].hidden) {
            this.client.error("You are already online!", message);
            return;
        }

        message.react(this.client.config.reactions.THUMBS);

        if (args.length > 0 && args[0] === "partial") {
            this.client.onlineTAs[message.author.id] = { afk: false, hidden: true };
            return;
        }

        this.client.onlineTAs[message.author.id] = { afk: false, hidden: false }; // Marks the author as 'online'
        message.guild.channels.cache.get(this.client.config.channels.officehours).send(`${message.author} is now online. Ready to answer questions! :wave:`);
    }
}