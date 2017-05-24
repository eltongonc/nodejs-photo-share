var express = require('express');
var axios = require('axios');
var Trello = require("node-trello");
var http = require('http');


var router = express.Router();
var client = {
    appName: "Real time web",
    scope: 'scope=read%2Cwrite%2Caccount',
    callbackURL: 'return_url=http://localhost:5000/callback',
    method: 'callback_method=fragment',
    key: process.env.TRELLO_KEY,
    secret: process.env.TRELLO_OAUTH_SECRET,
};
var trelloUrl = `https://trello.com/1/authorize?name=${client.appName}&key=${client.key}&${client.scope}&${client.method}&${client.callbackURL}`
var oauth_secrets = {};
/******************
*** Home route.
*****************/

router.get("/", function (req, res) {
    res.render("index", {trelloUrl});
});

router.get("/main", function (req, res) {
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
router.get("/callback", function (req, res) {
    res.render("callback");
});
// client-side token fix. the token came as a hash.
router.post("/login", function (req, res) {
    var token = req.body.token
    oauth_secrets.token = token;
    res.send('test');
});

router.get('/ping', function(req, res) {
    res.send('pong');
});


module.exports = router;
