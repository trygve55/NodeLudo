let express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    geoip = require('geoip-country'),
    gameJS = require('./import'),
    playerAuth = require('./playersAuth'),
    validator = require('validator'),
    jsonpatch = require('fast-json-patch'),
    config = require('./config'),
    logger = require('pino')();

let app = require('express')()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server, {path: config.baseUrl + 'socket.io'});

let router = express.Router();
router.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());

app.use(config.baseUrl, router); //Apply baseUrl for use with reverse proxies.

app.start = app.listen = function () {
    return server.listen.apply(server, arguments)
};

app.start(config.port);
logger.info("Server started on port " + config.port + ".");

let games = [], gamesObserver = []; //Create array for storing all games and gameObservers objects.
gameJS.setSocket(io);
gameJS.setPlayerAuth(playerAuth);
playerAuth.setLobbyUpdateCallback(updateLobby);

//Adding bot players
playerAuth.addPlayer("Blada Bot", null, isBot=true);
playerAuth.addPlayer("Bludo Bot", null, isBot=true);
playerAuth.addPlayer("Lada Bot", null, isBot=true);

//Set default settings for games
let defaultGameSettings = {
    idleTimeout: 20000,
    idleKickTurns: 4,
    idleKickTurnsTotal: 7,
    boardSize: 4
};

//Define pages start
router.get('/', function (req, res) {
    res.render('createNickname', {'baseUrl': config.baseUrl});
});

router.get('/lobby', function (req, res, next) {
    res.render('lobby', {'baseUrl': config.baseUrl});
});

router.get('/game', function (req, res) {
    res.render('game2', {'baseUrl': config.baseUrl});
});
//Define pages end

//Define rest endpoints start

/**
 * Registers the user and returns a JWT if successful.
 * @param req.body.playerName: String - The desired nickname.
 * @returns {
 *     success: Boolean,
 *     message: String
 * }
 */
router.post('/rest/regPlayer', function (req, res) {
    req.body.playerName = validator.escape(req.body.playerName);

    if (req.body.playerName == null)
        return res.json({success: false, message: 'No nickname given.'});
    if (playerAuth.playerExists(req.body.playerName) || req.body.playerName == null)
        return res.json({success: false, message: 'Nickname is already in use.'});
    if (req.body.playerName.length < 3 || req.body.playerName.length > 16)
        return res.json({success: false, message: 'Nickname is to long or to short.'});

    //Find country, offline geoip lookup
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let lookup = geoip.lookup(ip);
    let country = null;
    if (lookup) country = lookup.country;

    let token = playerAuth.addPlayer(req.body.playerName, country);

    res.json({
        success: true,
        playerId: playerAuth.getPlayerId(req.body.playerName),
        token: token
    });

    logger.info("Player " + req.body.playerName + " from " + country + " joined lobby.");

    updateLobby()
});

/**
 * Checks if username is already in use.
 * @param req.body.playerName: String - Username
 */
router.post('/rest/playerExists', function (req, res) {
    if (playerAuth.playerExists(req.body.playerName)) {
        res.json({
            success: false,
            message: 'Nickname is already in use.'
        });
    } else {
        res.json({
            success: true,
            message: 'Nickname free.',
        });
    }
});

/**
 * Returns true if the user is authenticated.
 */
router.get('/rest/login', function (req, res) {
    playerAuth.auth(req, res, function () {
        res.json({'valid': true})
    });
});

/**
 * Sets up authetication middleware validationg the JWT
 */
router.use('/rest', function (req, res, next) {
    playerAuth.auth(req, res, next);
});

/**
 * Returns the specified game object by id.
 * @param req.query.gameid: int - Game id
 * @return game: Json
 */
