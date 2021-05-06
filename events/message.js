module.exports = async (client, message) => {
    // Checks if the Author is a Bot, or the message isn`t from the guild, ignore it.
  if (!message.content.startsWith(client.config.prefix) && message.channel.type !== "dm" || message.author.bot) return; 
}