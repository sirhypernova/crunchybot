const Module = require("cmd-dj/modules/module");
const path = require("path");
const Utils = require("../utils");
const PlexAPI = require("plex-api");

module.exports = {
  events: {
    async ready() {
      /** @type {Module} */
      const module = this;
      if (
        !module.dj.config.plex ||
        !module.dj.config.plex.enabled ||
        module.dj.config.plex.libraryIndex == undefined
      )
        return console.log("Plex module not enabled.");
      this.plexClient = new PlexAPI(module.dj.config.plex);
      module.scanCommands(path.resolve(__dirname, "plex/commands"));
      console.log("[%s] Module Loaded", module._name);
    },
  },
};
