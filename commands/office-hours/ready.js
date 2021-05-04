const { Command } = require("discord.js-commando");
module.exports = class readyCommand extends Command {
    constructor(client) {
        super(client, {
            name: "ready",  
            description: "TA's can use this command to notify students they are ready for them. If no index is provided, it will use the first item in the this.queue. If the this.queue is empty warn the user.",  
            group: "office-hours",
            memberName: "ready",
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
          this.client.error("You are offline. Can't ready up.", message);
          return;
        }
    
        if (this.client.queue.length === 0) {
          message.react(this.client.config.reactions.WARN);
          this.client.error("```nimrod\nThe queue is currently empty```", message);
          return;
        }
    
        let readyIndex = 0;
        if (args.length > 0 && !Number.isNaN(args[0])) {
          readyIndex = parseInt(args[0], 10);
        }
    
        if (readyIndex < 0 || readyIndex >= this.client.queue.length) {
          message.react(this.client.config.reactions.STOP);
          this.client.error("Invalid index!", message); 
          return;
        }
    
        const authorId = message.author.id;
        const msg = this.client.queue[readyIndex];
    
        if (this.client.onlineTAs[authorId].last_ready_msg !== undefined) {
          this.client.onlineTAs[authorId].last_ready_msg.delete();
        }
    
        msg.reply(`${message.author} is ready for you. Move to their office.`)
          .then((reply) => {
            this.client.onlineTAs[authorId].last_ready_msg = reply;
          });
    
        this.client.onlineTAs[authorId].last_helped_time = new Date();
    
        msg.delete();
        message.reply(`${message.author} is next. There are ${this.client.queue.length - 1} people left in the queue.`);
    
        this.client.dequeue.push(this.client.queue[readyIndex]);
        this.client.queue.splice(readyIndex, 1);
    
        message.react(this.client.config.reactions.THUMBS);
        message.delete({ timeout: 5 * 1000 });
    }
}