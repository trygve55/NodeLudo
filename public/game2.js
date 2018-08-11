var isPlayer = 0;

var game = null,
    socket = io(window.location.host);

var drawedAt = [], 
    prevPossible = [],
    prevPossibleNext = [],
    multipleStackDrawCounter = 0,
    chipsOnColor = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    
socket.on('update', function(msg){
    msg = [msg.split(' ',1).toString(), msg.split(' ').slice(1).join(' ')];
	if (msg[0] == getUrlVars().gameid) {
        if (msg[1].length == 0) 
            return updateGame();
        
        updateGameWebSocket(msg[1]); 
        
        console.log("Player '" + game.players[(game.playerTurn + game.players.length - 1) % game.players.length ].playerName + "' stats:" );
        console.log(game.players[(game.playerTurn + game.players.length - 1) % game.players.length ].stats);
        console.log("Player '" + game.players[game.playerTurn].playerName + "' stats:" );
        console.log(game.players[game.playerTurn].stats);
    }
});

socket.on('gamestop', function(msg){
	if (msg == getUrlVars().gameid) {
		setTimeout(function() {
			window.location.href = "/lobby";
		}, 6000);	
	}
});

socket.on('connect_error', function(err) {
  alert("Connection lost. The webpage will now refresh.");
  location.reload();
});

function updateGameWebSocket(patchString) {
    var oldVersion = game.version
    jsonpatch.applyPatch(game,JSON.parse(patchString)).newDocument;
    
    if (game.version !== oldVersion + 1) 
        console.log("version error");
        return updateGame();
    
    draw();
	//$( window ).trigger("resize");	
}

function updateGame(cb) {
	jQuery.ajax({
		url: "/rest/game/?token="+ localStorage.token + "&gameid=" + getUrlVars().gameid,
		type: "GET",
		
		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			if (typeof resultData.redirect == 'string') window.location = resultData.redirect;
			game = resultData;
			setTimeout(function() {
				draw();
                if (cb) cb();
				//$( window ).trigger("resize");	
			}, 10);
			
		},
		error : function(jqXHR, textStatus, errorThrown) {
            updateGame()
		},

		timeout: 2000,
	});
}

function getChipSVG(chips, color) {
	var chip = [];
	chip[0] = "<svg width='100%' height='100%' viewBox='0 0 250 250'> <circle cx='125' cy='125' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='105' r='80' stroke='black' stroke-width='6' fill=? /> </svg>";
	chip[1] = "<svg width='100%' height='100%' viewBox='0 0 250 250'> <circle cx='125' cy='135' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='115' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='95' r='80' stroke='black' stroke-width='6' fill=? /></svg>"
	chip[2] = "<svg width='100%' height='100%' viewBox='0 0 250 250'> <circle cx='125' cy='155' r='80' stroke='black' stroke-width='6' fill=? /><circle cx='125' cy='135' r='80' stroke='black' stroke-width='6' fill=? /><circle cx='125' cy='115' r='80' stroke='black' stroke-width='6' fill=? /><circle cx='125' cy='95' r='80' stroke='black' stroke-width='6' fill=? /></svg>";
	chip[3] = "<svg width='100%' height='100%' viewBox='0 0 250 250'> <circle cx='125' cy='167' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='147' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='127' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='107' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='87' r='80' stroke='black' stroke-width='6' fill=? /> </svg>";
	return chip[chips-1].replace(/[?]/g, color);
}

function getTimeLeftSVG() {
    if (game === null) 
        return "<svg viewBox='0 0 500 100'>" + 
			"<polygon points='0,0 0,100 500,100 500,0' style='fill:black;stroke:black;stroke-width:2' />" + 
			"</svg>"
	var mult = game.timeLeftTurn*1000/game.idleTimeout;
	return "<svg viewBox='0 0 500 100'>" + 
			"<polygon points='0,0 0,100 " + mult*500 + ",100 " + mult*500 + ",0' style='fill:black;stroke:black;stroke-width:2' />" + 
			"</svg>"
}

function dice() {
	return Math.floor(Math.random() * 6) + 1  
}

function gameLogic(pos, chipsToMove) {
	
	if (game.status != 1) return;

	jQuery.ajax({
		url: "/rest/game?token="+ localStorage.token + "&gameid=" + getUrlVars().gameid,
		type: "POST",
		data: JSON.stringify({
			'pos': pos,
			'chipsToMove': chipsToMove
		}),
		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			
		},
		error : function(jqXHR, textStatus, errorThrown) {
		},

		timeout: 120000,
	});
}

function sendChatMessage(chatmessage) {
	
	if (game.status != 1) return;

	jQuery.ajax({
		url: "/rest/game?token="+ localStorage.token + "&gameid=" + getUrlVars().gameid,
		type: "POST",
		data: JSON.stringify({
			'chatmessage': chatmessage
		}),
		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			
		},
		error : function(jqXHR, textStatus, errorThrown) {
		},

		timeout: 120000,
	});
}

