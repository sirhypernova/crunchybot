module.exports = {
  checks: ["dj.owner"],
  usage: "{prefix}restart",
  help: "Restart the bot",
  /**
   *
   * @param {Message} msg
   */
  async handler(msg, args, client) {
    msg.channel.send("Restarting..");
    client.destroy();
    process.exit(0);
  },
};
