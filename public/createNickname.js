function validate() {
	var newText = "";
		
	jQuery.ajax({
		url: "/rest/playerExists",
		type: "POST",
		data: JSON.stringify({"playerName": $("#playerName").val()}),

		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			if (!resultData.success) $("#nicknameError").text(resultData.message);
		},
		error : function(jqXHR, textStatus, errorThrown) {
		},

		timeout: 120000,
	});
	
	if ($("#playerName").val().length > 16) newText = "Name max length is 16 charaters.";
	if ($("#playerName").val().length < 3) newText = "Name most be at least 3 charaters.";
	
	$("#nicknameError").text(newText);
	
	$("#createNickname").attr("disabled", (newText != ""));
}

function submit() {
	jQuery.ajax({
		url: "/rest/regPlayer",
		type: "POST",
		data: JSON.stringify({"playerName": $("#playerName").val()}),

		contentType: 'application/json; charset=utf-8',
		success: function(resultData) {
			if (resultData.success) {
				window.sessionStorage.token = resultData.token;
				window.sessionStorage.playerId = resultData.playerId;
				window.location.href = "lobby?token="+ window.sessionStorage.token;
			}
		},
		error : function(jqXHR, textStatus, errorThrown) {
		},

		timeout: 120000,
	});
}

$(document).ready(function() {
	$("#playerName").on("change keyup", function() {
		validate();
	});
	
	$("#form").submit(function () {
		event.preventDefault();
		submit();
	});
});