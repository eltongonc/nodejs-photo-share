require('dotenv').config();

// dependencies
var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    exphbs  = require('express-handlebars'), // templating engine
    http = require('http'),
    axios = require('axios'), // a better api calls
    fs = require('fs');

// define the app and make it globaly available
module.exports =  express();
var app = module.exports,
    server = http.Server(app),
    port = process.env.PORT || 5000;

// init routes
var routes = require('./routes.js')(app);

// init sockets
var sockets = require('./socket')(app, server);

// view engine setup
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    partialsDir: ['views/partials/']
}));
// define a views dir and engine
app.set('views', path.join(__dirname, '..', 'views'));
app.set('view engine', 'handlebars');

// parse submited forms as json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
// define a static dir for client
app.use(express.static(path.join(__dirname, '..','public')));

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: err,
        title: 'error'
    });
});

// Start app
server.listen(port, function() {
    console.log('Express server listening on port ' + port);
});
