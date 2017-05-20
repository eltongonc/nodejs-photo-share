var socket = io();
var index = 0;


/******************
** screenshot
******************/
// src: http://www.xpertdeveloper.com/2012/10/webpage-screenshot-with-html5-js/
function takeScreenshot(exports) {
    function urlsToAbsolute(nodeList) {
        if (!nodeList.length) {
            return [];
        }
        var attrName = 'href';
        if (nodeList[0].__proto__ === HTMLImageElement.prototype
        || nodeList[0].__proto__ === HTMLScriptElement.prototype) {
            attrName = 'src';
        }
        nodeList = [].map.call(nodeList, function (el, i) {
            var attr = el.getAttribute(attrName);
            if (!attr) {
                return;
            }
            var absURL = /^(https?|data):/i.test(attr);
            if (absURL) {
                return el;
            } else {
                return el;
            }
        });
        return nodeList;
    }

    function screenshotPage() {
        urlsToAbsolute(document.images);
        urlsToAbsolute(document.querySelectorAll("link[rel='stylesheet']"));
        var screenshot = document.documentElement.cloneNode(true);
        var b = document.createElement('base');
        b.href = document.location.protocol + '//' + location.host;
        var head = screenshot.querySelector('head');
        head.insertBefore(b, head.firstChild);
        screenshot.style.pointerEvents = 'none';
        screenshot.style.overflow = 'hidden';
        screenshot.style.webkitUserSelect = 'none';
        screenshot.style.mozUserSelect = 'none';
        screenshot.style.msUserSelect = 'none';
        screenshot.style.oUserSelect = 'none';
        screenshot.style.userSelect = 'none';
        screenshot.dataset.scrollX = window.scrollX;
        screenshot.dataset.scrollY = window.scrollY;
        var script = document.createElement('script');
        script.textContent = '(' + addOnPageLoad_.toString() + ')();';
        screenshot.querySelector('body').appendChild(script);
        var blob = new Blob([screenshot.outerHTML], {
            type: 'text/html'
        });
        return blob;
    }

    function addOnPageLoad_() {
        window.addEventListener('DOMContentLoaded', function (e) {
            var scrollX = document.documentElement.dataset.scrollX || 0;
            var scrollY = document.documentElement.dataset.scrollY || 0;
            window.scrollTo(scrollX, scrollY);
        });
    }

    function generate() {
        window.URL = window.URL || window.webkitURL;
        window.open(window.URL.createObjectURL(screenshotPage()));
    }
    exports.screenshotPage = screenshotPage;
    exports.generate = generate;
    generate();
}

var screenshotBtn = document.getElementById('screenshot')
if (screenshotBtn) {
    screenshotBtn.addEventListener('click',function(){
        takeScreenshot(window)
    })
}
/******************
** Socket events
******************/
// if (location.path === "/main") {
// }
socket.on('new position', function(element, Y,X){
    var img = document.getElementById(element);
    console.log(img);
    img.style.marginTop = Y+"px";
    img.style.marginLeft = X+"px";
    console.log("x:",X)
    console.log("y:",Y);
});

socket.on('new images', function(imgSrc, i){
    console.log(i);
    var img = document.createElement("img");
    img.src = JSON.parse(imgSrc);
    img.id = "img_"+i;
    document.body.appendChild(img);
    img.setAttribute("draggable", "false");
    // attach the mousedown event to all image tags
    img.addEventListener('mousedown',startDragging);
})

socket.on('update body', function(newBody){
    console.log(newBody);
    document.body.innerHTML = newBody
})

socket.on('connect', function(){
    socket.emit('load body')
})

socket.on('disconnect', function(){
    console.log("disconnect");
    socket.emit('save body',document.body.outerHTML.replace(/\n|\t/g, ' ')
)
})
// save on leave
socket.on('user left', function(){
    socket.emit('save body',document.body.outerHTML.replace(/\n|\t/g, ' '))
})

// autosave the body every ten seconds
setInterval(function(){
    console.log("autosaved", document.body.outerHTML);
    socket.emit('save body', document.body.outerHTML.replace(/\n|\t/g, ' '))
},10000)
/******************
** Trello api fix
******************/
if (location.hash.match(/#token=/)) {
    axios.post(location.origin+'/login',{
        token: location.hash.replace("#token=","")
    }).then(function(response){
        setTimeout(function(){
            window.location.replace('/main')
        },1000)
    })
    .catch(function(err){
        if (err) throw err
    })
}
/******************
** Drag movements
******************/
// currently draggin element
var draggingElement;
// run this code when fully loaded
window.addEventListener('load',function(){
    // add drag event to all images
    var imgs = document.querySelectorAll("img");
    for (var i = 0; i < imgs.length; i++) {
        imgs[i].addEventListener('mousedown',startDragging);
    }
    // add drag event to the body
    var body = document.querySelector("body")
    body.addEventListener('mousemove',dragging);
    body.addEventListener('mouseup',doneDragging);
});

// set this image as the current one to be dragged
function startDragging(e){
    draggingElement = this;
}

function dragging(e){
    if (draggingElement == null)
    return false;
    // calculate coordinates based of its size
    var Y = e.pageY - (e.target.width/2);
    var X = e.pageX - (e.target.height/2);
    console.log(draggingElement);
    socket.emit('img update', e.target.id, Y,X);
    // set coordinates
    draggingElement.style.marginTop = Y+"px";
    draggingElement.style.marginLeft = X+"px";

}

function doneDragging(e){
    // unset the image that's being dragged
    draggingElement = null;
}

/*******************
** Drag&Drop images
********************/
document.body.addEventListener('dragover', cancel, false);
document.body.addEventListener('dragenter', cancel, false);
document.body.addEventListener('drop', droppedImage, false);
function cancel(e) {
    if (e.preventDefault) { e.preventDefault(); }
    return false;
}

function droppedImage(e){
    e.preventDefault();
    var dt = e.dataTransfer;
    var files = dt.files;
    generateImages(files);
    return false;
}

function generateImages(files) {
    if (typeof files === "string") {
        console.log(JSON.parse(files))
    }
    console.log(files);
    for (var i=0; i<files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        //attach event handlers here...
        reader.readAsDataURL(file);
        // src: http://stackoverflow.com/questions/33923985/parameter-is-not-of-type-blob
        reader.addEventListener('loadend', function(e, file) {
            var bin = this.result;
            var img = document.createElement("img");
            // img.file = file;
            img.src = bin;
            img.id = "img_"+index;
            document.body.firstChild.appendChild(img);
            img.setAttribute("draggable", "false");
            // attach the mousedown event to all image tags
            img.addEventListener('mousedown',startDragging);
            socket.emit('images dropped', JSON.stringify(bin),index);
            index+=1;


        }.bindToEventHandler(file), false);
    }
}
Function.prototype.bindToEventHandler = function bindToEventHandler() {
    var handler = this;
    var boundParameters = Array.prototype.slice.call(arguments);
    //create closure
    return function(e) {
        e = e || window.event; // get window.event if e argument missing (in IE)
        boundParameters.unshift(e);
        handler.apply(this, boundParameters);
    }
};
