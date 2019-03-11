const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const _ = require('lodash');

function getChromiumExecPath() {
  return puppeteer.executablePath().replace('app.asar', 'app.asar.unpacked');
}

const OtoDomParser = async (link) => {
  const browser = await puppeteer.launch({executablePath: getChromiumExecPath()});
  const page = await browser.newPage();
  await page.goto(link);

  let content = await page.content();
  const { length } = cheerio.load(content)('.slick-dots.slick-thumb li');

  for (let i = 0; i < length - 6; i++) {
    await page.evaluate(() => document.querySelector('button.slick-next').click());
    await page.waitFor(1000)
  }

  content = await page.content();
  const $ = cheerio.load(content);
  const elems = $('.thumbsItem');

  const images = elems.map((index, element) => {
    let bg = $(element).css('background-image');
    bg = bg.replace(/.*\s?url\([\'\"]?/, '').replace(/[\'\"]?\).*/, '');
    return bg
  }).get();

  const desc = $('.section-description').text();
  await browser.close();

  return {
    images: _.uniq(images),
    desc
  }

};

module.exports = OtoDomParser;