function leaveGame() {
	
	if (game.status != 1) return;

	jQuery.ajax({
		url: "/rest/game?token="+ localStorage.token + "&gameid=" + getUrlVars().gameid,
		type: "POST",
		data: JSON.stringify({
			'leave': true,
		}),
		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			
		},
		error : function(jqXHR, textStatus, errorThrown) {
		},

		timeout: 120000,
	});
}


function draw() {
	
    //chatlog
    $("#chatLog").empty();
    
    for (var i = 0; i < game.chatMessages.length;i++) {
        var msg = $("<div/>").addClass("chatMessage");
        $("<div/>").text(game.chatMessages[i].player.playerName + " : ").css('width', '60px').css('display', 'inline').appendTo(msg);
        $("<div/>").text(game.chatMessages[i].text).css('display', 'inline').appendTo(msg);
        $("#chatLog").append(msg);
    }
    
    if ($("#chatLog").prop("scrollHeight") - $("#chatLog").scrollTop() < 180)
        $("#chatLog").scrollTop($("#chatLog").prop("scrollHeight"));
    
    //give up button
    if (isActivePlayer())
        $("#leaveGame").css('visibility','visible');
    else
        $("#leaveGame").css('visibility','hidden');
    
    //clear all chips
	while (drawedAt.length != 0) {
		$("#pos-"+drawedAt.pop()).empty();
	}
	
	while (prevPossible.length != 0) {
		$("#pos-"+prevPossible.pop()).removeClass("possiblePos").off("mouseenter mouseleave");
	}
	
	while (prevPossibleNext.length != 0) {
		 $("#pos-"+prevPossibleNext.pop()).removeClass("possiblePosNext");
	}
	
	if (game.status == 1 && isTurn()) {
		for (let i = 0;i < game.posiblePos.length;i++) {
			$("#pos-"+game.posiblePos[i]).addClass("possiblePos");
			prevPossible.push(game.posiblePos[i]);
			prevPossibleNext.push(game.posiblePosDest[i]);
			$("#pos-"+game.posiblePos[i]).on({
				mouseenter: function() {
					$("#pos-"+game.posiblePosDest[i]).addClass("possiblePosNext");
				},
				mouseleave: function() {
					$("#pos-"+game.posiblePosDest[i]).removeClass("possiblePosNext");
				}});
		}
	}
	
	chipColors = ['#f22438', '#f7e81d', '#14913e', '#1968ef'];
	
	$("#turn").html(game.turn);
	$("#throwsLeft").html(game.throwsLeft);
	
	drawDice(game.lastDice, 350);
	
	if (!game.waitingForMove && game.status == 1 && isTurn()) $("#pos-92").addClass("possiblePos");
	else $("#pos-92").removeClass("possiblePos");
	
	for (var i = 0;i < 4;i++) {
		if (game.players[i] == null) {
			$("#playerText-"+i).hide();
		} else {
			$("#playerText-"+i).html(game.players[i].playerName + ((game.players[i].turnsIdle === game.idleKickTurns) 
                ? " (Left)": ((game.players[i].turnsIdle > 0) ? " Idle(" + game.players[i].turnsIdle + ")" : "" )));
			if (game.playerTurn == i && game.status == 1) $("#playerText-"+i).addClass("possiblePos");
			else $("#playerText-"+i).removeClass("possiblePos");
		}
	}
	
	if (game.winners.length == 0) {
		$("#winnersDiv").hide();
	} else {
		$("#winnersDiv").show();
		var winnerText = "";
		for (var i = 0;i < game.winners.length;i++) winnerText += (i+1) + ". " + game.players[game.winners[i]].playerName + ((i < game.winners.length) ? "<br>" : "");
		$("#winnersText").html(winnerText);
	}
	
	chipsOnColor = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]
	
	for (var i = 0; i < game.players.length; i++) {	
		for (var j = 0; j < 4; j++) {
			var numOnPos = 0, pos = game.players[i].chips[j].pos;
			for (var k = 0; k < 4; k++) {
				if (game.players[i].chips[k].pos == game.players[i].chips[j].pos) numOnPos += 1;
			}
			if (pos == 16 || pos == 29 || pos == 42 || pos == 55) {
				chipsOnColor[i][(pos - 16)/13] = numOnPos;
			} else {
				$("#pos-" + game.players[i].chips[j].pos).html(getChipSVG(numOnPos, chipColors[i]));
				drawedAt.push(game.players[i].chips[j].pos);
			}
		}
	}
	
	drawMultiStackUpdate();
}

function drawMultiStackUpdate() {	
	for (var i = 0; i < 4; i++) {
		
		var playersOnPos = 0, players = [];
		for (var j = 0; j < game.players.length; j++){
			if (chipsOnColor[j][i]) {
				playersOnPos++;
				players.push(j);
			}
		}
		
		if (playersOnPos > 0 && !$("#pos-"+ (16 + 13 * i)).has("div").length) {
	
			$("#pos-"+ (16 + 13 * i)).html(getChipSVG(
					chipsOnColor[players[multipleStackDrawCounter % playersOnPos]][i], 
					chipColors[players[multipleStackDrawCounter % playersOnPos]]));
			drawedAt.push(16 + 13 * i);
		}
	}
	multipleStackDrawCounter++;
}

