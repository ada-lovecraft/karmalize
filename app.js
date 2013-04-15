
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , objects = require('./routes/objects')
  , http = require('http')
  , path = require('path')
  , mysql = require('mysql');


var app = express();

var server = http.createServer(app)
  , io = require('socket.io').listen(server);

server.listen('3001');


var pool = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: 'root'
})


var activeClients = 0;



// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/:object', objects.show);



http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});


 objects.emitter.on('insert',function(data) { insertObject(data); })


io.sockets.on('connection', function (socket) {

	clientConnect(socket);
  	socket.on('disconnect', function() { clientDisconnect(socket); });
  	socket.on('upvote', function(data) {
  		increaseScore(socket,data); 
  	});
  	socket.on('downvote', function(data) {
  		decreaseScore(socket,data);
  	});
});




function clientConnect(socket) {
	activeClients++;
	socket.broadcast.emit('clientConnected', { clientCount: activeClients })
	socket.emit('clientConnected', { clientCount: activeClients });
	console.log('activeClients: ' + activeClients)
}

function clientDisconnect(socket) {
	activeClients--;
	socket.broadcast.emit('clientDisconnected', { clientCount: activeClients });
}

function insertObject(data) {
	var objectName = data.name;
	console.log('INSERTING');
	pool.getConnection(function(err, connection) {
		connection.query('INSERT INTO karmalize.objects (name) VALUES("' + objectName + '");', function(err,insertrows) {
			if (err) {
				console.log('ERROR INSERTING: ' + err);
	    		connection.end();
			}
			else {
				connection.end();
				pool.getConnection(function(err, connection) {
					connection.query('SELECT LAST_INSERT_ID()', function(err,idrows) {
						if(err)
							console.log(err);
						else {
							console.log(JSON.stringify(idrows));
							var idrow = idrows[0];
							object = {
								id: idrow['LAST_INSERT_ID()']
								, score: 0
								, votes: 0
								, name: objectName
								, summary: ''
							};
							logData( {
				    			user: 'Some one',
				  				action: 'added',
				  				object: data.name
				  			});
				  			objects.listener.emit('inserted', {id:idrow['LAST_INSERT_ID()'], name: objectName});
						}
			    		connection.end();

					});
				});
			}
		});
	});
}


function increaseScore(socket,data) {
	console.log('increasing %s', data.id);
 		// Use the connection
	pool.getConnection(function(err, connection) {

  		connection.query( 'UPDATE karmalize.objects SET score = score + 1 where id = ' + data.id, function(err, rows) {
  			var voteObj = {
  				name: data.name
  				, voteValue: 1
  			};
  			broadcastVote(socket,voteObj);
  			logData( {
    			user: 'Some one',
  				action: 'liked',
  				object: data.name
  			});
    	// And done with the connection.
    		connection.end();
    	// Don't use the connection here, it has been returned to the pool.
  		});
  	});
	
}

function decreaseScore(socket,data) {
	console.log('decreasing %s', data.id);
	pool.getConnection(function(err, connection) {
  		// Use the connection
  		connection.query( 'UPDATE karmalize.objects SET score = score - 1 where id = ' + data.id, function(err, rows) {
  			var voteObj = {
  				name: data.name,
  				voteValue: -1
  			};
  			broadcastVote(socket,voteObj);
    	// And done with the connection.
    		logData( {
    			user: 'Some one',
  				action: 'disliked',
  				object: data.name
  			});
    		connection.end();
    	// Don't use the connection here, it has been returned to the pool.
  		});
  	});
	
}


function broadcastVote(socket, data) {
	socket.emit(data.name + ":voted", data);
	socket.broadcast.emit(data.name + ":voted", data);
}

function logData(data) {
	console.log('LOGGING: ' + JSON.stringify(data));
	pool.getConnection(function(err, connection) {
  		// Use the connection
  		connection.query( 'INSERT INTO log (action, object_name) VALUES("' + data.action + '","' + data.object + '");', function(err, rows) {
    	// And done with the connection.
    		connection.end();
    	// Don't use the connection here, it has been returned to the pool.
  		});


  	});
	io.sockets.emit('karmaLog', data );


}


