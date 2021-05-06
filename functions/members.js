module.exports.getNickname = ( message) => {
    const member = message.guild.member(message.author);
    if (member.nickname !== null) {
      return member.nickname;
    }
    return member.user.username;
} 

module.exports.getPosition = ( member) => { 
    for (let index = 0; index < this.client.queue.length; index += 1) {
      if (this.client.queue[index].author.id === member.id) return index;
    }
    return -1;
} 
