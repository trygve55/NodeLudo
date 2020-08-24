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
    setLobbyUpdateCallback: function (cb) {
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

//Interval set to check for inactive players in the lobby and remove them.
setInterval(function () {
    if (updateLobbyCallback) {
        let changes = false;
        for (let i = 0; i < players.length; i++) {
            if (players[i].inLobby && !players[i].isBot && new Date() - players[i].lastActiveLobby > config.lobbyTimeout) {
                players[i].inLobby = false;
                players[i].ready = false;
                changes = true;
                logger.info("Player: " + players[i].playerName + " is inactive in lobby.");
            }
        }
        if (changes) updateLobbyCallback(players);
    }
}, config.lobbyTimeoutCheckInterval);

/**
 * Validates the JWT in the request and decodes the information in the JWT.
 * @param req
 * @param res
 * @param next
 */
function auth(req, res, next) {
    let token = req.body.token || req.query.token;

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

/**
 * Sets a player as active in the lobby
 * @param playerId
 */
function playerActive(playerId) {
    players[playerId].lastActiveLobby = new Date();
    if (players[playerId].inLobby) return;
    players[playerId].inLobby = true;
    logger.info("Player " + players[playerId].playerName + " is active in lobby.");
    updateLobbyCallback(players);
}

/**
 * Returns whether an username is in use.
 * @param playerName
 * @returns {boolean}
 */
function playerExists(playerName) {
    for (let i = 0; i < players.length; i++) {
        if (players[i].playerName === playerName) return true;
    }
    return false;
}

/**
 * registers a new player on the server
 * @param playerName
 * @param country - What country the user is from.
 * @param isBot - If athe added player is a bot.
 * @returns {*}
 */
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

/**
 * Sets player as active in the lobby.
 * @param playerId
 */
function addPlayerToLobby(playerId) {
    if (players[playerId].inLobby) return;
    players[playerId].inLobby = true;
    logger.info("Player " + players[playerId].playerName + " is active in lobby.");
    updateLobbyCallback(players);
}

/**
 * Returns all players in the lobby
 * @returns Array Players
 */
function getLobbyPlayers() {
    let lobbyPlayers = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].inLobby) lobbyPlayers[lobbyPlayers.length] = players[i];
    }
    return lobbyPlayers;
}

/**
 * Returns all bot players on the server
 * @returns Array Players
 */
function getBotPlayers() {
    let botPlayers = [];
    for (let i = 0; i < players.length; i++) {
        if (players[i].isBot) botPlayers[botPlayers.length] = players[i];
    }
    return botPlayers;
}

/**
 * Return players that have readied up for a game up in the lobby.
 * @returns Array Players
 */
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

/**
 * Get id of player by player name
 * @param playerName
 * @returns number
 */
function getPlayerId(playerName) {
    for (let i = 0; i < players.length; i++) if (playerName === players[i].playerName) return players[i].playerId;
}

/**
 * Get player by id.
 * @param playerId
 * @returns Player
 */
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

/**
 * Limit how often a user can post messages in games.
 * @param playerId
 * @returns {boolean}
 */
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