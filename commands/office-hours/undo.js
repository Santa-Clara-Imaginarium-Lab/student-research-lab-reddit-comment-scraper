module.exports = class undoCommand extends Command {
    constructor(client) {
        super(client, {
            name: "undo",  
            description: "If a TA accidentally readied a student, and needs to put them back in the queue. This command will automatically put the last dequeued member back to the front of the queue. If the bot doesn't remember any recently readied students, it will tell the TA.",  
            group: "office-hours",
            memberName: "undo",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) {

        if (this.client.config.channels.tachannel === message.channel.id) {
            if (this.client.dequeue.length === 0) {
                message.react(this.client.config.reactions.STOP);
                this.client.error("```nimrod\nThere is currently nothing in the dequeue cache.```", message);
                return;
            }
            
            this.client.queue.splice(0, 1, this.client.dequeue.pop());
            message.react(this.client.config.reactions.THUMBS);
            message.reply("```nimrod\nDone! Don't screw up next time!```");
        }
    }
}