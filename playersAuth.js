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
		setIngame(playerId, ingame);
	},
	setReady: function (playerId, ready) {
		setReady(playerId, ready);
	},
	setSpectating: function (playerId, spectating) {
		setSpectating(playerId, spectating);
	}
};

var jwt    = require('jsonwebtoken'); 
var config = require('./config');

playersIncrement = 0;
var players = [];
var playerToken = [];

function auth(req, res, next) {
	var token = req.body.token || req.query.token || req.headers['x-access-token'];

	if (token) {
		jwt.verify(token, config.secret, function(err, decoded) {      
			if (err) {
				//res.redirect('/');
				// res.status(403).send({ 
					// success: false, 
					// message: 'Failed to authenticate token.' 
				// });
				res.status(200).send({ 
					redirect: '/'
				});
				
			} else {
				req.decoded = decoded;    
				next();
			}
		});
	} else  {
		
		//res.redirect('/');
		res.status(200).send({ 
			redirect: '/'
		});
		
	}
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
	
	players.push({playerId : playersIncrement, playerName: playerName, ingame: false, ready: false, spectating: false});
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
		if (!players[i].ingame) lobbyPlayers[lobbyPlayers.length] = players[i];
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

	return (playerToken[playerId] == token);
}

function getPlayerId(playerName) {
	for (var i = 0; i < players.length;i++) if (playerName == players[i].playerName) return players[i].playerId;
	
	return;
}

function getPlayerById(playerId) {
	return players[playerId];
	
	return;
}


function setReady(playerId, ready) {
	players[playerId].ingame = false;
	players[playerId].spectating = false;
	players[playerId].ready = ready;
}

function setIngame(playerId, ingame) {
	players[playerId].ready = false;
	players[playerId].spectating = false;
	players[playerId].ingame = ingame;
}

function setSpectating(playerId, spectating) {
	players[playerId].ingame = false;
	players[playerId].ready = false;
	players[playerId].spectating = spectating;
}