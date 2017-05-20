    function Game(){
        this.turn = 0;
        this.totalPlayers = [];
        this.inProgress = false;
        this.waiting = true;
        this.playersReady = false;
    }

    // start the game
    Game.prototype.start = function () {
        this.inProgress = true;
        socket.emit('new game', this);
        console.log(game);
        return game;
    };

    // Game.prototype.update = function (gameState) {
    //     for (var x in gameState) {
    //         game[x] = gameState[x];
    //     }
    //     socket.emit('set gameState', game);
    // };

    // update the game
    Game.prototype.update = function () {
        console.log(this);
        socket.emit('update game', this);
        // var playersReady = this.totalPlayers.forEach(function(item){
        //     if (item.player.isReady) {
        //         game.waiting = false;
        //     }else {
        //         game.waiting = true;
        //     }
        // });
        //
        // if (this.waiting === false) {
        //     this.newTurn();
        // }
        console.log("game updated");
        return game;
    };

    // pass cards counterCW
    Game.prototype.newTurn = function () {
        console.log(this.totalPlayers);
        // console.log('newTurn');
    };


    Game.prototype.getPlayedCard = function () {
        socket.emit('get played card');
    };

    var game = new Game();
    game.start();
    socket.emit('register player', player);

    // check if there are 4 players
    socket.on('game can start',function(){
        console.log('game can start');
    });

    // get the current players
    socket.on('players update', function(dataBase){
        displayPlayers(dataBase);
        game.totalPlayers = dataBase;
        // start game
        if (game.totalPlayers.length === 4) {
            game.start();
        }
    });

    socket.on('game updated', function(dataBase){
        game.totalPlayers = dataBase;
    });

    socket.on('gave card', function(destination,card){
        if (destination.id === socket.id) {
            console.log("this is the user");
            player.updateHand(card);
        }
    });

    socket.on('all cards', function(deck){
        console.log(deck);
    });
