$(document).ready(function() {
  	//var rowTemplate = "<tr class='{{rowClass}} row-{{status}}'><td>{{status}}</td><td>{{file}}</td><td>{{link}}</td><td><a href='{{url}}' target='_new'>{{url}}</a></td><td>{{notes}}</td></tr>"
  	//var currentFileTemplate = "<div class='currentFile'>{{fileName}}</div>";
	var socket = io.connect('http://localhost:3001');
	var hero = $("#hero");
	var karmaName = $(hero).data('karmaname');
	var karmaID = $(hero).data('karmaid');
	var karmaAction = $(hero).data('karmaaction');
	var karma = $(hero).data('karma');
	var karmaLog = $('#karmaLog');
	var logTemplate = '{{user}} {{action}} <a href="/{{object}}">{{object}}</a></br>';

console.log(karmaName);

	socket.on('clientConnected', function (data) {
		$('#currentListeners').html(data.clientCount);
	});

	socket.on('clientDisconnected', function (data) {
		$('#currentListeners').html(data.clientCount);
	});

	socket.on(karmaName + ":voted", function(data) {
		karma += data.voteValue;
		$('#score').html(karma);
		$(hero).data('karma', karma);
	});

	socket.on('karmaLog', function(data) {
		console.log(data);
		$(karmaLog).append(Mustache.to_html(logTemplate,data));
	});



	$('#upvote').click(function() {
		var id = $(this).data('id');
	  	socket.emit('upvote', { id: karmaID, name: karmaName }); 
	});

	$('#downvote').click(function() {
		socket.emit('downvote', { id: karmaID , name: karmaName}); 
 	});
});