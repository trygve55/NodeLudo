var isPlayer = 0;

var game = null;
updateGame();
	
var socket = io(window.location.host);

socket.on('update', function(msg){
	if (msg == getUrlVars().gameid) updateGame();
});

socket.on('gamestop', function(msg){
	console.log(msg);
	console.log("game end");
	if (msg == getUrlVars().gameid) {
		setTimeout(function() {
			window.location.href = "/lobby";
		}, 6000);	
	}
});


var dicePos = 208
		
var drawedAt = [], prevPossible = [], prevPossibleNext = [], multipleStackDrawCounter = 0, chipsOnColor = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

function makeSVG(tag, attrs) {
    var el= document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs)
        el.setAttribute(k, attrs[k]);
    return el;
}

function updateGame() {
	jQuery.ajax({
		url: "/rest/game/?token="+ localStorage.token + "&gameid=" + getUrlVars().gameid,
		type: "GET",
		
		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			if (typeof resultData.redirect == 'string') window.location = resultData.redirect;
			game = resultData;
			draw();
		},
		error : function(jqXHR, textStatus, errorThrown) {
		},

		timeout: 120000,
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

function draw() {
	
	$("circle.chip").remove();
	
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
	
	chipColors = ['#f22438', '#f7e81d', '#14913e', '#1968ef', '#d633ff', '#ff9933', '#9900ff', '#5cd6d6'];
	
	$("#turn").html(game.turn);
	$("#throwsLeft").html(game.throwsLeft);
	
	drawDice(game.lastDice, 350);
	
	if (!game.waitingForMove && game.status == 1 && isTurn()) $("#pos-dicePos").addClass("possiblePos");
	else $("#pos-dicePos").removeClass("possiblePos");
	
	for (var i = 0;i < game.boardSize;i++) {
		if (game.players[i] == null) {
			$("#playerText-"+i).hide();
		} else {
			$("#playerText-"+i).html(game.players[i].playerName);
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
			if (false && (pos == 16 || pos == 29 || pos == 42 || pos == 55)) {
				chipsOnColor[i][(pos - 16)/13] = numOnPos;
			} else {
				//$("#pos-" + game.players[i].chips[j].pos).html(getChipSVG(numOnPos, chipColors[i]));
                var x = 0, y = 0, cor = $("#pos-" + game.players[i].chips[j].pos).attr("points").split(/,| /);
                for (var k = 0; k < 4;k++) {
                    x += parseFloat(cor[k*2]);
                    y += parseFloat(cor[k*2+1]);
                }
                x /= 4;
                y /= 4;
                
                drawChips(x, y, numOnPos, chipColors[i]);
			}
		}
	}
	
	//drawMultiStackUpdate();
}

function drawChips(x, y, n, color) {
    
    var chipSize = 12, radius = 90;
    
    if (n > 2) document.getElementById('board').appendChild(
        makeSVG('circle', {cx: x, cy: y+chipSize*3, r: radius, stroke: 'black', 'stroke-width': 4, fill: color})).setAttribute("class", "chip");
    document.getElementById('board').appendChild(
        makeSVG('circle', {cx: x, cy: y+chipSize, r: radius, stroke: 'black', 'stroke-width': 4, fill: color})).setAttribute("class", "chip");
    document.getElementById('board').appendChild(
        makeSVG('circle', {cx: x, cy: y-chipSize, r: radius, stroke: 'black', 'stroke-width': 4, fill: color})).setAttribute("class", "chip");
    if (n > 1) document.getElementById('board').appendChild(
        makeSVG('circle', {cx: x, cy: y-chipSize*3, r: radius, stroke: 'black', 'stroke-width': 4, fill: color})).setAttribute("class", "chip");
    if (n > 3)document.getElementById('board').appendChild(
        makeSVG('circle', {cx: x, cy: y-chipSize*5, r: radius, stroke: 'black', 'stroke-width': 4, fill: color})).setAttribute("class", "chip");
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
	else gameLogic(dicePos, 1);
}

function removePopover() {
	$(".active-popover").popover('disable').popover("hide");
	$(".active-popover").remove();
}

function isTurn() {
	return (localStorage.playerId == game.players[game.playerTurn].playerId);
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

function test(string) {
	console.log(string);
}

$(document).ready(function() {
	

	validateToken(function(valid) {
		if (!valid) window.location.href = "/";
	});
    
	$( window ).resize(function()  {
		var size = $('.grid').width();
		if (size > document.body.clientHeight - 10) {
			size = document.body.clientHeight - 10;
			$('.grid').css({'width': size +'px'});
		} else {
			$('.grid').css({'width': 'auto'});
		}
		$('.grid').css({'height': size +'px'});
	});
	
	$( window ).trigger("resize");
	
	for (var i = 0; i < dicePos + 1; i++) {
		$("#pos-"+i).data("pos", i);
		$("#pos-"+i).click(function() {
			
            console.log($(this).data("pos"));

			let chipsOn = 0;
			for (var i = 0;i < game.posiblePos.length;i++) {
				if (game.posiblePos[i] == $(this).data("pos")) chipsOn++;
			}
			if (chipsOn == 1 || $(this).data("pos") == dicePos) {
                console.log("sending press");
				gameLogic($(this).data("pos"), 1);
				if ($(this).data("pos") == dicePos && !game.waitingForMove &&  isTurn()) animateDice(game.lastDice, 350);
			}
			else if (chipsOn > 1){				
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

	
	draw();
	//drawMultiStackUpdate()
	setInterval(function() {
		//drawMultiStackUpdate();
		//$("#timeLeftText").text(game.timeLeftTurn + " s");
	
		
	}, 1000);
	
	setInterval(function() {
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
	
	$(document).keydown(function(e) {
		if(e.keyCode == 32 && isTurn()) {
			if (!game.waitingForMove &&  isTurn()) {
				gameLogic(dicePos, 1);
				animateDice(game.lastDice, 350);
			}
			else if (game.posiblePos.length == 1) {
				gameLogic(game.posiblePos[0], 1);
			}	
		}
	});
    
    autoPlay();
});