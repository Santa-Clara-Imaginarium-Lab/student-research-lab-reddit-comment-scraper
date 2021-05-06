<<<<<<< HEAD
const { Command } = require("discord.js-commando"); 

module.exports = class spotifyAlbumCommand extends Command {
  constructor(client) {
    super(client, {
      name: "sp-album",
      group: "music",
      memberName: "sp-album",
      description: "Get an album URL from Spotify!",
      throttling: {
        usages: 2,
        duration: 5,
      },
      args: [
        {
          key: "album",
          prompt: "Enter an album name to lookup!",
          type: "string",
        },
      ],
    });
  }

  async run( message, { album }) { 
    this.client.spotifyApi.clientCredentialsGrant().then(
        function(data) {
            // Save the access token so that it"s used in future calls
            this.client.spotifyApi.setAccessToken(data.body["access_token"]);
            const query = album.join(" ");
            this.client.spotifyApi.searchTracks(query)
                .then(function(data) {
                    console.log(data);
                    try {
                        message.channel.send(data.body.tracks.items[0].album.external_urls.spotify);
                    }
                    catch{
                        message.channel.send("Couldn't find that album on Spotify!");
                    }
                }, function(err) {
                    message.channel.send("Couldn't find that album on Spotify!");
                    console.error(err);
                });
        },
        function(err) {
            console.log("Something went wrong when retrieving an access token", err);
        }
    ); 
  };
=======
const { Command } = require("discord.js-commando"); 
const SpotifyWebApi = require("spotify-web-api-node");
const spotifyApi = new SpotifyWebApi({
    clientId: botconfig.spotifyClientId,
    clientSecret: botconfig.spotifyClientSecret
});

module.exports = class spotifyAlbumCommand extends Command {
  constructor(client) {
    super(client, {
      name: "sp-album",
      group: "utility",
      memberName: "sp-album",
      description: "Get an album URL from Spotify!",
      throttling: {
        usages: 2,
        duration: 5,
      },
      args: [
        {
          key: "album",
          prompt: "Enter an album name to lookup!",
          type: "string",
        },
      ],
    });
  }

  async run( message, { album }) { 
    spotifyApi.clientCredentialsGrant().then(
        function(data) {
            // Save the access token so that it"s used in future calls
            spotifyApi.setAccessToken(data.body["access_token"]);
            const query = album.join(" ");
            spotifyApi.searchTracks(query)
                .then(function(data) {
                    console.log(data);
                    try {
                        message.channel.send(data.body.tracks.items[0].album.external_urls.spotify);
                    }
                    catch{
                        message.channel.send("Couldn't find that album on Spotify!");
                    }
                }, function(err) {
                    message.channel.send("Couldn't find that album on Spotify!");
                    console.error(err);
                });
        },
        function(err) {
            console.log("Something went wrong when retrieving an access token", err);
        }
    ); 
  };
>>>>>>> fb4a4f504dcea792e47c3c995674822f39667500
};