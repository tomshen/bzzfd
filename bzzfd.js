var _ = require('lodash')
  , Twitter = require('twitter-js-client').Twitter;

var twitter = new Twitter({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  callBackUrl: process.env.TWITTER_CALLBACK_URL
});

var NUMBERS = [
  'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'
];

var UNIMPORTANT_WORDS = [
  'the', 'a', 'an', 'of', 'with', 'for', 'on'
];

var ADJECTIVES = [
  'Afraid','Agreeable','Amused','Ancient','Angry','Annoyed','Anxious','Arrogant','Ashamed','Average','Awful','Bad','Beautiful','Better','Big','Bitter','Black','Blue','Boiling','Brave','Breezy','Brief','Bright','Broad','Broken','Bumpy','Calm','Charming','Cheerful','Chilly','Clumsy','Cold','Colossal','Combative','Comfortable','Confused','Cooing','Cool','Cooperative','Courageous','Crazy','Creepy','Cruel','Cuddly','Curly','Curved','Damp','Dangerous','Deafening','Deep','Defeated','Defiant','Delicious','Delightful','Depressed','Determined','Dirty','Disgusted','Disturbed','Dizzy','Dry','Dull','Dusty','Eager','Early','Elated','Embarrassed','Empty','Encouraging','Energetic','Enthusiastic','Envious','Evil','Excited','Exuberant','Faint','Fair','Faithful','Fantastic','Fast','Fat','Few','Fierce','Filthy','Fine','Flaky','Flat','Fluffy','Foolish','Frail','Frantic','Fresh','Friendly','Frightened','Funny','Fuzzy','Gentle','Giant','Gigantic','Good','Gorgeous','Greasy','Great','Green','Grieving','Grubby','Grumpy','Handsome','Happy','Hard','Harsh','Healthy','Heavy','Helpful','Helpless','High','Hilarious','Hissing','Hollow','Homeless','Horrible','Hot','Huge','Hungry','Hurt','Hushed','Husky','Icy','Ill','Immense','Itchy','Jealous','Jittery','Jolly','Juicy','Kind','Large','Late','Lazy','Light','Little','Lively','Lonely','Long','Loose','Loud','Lovely','Low','Lucky','Magnificent','Mammoth','Many','Massive','Melodic','Melted','Mighty','Miniature','Moaning','Modern','Mute','Mysterious','Narrow','Nasty','Naughty','Nervous','New','Nice','Nosy','Numerous','Nutty','Obedient','Obnoxious','Odd','Old','Orange','Ordinary','Outrageous','Panicky','Perfect','Petite','Plastic','Pleasant','Precious','Pretty','Prickly','Proud','Puny','Purple','Purring','Quaint','Quick','Quickest','Quiet','Rainy','Rapid','Rare','Raspy','Ratty','Red','Relieved','Repulsive','Resonant','Ripe','Roasted','Robust','Rotten','Rough','Round','Sad','Salty','Scary','Scattered','Scrawny','Screeching','Selfish','Shaggy','Shaky','Shallow','Sharp','Shivering','Short','Shrill','Silent','Silky','Silly','Skinny','Slimy','Slippery','Slow','Small','Smiling','Smooth','Soft','Solid','Sore','Sour','Spicy','Splendid','Spotty','Square','Squealing','Stale','Steady','Steep','Sticky','Stingy','Straight','Strange','Striped','Strong','Successful','Sweet','Swift','Tall','Tame','Tan','Tart','Tasteless','Tasty','Tender','Tender','Tense','Terrible','Testy','Thirsty','Thoughtful','Thoughtless','Thundering','Tight','Tiny','Tired','Tough','Tricky','Troubled','Ugliest','Ugly','Uneven','Upset','Uptight','Vast','Victorious','Vivacious','Voiceless','Wasteful','Watery','Weak','Weary','Wet','Whispering','Wicked','Wide','Wide',-'Eyed','Witty','Wonderful','Wooden','Worried','Yellow','Young','Yummy','Zany'
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
function getItems(query, numItems, callback) {
  twitter.doRequest(
    'https://api.twitter.com/1.1/search/tweets.json?q=' + query + '&count=' + numItems,
    function (err, res, body) {
      callback(err);
    }, function (data) {
      var statuses = JSON.parse(data).statuses;
      var items = _.map(_.range(_.min([numItems, 100])), function (itemNum) {
        var imgURL = 'http://mebe.co/' + query.replace(' ', '_');
        var status = statuses[itemNum];
        if (!status)
          status = {
            user: {
              name: 'Anonymous Stranger',
              screen_name: null
            },
            text: 'No words necessary.'
          };
        return {
          title: getAdjective() + ' ' + query,
          imageLink: imgURL + '?' + itemNum,
          thumbLink: imgURL + '?' + itemNum,
          sourceLink: 'http://mebe.com',
          sourceName: 'mebe.co',
          author: String(status.user.name).trim(),
          text: _.filter(String(status.text).split(' '), function (tok) {
            return tok != 'RT'
                && tok.indexOf('://') === -1
                && tok.indexOf('http') === -1
                && tok.indexOf('@') === -1;
          }).join(' '),
          textLink: status.user.screen_name ? 'https://twitter.com/' + status.user.screen_name : ''
        };
      });
      callback(null, items);
    });
}

function addText(images, callback) {
  var numItems = images.length;

}

function getAdjective() {
  return _.sample(ADJECTIVES);
}

exports.makeArticle = function (headline, callback) {
  var toks = headline.split(' ');
  var topic = getTopic(toks);
  var numItems = getNumItems(toks);
  getItems(topic, numItems, callback);
}