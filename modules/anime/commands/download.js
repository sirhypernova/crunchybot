const Utils = require("../../../utils");
const path = require("path");
const fs = require("fs");
const stripAnsi = require("strip-ansi");
const { Message, RichEmbed } = require("discord.js");

const crunchyBase = Utils.crunchyBase;

module.exports = {
  checks: ["dj.owner"],
  usage: "{prefix}download [unblocked] <episode[-episode]> <...show>",
  help: "Download Anime to your server",
  /**
   *
   * @param {Message} msg
   */
  async handler(msg, args, client) {
    let unblocked = false;
    if (args[0] == "true" || args[0] == "unblocked") {
      unblocked = true;
      args.shift();
    }
    if (args.length < 2) return msg.channel.send("Invalid arguments");
    if (!Utils.episodesRegex.test(args[0]) && !args[0].endsWith(","))
      return msg.channel.send("Please specify valid episodes to download.");
    const episodes = args.shift();
    let show = args.join("-");
    if (!this.module.searchData)
      return msg.channel.send(
        "Search data is not loaded. Please use the refresh command."
      );

    let searchedShows = this.module.searchData
      .filter(
        (d) =>
          d.name.toLowerCase().includes(args.join(" ").toLowerCase()) ||
          d.link.toLowerCase().includes(show.toLowerCase())
      )
      .slice(0, 4);

    if (!searchedShows.length) return msg.channel.send("Show does not exist");
    if (searchedShows.length > 1) {
      let selectShow = await msg.channel.send(
        new RichEmbed()
          .setTitle("Choose Show")
          .setDescription(
            searchedShows
              .map((show, index) => `**${index + 1}.** ${show.name}`)
              .join("\n")
          )
          .setFooter("Please send the show number to download from.")
          .setColor("#f47521")
      );
      const showCollector = msg.channel.createMessageCollector(
        (m) => {
          return (
            m.author.id == msg.author.id && /^[1-9]{1}[0-9]*$/.test(m.content)
          );
        },
        { time: 15000, maxMatches: 1 }
      );

      show = await new Promise((res) => {
        showCollector.on("end", (shows) => {
          if (shows.size) {
            let thisShow = parseInt(shows.first().content);
            if (thisShow > searchedShows.length) return res("invalid");
            shows.first().delete();
            res(searchedShows[thisShow - 1].link);
          }
          res(false);
        });
      });
      if (show == "invalid")
        return msg.channel.send("The show you provided is invalid.");
      if (show == false) return msg.channel.send("Timed out");
      await selectShow.delete();
    } else {
      show = searchedShows[0].link;
    }

    const showData = await Utils.fetchData(show);
    if (showData == false) return msg.channel.send("Show does not exist");
    const showName = showData.title.replace(/\//g, "\\");

    let season = 1;
    let progressMessage = false;
    if (showData.seasons.length > 1) {
      progressMessage = await msg.channel.send(
        new RichEmbed()
          .setTitle("Choose Season")
          .setDescription(
            showData.seasons
              .map((name, index) => `**${index + 1}.** ${name}`)
              .join("\n")
          )
          .setFooter("Please send the season number to download from.")
          .setColor("#f47521")
      );

      const seasonCollector = msg.channel.createMessageCollector(
        (m) => {
          return (
            m.author.id == msg.author.id && /^[1-9]{1}[0-9]*$/.test(m.content)
          );
        },
        { time: 15000, maxMatches: 1 }
      );

      season = await new Promise((res) => {
        seasonCollector.on("end", (seasons) => {
          if (seasons.size) {
            let thisSeason = parseInt(seasons.first().content);
            if (thisSeason > showData.seasons.length) return res("invalid");
            seasons.first().delete();
            res(thisSeason);
          }
          res(false);
        });
      });

      if (season == "invalid")
        return msg.channel.send("The season you provided is invalid.");
      if (season == false) return msg.channel.send("Timed out");
    }
    const progress = {};
    const epNames = {};

    const baseEmbed = new RichEmbed()
      .setTitle("Downloading...")
      .setDescription("*Waiting for progress..*")
      .addField("Season", showData.seasons[season - 1])
      .setColor("#f47521");

    if (!progressMessage) {
      progressMessage = await msg.channel.send(baseEmbed);
    } else {
      await progressMessage.edit(baseEmbed);
    }

    async function updateProgress(embed, extra = false, error = false) {
      embed.setDescription(
        Object.entries(progress)
          .map((ep) => {
            return `${ep[0]} - ${epNames[ep[0]]}: **${ep[1]}%**`;
          })
          .join("\n")
      );
      if (extra) {
        if (error) {
          baseEmbed.setDescription("Error: " + extra).setColor("RED");
        } else {
          baseEmbed.setFooter(extra);
        }
        baseEmbed.setTimestamp();
      }
      await progressMessage.edit(embed);
    }

    let progressInterval = setInterval(() => {
      if (Object.keys(progress).length) updateProgress(baseEmbed);
    }, 3000);

    const outputFolder = client.config.outputFolder;
    const login = client.config.login;

    let showFolderExists = fs.readdirSync(outputFolder).includes(showName);

    if (!showFolderExists) fs.mkdirSync(path.join(outputFolder, showName));

    if (!fs.existsSync(path.join(outputFolder, showName, "Season " + season)))
      fs.mkdirSync(path.join(outputFolder, showName, "Season " + season));

    const pty = require("node-pty");
    const downloader = pty.spawn(
      "node",
      [
        "/home/sirhypernova/crunchydownbot/crunchyroll-dl/index.js",
        ...`-i ${crunchyBase}${show} -e ${episodes} --ignore-dubs -u ${
          login.username
        } -p ${login.password} ${
          unblocked ? "--unblocked" : ""
        } --language enUS`.split(" "),
        "-o",
        '":ep - :epname"',
      ],
      { cwd: path.join(outputFolder, showName, "Season " + season) }
    );

    let cancelled = false;

    let selectedSeason = false;

    let currentEpisode = parseInt(episodes.split("-")[0]);
    let hasSeasons = 0;

    let error = false;

    downloader.on("data", (data) => {
      process.stdout.write(data);
      let text = stripAnsi(data.toString());
      if (text.includes("◯") && !selectedSeason) {
        hasSeasons += text.split("◯").length - 1;
        if (hasSeasons != showData.seasons.length) return;
        selectedSeason = true;
        downloader.write("\u001b[B".repeat(season - 1));
        downloader.write(" \n");
      }
      if (text.includes("Downloading") && text.includes("encoded")) {
        let percent = /([0-9]{1,3}\.[0-9]{1,2})%/.exec(text)[1];
        progress[currentEpisode] = percent;
        if (percent.includes("100")) {
          progress[currentEpisode] = "100.00";
        }
      } else if (text.includes("Downloading episode as")) {
        let episodeData = /"(.*)"/
          .exec(text)[1]
          .split(/([1-9]+[0-9]*) - /g)
          .slice(1);
        episodeName = episodeData
          ? episodeData[1].replace(".mp4", "")
          : "UNKNOWN";
        currentEpisode = parseInt(episodeData[0]);
        epNames[parseInt(episodeData[0])] = episodeName;
      } else if (text.includes("Could not find")) {
        let badEpisodes = text.split(": ")[1].trim();
        let firstBad = badEpisodes.includes(",")
          ? badEpisodes.split(", ")[0]
          : badEpisodes;
        const lastEpisode =
          episodes.split("-").length > 1 ? episodes.split("-")[1] : episodes;
        let logBad =
          firstBad == lastEpisode ? firstBad : `${firstBad}-${lastEpisode}`;
        error = `Episode(s) ${logBad} do not exist in season \`${
          showData.seasons[season - 1]
        }\``;
        cancelled = true;
      } else if (text.includes("File already exists")) {
        progress[currentEpisode] = "100.00";
      }
      if (text.includes("when creating an unblocked")) {
        error =
          "Something went wrong when creating an unblocked session. Please try again without the 'unblocked' argument.";
        cancelled = true;
      }
      if (text.includes("UnhandledPromiseRejectionWarning:")) {
        error = text
          .split("\r")[0]
          .split("UnhandledPromiseRejectionWarning: ")[1];
        cancelled = true;
      }
    });

    downloader.on("exit", (code) => {
      if (!cancelled) {
        updateProgress(baseEmbed, "Download(s) Complete");
      } else {
        updateProgress(baseEmbed, error, error);
      }
      clearInterval(progressInterval);
    });
  },
};
