const PlexAPI = require("plex-api");
const fs = require("fs");
const rl = require("readline-sync");

const configExists = fs.existsSync("config.json");
if (!configExists) {
  fs.copyFileSync("config.tmp.json", "config.json");
}

const config = require("./config.json");

if (!config.token.length) config.token = rl.question("Bot Token> ");
if (!config.outputFolder.length || config.outputFolder == "/path/to/output")
  config.outputFolder = rl.questionPath("Output> ", {
    isDirectory: true,
    exists: true,
  });
if (config.owners[0] == "DISCORD_ID")
  config.owners[0] = rl.question("Discord ID> ");
if (!config.login.username.length)
  config.login.username = rl.question("Crunchyroll Username> ");
if (!config.login.password.length)
  config.login.password = rl.question("Crunchyroll Password> ", {
    hideEchoBack: true,
  });

async function selectPlexLibrary(plex) {
  const libraries = (
    await plex.query("/library/sections")
  ).MediaContainer.Directory.filter((l) => l.type == "show");
  const libraryKey =
    libraries[
      rl.keyInSelect(
        libraries.map((l) => l.title),
        "Choose a library",
        { cancel: false }
      )
    ].key;
  config.plex.libraryIndex = libraryKey;
  fs.writeFileSync("config.json", JSON.stringify(config, null, "\t"));
  console.log("Setup Complete.");
}

if (rl.keyInYN("Plex Setup?")) {
  if (!config.plex.hostname.length)
    config.plex.hostname = rl.question("Hostname> ");
  if (!config.plex.token.length) {
    config.plex.port = rl.questionInt("Port> ", { defaultInput: 32400 });
    let plexUsername = rl.question("Username> ");
    let plexPassword = rl.question("Password> ", { hideEchoBack: true });
    let plex = new PlexAPI({
      hostname: config.plex.hostname,
      port: config.plex.port,
      username: plexUsername,
      password: plexPassword,
    });
    plex.authenticator.on("token", async (token) => {
      config.plex.token = token;
      config.plex.enabled = true;
      fs.writeFileSync("config.json", JSON.stringify(config, null, "\t"));
      await selectPlexLibrary(new PlexAPI(config.plex));
    });
    plex.query("/").catch((e) => {
      console.error(e.message);
      console.log("Please try again.");
      process.exit();
    });
  } else {
    selectPlexLibrary(new PlexAPI(config.plex));
    // fs.writeFileSync("config.json", JSON.stringify(config, null, "\t"));
    // console.log("Setup Complete.");
  }
} else {
  fs.writeFileSync("config.json", JSON.stringify(config, null, "\t"));
  console.log("Setup Complete.");
}
