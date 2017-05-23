var socket = io();

/******************
** Trello api fix
******************/
if (location.hash.match(/#token=/)) {
    axios.post(location.origin+'/login',{
        token: location.hash.replace("#token=","")
    }).then(function(response){
        setTimeout(function(){
            window.location.replace(location.origin+'/main')
        },1000)
    })
    .catch(function(err){
        if (err) throw err
    })
}

/*****************
** Canvas
*****************/
var colors = {
    red: "#F2898B",
    green: "#B9E1EC",
}
// use fabric to generate a wrapper around the canvas element.
var canvas = new fabric.Canvas('canvas-container',{
    width : window.innerWidth,
    height : window.innerHeight - 50,
    background : colors.green,
    selection: false
});

/****************************
** get all files from canvas
****************************/
fabric.Canvas.prototype.getItemsById = function(id) {
  var objectList = {},
      objects = this.getObjects();

  for (var i = 0, len = this.size(); i < len; i++) {
    if (objects[i].id && objects[i].id === id) {
      objectList = objects[i];
    }
  }
  return objectList;
};

/*****************
** edit image
*****************/
var placeholderId = {}
  canvas.on({
    'object:moving': function(e) {
        console.log(e.target);
        e.target.opacity = 0.5;
        e.target.selectable = false
        canvas.forEachObject(function(obj) {
            if (obj.id && obj.id === e.target.id) {
                obj.set('selectable', false)
            }
        });
        // dragg on all clients
        socket.emit('img moving',  e.target.id, e.target)
    },
    'object:scaling': function(e) {
        console.log(e.target);
        // dragg on all clients
        socket.emit('img moving',  e.target.id, e.target)
    },
    'object:modified': function(e) {
        console.log(e.target);
        e.target.opacity = 1;

        e.target.selectable = true
        // make all objects selectable
        canvas.forEachObject(function(obj) {
            obj.set('selectable', true)
        });

        socket.emit('img moving',  e.target.id, e.target)
    }
  });

  socket.on('new position', function(item){
    canvas.forEachObject(function(obj) {
        if (obj.id && obj.id === item.id) {
            for (var x in item) {
                obj[x] = item[x];
            }
        }
    });
    canvas.renderAll()
  });

/*****************
** upload files
*****************/
document.getElementById("upload").addEventListener("change",handleChange);

// file upload handler
function handleChange(e){
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function (f) {
        var data = f.target.result;
        addToCanvas(data)
    };
    reader.readAsDataURL(file);
}
// creates an fabric img and adds it to the canvas
function addToCanvas(item){
    fabric.Image.fromURL(item, function (img) {
        var oImg = img.set({left: 0, top: 0, angle: 00}).scale(0.9);
        socket.emit('img uploaded', img, socket.id)
    });
}

function broadcastImage(item){
    var img = document.createElement("img");
    img.onload = function(){
       var fImg = new fabric.Image(img, {
           width: item.width,
           id: item.id,
           height: item.height,
           skewX: item.skewX,
           skewY: item.skewY,
           left: item.left,
           top: item.top,
           angle: item.angle,
           scaleX: item.scaleX,
           scaleY: item.scaleY
       });
       canvas.add(fImg).renderAll();
    }
    img.src = item.src
}


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
        socket.emit('take screenshot')
    })
}


/******************
** Socket events
******************/
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

socket.on('uploaded', function(data){
    console.log(data);
    broadcastImage(data)
})
socket.on('connect', function(){
    socket.emit('load body')
})

socket.on('disconnect', function(){
    console.log("disconnect");
    socket.emit('save canvas')
})
// save on leave
socket.on('user left', function(){
    socket.emit('save canvas')
})

// autosave the body every ten seconds
// setInterval(function(){
//     console.log("autosaved");
//     socket.emit('save canvas',canvas.toDataURL())
// },10000)
