module.exports.getNickname = (client, message) => {
    const member = message.guild.member(message.author);
    if (member.nickname !== null) {
      return member.nickname;
    }
    return member.user.username;
}

module.exports.getPosition = (client, member) => {
    for (let index = 0; index < queue.length; index += 1) {
      if (queue[index].author.id === member.id) return index;
    }
    return -1;
} 