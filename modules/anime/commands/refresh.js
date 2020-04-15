const Utils = require("../../../utils");

module.exports = {
  checks: ["dj.owner"],
  usage: "{prefix}refresh",
  help: "Refresh search data",
  async handler(msg, args, client) {
    let searchData = await Utils.fetchSearch();
    if (searchData) {
      this.module.searchData = searchData;
      return msg.channel.send("Refreshed search data.");
    }
    msg.channel.send(
      "An error occured while fetching search data. Try again later."
    );
  },
};
