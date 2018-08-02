var socket = io(window.location.host);

socket.on('lobby', function(msg){
	updateLobby();
});

socket.on('gamestart', function(msg){
	var args = msg.split(" ");
	
	var joinGame = false;
	for (var i = 1;i < msg.length;i++) if (parseInt(msg[i]) == localStorage.playerId) joinGame = true;
	
	if (joinGame) {
		window.location.href = "game?gameid=" + args[0];
	}
});

socket.on('connect_error', function(err) {
  alert("Connection lost. The webpage will now refresh.");
  location.reload();
});

function updateLobby() {
	jQuery.ajax({
		url: "/rest/lobby?token="+ localStorage.token,
		type: "GET",

		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			if (typeof resultData.redirect == 'string') window.location = resultData.redirect;
			
			$("#players").empty();
			$("#readyPlayers").empty();
			for (var i = 0; i < resultData.players.length;i++) {
				jQuery('<div/>', {
					class: 'well',
					text: resultData.players[i].playerName
				}).appendTo($((resultData.players[i].ready) ? "#readyPlayers" :"#players"));
			}			
		},
		error : function(jqXHR, textStatus, errorThrown) {
		},

		timeout: 120000,
	});
	
	jQuery.ajax({
		url: "/rest/games?token="+ localStorage.token,
		type: "GET",

		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			if (resultData.length == 0) {
				$("#ongoingGames").text("No games ongoing");
				$("#previousGames").text("No games ongoing");
			} else {
				$("#ongoingGames").empty();
				$("#previousGames").empty();
				
				for (var i = 0; i < resultData.length;i++) {
					var string = "";
					
					if (resultData[i].status == 1) {
						string += "Players: ";
						for (var j = 0;j < resultData[i].players.length;j++) string += resultData[i].players[j].playerName + ((resultData[i].players.length - 1 == j) ? "" : ", ");
						string += " on turn " + resultData[i].turn + ".";
						if (resultData[i].winners.length > 0) string+= " Winners: " 
						for (var j = 0;j < resultData[i].winners.length;j++) string += (j+1) + ". " + resultData[i].players[resultData[i].winners[j]].playerName + ((resultData[i].players.length - 1 == j) ? "" : ", ");
					} else {
						string += "Winners: ";
						for (var j = 0;j < resultData[i].winners.length;j++) string += (j+1) + ". " + resultData[i].players[resultData[i].winners[j]].playerName + ((resultData[i].players.length - 1 == j) ? "" : ", ");
					}
					jQuery('<button/>', {
						href: "/game?gameid=" + resultData[i].gameId,
						rel: 'internal',
						class: 'well',
						text: string,
						style: 'padding: 2%; width: 100%; textAlign: left; ',
						onclick: "window.location.href=$(this).attr('href')",
					}).click(function() {
						console.log("test");
					}).appendTo($((resultData[i].status == 1) ? "#ongoingGames" : "#previousGames"));
				}
			}
		},
		error : function(jqXHR, textStatus, errorThrown) {
		},

		timeout: 120000,
	});
}

$(document).ready(function() {
	updateLobby();
	
	$("#startGame").click(function () {
		jQuery.ajax({
			url: "/rest/lobby?token="+ localStorage.token,
			type: "POST",
			data: JSON.stringify({action: "startGame"}),
			contentType: 'application/json; charset=utf-8',
			timeout: 120000
		});
	});
	
	$("#readyBtn").click(function () {		
		jQuery.ajax({
			url: "/rest/lobby?token="+ localStorage.token,
			type: "POST",
			data: JSON.stringify({action: "ready"}),
			contentType: 'application/json; charset=utf-8',
			timeout: 120000
		});
	});
	
	setInterval(function() {
		jQuery.ajax({
			url: "/rest/active?token="+ localStorage.token,
			type: "POST",
			data: JSON.stringify({}),
			contentType: 'application/json; charset=utf-8',
			timeout: 1000
		});
	}, 1000);
});