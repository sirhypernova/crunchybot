# Crunchyroll Downloader Bot

Easily download Anime from Crunchyroll to your private server via a discord bot

## Features

- Download episodes by range or single episode
- Automatically search for show by name
- Select season from list
- Does not list dubs

### Requirements

- [node.js](https://nodejs.org) 8+
- [ffmpeg](https://www.ffmpeg.org/)
- [mkvmerge](https://mkvtoolnix.download/downloads.html)

### Installation

`cd crunchybot && npm install`

Rename `config.tmp.json`. Put your discord ID and whoever else you want to allow command usage in `owners` section.

Put your Crunchyroll login in the `login` section.

Put the path for where to download Anime to in the `outputFolder` section.

Fill in your discord bot token.

### Running

Start the bot by typing `node index.js` in the downloaded folder.

If you want to keep your bot running permanently, I recommend using [pm2](http://npmjs.com/package/pm2).