router.get('/rest/game', function (req, res) {
    if (req.query.gameid >= games.length)
        return res.status(404).send();

    games[req.query.gameid].timeLeftTurn = (
        (games[req.query.gameid] && games[req.query.gameid].status === 1) ?
            ((games[req.query.gameid].idleTimeout - ((new Date()).getTime() - games[req.query.gameid].lastMoveTime.getTime())) / 1000) : 0);
    res.json(games[req.query.gameid]);
});

/**
 * Returns the players in the lobby.
 * @return {
 *     success: Boolean
 *     players: Players[]
 * }
 */
router.get('/rest/lobby', function (req, res) {
    res.json({
        success: true,
        players: playerAuth.getLobbyPlayers()
    });
});

/**
 * Registers an action in the lobby. When the user clicks a button.
 * @param req.body.action: String - "startGame" | "ready" | "unready" | "addBot" | "removeBot"
 */
router.post('/rest/lobby', function (req, res) {
    if (req.body.action === "startGame") {
        let readyPlayers = playerAuth.getReadyPlayers();
        if (readyPlayers.length) startGame(readyPlayers, defaultGameSettings);
    } else if (req.body.action === "ready") {
        playerAuth.setReady(req.decoded.playerId, true);

        setTimeout(function () {
            let readyPlayers = playerAuth.getReadyPlayers();

            if (readyPlayers.length >= 4) {
                let playersToGame = [];
                for (let i = 0; i < 4; i++) {
                    playersToGame[i] = readyPlayers[i];
                }
                startGame(playersToGame, defaultGameSettings);
                updateLobby()
            }
        }, 1000);
    } else if (req.body.action === "unready") {
        let lobbyPlayers = playerAuth.getLobbyPlayers();

        let nonBotPlayers = lobbyPlayers.filter(function(e) {
            return !e.isBot;
        }).length;

        if (nonBotPlayers === 1) {
            for (let i = 0;i < lobbyPlayers.length;i++) {
                playerAuth.setReady(lobbyPlayers[i].playerId, false);
            }
        } else {
            playerAuth.setReady(req.decoded.playerId, false);
        }

    } else if (req.body.action === "addBot") {
        let readyPlayers = playerAuth.getReadyPlayers();

        //require player to be ready for adding bots
        if (readyPlayers.filter(function(e) {
            return e.playerId === req.decoded.playerId;
        }).length === 0) {
            return res.send();
        }

        let botPlayers = playerAuth.getBotPlayers();
        let freeBotPlayers = botPlayers.filter(function(e) {
            return readyPlayers.indexOf(e) === -1;
        });

        playerAuth.setReady(freeBotPlayers[Math.floor(Math.random() * Math.floor(freeBotPlayers.length))].playerId, true);

        setTimeout(function () {
            let readyPlayers = playerAuth.getReadyPlayers();

            if (readyPlayers.length >= 4) {
                let playersToGame = [];
                for (let i = 0; i < 4; i++) {
                    playersToGame[i] = readyPlayers[i];
                }
                startGame(playersToGame, defaultGameSettings);
                updateLobby()
            }
        }, 1000);
    } else if (req.body.action === "removeBot") {
        let botPlayers = playerAuth.getBotPlayers();
        let readyPlayers = playerAuth.getReadyPlayers();

        let readyBotPlayers = botPlayers.filter(function(e) {
            return readyPlayers.indexOf(e) > -1;
        });

        playerAuth.setReady(readyBotPlayers[Math.floor(Math.random() * Math.floor(readyBotPlayers.length))].playerId, false);

    }

    updateLobby();
    res.send();
});

/**
 * Registers an action from a player in a game.
 * @param req.query.gameid: int - gameId
 * @param req.decoded.playerId: int - playerId, fetched from the JWT
 * @param req.body.chatmessage: String - Chatmessage to be posted to the game.
 * @param req.body.leave - if not null makes the player leave the game.
 * @param req.body.pos: int - What square was clocked by the player.
 * @param req.body.chipsToMove: int - How many chips to move.
 * @param req.body.moveChipsIn: Boolean - If the chips are at the starting position choose to move chips to the goal or out from start.
 */
