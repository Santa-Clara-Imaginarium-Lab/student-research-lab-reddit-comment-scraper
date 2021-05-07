const { MessageEmbed } = require("discord.js");
const db = require("quick.db"); 
const { log } = require("../functions/log.js");

module.exports = async (client, message) => {
    // Checks if the Author is a Bot, or the message isn`t from the guild, ignore it.
  if (!message.content.startsWith(client.config.prefix) && message.channel.type !== "dm" || message.author.bot) return; 
  
    const messageReception = new MessageEmbed().setColor(client.config.school_color)
    .setAuthor(message.author.tag, message.author.displayAvatarURL()); 
  
      //Check if message is in a direct message and mentions bot
      if (message.channel.type === "dm" && message.mentions.has(client.user)) {   
        const userTicketContent = message.content.split(" ").slice(1).join(" "); 
        if (userTicketContent.length > 1) {
          let user = await db.get(`suspended${message.author.id}`);
          if (user === true || user === "true") return await message.channel.send({ embed: { description: `Your ticket has been paused!`, color: client.config.school_color}}); 
  
          let active = await db.fetch(`support_${message.author.id}`);
          let guild = client.guilds.cache.get(client.config.guildID);
          let channel, found = true; 
    
          try { 
            if (active) client.channels.cache.get(active.channelID).guild; 
          } catch (e) {
            found = false;
          }
    
          if (!active || !found) { //create support channel for new respondee  
            try {
              active = {};
              channel = await guild.channels.create(`${message.author.username}-${message.author.discriminator}`);     
              channel.setParent(client.config.channels.supportTicketsCategory); //sync text channel to category permissions
              channel.setTopic(`Use **${client.config.prefix}cmds** to utilize the Ticket | ModMail commands on behalf of <@${message.author.id}>`);
  
              let perms = [{ id: client.config.guildID, deny: ["VIEW_CHANNEL"]}];
              let permissionFlags = ["VIEW_CHANNEL", "SEND_MESSAGES", "ADD_REACTIONS", "READ_MESSAGE_HISTORY", "MANAGE_CHANNELS", "MANAGE_MESSAGES", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS"];
  
              client.config.serverRoles.modRoles.forEach((role) => {
                perms.push({id: role, allow: permissionFlags });
              });
  
              channel.overwritePermissions(perms);
            } catch (err) {
                if (err === "TypeError [INVALID_TYPE]: Supplied parameter is not a User nor a Role.") return; 
            }
            
            messageReception.setTitle("ModMail Ticket Created").setThumbnail("attachment://verified.gif") 
            .setDescription("Hello, I've opened up a new ticket for you! Our staff members " +
            "will respond shortly. If you need to add to your ticket, plug away again!")
            .setFooter(`ModMail Ticket Created -- ${message.author.tag}`) 
            .attachFiles(["./assets/verified.gif"]);
            
            await message.author.send({ embed: messageReception });
            
            // Update Active Data
            active.channelID = channel.id;
            active.targetID = message.author.id;
          }
    
          channel = client.channels.cache.get(active.channelID); 
    
          messageReception.setTitle(`Modmail Ticket Sent!`).setDescription(`Your new content was sent!`).setFooter(`ModMail Ticket Received -- ${message.author.tag}`)
          await message.author.send({ embed: messageReception }); 
    
          db.set(`support_${message.author.id}`, active);
          db.set(`supportChannel_${channel.id}`, message.author.id);
          
          return await channel.send(messageReception.setDescription(`> ${userTicketContent}`).setImage(message.attachments.first() ? message.attachments.first().url : ""));
       
        } 
      } else if (message.channel.type === "dm" && (!message.mentions.has(client.user) || message.attachments.size > 0)) { 
          return await client.error(`To open a ticket, mention <@${client.user.id}> and type your message and/or send an attachment!`, message);
      }  
  
    let support = await db.fetch(`supportChannel_${message.channel.id}`);
    if (support) {
      support = await db.fetch(`support_${support}`);
      const supportUser = client.users.cache.get(support.targetID);
      if (!supportUser) return message.channel.delete(); 
  
      function modmailCommands() {
        const commands = [  
          { cmd: "complete", desc: "Close a ticket channel and logs the support channel`s content!" },   
          { cmd: "continue", desc: "Continue the modmail session!"},   
          { cmd: "pause", desc: "Pause the modmail session!" }, 
          { cmd: "reply", desc: "DM the user who sent the modmail ticket!"},
        ];
        let str = "```\n";
        for (let i in commands) {
          str += `${client.config.prefix}${commands[i].cmd} - ${commands[i].desc}\n`;
        }
        return str + "\n```";
      }
       
      messageReception.setAuthor(supportUser.tag, supportUser.displayAvatarURL()).setTimestamp();
   
      const isPause = await db.get(`suspended${support.targetID}`);
      const modmailArgs = message.content.split(" ").slice(1);   
  
      switch (message.content.split(" ")[0].slice(1).toLowerCase()) { //if message content in the support user channel is a modmail command, execute the results...
        case "cmds": //on default, give list of modmail sub-commands :)
          messageReception.setTitle("**MODMAIL COMMANDS!**").setColor(client.config.default_color).setDescription(modmailCommands());
          await message.channel.send(messageReception);
          break; 
    
        case "complete": //close the user`s ticket after they`re done and log it!
          if(isPause === true || isPause === "true") return client.error("Continue the support user's thread before completing the ticket!", message); 
    
          messageReception.setTitle("ModMail Ticket Resolved").setFooter(`ModMail Ticket Closed -- ${supportUser.tag}`)
          .setDescription(`*Your ModMail has been marked as **complete** and has been logged by the admins/mods. If you wish to create a new one, please send a message to the bot.*`)     
          
          await supportUser.send(`<@${supportUser.id}>`, { embed: messageReception });
            
          log(client, client.config.channels.auditlogs, { embed: messageReception }); 
    
          await message.channel.delete();
          db.delete(`support_${support.targetID}`);
          break; 
        
        case "continue": // continue a thread
          if(isPause === false || isPause === "false") return client.error("This ticket was not paused.", message); 
          
          await db.delete(`suspended${support.targetID}`);
          
          messageReception.setTitle("Modmail Ticket Continued!").setDescription(`<@${supportUser.id}>, your thread has **continued**! We're ready to continue!`).setColor("BLUE") 
          .attachFiles(["./assets/continued.gif"]).setThumbnail("attachment://continued.gif").setFooter(`ModMail Ticket Continued -- ${supportUser.tag}`); 
          
          await supportUser.send(messageReception); 
          await message.channel.send(messageReception);
          log(client, client.config.channels.auditlogs, { embed: messageReception });
          break;
          
        case "pause":  // pause a thread 
          if(isPause === true || isPause === "true") return client.error("This ticket already paused. Unpause it to continue!", message); 
          
          await db.set(`suspended${support.targetID}`, true);
          
          messageReception.setTitle("Modmail Ticket Paused!").setDescription(`<@${supportUser.id}>, your thread has been **paused**!`).setColor("YELLOW")
          .attachFiles(["./assets/paused.gif"]).setThumbnail("attachment://paused.gif").setFooter(`ModMail Ticket Paused -- ${supportUser.tag}`); 
    
          await supportUser.send(messageReception);
          
          messageReception.setDescription(`Admin/mod, please use \`${client.config.prefix}continue\` to cancel.`);
       
          await message.channel.send(messageReception);
          log(client, client.config.channels.auditlogs, { embed: messageReception });
          break;
    
        case "reply": // reply to user 
          await message.delete();
          if(isPause === true || isPause === "true") return client.error("This ticket is already paused. Unpause it to continue.", message); 
    
          let msg = modmailArgs.join(" "); 
          if (!msg) return client.error("Please enter a message for the support ticket user!", message); 
          
          messageReception.setTitle(`**Admin/mod replied to you!**`).setFooter(`ModMail Ticket Replied -- ${supportUser.tag}`)
          .setDescription(`> ${msg}`).attachFiles(["./assets/reply.gif"]).setThumbnail("attachment://reply.gif")
          .setImage(message.attachments.first() ? message.attachments.first().url : "") ;
          
          await supportUser.send(messageReception);
          await message.channel.send(messageReception);
          log(client, client.config.channels.auditlogs, { embed: messageReception });
          break; 
    
        default:
          await message.react(":x:");
          await message.delete({ timeout: 3000 });
          break;
        }
      }
};