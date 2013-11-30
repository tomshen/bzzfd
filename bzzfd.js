var request = require('request'),
    _ = require('lodash');

function getTopic(tokens) {
  var articles = ['the', 'a', 'an'];
  return _.filter(tokens, function (token) {
    return !(_.isNumber(token) || token in articles);
  }).join(' ');
}

/* returns first valid integer in tokens, or 10 otherwise */
function getNumItems(tokens) {
  var numbers = [
    'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'
  ];
  var nums = _.filter(tokens, function (token) {
    return _.isNumber(token) || token in numbers
  });
  if (nums.length > 0 && 0 < nums[0] && nums[0] < 10)
    return nums;
  return 10;
}

/* TODO: ideally, we want to get a pool of the top 2 * numItems images, and
 * then randomly sample numItems of them, so that we get a somewhat
 * different set of images every time.
 */
function getImages(query, numItems, callback) {
  var reqURL = 'https://www.googleapis.com/customsearch/v1?';
  reqURL += 'key=' + process.env.GOOGLE_API_KEY;
  reqURL += '&cx=' + process.env.GOOGLE_SEARCH_ID;
  reqURL += '&searchType=image';
  reqURL += '&q=' + query;
  reqURL += '&num=' + numItems;
  console.log(numItems);
  return request.get({
    url: reqURL,
    json: true
    }, function(err, res, body) {
      if (!err && res.statusCode == 200) {
        callback(null, body.items);
      }
  });
}

function makeArticleItem(image) {
  return {
    title: image.title,
    imageLink: image.image.thumbnailLink,
    sourceLink: image.image.contextLink,
    sourceName: image.displayLink,
    text: ''
  };
}

exports.makeArticle = function (headline, callback) {
  var toks = headline.split(' ');
  var topic = getTopic(toks);
  var numItems = getNumItems(toks);
  getImages(topic, numItems, function(err, images) {
    var items = _.map(images, makeArticleItem);
    callback(err, items);
  });
}