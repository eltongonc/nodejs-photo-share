require('dotenv').config();

var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    exphbs  = require('express-handlebars'), // templating engine
    http = require('http'),
    socketIO = require('socket.io'), // websockets
    axios = require('axios'), // a better api calls
    stringDiff = require('diff'); //checks diffs of elements
    fs = require('fs');

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

// api credentials
var api = {
    appName: "Real time web",
    scope: 'scope=read%2Cwrite%2Caccount',
    callbackURL: 'return_url=http://localhost:3000/callback',
    method: 'callback_method=fragment',
    key: process.env.TRELLO_KEY,
    secret: process.env.TRELLO_OAUTH_SECRET,
};
var idList = "591efb7d570cadac0b06f3ea";
var idBoard = "591eea3ee00e7d3abf0787da";

// Start socket
var allUsers = [];
var bodyData;
io.on('connection', function(client){
    var token = app.token
    var trello = app.trello;

    // Listens to whenever an images is dropped
    client.on('images dropped', (files, index)=>{
        client.broadcast.emit('new images', files,index );
    })
    // Listens to whenever an images is being dragged
    client.on('img update', (element, Y,X)=>{
        client.broadcast.emit('new position', element, Y,X );
    })

    // load backup from trello
    client.on('load body', loadBody)
    // save backup to trello
    client.on('save body', autosave)
    // make a backup of the body when an user disconnects
    client.on('disconnect', ()=>{
        console.log("96:disconnected", bodyData);
        autosave(bodyData)
    })

    function autosave(body){
        console.log("101:autosaved");
        if (bodyData) {
            var newBody = stringDiff(bodyData,body)
            bodyData = newBody;
            saveBody(bodyData);
        }else {
            saveBody(body)
        }
    }
    function stringDiff(stringA, stringB) {
        var diff = stringB.indexOf(stringA)
        var length = stringA.length;
        var newBody;

        if(diff == 0){
            newBody = stringB.substring(length);
        }else{
            newBody = stringB.substring(0, diff);
            newBody += stringB.substring(diff + length);
        }
        return newBody;
    }
    function loadBody(){
        if (token && trello) {
            var url = `https://api.trello.com/1/lists/${idList}/cards`;
            axios.get(url,{
                key:api.key,
            }).then(response=>{
                // update the card if it already exists
                var cards = response.data;
                var filteredCards = cards.filter(card=>card.name.match(/Body/))
                if (filteredCards.length >= 1) {
                    var url = `https://api.trello.com/1/cards/${filteredCards[0].id}`;
                    // experimental: Set the body of the page to what is saved on trello.
                    axios.get(url, {
                        key:api.key,
                        token: token,
                    }).then(res=>{
                        var card = res.data;
                        io.sockets.emit('update body', card.desc );
                        bodyData = card.desc;
                    }).catch(err=>{if (err)throw err});
                }
            }).catch(err=>{if (err)throw err});
        }
    }

    function saveBody(body){
        fs.writeFile("./public/html/body.html", body, function(err) {
            if(err) {
                return console.log(err);
            }

            console.log("The file was saved!");
        });
        if (token && trello) {
            var url = `https://api.trello.com/1/lists/${idList}/cards`;
            axios.get(url,{
                key:api.key,
            }).then(response=>{
                var cards = response.data;
                var filteredCards = cards.filter(card=>card.name.match(/Body/))
                if (filteredCards.length >= 1) {
                    // update the card if it exists
                    var url = `https://api.trello.com/1/cards/${filteredCards[0].id}`;
                    axios.delete(url, {
                        key:api.key,
                        token: token,
                    }).catch(err=>{if (err)throw err});
                    // update the body for the remaining users
                    // loadBody()

                }
                    // create new card if it doesn't exist
                    var url = `https://api.trello.com/1/cards`;
                    axios.post(url, {
                        key:api.key,
                        token: token,
                        name: "Body"+client.id,
                        desc: "test",
                        urlSource: "http://localhost:3000/html/body.html",
                        pos: "top",
                        due: null,
                        idList: "591efb7d570cadac0b06f3ea"
                    }).catch(err=>{if (err)throw err});
            }).catch(err=>{if (err)throw err});
        }
    }
});


// Start app
server.listen(port, function() {
    console.log('Express server listening on port ' + port);
});
