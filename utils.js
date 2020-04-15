const crunchyBase = "https://www.crunchyroll.com/";
const episodesRegex = /^(?:[1-9]{1}[0-9]{0,2}(?:-[1-9]{1}[0-9]{0,2})?){1,}$/;

const fetch = require("node-fetch");
const cheerio = require("cheerio");

module.exports = {
  async fetchData(show) {
    return await fetch(`${crunchyBase}${show}`)
      .then((res) => res.text())
      .then((text) => {
        const $ = cheerio.load(text);
        let title = $("#showview-content-header .ellipsis span").text();
        const hasSeasons = !!$("li.season").length;
        const seasons = $("li.season a.season-dropdown")
          .map((i, el) => $(el).attr("title"))
          .get()
          .filter((name) => !name.toLowerCase().includes("dub"))
          .filter((name) => !name.endsWith(")"))
          .filter((name) => !name.includes("Promotional"))
          .reverse();
        if (hasSeasons && !seasons.length) return { title, seasons: [title] };
        if (!seasons.length) return false;
        return { title, seasons };
      })
      .catch((e) => false);
  },
  async fetchSearch() {
    const data = await fetch(
      crunchyBase + "ajax/?req=RpcApiSearch_GetSearchCandidates"
    )
      .then((res) => res.text())
      .then((text) =>
        JSON.parse(text.replace("/*-secure-\n", "").replace("\n*/", ""))
      );
    if (data.result_code == 1) {
      return data.data
        .filter((d) => d.type == "Series")
        .map((d) => ({ name: d.name, link: d.link.replace("/", "") }));
    } else {
      return false;
    }
  },
  crunchyBase: crunchyBase,
  episodesRegex: episodesRegex,
};
