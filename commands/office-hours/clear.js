const { Command } = require("discord.js-commando");
module.exports = class clearCommand extends Command {
    constructor(client) {
        super(client, {
            name: "clear",  
            description: "TA's can use this command to empty the this.queue.",  
            group: "office-hours",
            memberName: "clear",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) {  
        if (this.client.config.channels.tachannel !== message.channel.id) return;

        if (this.client.queue.length === 0) {
            message.react(this.client.config.reactions.warn);
            this.client.error("```nimrod\nThe queue is currently empty!", message);
            return;
        }

        /* Goes through entire queue and finds the student's next message and removes it */
        for (let i = this.client.queue.length - 1; i >= 0; i -= 1) this.client.queue[i].delete();

        this.client.queue.length = 0;
        this.client.error("```nimrod\nThe queue is now empty!", message);
        message.react(this.client.config.reactions.THUMBS);

    }
}   