function drawDice(num) {
	for (var i = 1;i <= 6;i++) $("#dice-"+i).hide();
	$("#dice-"+num).show();
}

function animateDice(num, animationTime) {
	for (var i = 20; i < animationTime - 100;i += 20) {
		setTimeout(function () {
			drawDice(dice());
		}, i)
	}
	setTimeout(function () {
		drawDice(game.lastDice);
	}, animationTime)
}

function ludoAI() {
	if (game.waitingForMove && game.posiblePos.length > 0) {
		var moved = false;
		if (game.lastDice == 6) {
			for (var j = 0;j < 4;j++) {
				if (game.players[game.playerTurn].chips[j].distance == 0) {
					gameLogic(game.players[game.playerTurn].chips[j].pos, 1);
					j = 4;
					moved = true;
				}
			}
		}
		if (!moved) {
			gameLogic(game.posiblePos[0], 1);
		}
	}
	else gameLogic(92, 1);
}

function removePopover() {
	$(".active-popover").popover('disable').popover("hide");
	$(".active-popover").remove();
}

function isTurn() {
	return (localStorage.playerId == game.players[game.playerTurn].playerId);
}

function isActivePlayer() {
    for (var i = 0; i < game.players.length; i++) 
		if (game.players[i].playerId == localStorage.playerId && game.players[i].status === 0 && game.status === 1) 
            return true;

    return false;
}

function getUrlVars()
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}

function autoPlay() {
	setInterval(function() {
		if (isTurn()) ludoAI();
	}, 80);
}

function validateToken(next) {
	jQuery.ajax({
		url: "/rest/login/?token="+ localStorage.token,
		type: "GET",
		
		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			next(resultData.valid);
		},
		timeout: 120000,
	});
}

$(document).ready(function() {
	
	validateToken(function(valid) {
		if (!valid) window.location.href = "/";
	});
    
    updateGame(function(){
        $("#chatLog").scrollTop($("#chatLog").prop("scrollHeight"));
    });
	
	$( window ).resize(function()  {
		$('.grid').css({'width': 'auto'});
		var size = $('.grid').width();
		if (size > document.body.clientHeight - 10) {
			size = document.body.clientHeight - 10;
			$('.grid').css({'width': size +'px'});
		} else {
			//$('.grid').css({'width': 'auto'});
		}
		$('.grid').css({'height': size +'px'});
		
		setTimeout(function() {
			//$( window ).trigger("resize");
		}, 500);
	});
	
	$( window ).trigger("resize");
	
	for (var i = 0; i < 100; i++) {
		$("#pos-"+i).data("pos", i);
		$("#pos-"+i).click(function() {
			
			let chipsOn = 0;
			for (var i = 0;i < game.posiblePos.length;i++) {
				if (game.posiblePos[i] == $(this).data("pos")) chipsOn++;
			}
			if (chipsOn == 1 || $(this).data("pos") == 92) {
				gameLogic($(this).data("pos"), 1);
				if ($(this).data("pos") == 92 && !game.waitingForMove &&  isTurn()) animateDice(game.lastDice, 350);
			}
			else if (chipsOn > 1 && isTurn()){				
				var content = "";
				for (var i = 0;i < chipsOn;i++) {
					content += "<button onclick='gameLogic(" + $(this).data("pos") + ', ' + (i+1) + "); removePopover();' style='width:100px'>Move " + (i+1) + " chip</botton>" + ((i < chipsOn) ? "<br>" : "");
				}
				
				removePopover()
				$("<div class='active-popover contain-over' style='position: relative; z-index: 2; margin-top: -50px;'></div>").appendTo(this);
				$(".active-popover").popover({
					placement : 'right',
					container : $(".active-popover"),
					html : true,
					content: content,
					trigger: "click",
					animation:false
				}).popover('show'); 
			}
		});
	}

	setInterval(function() {
		drawMultiStackUpdate();	
		
	}, 1000);
	
	setInterval(function() {
        if (game === null) return;
		$("#timeLeftText").html(getTimeLeftSVG());
		if (game.timeLeftTurn > 0) game.timeLeftTurn -= 0.05;
		if (game.status != 1) game.timeLeftTurn = 0;
	}, 50);
	
	$("#nextPlayer").click(function() {
		for (var i = 0;i < 30; i++) ludoAI();
	});
    
	$("#runGame").click(function() {
		autoPlay();
	});
    
	$("#diceBottom").click(function() {
		playerThrowDice();
	});
    
    $("#leaveGame").click(function() {
		leaveGame();
	});
    
    $("#chatTypeBox").keyup(function(event) {
        if (event.keyCode === 13 && $("#chatTypeBox").val().length !== 0) {
            sendChatMessage($("#chatTypeBox").val());
            $("#chatTypeBox").val("");
        }
    });
	
	$(document).keydown(function(e) {
		if(e.keyCode == 32 && isTurn()) {
			if (!game.waitingForMove &&  isTurn()) {
				gameLogic(92, 1);
				animateDice(game.lastDice, 350);
			}
			else if (game.posiblePos.length == 1) {
				gameLogic(game.posiblePos[0], 1);
			}	
		}
	});
});