var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var gameJS = require('./import');
var playerAuth = require('./playersAuth');

var app = require('express')()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);
  
app.start = app.listen = function(){
  return server.listen.apply(server, arguments)
}

app.start(80)

app.use(bodyParser.urlencoded({ extended: false }));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

var games = [];
gameJS.setSocket(io);
gameJS.setPlayerAuth(playerAuth);

console.log(io);

app.get('/rest/game', function (req, res) {
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
		if (readyPlayers.length)startGame(readyPlayers, 30000);
	} else if (req.body.action == "ready") {
		playerAuth.setReady(req.decoded.playerId, true);
		
		setTimeout(function () {
			var readyPlayers = playerAuth.getReadyPlayers();
			
			if (readyPlayers.length >= 4) {
				var playersToGame = [];
				for (var i = 0;i < 4;i++) {
					playersToGame[i] = readyPlayers[i];
				}
				startGame(playersToGame, 30000);
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
	
	switch(gameJS.gameLogic(games[req.query.gameid], req.decoded.playerId, req.body.pos, req.body.chipsToMove)) {
		case 1:
			io.emit('update', "" + games[req.query.gameid].gameId);
			break;
		case 2:
			var players = games[req.query.gameid].players;
			for (var i = 0;i < players.length;i++) playerAuth.setIngame(players[i].playerId, false);
			io.emit('update', "" + games[req.query.gameid].gameId);
			io.emit('gamestop', "" + games[req.query.gameid].gameId);
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
	
	if (req.body.playerName == null) {
		res.json({ success: false, message: 'No nickname given.' });
	} else if (playerAuth.playerExists(req.body.playerName) || req.body.playerName == null) {
		res.json({ success: false, message: 'Nickname is already in use.' });
	} else if (req.body.playerName.length < 3 || req.body.playerName.length > 16) {
		res.json({ success: false, message: 'Nickname is to long or to short.' });
	} else {
		
		var token = playerAuth.addPlayer(req.body.playerName);

		res.json({
          success: true,
          message: 'Enjoy your token!',
		  playerId: playerAuth.getPlayerId(req.body.playerName),
          token: token
        });
		
		io.emit('lobby', "");
	}	
});

app.use('/rest/players', function (req, res, next) {
	playerAuth.auth(req, res, next);
});

app.delete('/rest/player', function (req, res) {
	
	playerAuth[player] = null;
	io.emit('lobby', "");
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

function startGame(players, idleTimeout) {

	if (players.length < 2) return;		
	
	console.log("start game");
	var game = gameJS.createGame(players, idleTimeout);
	
	for (var i = 0;i < players.length;i++) {
		playerAuth.setIngame(players[i].playerId, true);
	}
	
	games.push(game);
	
	var string = game.gameId;
	for (var i = 0;i < players.length;i++) string += " " + players[i].playerId;
	io.emit('gamestart', string);
}
