'use strict';

var kafka = require('kafka-node');
var Consumer = kafka.Consumer;
var Producer = kafka.Producer;
var Offset = kafka.Offset;
var Client = kafka.Client;


/**
config ={
            topic: "teste",
            kafkaEndpoint: "localhost:2181"
        }
*/
var options = { autoCommit: false, fromBeginning: false, fetchMaxWaitMs: 1000, fetchMaxBytes: 1024*1024 };
var KafkaConsumer = function(config, callback){
    var topics = [config.topic];
    var client = new Client(config.kafkaEndpoint);
    var consumer = new Consumer(client, topics, options);
    var offset = new Offset(client);

    consumer.on('message', function (message) {
        callback(message);
    });

    consumer.on('error', function (err) {
        console.log('error', err);
    });

    consumer.on('offsetOutOfRange', function (topic) {
        topic.maxNum = 2;
        offset.fetch([topic], function (err, offsets) {
            var min = Math.min.apply(null, offsets[topic.topic][topic.partition]);
            consumer.setOffset(topic.topic, topic.partition, min);
        });
    })
}

// var configMock={
//                     topic: "test",
//                     kafkaEndpoint: "localhost:2181"
//                 };
// var consumer = new KafkaConsumer(configMock, function(message){
//     console.log(message);
// });


module.exports.KafkaConsumer=KafkaConsumer;
