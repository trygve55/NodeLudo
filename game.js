var isPlayer = 0;

var game = {}
game.playerTurn = 0;
game.turn = 0;
game.throwsLeft=3;
game.waitingForMove = false;
game.nextDice=dice();
game.lastDice=-1;
game.posiblePos=[];
game.posiblePosDest=[];
game.gameId = 0;
game.winners = [];
game.status = 1;
game.players = [];
game.chatMessage = [];
game.lastMoveTime;
for (var i = 0; i < 4;i++) {
	game.players[i] = {};
	game.players[i].playerId = i;
	game.players[i].playerName = "Player " + i;
	game.players[i].chips = [];
	for (var j = 0; j < 4;j++) {
		game.players[i].chips[j] = {};
		game.players[i].chips[j].pos = j+i*4;
		game.players[i].chips[j].distance = 0;
		game.players[i].chips[j].inAtTurn = -1;
	}
};

var drawedAt = [], prevPossible = [], prevPossibleNext = [];

function getChipSVG(chips, color) {
	var chip = [];
	chip[0] = "<svg width='100%' height='100%' viewBox='0 0 250 250'> <circle cx='125' cy='125' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='105' r='80' stroke='black' stroke-width='6' fill=? /> </svg>";
	chip[1] = "<svg width='100%' height='100%' viewBox='0 0 250 250'> <circle cx='125' cy='135' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='115' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='95' r='80' stroke='black' stroke-width='6' fill=? /></svg>"
	chip[2] = "<svg width='100%' height='100%' viewBox='0 0 250 250'> <circle cx='125' cy='155' r='80' stroke='black' stroke-width='6' fill=? /><circle cx='125' cy='135' r='80' stroke='black' stroke-width='6' fill=? /><circle cx='125' cy='115' r='80' stroke='black' stroke-width='6' fill=? /><circle cx='125' cy='95' r='80' stroke='black' stroke-width='6' fill=? /></svg>";
	chip[3] = "<svg width='100%' height='100%' viewBox='0 0 250 250'> <circle cx='125' cy='167' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='147' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='127' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='107' r='80' stroke='black' stroke-width='6' fill=? /> <circle cx='125' cy='87' r='80' stroke='black' stroke-width='6' fill=? /> </svg>";
	return chip[chips-1].replace(/[?]/g, color);
}

function dice() {
	return Math.floor(Math.random() * 6) + 1  
}

function updatePosible() {
	game.posiblePos.length = 0;
	game.posiblePosDest.length = 0;
	
	for (var i = 0;i < 4;i++) {
		if (game.players[game.playerTurn].chips[i].distance + game.nextDice > 59);
		else if (game.players[game.playerTurn].chips[i].pos < 16 && game.nextDice == 6) game.posiblePos.push(game.players[game.playerTurn].chips[i].pos);
		else if (game.players[game.playerTurn].chips[i].pos >= 16) game.posiblePos.push(game.players[game.playerTurn].chips[i].pos);
		
		if (game.posiblePos[game.posiblePos.length - 1] == game.players[game.playerTurn].chips[i].pos) {
			if (game.players[game.playerTurn].chips[i].pos < 16) {
				game.posiblePosDest.push(16 + 13 * game.playerTurn);
			} else {
				var newPos = game.players[game.playerTurn].chips[i].pos + game.nextDice;
				var newDistance = game.players[game.playerTurn].chips[i].distance + game.nextDice;
			
				if (newPos > 67 && newPos < 74) {
					newPos += -52;
				}
				
				if (newDistance > 53) {
					newPos = 14 + game.playerTurn * 6 + newDistance
				}
				
				game.posiblePosDest.push(newPos);
			}
		}
	}
}

function gameLogic(pos) {
	gameLogic(pos, 1);
}

function gameLogic(pos, chipsToMove) {
	
	if (game.status != 1) return;
	
	console.log(pos + " " + chipsToMove);

	if (game.waitingForMove) {
		var chipsOnPos = [];
		for (var i = 0;i < 4;i++) {
			if (game.players[game.playerTurn].chips[i].pos == pos) chipsOnPos.push(i);
		}
		
		
		if (chipsOnPos.length > 0) {
			for (var i = 0; i < chipsToMove;i++) {
				if (pos < 16) {
					game.players[game.playerTurn].chips[chipsOnPos[i]].pos = 16 + 13 * game.playerTurn;
					game.players[game.playerTurn].chips[chipsOnPos[i]].distance = 1;
					knockoutOn(16 + 13 * game.playerTurn);
				} else {
					var newPos = game.players[game.playerTurn].chips[chipsOnPos[i]].pos + game.lastDice;
					var newDistance = game.players[game.playerTurn].chips[chipsOnPos[i]].distance + game.lastDice
				
					if (newPos > 67 && newPos < 74) {
						newPos += -52;
					}
					
					if (newDistance > 53) {
						newPos = 14 + game.playerTurn*6 + newDistance;
					}
					
					if (newDistance == 59) {
					
						game.players[game.playerTurn].chips[chipsOnPos[i]].inAtTurn = game.turn;
						
						var allIn = true;
						for (var j = 0; j < 4;j++) {
							if (game.players[game.playerTurn].chips[j].inAtTurn == -1) allIn = false;
						}
						
						if (allIn) {
							console.log("player " + game.playerTurn + " won ");
							game.winners.push(game.playerTurn);
							if (game.winners.length == game.players.length - 1) {
								for (var j = 0; j < game.players.length;j++) {
									if ($.inArray(j, game.winners) == -1) game.winners.push(j);
								}
								game.status = 2;
							}
						}
					}
					
					console.log("distance " + newDistance + " pos " + (newPos));
					game.players[game.playerTurn].chips[chipsOnPos[i]].distance = newDistance;
					game.players[game.playerTurn].chips[chipsOnPos[i]].pos = newPos;
					knockoutOn(newPos);
				}
				
			}
				
			game.lastMoveTime = new Date();
			
			game.waitingForMove = false;
			game.posiblePos.length = 0; 
			if (game.lastDice != 6) {
				nextPlayer();
			}
			
			draw();
		}
		
	
	} else if (pos == 92) {
		updatePosible();
		console.log(game.posiblePos);
		
		var allOnStart = true;
		for (var i = 0; i < 4;i++) if (game.players[game.playerTurn].chips[i].distance > 0 && game.players[game.playerTurn].chips[i].distance < 59) allOnStart = false;
		
		game.throwsLeft--;
		if (game.nextDice == 6) {
			game.throwsLeft = 1;
			if (game.posiblePos.length == 0);
			else game.waitingForMove = true;
		} else if (allOnStart && game.throwsLeft <= 0 && game.posiblePos.length == 0) {
			nextPlayer()
		} else if (!allOnStart) {
			if (game.posiblePos.length == 0) nextPlayer();
			else game.waitingForMove = true;
		}
		game.lastDice = game.nextDice;
		game.nextDice = dice();
		
		draw();
	}
}

