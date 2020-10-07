const crunchyBase = "https://www.crunchyroll.com/";
const episodesRegex = /^(?:[1-9]{1}[0-9]{0,2}(?:-[1-9]{1}[0-9]{0,2})?){1,}$/;

const cheerio = require("cheerio");

const puppeteer = require("puppeteer");

let browser = false;

module.exports = {
  async fetchData(show) {
    if (!browser) browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);

    page.on("request", (req) => {
      if (
        ["stylesheet", "font", "image", "script", "xhr"].includes(
          req.resourceType()
        )
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });
    await page.setUserAgent(
      "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
    );

    await page.goto(`${crunchyBase}${show}?skip_wall=1`);
    let text = await page.content();
    await page.close();
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
  },
  async fetchSearch() {
    if (!browser) {
      console.log("Launching browser");
      browser = await puppeteer.launch();
    }
    const page = await browser.newPage();
    await page.setUserAgent(
      "5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36"
    );

    const res = await page.goto(
      `${crunchyBase}ajax/?req=RpcApiSearch_GetSearchCandidates`
    );
    let data = await res.text();
    data = JSON.parse(data.replace("/*-secure-\n", "").replace("\n*/", ""));
    await page.close();
    console.log("Loaded search data.");
    if (data && data.result_code == 1) {
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
