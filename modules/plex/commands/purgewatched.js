const fs = require("fs");
const path = require("path");

module.exports = {
  checks: ["dj.owner"],
  usage: "{prefix}purgewatched",
  help: "Purge all watched episodes",
  async handler(msg, args, client) {
    let watchedEpisodes = [];
    await this.module.plexClient
      .query(`/library/sections/${client.config.plex.libraryIndex}/all`)
      .then(async (res) => {
        const shows = res.MediaContainer.Metadata;
        for (let show of shows) {
          const seasons = (
            await this.module.plexClient.query(show.key)
          ).MediaContainer.Metadata.filter((s) => s.type == "season");
          for (let season of seasons) {
            let seasonData = await this.module.plexClient.query(season.key);
            let watched = seasonData.MediaContainer.Metadata.filter(
              (ep) => ep.viewCount && ep.viewCount > 0
            );
            watchedEpisodes = watchedEpisodes.concat(watched);
          }
        }
      });
    if (watchedEpisodes.length) {
      const files = watchedEpisodes
        .sort((a, b) => b.Media[0].Part[0].size - a.Media[0].Part[0].size)
        .map((ep) => ep.Media[0].Part[0]);
      const totalBytes = files.reduce((v, n) => v + n.size, 0);
      const watchedGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);
      msg.channel.send(
        watchedGB +
          "gb of watched anime will be deleted. This may take a few seconds.."
      );
      files.forEach((file) => {
        fs.unlink(file.file, (err) => {
          if (err) console.log(err);
        });
      });
      const seasonFolders = [];
      const removedSeasons = [];
      files.forEach((file) => {
        let folder = path.dirname(file.file);
        if (!seasonFolders.includes(folder)) {
          seasonFolders.push(folder);
          let hasFiles = !!fs.readdirSync(folder).length;
          if (!hasFiles) {
            removedSeasons.push(folder);
            fs.rmdirSync(folder);
          }
        }
      });
      const showFolders = [];
      removedSeasons.forEach((season) => {
        const show = path.resolve(season, "..");
        if (!showFolders.includes(show)) {
          let hasFiles = !!fs.readdirSync(show);
          if (!hasFiles) {
            fs.rmdirSync(show);
          }
        }
      });
    } else {
      msg.channel.send("There is no watched anime to delete.");
    }
  },
};
