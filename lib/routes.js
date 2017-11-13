var app = require('./app.js');
var axios = require('axios');
var Trello = require("node-trello");
var http = require('http');

var host = process.env.HOST || 'https://real-time-moodboard.herokuapp.com';
var client = {
    appName: "Real time web",
    scope: 'scope=read%2Cwrite%2Caccount',
    callbackURL: 'return_url='+host+'/callback',
    method: 'callback_method=fragment',
    key: process.env.TRELLO_KEY,
    secret: process.env.TRELLO_OAUTH_SECRET,
};
var trelloUrl = `https://trello.com/1/authorize?name=${client.appName}&key=${client.key}&${client.scope}&${client.method}&${client.callbackURL}`
var oauth_secrets = {};

module.exports = function routes(app){
    /******************
    *** Home route.
    *****************/
    app.get("/", function (req, res) {
        res.render("instagram");
    });

    app.get("/main", function (req, res) {
        if (oauth_secrets.token) {
            var token = oauth_secrets.token
            var trello = new Trello(client.key, client.token);
            req.app.token = token;
            req.app.trello = trello

            res.render('instagram');
        }else{
            res.render("index", {trelloUrl});
        }
    });

    // redirect from trello
    app.get("/callback", function (req, res) {
        res.render("callback");
    });
    // client-side token fix. the token came as a hash.
    app.post("/login", function (req, res) {
        var token = req.body.token
        oauth_secrets.token = token;
        res.send('test');
    });
}
