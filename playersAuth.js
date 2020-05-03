module.exports = {
    addPlayer: function (playerName, country, isBot=false) {
        return addPlayer(playerName, country, isBot);
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
        if (!players[playerId].isBot) players[playerId].ingame = ingame;
    },
    setReady: function (playerId, ready) {
        players[playerId].ready = ready;
    },
    setInLobby: function (playerId, inLobby) {
        if (!players[playerId].isBot) players[playerId].inLobby = inLobby;
    },
    setSpectating: function (playerId, spectating) {
        players[playerId].spectating = spectating;
    },
    setLobbyCallback: function (cb) {
        updateLobbyCallback = cb;
    },
    playerActive: function (playerId) {
        return playerActive(playerId);
    },
    addPlayerToLobby: function (playerId) {
        return addPlayerToLobby(playerId);
    },
    chatDOSCheck: function (playerId) {
        return chatDOSCheck(playerId);
    },
    playerListToString: function (players) {
        return playerListToString(players);
    },
    getBotPlayers: function () {
        return getBotPlayers();
    }
};

var jwt = require('jsonwebtoken');
var config = require('./config');

const logger = require('pino')();

var playersIncrement = 0;
var players = [];
var playerToken = [];
var updateLobbyCallback;
var chatMessagesRecentNum = [];

setInterval(function () {
    if (updateLobbyCallback) {
        let changes = false;
        for (let i = 0; i < players.length; i++) {
            if (players[i].inLobby && !players[i].isBot && new Date() - players[i].lastActiveLobby > config.lobbyTimeout) {
                players[i].inLobby = false;
                players[i].ready = false;
                changes = true;
                logger.info("player: " + players[i].playerName + " is inactive in lobby.");
            }
        }
        if (changes) updateLobbyCallback(players);
    }
}, config.lobbyTimeoutCheckInterval);

function auth(req, res, next) {
    var token = req.body.token || req.query.token;

    if (token) {
        jwt.verify(token, config.secret, function (err, decoded) {
            if (err) {
                res.status(200).send({
                    redirect: config.baseUrl
                });

            } else {
                req.decoded = decoded;

                next();
            }
        });
    } else {
        res.status(200).send({
            redirect: config.baseUrl
        });

    }
}

function playerActive(playerId) {
    players[playerId].lastActiveLobby = new Date();
    if (players[playerId].inLobby) return;
    players[playerId].inLobby = true;
    logger.info("Player " + players[playerId].playerName + " is active in lobby.");
    updateLobbyCallback(players);
}

function playerExists(playerName) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].playerName === playerName) return true;
    }
    return false;
}

function addPlayer(playerName, country, isBot) {
    const payload = {
        playerName: playerName,
        playerId: playersIncrement
    };

    players.push({
        playerId: playersIncrement,
        playerName: playerName,
        ingame: false,
        ready: false,
        spectating: false,
        inLobby: true,
        lastActiveLobby: new Date(),
        country: country,
        isBot: isBot
    });
    playersIncrement++;

    let token = jwt.sign(payload, config.secret, {
        expiresIn: "10 days"
    });

    playerToken.push(token);

    return token;
}

function addPlayerToLobby(playerId) {
    if (players[playerId].inLobby) return;
    players[playerId].inLobby = true;
    logger.info("Player " + players[playerId].playerName + " is active in lobby.");
    updateLobbyCallback(players);
}

function getLobbyPlayers() {
    let lobbyPlayers = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].inLobby) lobbyPlayers[lobbyPlayers.length] = players[i];
    }
    return lobbyPlayers;
}

function getBotPlayers() {
    let botPlayers = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].isBot) botPlayers[botPlayers.length] = players[i];
    }
    return botPlayers;
}

function getReadyPlayers() {
    let readyPlayers = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].ready) readyPlayers[readyPlayers.length] = players[i];
    }
    return readyPlayers;
}

function authPlayer(req, res) {
    logger.info("authPlayer:" + req.decoded);
    players[playerId].lastActiveLobby = new Date();
    return (playerToken[playerId] === token);
}

function getPlayerId(playerName) {
    for (let i = 0; i < players.length; i++) if (playerName === players[i].playerName) return players[i].playerId;
}

function getPlayerById(playerId) {
    return players[playerId];
}

function playerListToString(players) {
    let output = "";
    for (let i = 0; i < players.length;i++) {
        if (players[i]) {
            output += players[i].playerName;
            if (i + 2 === players.length) {
                output += " and "
            } else if (i + 1 !== players.length) {
                output += ", "
            }
        }
    }
    return output;
}

function chatDOSCheck(playerId) {
    if (chatMessagesRecentNum[playerId] === undefined) chatMessagesRecentNum[playerId] = 0;

    if (chatMessagesRecentNum[playerId] === 0) {
        setTimeout(function () {
            chatMessagesRecentNum[playerId] = 0;
        }, 10000)
    }

    chatMessagesRecentNum[playerId]++;

    return chatMessagesRecentNum[playerId] > 3;
}