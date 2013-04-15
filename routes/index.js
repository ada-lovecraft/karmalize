
/*
 * GET home page.
 */

var radium = require('events').EventEmitter();

exports.index = function(req, res){
  res.render('index', { title: 'Karmalize' });

};