router.post('/rest/game', function (req, res) {
    if (req.body.chatmessage != null) {
        if (req.body.chatmessage.length > 80) return res.status(422).send("Too long message");

        if (playerAuth.chatDOSCheck(req.decoded.playerId)) return res.status(422).send("Too many messages");

        logger.info("Player: " + playerAuth.getPlayerById(req.decoded.playerId).playerName + " sent message '" + req.body.chatmessage + "' in game " + req.query.gameid);
        gameJS.postChatMessage(games[req.query.gameid], playerAuth.getPlayerById(req.decoded.playerId), req.body.chatmessage, "#ffffff");

        sendGameUpdate(games[req.query.gameid].gameId);

        return res.send();
    }

    if (req.body.leave != null) {
        logger.info("Player: " + playerAuth.getPlayerById(req.decoded.playerId).playerName + " left game '" + req.query.gameid);
        gameJS.leaveGame(games[req.query.gameid], playerAuth.getPlayerById(req.decoded.playerId));

        sendGameUpdate(games[req.query.gameid].gameId);

        return res.send();
    }

    switch (gameJS.gameLogic(games[req.query.gameid], req.decoded.playerId, req.body.pos, req.body.chipsToMove, req.body.moveChipsIn)) {
        case 1:
            sendGameUpdate(games[req.query.gameid].gameId);
            break;
        case 2:
            let players = games[req.query.gameid].players;
            for (let i = 0; i < players.length; i++) if (players[i]) playerAuth.setIngame(players[i].playerId, false);
            sendGameUpdate(games[req.query.gameid].gameId);
            break;
        default:
            break;
    }

    res.send();
});

/**
 * @returns games: Game[] - All game objects on the server.
 */
router.get('/rest/games', function (req, res) {
    res.json(games);
});

/**
 * Player active ping. Used to show who is active in the lobby.
 */
router.post('/rest/active', function (req, res) {
    playerAuth.playerActive(req.decoded.playerId);
    res.send();
});
//Define rest endpoints end

/**
 * Attempts to start a game with the given players.
 * @param players: Players[] - The players
 * @param idleTimeout: int - Time limit for each turn in ms.
 */
function startGame(players, idleTimeout) {

    if (players.length < 2) return; //Refuse to start game if less than two players.

    //Randomize the order of the players
    let newPlayers = [];
    while (players.length > 0) {
        let index = Math.floor(Math.random() * (players.length));
        newPlayers.push(players[index]);
        players.splice(index, 1);
    }
    players = newPlayers;

    let game = gameJS.createGame(players, idleTimeout); //Create game object with the players.

    //Remove players from the lobby
    for (let i = 0; i < players.length; i++) {
        if (players[i]) {
            playerAuth.setIngame(players[i].playerId, true);
            playerAuth.setReady(players[i].playerId, false);
            playerAuth.setInLobby(players[i].playerId, false);
        }
    }

    games.push(game); //Add the new game object to the collection of all game objects.
    gamesObserver.push(jsonpatch.observe(game)); //Adds and jsonpath observer for partial updates of the game object.

    logger.info("Starting game id: " + game.gameId + " with players: " + playerAuth.playerListToString(players));

    //Send game starting to players over websocket.
    let string = game.gameId;
    for (let i = 0; i < players.length; i++) if (players[i]) string += " " + players[i].playerId;
    setTimeout(function () {
        io.emit('gamestart', string);
    }, 200);
}

/**
 * Sends an update to all players in the selected game.
 * @param gameId
 */
function sendGameUpdate(gameId) {
    games[gameId].version++;
    io.emit('update', gameId + " " + JSON.stringify(jsonpatch.generate(gamesObserver[gameId])));
}

/**
 * Sends a message to all players in the lobby that the lobby changed.
 */
function updateLobby() {
    io.emit('lobby', "");
}