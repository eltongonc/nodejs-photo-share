require('dotenv').config();

var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    exphbs  = require('express-handlebars'), // templating engine
    http = require('http'),
    socketIO = require('socket.io') // websockets
    axios = require('axios'), // a better api calls
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
var host = process.env.HOST || 'https://real-time-moodboard.herokuapp.com';
var api = {
    appName: "Real time web",
    scope: 'scope=read%2Cwrite%2Caccount',
    callbackURL: 'return_url='+host+'/callback',
    method: 'callback_method=fragment',
    key: process.env.TRELLO_KEY,
    secret: process.env.TRELLO_OAUTH_SECRET,
};
// trello options
var idBoard = "591eea3ee00e7d3abf0787da";
var idList = "591efb7d570cadac0b06f3ea";

var index = 0;
var allUsers = [];
var imgLink = host+"/img/canvas.jpeg";


// socket events
io.on('connection', function(client){
    var canvas = [];
    var token = app.token;
    var trello = app.trello;
    console.log("new connection", client.id);
    /******************
    ** users
    ******************/
    // New user
    client.on('new user', function(name){
        // add a user to the database if it's an unique name
        if(isUniqueUser(name)){
            allUsers.push({name, id: client.id});
            updateUsers(client,{name,id:client.id},'has joined the party');
        }else{
            updateUsers(client,null,'Name already taken');
        }
        console.log(allUsers);
    });

    // Whenever a user shuts down the browser
    client.on('disconnect', function(){
        // Get the data of the current leaving user and update the list of users
        var leavingUser = checkCurrentUser(client.id);
        if (leavingUser) {
            updateUsers(io,leavingUser[0],'has left the party');
            // Remove leavingUser from list
            allUsers.splice(allUsers.indexOf(leavingUser),1);
        }
    });

/******************
** images
******************/
// Listens to whenever an images is being dragged
client.on('img moving', (id,element)=>{
    var item =  {
        id: id,
        width: element.width,
        height: element.height,
        scaleX: element.scaleX,
        scaleY: element.scaleY,
        skewX: element.skewX,
        opacity: element.opacity,
        selectable: element.selectable,
        skewY: element.skewY,
        left: element.left,
        top: element.top,
        src: element.src,
        angle: element.angle
    }
    client.broadcast.emit('new position', item);
})

// upload an image
client.on('img uploaded', (data, currentCanvas)=>{
    index += 1;
    var item =  {
        id: "fabric-img_"+index,
        width: data.width,
        height: data.height,
        scaleX: data.scaleX,
        scaleY: data.scaleY,
        skewX: data.skewX,
        opacity: data.opacity,
        skewY: data.skewY,
        left: data.left,
        top: data.top,
        src: data.src,
        angle: data.angle
    }
    console.log(currentCanvas);
    canvas = currentCanvas;
    io.sockets.emit("uploaded", item)
})

// take screenshot of the canvas
client.on('take screenshot', takeScreenshot)

/******************
** Trello
******************/
// load backup from trello
client.on('load canvas', loadCanvas)

// save backup to trello
client.on('save canvas', saveCanvas)

// make a backup of the body when an user disconnects
client.on('disconnect', ()=>{
    console.log("disconnected");
    // Get the data of the current leaving user and update the list of users
    var leavingUser = checkCurrentUser(client.id);
    if (leavingUser) {
        updateUsers(io,leavingUser[0],'has left the party');
        // Remove leavingUser from list
        allUsers.splice(allUsers.indexOf(leavingUser),1);
    }
    saveCanvas(imgLink)
    // allUsers.splice(allUsers.indexOf(client.id),1);
})


/******************
** funtions
******************/
function checkCurrentUser(id){
    var users = allUsers.filter(user=>{
        if(user.id == id){ return user; }
    });
    return users;
}

function isUniqueUser(name){
    // src: https://github.com/eltongonc/real-time_web/issues/4
    return !allUsers.some(function (user) {
        return user.name === name;
    });
}

function loadCanvas(){
    console.log("loaded");
    if (token && trello) {
        var url = `https://api.trello.com/1/lists/${idList}/cards`;
        axios.get(url,{
            key:api.key,
        }).then(response=>{
            // update the card if it already exists
            var cards = response.data;
            var filteredCards = cards.filter(card=>card.name.match(/Body/))
            if (filteredCards.length >= 1) {
                var url = `https://api.trello.com/1/cards/${filteredCards[0].id}/attachments`;
                // experimental: Set the body of the page to what is saved on trello.
                axios.get(url, {
                    key:api.key,
                    token: token,
                }).then(res=>{
                    var card = res.data;
                    // bodyData = card.desc;
                }).catch(err=>{if (err)throw err});
            }
        }).catch(err=>{if (err)throw err});
    }
    io.sockets.emit('update canvas', canvas );
}

function saveCanvas(canvasImg){
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
                axios.put(url, {
                    key:api.key,
                    token: token,
                    urlSource: canvasImg,
                }).catch(err=>{if (err)throw err});
                // update the body for the remaining users
                // loadCanvas()
            }
            else {
            //     create new card if it doesn't exist
                var url = `https://api.trello.com/1/cards`;
                axios.post(url, {
                    key:api.key,
                    token: token,
                    name: "Body"+client.id,
                    desc: "test",
                    pos: "top",
                    due: null,
                    urlSource: canvasImg,
                    idList: "591efb7d570cadac0b06f3ea"
                }).catch(err=>{if (err)throw err});
            }
        }).catch(err=>{if (err)throw err});
    }
}

function takeScreenshot(data){
    var base64Data = data.replace(/^data:image\/png;base64,/, "");
    fs.writeFile("./public/img/canvas.jpeg", base64Data, 'base64', console.log);
    client.emit('screenshot taken', imgLink)
}

function updateUsers(client, user, message){
    client.emit('update users', user, allUsers, message);
}


})
// Start app
server.listen(port, function() {
    console.log('Express server listening on port ' + port);
});
