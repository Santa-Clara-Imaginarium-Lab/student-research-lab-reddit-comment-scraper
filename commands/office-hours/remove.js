const { Command } = require("discord.js-commando");
module.exports = class removeCommand extends Command {
    constructor(client) {
        super(client, {
            name: "remove",  
            description: "TA's can use this command to remove items from the queue. If there is no one in the queue, or the index is invalid it the TA will be warned.",  
            group: "office-hours",
            memberName: "remove",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) {
        if (this.client.config.channels.tachannel !== message.channel.id) return;

        const isOnline = (member) => member.id in this.client.onlineTAs;

        if (!isOnline(message.author)) {
            message.react(this.client.config.reactions.STOP);
            this.client.error("You are offline. Can't remove.", message); 
            return;
        }

        if (args.length === 0 || Number.isNaN(args[0])) {
            message.react(this.client.config.reactions.STOP);
            this.client.error(`Please provide an index to remove like this \`\`\`${this.client.config.prefix}remove index\`\`\``, message);
            return;
        }

        const removeIndex = parseInt(args[0], 10);
        if (removeIndex >= this.client.queue.length) {
            message.react(this.client.config.reactions.STOP);
            this.client.error("Invalid index.", message); 
            return;
        }

        message.react(this.client.config.reactions.THUMBSUP);
        this.client.queue.splice(removeIndex, 1);
    }
}