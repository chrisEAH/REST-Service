    var express = require('express');
    var path = require("path");
    var bodyParser = require('body-parser');
    var mongo = require("mongoose");
    var config = require("./config.json");

    var url = "mongodb://" + config.host + ":" + config.dbPort + "/" + config.db;
    var db = mongo.connect(url, {
        useNewUrlParser: true
    }, function(error) {
        if (error) {
            console.log("Connection Error" + error);
        }
    });
    var app = express();
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json({
        limit: '5mb'
    }));



    app.use(function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
        res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:4200');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Credentials', true);
        next();
    });

    var Schema = mongo.Schema;

    var messwerteSchema = new Schema({
        value: {
            type: Number
        },
        timeStamp: {
            type: Date
        },
    }, {
        versionKey: false
    });


    var model = mongo.model('random', messwerteSchema);
    var minDateQuery;
    var maxDateQuery;
    var minValueQuery;
    var maxValueQuery;


    //Fehler bei der simultanen Abarbeitung von abfragen und befüllen der Variablen, 
    //maximal und minimal Werte extrem hoch oder niedrig gesetzt bei nichtsetzen der Parameter durch User

    app.get("/api/getMesswerte", function(req, res) {
        minDateQuery = req.query.minDate;
        maxDateQuery = req.query.maxDate;
        minValueQuery = req.query.minValue;
        maxValueQuery = req.query.maxValue;

        console.log(minValueQuery + "   " + maxValueQuery);
        //console.log(req.params('minValue') + " " +req.param('maxValue'));
        //axis restrictions
        if (req.query.minDate == null || req.query.minDate == undefined) {
            //model.find({}, function(err, data)
            //{if(err){  
            //         res.send(err);  
            //     }  
            //     else{                
            minDateQuery = '1970-01-01';
            //         minDateQuery = data[0].timeStamp;
            //         res.send(minDateQuery);
            //         }  
            //     }).sort({timeStamp: 1}).limit(1);
        } else {
            if (Date.parse(req.query.minDate) == NaN) {
                minDateQuery = '1970-01-01';
            }
        }

        if (req.query.maxDate == null || req.query.maxDate == undefined) {
            //model.find({}, function(err, data)
            //{if(err){  
            //         res.send(err);  
            //     }  
            //     else{                
            maxDateQuery = '2200-01-01';
            //         minDateQuery = data[0].timeStamp;
            //         res.send(minDateQuery);
            //         }  
            //     }).sort({timeStamp: 1}).limit(1);
        } else {
            if (Date.parse(req.query.maxDate) == NaN || req.query.maxDate==0) {
                maxDateQuery = '2200-01-01';
            }
        }

        if (minValueQuery == null || minValueQuery == undefined) {
            minValueQuery = 0;
        } else {
            if (isNaN(minValueQuery) == true) {
                minValueQuery = 0;
            }
        }

        if (maxValueQuery == null || maxValueQuery == undefined || maxValueQuery==0) {
            maxValueQuery = 10000;
        } else {
            if (isNaN(maxValueQuery) == true) {
                maxValueQuery = 10000;
            }
        }
		
        // Query der die gesamte Abfrage mit den gesetzten Parametern ausführt

        model.find({
            "timeStamp": {
                $gte: new Date(minDateQuery),
                $lte: new Date(maxDateQuery)
            },
            "value": {
                $gte: minValueQuery,
                $lte: maxValueQuery
            }
        }, function(err, data) {
            if (err) {
                res.send(err);
            } else {
                res.send(data);
            };
        });

    });



    app.listen(config.restPort, function() {

        console.log('REST-Service listening on port ' + config.restPort + '!')
    })