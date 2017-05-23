var axios = require('axios'), // a better api calls
    fs = require('fs');
// api credentials
var api = {
    appName: "Real time web",
    scope: 'scope=read%2Cwrite%2Caccount',
    callbackURL: 'return_url=http://localhost:3000/callback',
    method: 'callback_method=fragment',
    key: process.env.TRELLO_KEY,
    secret: process.env.TRELLO_OAUTH_SECRET,
};
// trello options
var idBoard = "591eea3ee00e7d3abf0787da";
var idList = "591efb7d570cadac0b06f3ea";

var index = 0;
var allUsers = [];
var bodyData;
var imgLink = "http://localhost:5000/img/canvas.jpeg";

function socketEvents(io, token, trello){
    io.on('connection', function(client){
    /******************
    ** user options
    ******************/


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
    client.on('img uploaded', data=>{
        index += 1
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
        io.sockets.emit("uploaded", item)
    })
    // take screenshot of the canvas
    client.on('take screenshot', takeScreenshot)

    /******************
    ** Trello
    ******************/
    // load backup from trello
    client.on('load body', loadCanvas)

    // save backup to trello
    client.on('save canvas', saveCanvas)

    // make a backup of the body when an user disconnects

    client.on('disconnect', ()=>{
        console.log("disconnected");
        saveCanvas(imgLink)
    })

    /******************
    ** funtions
    ******************/
    function loadCanvas(){
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
                        urlSource:canvasImg
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
})
}

module.exports = socketEvents;
