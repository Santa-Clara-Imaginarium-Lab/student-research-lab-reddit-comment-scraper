const { getPosition, getNickname } = require(`../functions/members.js`);
const moment = require(`moment`);

module.exports = class queueCommand extends Command {
    constructor(client) {
        super(client, {
            name: "queue",  
            description: "TA's can use this command to view the current items in the queue. Student's can use the !queue command to view how many people are in the queue, and where they are (if they are in the queue).",  
            group: "office-hours",
            memberName: "queue",
            throttling: {
                usages: 2,
                duration: 5,
            },
        });
    }

    async run ( message ) {  
        const contains = (member) => getPosition(member) !== -1;

        if (this.client.config.channels.tachannel === message.channel.id) {
            message.react(this.client.config.reactions.STOP);
      
            if (this.client.queue.length === 0) {
              this.client.error("```nimrod\nThe queue is currently empty```", message);
              return;
            }
      
            let body = `\`\`\`nimrod\nThere are currently ${this.client.queue.length} people in the queue.`;
      
            if (contains(message.author)) {
              body += `You are #${getPosition(message.author) + 1}!`;
            }
      
            message.channel.send(`${body}\`\`\``);
          } else if (this.client.config.channels.tachannel === message.channel.id) {
                message.react(this.client.config.reactions.THUMBS);
        
                if (this.client.queue.length === 0) {
                    this.client.error("```nimrod\nThe queue is currently empty```", message);
                    return;
                }
        
                const body = [];
        
                for (let i = 0; i < this.client.queue.length; i += 1) {
                    const msg = this.client.queue[i];
                    const desc = msg.content.substring(6); // remove '!next '
                    body.push(`${i}) ${getNickname(msg)} "${desc}"\t\t [${moment(msg.createdTimestamp).fromNow()}]`);
                }
        
                message.channel.send(`\`\`\`nimrod\n${body.join('\n')}\`\`\``);
          }
    }
}