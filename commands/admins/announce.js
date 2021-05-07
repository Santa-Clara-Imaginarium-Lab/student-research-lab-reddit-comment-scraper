<<<<<<< HEAD
const { Command } = require("discord.js-commando");

module.exports = class announceCommand extends Command {
  constructor(client) {
    super(client, {
      name: "announce",
      group: "admins",
      memberName: "announce", 
      throttling: {
          usages: 2,
          duration: 5,
			},
      description: "Make a formatted announcement using Embed data",
      // format: "announce [#channel] [message goes here]\nannounce edit [message id] [new message]\nannounce append [message id] [text to append\nannounce embed [embed JSON]",
      // examples: [""],
      args: [
        {
          key: "option",
          prompt: "Please choose a valid option \`msg, embed, append, edit\`",
          type: "string",
          oneOf: ["edit", "append", "embed", "msg"],
        },
        {
          key: "id",
          prompt: "Please provide a message id to edit or mention a channel to send this message to",
          type: "string",
          validate: (id) => {
            if(id.match(/^[0-9]*$/)) {
              return true;
            } else {
                return "Please enter a proper snowflake!"
            }
          }
        },
        {
          key: "body",
          prompt: "Please provide some body text (embed format)",
          type: "string",
        },
      ],
    });
  }

  async run(message, { option, id, body }) {
    const announceChannel = this.client.channels.cache.get(`${id.replace(/</g, "").replace(/>/g, "").replace(/#/g, "")}`);
    switch (option) {
      case "edit": 
          message.channel.messages.fetch(id).then((m) => {
            m.edit({
              embed: {
                description: body, 
              },
            });
          }); 
        break;
      case "append": 
          message.channel.messages.fetch(id).then((m) => {
            m.edit({
              embed: {
                description: m.embeds[0].description + " " + body, 
              },
            });
          }); 
        break;
      case "embed":  
          announceChannel.send({ embed: JSON.parse(body)}); 
          break;
      case "msg": 
          announceChannel.send(body);
 
          break;
    } 
  } 
}; 
=======
const { Command } = require("discord.js-commando");

module.exports = class announceCommand extends Command {
  constructor(client) {
    super(client, {
      name: "announce",
      group: "admins",
      memberName: "announce", 
      throttling: {
          usages: 2,
          duration: 5,
			},
      description: "Make a formatted announcement using embed data", 
      args: [
        {
          key: "option",
          prompt: "Please choose a valid option \`edit, append, embed\`",
          type: "string",
          oneOf: ["edit", "append", "embed"],
        },
        {
          key: "id",
          prompt: "Please provide a message id to edit or mention a channel to send this message to",
          type: "string",
          validate: (id) => {
            if(id.match(/^[0-9]*$/)) {
              return true;
            } else {
                return "Please enter a proper snowflake!"
            }
          }
        },
        {
          key: "title",
          prompt: "Please provide some title text.",
          type: "string",
        },

        {
          key: "body",
          prompt: "Please provide some body text.",
          type: "string",
        },
        {
          key: "color",
          prompt: "Please provide some color.",
          type: "string",
        },
        {
  	  key: "image",
  	  prompt: "Please provide an image URL.",
	  type: "string",
        },
        {
          key: "footer",
          prompt: "Please provide some footer text.",
          type: "string",
        },
 
      ],
    });
  }

  async run(message, { option, id, title, body, color, footer }) {
    switch (option) {
      case "edit":
        try {
          message.channel.messages.fetch(id).then((m) => {
            m.edit({
              embed: {
		title: title,
                description: body,
		color: color,
		footer: footer,
		image: image
              },
            });
          });
        } catch (e) {
          return this.client.error(e + "Channel not found, you must run in same channel as message!", message);
        }
        break;
      case "append":
        try {
          message.channel.messages.fetch(id).then((m) => {
            m.edit({
              embed: {
                description: m.embeds[0].description + " " + body,
              },
            });
          });
        } catch (e) {
          return this.client.error("Channel not found, you must run in same channel as message!", message);
        }
        break; 
      case "embed":
        try {
          let announceChannel = this.client.channels.cache.get(`${id.replace(/</g, "").replace(/>/g, "").replace(/#/g, "")}`);
          announceChannel.send({ embed: { title: title, description: body, footer: footer, image: image, color: color } });
        } catch (e) {
          return this.client.error(e, message);
        }
        break;
    }
    message.delete();
  }
}; 
>>>>>>> f3fb4256572e68610ee3a447de3b122fe2707deb
