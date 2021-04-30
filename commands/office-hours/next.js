const { getPosition } = require(`../functions/members.js`);

module.exports = class nextCommand extends Command {
    constructor(client) {
        super(client, {
            name: "next",  
            description: "Users can add themselves to the queue via this command. If they are already in the queue, it will let them know and quit, otherwise acknowledge them.",  
            group: "office-hours",
            memberName: "next",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) {
        if (message.channel.id !== this.client.config.channels.officehours) return; 

        if (Object.values(this.client.onlineTAs).length === 0) {
            message.react(this.client.config.reactions.STOP);
            this.client.erroṛ("Sorry, there are no TA's online at the moment!", message);
            return;
        }

        if (!Object.values(this.client.onlineTAs).filter((onlineTA) => !onlineTA.hidden).length) {
            message.react(this.client.config.reactions.STOP);
            message.channel.send("⏰ Office hours are wrapping up and TA's are no longer taking new questions.");
            return;
        }

        const contains = (member) => getPosition(member) !== -1;

        if (contains(message.author)) {
            message.react(this.client.config.reactions.STOP);
            this.client.error("You're already in the queue.", message); 
            message.delete( { timeout: 5 * 1000 });
            return;
        }

        this.client.queue.push(message);

        message.react(this.client.config.reactions.THUMBS);
        message.channel.send(`You are now #${this.client.queue.length} in the queue.`)
            .then((msg) => msg.delete({ timeout: 10 * 1000 }));
    }
}