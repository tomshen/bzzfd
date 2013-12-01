var request = require('request')
  , _ = require('lodash');

var NUMBERS = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'
];

var UNIMPORTANT_WORDS = [
  'the', 'a', 'an', 'of', 'with', 'for', 'on'
];

function word_importance(word) {
  if (word in UNIMPORTANT_WORDS)
    return 0;
  else
    return 1;
}

/* returns main topic in tokens
 * TODO: use NLP to find main topic
 */
function getTopic(tokens) {
  return _.filter(tokens, function (token) {
    return isNaN(token) && word_importance(token) > 0.5;
  }).join(' ');
}

/* returns first valid integer in tokens, or 10 otherwise */
function getNumItems(tokens) {
  var nums = _.filter(tokens, function (token) {
    return !isNaN(token) || token in NUMBERS
  });
  if (nums.length > 0)
    return parseInt(nums[0]);
  return 10;
}

/* TODO: ideally, we want to get a pool of the top 2 * numItems images, and
 * then randomly sample numItems of them, so that we get a somewhat
 * different set of images every time.
 * TODO: handle numItems > 10 properly
 */
function getImages(query, numItems, callback) {
  var reqURL = 'https://www.googleapis.com/customsearch/v1?';
  reqURL += 'key=' + process.env.GOOGLE_API_KEY;
  reqURL += '&cx=' + process.env.GOOGLE_SEARCH_ID;
  reqURL += '&searchType=image';
  reqURL += '&q=' + query;
  reqURL += '&num=' + (0 < numItems && numItems < 10 ? numItems : 10);
  console.log('[GET]: ' + reqURL);
  return request.get({
    url: reqURL,
    json: true
    }, function(err, res, body) {
      if (!err && res.statusCode == 200)
        return callback(null, body.items);
      else
        return callback(err);
  });
}

function makeArticleItem(image) {
  return {
    title: image.title,
    imageLink: image.link,
    thumbLink: image.image.thumbnailLink,
    sourceLink: image.image.contextLink,
    sourceName: image.displayLink,
    text: '' // TODO: generate text based on actual BuzzFeed articles
  };
}

exports.makeArticle = function (headline, callback) {
  var toks = headline.split(' ');
  var topic = getTopic(toks);
  var numItems = getNumItems(toks);
  getImages(topic, numItems, function(err, images) {
    if (err)
      callback(err);
    else
      callback(err, _.map(images, makeArticleItem));
  });
}