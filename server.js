'use strict';

var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    mongoose = require('mongoose'),
    KafkaConsumer = require('./lib/kafka-consumer').KafkaConsumer;

/**
 * Main application file
 */

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Application Config
var config = require('./lib/config/config');

// Connect to database
var db = mongoose.connect(config.mongo.uri, config.mongo.options);

// Bootstrap models
var modelsPath = path.join(__dirname, 'lib/models');
fs.readdirSync(modelsPath).forEach(function (file) {
  if (/(.*)\.(js$|coffee$)/.test(file)) {
    require(modelsPath + '/' + file);
  }
});

// Populate empty DB with sample data
require('./lib/config/dummydata');
  
// Passport Configuration
var passport = require('./lib/config/passport');

var app = express();

// Express settings
require('./lib/config/express')(app);

// Routing
require('./lib/routes')(app);

// Start server
var server = app.listen(config.port, function () {
  console.log('Express server listening on port %d in %s mode', config.port, app.get('env'));
});

var everyone = require("now").initialize(server);
everyone.now.logStuff = function(msg){
    console.log(msg);
}

everyone.now.distributeMessage = function(message){
  everyone.now.receiveMessage(message);
};

var eventsQueue = [];
var eventNames = [];

function putEvent(eventType){
	var indexOf = eventNames.indexOf(eventType.name);
	if(indexOf<0){
		eventsQueue.push(eventType);
		eventNames.push(eventType.name);
	}else{
		eventsQueue[indexOf].count++;
	}
}


function start(){
	var config={
    topic: "test",
    kafkaEndpoint: "localhost:2181"
	};

	var consumer = new KafkaConsumer(config, function(message){
		var value = JSON.parse(message.value);
		console.log(value.type);
		var event = {name: value.type, count:0};
		putEvent(event);
	});
}

function reset(){
	for (var i = eventsQueue.length - 1; i >= 0; i--) {
		var event = eventsQueue[i];
		event.count=0;
	};
}

setTimeout(function(){
	start();
	setInterval(function(){
		console.log("Sending "+ eventsQueue.length);
		everyone.now.distributeMessage(eventsQueue);
		reset();
	},1000);	
}, 6000);


// Expose app
exports = module.exports = app;