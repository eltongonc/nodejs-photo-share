var socket = io();
//
// var playedPile = document.querySelector('.played-cards');
// var remainingPile = document.querySelector('.remaining-cards');
// var playerHand = document.querySelector('section.your-hand');
//
// function initialDraw(cards){
//     var ul = playerHand.children[2];
//     cards.forEach(function(card){
//         ul.innerHTML += `
//             <li>
//                 <button class="card" id='card${card.code}'>
//                     <img src='${card.image}' alt='${card.suit} ${card.value}'/>
//                 </button>
//             </li>
//         `;
//     });
//     makeCardsClickable();
// }
//
//
// function makeCardsClickable(){
//     var cardElements = document.querySelectorAll('.card');
//
//     cardElements.forEach(function(card){
//         var id = card.id.replace('card','');
//
//         card.addEventListener('click', function(){
//             for (var i = 0; i < cardElements.length; i++) {
//                 if (cardElements[i].classList.contains('card-selected')) {
//                     cardElements[i].classList.remove('card-selected');
//                 }
//             }
//             card.classList.add('card-selected');
//             player.selectCard(id);
//
//             // update other players t
//         });
//     });
// }
//
// function displayPlayers(dataBase){
//     var otherPlayer = document.querySelectorAll('section');
//     for (var i = 0; i < dataBase.length; i++) {
//         otherPlayer[i].children[0].innerHTML = dataBase[i].player.name;
//         // otherPlayer[i].insertAdjacentHTML('afterbegin', players[i].name);
//     }
// }
//
// function playerIsReady(){
//     playerHand.querySelector('.status').innerHTML = '<h2 class="readyText">Player is ready</h2>';
// }

/*****************
** Instagram
*****************/
var button = document.getElementById('snapshot');
// use fabric to manipulate images
var canvas = new fabric.Canvas('canvas',{
    width : window.innerWidth,
    height : window.innerHeight
});

// load users instagram images
var instaPhotos = document.querySelectorAll('aside li img');
instaPhotos.forEach(addToCanvas);

// select a image to manipulate
image = new fabric.Image.fromURL('img/card.png', function(img){
    img.id = "card";
    img.left = 100;
    img.top = 100;
    img.angle = 20;
    img.opacity = 0.85;
    // place on the canvas
    canvas.add(img);
});

// img.on('modified', function(){
//     socket.emit('image update', JSON.stringify(img));
// });


socket.on('image position', function(newImg){
    console.log(JSON.parse(newImg));
    // console.log(image);
    // var image =canvas.getObjects()[0];

    // canvas.add(newImg);
});

canvas.getObjects().forEach(function(item){
    console.log(item);
});
console.log(canvas.getObjects());

// // get other users mouse position
// socket.emit('mouse position', {x:options.e.clientX, y:options.e.clientY});

// canvas.on('mouse:down', function(options) {
//     socket.emit('info', options.target);
//   console.log(options.e.clientX, options.e.clientY);
// });

function addToCanvas(item){
    item.addEventListener('click', function(){
        var img = new fabric.Image(item, {
            left : 100,
            top : 100,
            angle : 20,
            opacity : 0.85,
        });
        canvas.add(img);
    });
}
