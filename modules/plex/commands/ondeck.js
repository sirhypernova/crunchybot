const { RichEmbed } = require("discord.js");

module.exports = {
  checks: ["dj.owner"],
  usage: "{prefix}ondeck",
  help: "Shows next episodes to watch",
  async handler(msg, args, client) {
    let episodes = (
      await this.module.plexClient.query(
        `/library/sections/${client.config.plex.libraryIndex}/onDeck`
      )
    ).MediaContainer.Metadata;

    const embed = new RichEmbed()
      .setTitle("On Deck")
      .setColor("#f47521")
      .setTimestamp();
    episodes.forEach((ep) => {
      embed.addField(
        ep.grandparentTitle,
        `S${ep.parentIndex} E${ep.index} - ${ep.title}`
      );
    });
    msg.channel.send(embed);
  },
};
