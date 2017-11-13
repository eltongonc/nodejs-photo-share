# Photo share
The Photo Share app allows users to work together on a moodboard, which can be saved on Trello

## How does it work
The app allows users to upload images on to the platform, displays and edit live on the other clients screen.


### Dependencies
- A basic server: [Nodejs](https://nodejs.org/en/)
- A Nodejs framework: [Express](https://expressjs.com/)
- Handlebars as serverside templating engine
- Gulp to bundle and compile SCSS.
- Socket.io - Realtime client - sever communication.
- Fabric.js - Image manipulation.
- Handlebars - Serverside templating.
- JavaScript (mixed ES5 and ES6) - Client.
- CSS for the styling.


### Install
First clone this repo with:
```txt
$ git clone https://github.com/eltongonc/photo_share.git
```
Install the dependencies:
```txt
$ npm install
```
Start a local development server.
```txt
$ npm start
```
Start a live development server.
```txt
$ npm run live
```
In order to use the live development server, a local development must be running.

- Visit the app in the browser locally on `localhost:5000`.
- Visit the app in the browser on other devices with a random generated link with the live development server on `http://<RANDOM_CODE>.ngrok.io` or `https://<RANDOM_CODE>.ngrok.io`.


### Routes
#### Endpoint:** /**
This page will render a view with a link that will redirect the user to a authorization page of Trello.

#### Endpoint: ** /main**
This is where all the magic happens. If a user is authenticated he or she will be able to view the moodboard canvas.

#### Endpoint: ** /callback**
This path is used as a callback URI by Instagram. The link looks as follows `http://localhost:3000/callback#token={token}`   

This is the first time i receive a token as a hash
- code: is used to generate a `access_token`

### Websockets
The app allows communication via Socket.io

**Connection**

This event listener listens whenever a user visits the `/` endpoint.
- It receives one parameter `client` to handle further socket events by the clients.

```js
io.on('connection', function(client){})
```

***
**img moving**

This event listener listens a user is editing an image. It receives two parameters: `id` and `element`. These parameters help building a object which is then broadcast to all other clients.
- It emits a function to the client named `new position` refresh the image on other connected clients

```js
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
```
***
**img uploaded**

This event is called whenever an image is uploaded.
- The server generates an id to make sure they are equal on all clients.

```js
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
    canvas = currentCanvas;
    io.sockets.emit("uploaded", item)
})

```
***
**take screenshot**

Lets a sure save the the canvas as an image.
- this feature uses Node.js fs module to create a .png image out of the canvas.

```js
// take screenshot of the canvas
client.on('take screenshot', takeScreenshot)

function takeScreenshot(data){
    var base64Data = data.replace(/^data:image\/png;base64,/, "");
    fs.writeFile("./public/img/canvas.png", base64Data, 'base64', console.log);
    client.emit('screenshot taken', imgLink)
}

```
***
**load canvas & save canvas**

*Work in progress* This should let the user get and set images to the Trello API.

```js
// load backup from trello
client.on('load canvas', function(){
    // api call
})
// save backup to trello
client.on('save canvas', function(){
    // api
})

```

## Improving the app
A lot love and though have been put to this app, but there are still a lott that can be added or be done better. Here is an overview of features, wishes and know bugs.


## To-do
- [x] Express server
- [x] Implement socket.io
- [x] App is live
- [ ] Identify an user
- [ ] Make the site responsive to work on smaller devices
- [ ] Production ready code on github
- [ ] Join or create a Socket.io room on entering the page
- [x] Upload images that can be edited
- [x] Use an API to get image
- [ ] Save the canvas as an images
- [ ] Use Trello name as profile name

## Wishlist
- [ ] Username and password stored in database
- [x] Edit images (I used Fabric.js but it's a bit glitchy)

## Features
- Login in to a Trello board by its id(Board needs to be public)
- Upload images to a moodboard canvas.
- Move, scale and rotate image.
- Multiple people can use the app at once
- The app checks whenever the user is not connected to the server.

## Example
A live demo is available on [Heroku](https://real-time-moodboard.herokuapp.com/main)

## Known bugs
- App may crash when dropping a large image onto the canvas
- App has bugs when multiple users are connected
- App is not mobile friendly
- App sometimes won't let you select a certain image.

## Sources
- [Trello Api](https://developers.trello.com/advanced-reference)
- [Fabric.js](http://fabricjs.com/docs/)
- [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)

### Author
`Elton Gonçalves Gomes` - check out more of my work on [github](github.com/eltongonc)

## Licensing
MIT Elton Goncalves Gomes
