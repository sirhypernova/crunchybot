const { RichEmbed } = require("discord.js");

module.exports = {
  usage: "{prefix}help [command]",
  help: "Show a list of commands",
  async handler(msg, args, bot) {
    const embed = new RichEmbed();
    embed.setAuthor("Help", msg.author.avatarURL);
    embed.setColor("#f47521");

    let owner = bot.dj.get("owners").includes(msg.author.id);
    if (args[0] == "!" && owner) {
      owner = false;
      args.shift();
    }

    if (args.length) {
      if (bot.commands.exists(args[0])) {
        let cmd = bot.commands.get(args[0]);
        if (cmd.checks.includes("dj.owner") && !owner) {
          embed.setAuthor(`Help - Unknown Command`, msg.author.avatarURL);
          embed.setDescription("There was no command found with this name");
        } else {
          embed.setAuthor(`Help - "${args[0]}" command`, msg.author.avatarURL);
          embed.addField(
            "Help",
            cmd._help.split("{prefix}").join(bot.dj.get("prefix"))
          );
          embed.addField("Usage", cmd.usage);
        }
      } else {
        embed.setAuthor(`Help - Unknown Command`, msg.author.avatarURL);
        embed.setDescription("There was no command found with this name");
      }
    } else {
      let modules = bot.modules.collection;

      modules.map((mod) => {
        if (!mod._name) return;

        let data = [];
        let commands = bot.commands.collection.filter(
          (cmd) => cmd.module._name == mod._name
        );
        commands.map((cmd) => {
          if (cmd.checks.includes("dj.owner") && !owner) return;
          let name = cmd._name;
          let help = cmd._help.split("\n")[0];
          data.push(`${name}: ${help}`);
        });

        let nameArr = mod._name.split("");
        let upper = nameArr.shift().toUpperCase() + nameArr.join("");

        if (data.length) embed.addField(upper, data.join("\n"));
      });
    }
    msg.channel.send({
      embed,
    });
  },
};
