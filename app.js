require('dotenv').config();

var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    exphbs  = require('express-handlebars'), // templating engine
    http = require('http'),
    socketIO = require('socket.io') // websockets

var routes = require('./routes/index');

var app = express(),
port = process.env.PORT || 5000,
server = http.Server(app),
io = socketIO.listen(server);

// view engine setup
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    partialsDir: ['views/partials/']
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

// client-side setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));

// Make socket io available through req
app.use(function(req, res, next){
    req.io = io;
    next();
});

// routes
for (var x in routes) {
    app.use(x, routes[x]);
}

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


// socket events
var socketsEvets = require('./socketEvents.js')(io, app.token, app.trello);


// Start app
server.listen(port, function() {
    console.log('Express server listening on port ' + port);
});
