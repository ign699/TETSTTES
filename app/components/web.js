const axios = require('axios');
const cheerio = require('cheerio');
const _ = require('lodash');

const main = async (link) => {
  const web = await axios.get(link);
  const $ = cheerio.load(web.data);
  const elems = $('.slick-slider .thumbsItem img');
  const images = elems.map(function(index, element) {
    const link = $(element).attr('src').split(';');
    link.pop();
    return link.join('')
  }).get();
  const desc = $('.section-description').text();
  return {
    images: _.uniq(images),
    desc
  }
};

module.exports = main;
