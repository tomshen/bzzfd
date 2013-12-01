require('newrelic');

var path = require('path')
  , express = require('express')
  , bzzfd = require('./bzzfd.js');

// Set up Express
var app = express();
app.configure(function() {
  app.use(express.logger());
  app.use(express.static(path.join(__dirname, 'public')));
  app.set('port', process.env.PORT || 5000);
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'ejs');
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(app.router);
});

app.get('/', function (req, res) {
  res.render('index');
});

app.get('/article', function (req, res) {
  var headline = req.query.headline;
  bzzfd.makeArticle(headline, function (err, items) {
    if (err)
      console.error(err);
    res.render('article', {
      headline: headline,
      items: items
    });
  });
});

app.listen(app.get('port'), function() {
  console.log('Listening on ' + app.get('port'));
});
