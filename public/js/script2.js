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
        socket.emit('img uploaded', img, canvas.toJSON())
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
var screenshotBtn = document.getElementById('screenshot')
if (screenshotBtn) {
    screenshotBtn.addEventListener('click',function(){
        socket.emit('take screenshot', canvas.toDataURL())
    })
}

socket.on('screenshot taken', function(imgLink){
    alert("screenshot taken and saved at "+ imgLink)
})

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

socket.on('update canvas', function(newCanvas){
    for (var i = 0; i < newCanvas.length; i++) {
        newCanvas[i]
    }
    canvas.renderAll();
})

socket.on('uploaded', function(data){
    console.log(data);
    broadcastImage(data)
})


/******************
** polling
******************/
socket.on('connect', function() {
    console.log("connected");
    socket.emit('load canvas')

    var notification = document.querySelectorAll('.notification');
    if (notification.length > 0) {
        for (var i = 0; i < notification.length; i++) {
            notification[i].remove()
        }
    }
});

socket.on('disconnect', function() {
  console.log('disconnected');
  socket.emit('save canvas')
  var notification =
  `<div class="notification">
    <h3>The connection with the server has been lost. Trying to reconnect</h3>
  </div>`

  document.body.insertAdjacentHTML('afterbegin', notification);
});

// autosave the body every ten seconds
// setInterval(function(){
//     console.log("autosaved", canvas.toJSON());
//     socket.emit('save canvas',canvas.toJSON())
// },10000)
