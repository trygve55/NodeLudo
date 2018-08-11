var express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	gameJS = require('./import'),
	playerAuth = require('./playersAuth'),
	validator = require('validator'),
    clone = require('clone'),
    jsonpatch = require('fast-json-patch'),
    config = require('./config');

var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);
  
app.start = app.listen = function(){
  return server.listen.apply(server, arguments)
}

app.start(config.port)

app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

console.log("Server started on port " + config.port + ".");

var games = [], gamesObserver = [];
gameJS.setSocket(io);
gameJS.setPlayerAuth(playerAuth);

var defaultGameSettings = {
	idleTimeout: 20000,
	idleKickTurns: 4,
    idleKickTurnsTotal: 7,
    boardSize: 4
}

app.get('/rest/game', function (req, res) {
	games[req.query.gameid].timeLeftTurn = (
		(games[req.query.gameid] && games[req.query.gameid].status == 1) ? 
		((games[req.query.gameid].idleTimeout - ((new Date()).getTime() - games[req.query.gameid].lastMoveTime.getTime()))/1000) : 0);
	res.json(games[req.query.gameid]);
});

app.get('/', function (req, res) {
	res.render('createNickname');
});

app.get('/lobby', function (req, res, next) {	
	res.render('lobby');
});

app.get('/game', function (req, res) {
	res.render('game2');
});

app.use('/rest/lobby', function (req, res, next) {
	playerAuth.auth(req, res, next);
});

app.get('/rest/lobby', function (req, res) {
	res.json({
		success: true,
		players: playerAuth.getLobbyPlayers()
	});
});

app.post('/rest/lobby', function (req, res) {
	if (req.body.action == "startGame") {
		var readyPlayers = playerAuth.getReadyPlayers()
		if (readyPlayers.length)startGame(readyPlayers, defaultGameSettings);
	} else if (req.body.action == "ready") {
		playerAuth.setReady(req.decoded.playerId, true);
		
		setTimeout(function () {
			var readyPlayers = playerAuth.getReadyPlayers();
			
			if (readyPlayers.length >= 4) {
				var playersToGame = [];
				for (var i = 0;i < 4;i++) {
					playersToGame[i] = readyPlayers[i];
				}
				startGame(playersToGame, defaultGameSettings);
				io.emit('lobby', "");
			}
		}, 1000);
	} else if (req.body.action == "spectating") {
		playerAuth.setSpectating(req.decoded.playerId, true);
	}
	io.emit('lobby', "");
});

app.use('/rest/game', function (req, res, next) {
	playerAuth.auth(req, res, next);
});

app.post('/rest/game', function (req, res) {	
	
    let before = clone(games[req.query.gameid]);
    
	if (req.body.chatmessage != null) {
		console.log("Player: " + req.decoded.playerId + " sent message '" + req.body.chatmessage + "' in game " + req.query.gameid);
		gameJS.postChatMessage(games[req.query.gameid], playerAuth.getPlayerById(req.decoded.playerId), req.body.chatmessage, "#ffffff");
        
        sendUpdate(games[req.query.gameid].gameId);
        
		return res.send("posted");
	}
    
    if (req.body.leave != null) {
		console.log("Player: " + req.decoded.playerId + " left game '" + req.query.gameid);
		gameJS.leaveGame(games[req.query.gameid], playerAuth.getPlayerById(req.decoded.playerId));
        
        sendUpdate(games[req.query.gameid].gameId);
        
		return res.send("posted");
	}
	
	switch(gameJS.gameLogic(games[req.query.gameid], req.decoded.playerId, req.body.pos, req.body.chipsToMove)) {
		case 1:
            sendUpdate(games[req.query.gameid].gameId);
			break;
		case 2:
			var players = games[req.query.gameid].players;
			for (var i = 0;i < players.length;i++) playerAuth.setIngame(players[i].playerId, false);
			sendUpdate(games[req.query.gameid].gameId);
			break;
		default:
			break;
	}
	
	res.send("test");	
});

app.use('/rest/games', function (req, res, next) {
	playerAuth.auth(req, res, next);
});

app.get('/rest/games', function (req, res) {	
	res.json(games);
});

app.post('/rest/regPlayer', function (req, res) {
	
	req.body.playerName = validator.escape(req.body.playerName);
	
	if (req.body.playerName == null) 
		return res.json({ success: false, message: 'No nickname given.' });
	if (playerAuth.playerExists(req.body.playerName) || req.body.playerName == null) 
		return res.json({ success: false, message: 'Nickname is already in use.' });
	if (req.body.playerName.length < 3 || req.body.playerName.length > 16) 
		return res.json({ success: false, message: 'Nickname is to long or to short.' });
	
	var token = playerAuth.addPlayer(req.body.playerName);

	res.json({
	  success: true,
	  playerId: playerAuth.getPlayerId(req.body.playerName),
	  token: token
	});
	
	console.log("Player " + req.body.playerName + " joined lobby.")
	
	io.emit('lobby', "");

});

app.use('/rest/players', function (req, res, next) {
	playerAuth.auth(req, res, next);
});

app.delete('/rest/player', function (req, res) {
	playerAuth[player] = null;
	io.emit('lobby', "");
});

app.use('/rest/active', function (req, res, next) {
	playerAuth.auth(req, res, next);
});

app.post('/rest/active', function (req, res) {
	playerAuth.playerActive(req.decoded.playerId);
	res.send("ok");
});

app.post('/rest/playerExists', function (req, res) {

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

app.get('/rest/login', function (req, res) {	
	playerAuth.auth(req, res, function() {
		res.json({'valid' : true})
	});
});

playerAuth.setLobbyCallback(function() {
	io.emit('lobby', "");
});

function startGame(players, idleTimeout) {

	if (players.length < 2) return;		
	
	var newPlayers = [];
	
	while (players.length > 0) {
		var index = Math.floor(Math.random() * (players.length));
		newPlayers.push(players[index]);
		players.splice(index, 1);
	}
	
	players = newPlayers;
	
	var game = gameJS.createGame(players, idleTimeout);
	
	for (var i = 0;i < players.length;i++) {
		playerAuth.setIngame(players[i].playerId, true);
        playerAuth.setReady(players[i].playerId, false);
        playerAuth.setInLobby(players[i].playerId, false);
	}
	
	games.push(game);
    gamesObserver.push(jsonpatch.observe(game));
	
	console.log("Starting game id: " + game.gameId);
	
	var string = game.gameId;
	for (var i = 0;i < players.length;i++) string += " " + players[i].playerId;
    setTimeout(function() {
        io.emit('gamestart', string);
    }, 200);
}

function sendUpdate(gameId) {
    games[gameId].version++;
    io.emit('update', gameId + " " + JSON.stringify(jsonpatch.generate(gamesObserver[gameId])));
}