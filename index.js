const config = require("./config.json");

const { Client } = require("cmd-dj");
const client = new Client(config);
client.config = config;
const path = require("path");

client.modules.scan(path.resolve(__dirname, "modules"));

client.run().then(async () => {
  console.log("Logged in as %s!", client.user.tag);
  client.user.setActivity("Anime", { type: "WATCHING" });
});