function knockoutOn(pos) {
	for (var i = 0;i < game.players.length;i++) {
		if (i != game.playerTurn) {
			for (var j = 0;j < 4;j++) {
				if (game.players[i].chips[j].pos == pos) {
					if (i == 0 && pos != 16) game.players[i].chips[j].pos = j+i*4;
					if (i == 1 && pos != 29) game.players[i].chips[j].pos = j+i*4;
					if (i == 2 && pos != 42) game.players[i].chips[j].pos = j+i*4;
					if (i == 3 && pos != 55) game.players[i].chips[j].pos = j+i*4;
				}
			}
		}
	}
}

function nextPlayer() {
	
	if (game.status != 1) return;
	
	game.playerTurn++;
	if (game.playerTurn == game.players.length) {
		game.turn++;
		game.playerTurn = 0;
	}
	
	if ($.inArray(game.playerTurn, game.winners) == -1) {
	
		var notStartedChips = 0;
		var chipsFinished = 0;
		for (var i = 0; i < 4;i++) {
			if (game.players[game.playerTurn].chips[i].distance == 0) notStartedChips++;
			if (game.players[game.playerTurn].chips[i].distance == 59) chipsFinished++;
		}

		game.throwsLeft = 1;
		
		if (notStartedChips + chipsFinished == 4) game.throwsLeft = 3;		
	
	} else {
		nextPlayer();
	}
}

function draw() {
	
	while (drawedAt.length != 0) {
		$("#pos-"+drawedAt.pop()).empty();
	}
	
	while (prevPossible.length != 0) {
		$("#pos-"+prevPossible.pop()).removeClass("possiblePos").off("mouseenter mouseleave");
	}
	
	while (prevPossibleNext.length != 0) {
		 $("#pos-"+prevPossibleNext.pop()).removeClass("possiblePosNext");
	}
	
	if (game.status == 1) {
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
	
	
	if (!game.waitingForMove && game.status == 1) $("#pos-92").addClass("possiblePos");
	else $("#pos-92").removeClass("possiblePos");
	
	for (var i = 0;i < 4;i++) {
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
	
	for (var i = 0; i < game.players.length; i++) {	
		for (var j = 0; j < 4; j++) {
			var numOnPos = 0;
			for (var k = 0; k < 4; k++) {
				if (pos = game.players[i].chips[k].pos == game.players[i].chips[j].pos) numOnPos += 1;
			}
			$("#pos-"+game.players[i].chips[j].pos).html(getChipSVG(numOnPos, chipColors[i]));
			drawedAt.push(game.players[i].chips[j].pos);
		}
	}
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
		drawDice(num);
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

$(document).ready(function() {
	
	var size = (($(window).width() < $(window).height()) ? $(window).width() : $(window).height());
	$('.grid').css({'height':size +'px'});
	$('.grid').css({'width':size +'px'});
	
	for (var i = 0; i < 100; i++) {
		$("#pos-"+i).data("pos", i);
		$("#pos-"+i).click(function() {
			
			let chipsOn = 0, chipsOnIn = 0;
			for (var i = 0;i < game.posiblePos.length;i++) {
				if (game.posiblePos[i] == $(this).data("pos")) {
                    if (0 != 53) chipsOn++;
                    else chipsOnIn++
                }
			}
			if (chipsOn == 1 || $(this).data("pos") == 92) {
				gameLogic($(this).data("pos"), 1);
				if ($(this).data("pos") == 92) animateDice(game.lastDice, 350);
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
	
	$("#nextPlayer").click(function() {
		for (var i = 0;i < 30; i++) ludoAI();
	});
	$("#runGame").click(function() {
		setInterval(function() {
			ludoAI();
		}, 40);
		
	});
	$("#diceBottom").click(function() {
		playerThrowDice();
	});
});