module.exports = {

    addPlayer: function (playerName) {
		return addPlayer(playerName);
	},
	playerExists: function (playerName) {
		return playerExists(playerName);
	},
	authPlayer: function (playerId, token) {
		return authPlayer(playerId, token);
	},
	auth: function (req, res, next) {
		return auth(req, res, next);
	},
	players: function () {
		return players;
	},
	getLobbyPlayers: function () {
		return getLobbyPlayers();
	},
	getReadyPlayers: function () {
		return getReadyPlayers();
	},
	getPlayerId: function (playerName) {
		return getPlayerId(playerName);
	},
    getPlayerById: function (playerName) {
		return getPlayerById(playerName);
	},
	setIngame: function (playerId, ingame) {
		players[playerId].ingame = ingame;
	},
	setReady: function (playerId, ready) {
		players[playerId].ready = ready;
	},
	setInLobby: function (playerId, inLobby) {
		players[playerId].inLobby = inLobby;
	},
	setSpectating: function (playerId, spectating) {
		players[playerId].spectating = spectating;
	},
	setLobbyCallback: function (cb) {
		updateLobbyCallback = cb;
	},
	playerActive: function (playerId) {
		return playerActive(playerId);
	}
};

var jwt    = require('jsonwebtoken'); 
var config = require('./config');

playersIncrement = 0;
var players = [];
var playerToken = [];
var updateLobbyCallback;

setInterval(function() {
	if (updateLobbyCallback) {
		var changes = false;
		for (var i = 0; i < players.length;i++) {
			if (players[i].inLobby &&  new Date() - players[i].lastActiveLobby > config.lobbyTimeout) {
				players[i].inLobby = false;
                players[i].ready = false;
				changes = true;
				console.log("player: " + players[i].playerName + " is inactive. ");
			}
		}
		if (changes) updateLobbyCallback(players);
	}
}, config.lobbyTimeoutCheckInterval)

function auth(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	if (token) {
		jwt.verify(token, config.secret, function(err, decoded) {      
			if (err) {
				res.status(200).send({ 
					redirect: '/'
				});
				
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else  {
		res.status(200).send({ 
			redirect: '/'
		});
		
	}
}

function playerActive(playerId) {
    players[playerId].lastActiveLobby = new Date();
    if (players[playerId].inLobby == true) return;
	players[playerId].inLobby = true;
	console.log("player: " + players[playerId].playerName + " is active. ");
	updateLobbyCallback(players);
}

function playerExists(playerName) {
	var nicknameInUse = false;
	for (var i = 0; i < players.length;i++) {
		if (players[i].playerName == playerName) nicknameInUse = true;
	}
	return nicknameInUse;
}

function addPlayer(playerName) {
	const payload = {
		playerName: playerName,
		playerId: playersIncrement
	};
	
	players.push({playerId : playersIncrement, playerName: playerName, ingame: false, ready: false, spectating: false, inLobby: true, lastActiveLobby: new Date()});
	playersIncrement++;
	
	var token = jwt.sign(payload, config.secret, {
	  expiresIn: "10 days" // expires in 240 hours
	});
	
	playerToken.push(token);
    
	return token;
}

function getLobbyPlayers() {
	var lobbyPlayers = [];
	for (var i = 0;i < players.length;i++) {
		if (players[i].inLobby) lobbyPlayers[lobbyPlayers.length] = players[i];
	}
	return lobbyPlayers;
}

function getReadyPlayers() {
	var readyPlayers = [];
	for (var i = 0;i < players.length;i++) {
		if (players[i].ready) readyPlayers[readyPlayers.length] = players[i];
	}
	return readyPlayers;
}

function authPlayer(req, res) {
	console.log(req.decoded);
	player[playerId].lastActiveLobby = new Date();
	return (playerToken[playerId] == token);
}

function getPlayerId(playerName) {
	for (var i = 0; i < players.length;i++) if (playerName == players[i].playerName) return players[i].playerId;
	
	return;
}

function getPlayerById(playerId) {
	return players[playerId];
}