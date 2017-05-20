// (function(){
    var socket = io(); // use websockets
    // Player class
    function Player(name){
        this.name = name;
        this.startingHand;
        this.isReady = false;
        this.cardToGive;

        // initial draw
        socket.emit('new player', this);
        socket.emit('draw cards', 4);
        // socket.emit('update game', this);
    }

    // function to toggle if the player is ready
    Player.prototype.toggleReady = function(){
        playerIsReady();
        player.isReady = !player.isReady;
        console.log(this);
        socket.emit('update player', this);
        return this.isReady;
    };

    // Select a card and wait for other players
    Player.prototype.selectCard = function(cardCode){
        document.querySelector('.your-hand button.readyButton').disabled=false;
        var hand = this.startingHand;
        // get the value array element of cardCode
        var playedCard = hand.filter(function(cards){
            if (cards.code == cardCode) {
                return cards;
            }
        });
        this.cardToGive = playedCard[0];

        this.toggleReady();

        // update game
        game.update();
        return this.cardToGive;
    };


    // When all players are ready play selectd card
    Player.prototype.playCard = function () {
        console.log(this.cardToGive);
        var hand = this.startingHand;
        // remove this card from players hand
        hand.splice(hand.indexOf(this.cardToGive), 1);
        document.querySelector('#card'+this.cardToGive.code).classList.add('to-remove');
        // update hand
        this.startingHand = hand;
        // update game;
        socket.emit('player played a card', socket.id, this.cardToGive);
    };

    // receive a card from other player
    Player.prototype.updateHand = function (card) {
        // remove the card from players hand
        document.querySelector('#card'+this.cardToGive.code).parentNode.remove();
        // add the receiving card to player hand
        this.startingHand.push(card);
        initialDraw([card]);
    };


    // new player
    var player = new Player('elton');
    var readyButton = document.querySelector('.your-hand button.readyButton');

    // initial draw
    socket.on('drew cards', function(newHand){
        player.startingHand = newHand.cards;
        initialDraw(player.startingHand);
    });

    // receive a card
    socket.on('new turn', function(){
        player.playCard();
    });

// }());
