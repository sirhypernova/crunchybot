const Module = require("cmd-dj/modules/module");
const path = require("path");
const Utils = require("../utils");

module.exports = {
  events: {
    async ready() {
      /** @type {Module} */
      const module = this;
      this.searchData = await Utils.fetchSearch();
      module.scanCommands(path.resolve(__dirname, "anime/commands"));
      console.log("[%s] Module Loaded", module._name);
    },
  },
};
