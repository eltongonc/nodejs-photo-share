// use websockets
var socket = io();

// get a list of all instagram photos
// var instaPhotos = document.querySelectorAll('footer li img');
// instaPhotos.forEach(item=>{
//     item.addEventListener('click', updateImage)
// });
// get username input
// var username = document.querySelector('form.username');
// username.addEventListener('submit', formSubmit);

// get the canvasElement where images will be shown
var canvas = document.querySelectorAll('.collage div');
// drag handlers
canvas.forEach(function(collageSection){
    collageSection.addEventListener('dragover', dragover);
    collageSection.addEventListener('dragleave', dragleave);
    collageSection.addEventListener('drop', drop);
})

/******************
** Sockets handlers
******************/
// get a list of all users along with an update message
socket.on('update users', function(user, allUsers, message){
    alert(message);
});
// get files that are uploaded by others will be build
// socket.on('update image', function(data){
//     updateImage(data);
// });


/******************
** functions
******************/
// function to handle the user login
function formSubmit(event){
    event.preventDefault();
    var input = username.children[1];
    if (input !== '') {
        socket.emit('new user', input.value, function(value){
            if (value) {
                // hide the input if a username is available
                username.classList.add('hidden');
                username.parentNode.innerHTML += "<h1>Drag a image here to view</h1>";
            }
        });
    }
    return false;
}

// drag and drop functions
function dragstart(event){
    // Set the format of the data
    event.dataTransfer.setData("text/html", event.target.id);
}

// Triggers whenever an element is above the dropzone
function dragover(event){
    event.preventDefault();
    // Set the dropEffect to move. I am not sure what it does. I think it changes the cursor
    event.dataTransfer.dropEffect = "move";
    // give user feedback
    event.srcElement.classList.add('dragover');
}
// Triggers whenever an element is above the dropzone
function dragleave(event){
    event.preventDefault();
    // remove feedback style
    canvas.forEach(function(item){
        if (item.classList.contains('dragover')) {
            item.classList.remove('dragover');
        }
    })
}

// Triggers whenever an element is dropped in the dropzone
function drop(event){
    event.preventDefault();
    // Get the id of the target and add the moved element to the target's DOM
    var data = event.dataTransfer.getData('text') || event.dataTransfer.files;
    generateFiles(event.srcElement,data);
    // remove feedback style
    canvas.forEach(function(item){
        item.classList.remove('dragover');
    })
}

function generateFiles(container, files){
    var reader = new FileReader();
    console.log(files.length);
    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {
        // Only process image files.
        if (!f.type.match('image.*')) {
            continue;
        }
        // Read the file that is dropped
        reader.onload = (function(theFile) {
            return function(e) {
                var data = {src:e.target.result, name: theFile.name};
                // Render the image in the canvas.
                updateImage(container, data);
                // socket.emit("new dropped file",data);
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    }
}
var i = 1;

function updateImage(container, data){
    // if the container is not a div remove it
    if (container.parentNode.className !== "collage") {
        container = container.parentNode;
    }
    container.innerHTML = '';

    if (data.name && data.src) {
        var span = `<img id="image_${i}" src="${data.src}" title="${escape(data.name)}"/>`
        container.innerHTML=span;
        // make it dragable
        // console.dir(container.children[0]);
        container.children[0].addEventListener('dragstart', dragstart);
        socket.emit("new dropped file",data);
        i++;
    }
    // if (data.type === "click"){
    //     data = {src:this.src, name:this.alt};
    //
    //     var span = `<span><img src="${data.src}" title="${escape(data.name)}"/></span>`
    //     container.innerHTML=span;
    //     socket.emit("new dropped file",data);
    // }
}
