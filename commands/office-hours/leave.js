const { Command } = require("discord.js-commando");
const { getPosition } = require(`../../functions/members.js`);

module.exports = class leaveCommand extends Command {
    constructor(client) {
        super(client, {
            name: "leave",  
            description: "If a user needs to leave the queue, they can use this command, which will remove them if they're in queue, otherwise react STOP.",  
            group: "office-hours",
            memberName: "leave",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) {
        
        const contains = (member) => getPosition(member) !== -1;    

        if (this.client.config.channels.officehours === message.channel.id) {
            if (!contains(message.author)) {
              message.react(this.client.config.reactions.STOP);
              message.delete({ timeout: 10 * 1000 });
              return;
            }
      
            this.client.queue.splice(getPosition(message.author), 1);
            message.react(this.client.config.reactions.THUMBS);
            message.reply("Goodbye :wave:")
              .then((msg) => msg.delete({ timeout: 10 * 1000 }));
            message.delete({ timeout: 5 * 1000 });
          }
    }
}