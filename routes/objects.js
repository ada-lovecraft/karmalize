var EventEmitter = require('events').EventEmitter;
exports.emitter = new EventEmitter();
exports.listener = new EventEmitter();
var mysql = require('mysql');
var radium = new EventEmitter();

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root'
});


exports.show = function(req, res) {
	var objectName = req.params.object;
	var object = null;
	connection.query('SELECT * from karmalize.objects where name ="' + objectName.toLowerCase() + '" LIMIT 1', function(err,rows) {
		if (!err) {
			if (rows.length > 0) {
				var row = rows[0];
				object = {
					id: row.id
					, score: row.score
					, votes: row.votes
					, name: row.name
					, summary: row.summary
				};
				res.render('object', { 'title': 'Karmalize' , 'karma' : object});

			} else {
				exports.emitter.emit('insert', {name: objectName});
				exports.listener.on('inserted', function(data) { 
					object = {
						id: data.id
						, score: 0
						, votes: 0
						, name: data.name
						, summary: ''
					};
					res.render('object', { 'title': 'Karmalize' , 'karma' : object}); });
			}
		} else {
			console.log('error: ' + err);
		}
		//connection.end();

	});
	


};

