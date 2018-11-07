    var express = require('express');
    var bodyParser = require('body-parser');
    var MongoClient = require('mongodb').MongoClient;
    var config = require("./config.json");
	var eventEmitter = require('events').EventEmitter;
	var math=require('mathjs');

	var ee = new eventEmitter();
	
	/*
	var frameAnfang=0;
	var frameEnde=0;
	
	var frameIntervall=0;
	var pixelEntfernung=0;
	var n=1;
	
	
	
	var results=new Array();*/
	
	
	
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
    
	
	app.listen(config.restPort, function() {
        console.log('REST-Service listening on port ' + config.restPort + '!');
    });
	
	
	app.get("/api/getMax", function(req, response) {
		let results=new Array();
		
		let frameAnfang=checkNumberValue(req.query.frameAnfang,0);
		let frameEnde=checkNumberValue(req.query.frameEnde,100);
		
		console.log("Frame Anfang: " + frameAnfang);
		console.log("Frame Ende: " + frameEnde);
	
		
		MongoClient.connect("mongodb://"+config.host+":"+config.port,  { useNewUrlParser: true }, function(err, db){  
		if(err){ console.log( err); }  
		else{ 
			var dbObject=db.db(config.db);
				ee.emit('getMongoMaxResults',dbObject,db,response, frameAnfang, frameEnde, results);
		}  
		}); 

    });
	
	app.get("/api/getMaxTempFromVariablenMesspunkt", function(req, response) {
		let results=new Array();
		let n=1;
		
		let frameAnfang=checkNumberValue(req.query.frameAnfang,0);
		let frameEnde=checkNumberValue(req.query.frameEnde,100);
		
		let frameIntervall=checkNumberValue(req.query.frameIntervall,1);
		let pixelEntfernung=checkNumberValue(req.query.pixelEntfernung,10);;
		
		console.log("Frame Anfang: " + frameAnfang);
		console.log("Frame Ende: " + frameEnde);
		console.log("Frame Intervall: " + frameIntervall);
		console.log("pixelEntfernung: " + pixelEntfernung);
	
		
		MongoClient.connect("mongodb://"+config.host+":"+config.port,  { useNewUrlParser: true }, function(err, db){  
		if(err){ console.log( err); }  
		else{ 
			var dbObject=db.db(config.db);
				ee.emit('getFirstPixelCoordinate',dbObject,db,response,n, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results);
		}  
		}); 

    });
	
	ee.on('getFirstPixelCoordinate',function(dbObject,db,response,n, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results)
	{
		if(frameAnfang<=frameEnde)
			{
				dbObject.collection(config.collectionName).find({frame:frameAnfang}).sort({temp:-1}).limit(1).toArray(function(err,data){
					if(data.length>0)
					{
						console.log("Frame: " + data[0].frame);
						console.log("firstPixel X: "+ data[0].x);
						console.log("firstPixel Y: "+ data[0].y);
						ee.emit('getSecondPixelCoordinate',dbObject,db,response,n, data[0].x, data[0].y, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results);
					}
					else
					{
						frameAnfang++;
						ee.emit('getFirstPixelCoordinate',dbObject,db,response,n, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results);
					}
					
				});
			}
			else
			{
				ee.emit('sendMongoResults', results,db,response);
			}
	});
	
	
	ee.on('getSecondPixelCoordinate',function(dbObject,db,response,n, firstPixelX, firstPixelY, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results)
	{
		if(frameAnfang+frameIntervall*n<=frameEnde)
			{
				dbObject.collection(config.collectionName).find({frame:frameAnfang+frameIntervall*n}).sort({temp:-1}).limit(1).toArray(function(err,data){
					if(data.length>0)
					{
						var secondPixelX=data[0].x;
						var secondPixelY=data[0].y;
						
						console.log("secondPixel X: "+ secondPixelX);
						console.log("secondPixel Y: "+ secondPixelY);
						console.log("n: " + n);
						
						//wenn beide coordinaten gleich sind, denn kann kein weg berechnet werden
						//somit wider holen bis die pixel unterschide
						if(secondPixelX==firstPixelX && secondPixelY==firstPixelY)
						{
							n++;
							ee.emit('getSecondPixelCoordinate',dbObject,db,response,n, firstPixelX, firstPixelY, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results);
						}
						else
						{
							n=1;
							variablenPixel=getVariablenPixel(firstPixelX, firstPixelY, secondPixelX, secondPixelY, pixelEntfernung);
							console.log("varPixel X: "+ variablenPixel.x);
							console.log("varPixel Y: "+ variablenPixel.y);
							ee.emit('getTempFromVariablenPixel',dbObject,db,response,n, variablenPixel, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results);
						}
						
						
					}
					else
					{
						console.log("-------------------");
						n=1;
						frameAnfang++;
						ee.emit('getFirstPixelCoordinate',dbObject,db,response,n, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results);
					}
				});
			}
			else
			{
				ee.emit('sendMongoResults', results,db,response);
			}
	});
	
	ee.on('getTempFromVariablenPixel',function(dbObject,db,response,n,variablenPixel, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results)
	{
		if(frameAnfang<=frameEnde)
			{
				dbObject.collection(config.collectionName).find({frame:frameAnfang,x:variablenPixel.x, y:variablenPixel.y}).limit(1).toArray(function(err,data){
					if(data.length>0)
					{
						console.log("var. Temp: "+data[0].temp);
						var frame={frame:frameAnfang, temp:data[0].temp};
						results.push(frame);
					}
					console.log("-------------------");
					frameAnfang++;
					ee.emit('getFirstPixelCoordinate',dbObject,db,response,n, frameAnfang, frameEnde, frameIntervall, pixelEntfernung, results);
				});
			}
			else
			{
				ee.emit('sendMongoResults', results,db,response);
			}
	});
	
	
	
	ee.on('getMongoMaxResults',function(dbObject,db,response,frameAnfang,frameEnde, results)
	{		
		if(frameAnfang<=frameEnde)
			{
				dbObject.collection(config.collectionName).find({frame:frameAnfang}).sort({temp:-1}).limit(1).toArray(function(err,data){
					if(data.length>0)
					{
						console.log("Frame: " +data[0].frame + " Temp: "+ data[0].temp);
						var frame={frame:frameAnfang, temp:  data[0].temp};
						results.push(frame);
					}
					frameAnfang++;
					ee.emit('getMongoMaxResults',dbObject,db,response,frameAnfang, frameEnde, results);
				});
			}
			else
			{
				ee.emit('sendMongoResults', results,db,response);
			}
	});
	

	ee.on('sendMongoResults', function(results,db,response)
	{
		response.send(results);
		db.close();
	});
	
	function checkNumberValue(value, defaultValue)
	{
		if (value == null || value == undefined || value==0) {
            return defaultValue;
        } else {
            if (value == NaN) {
                return defaultValue;
            }
        }
		
		return parseInt(value, 10);
	}
	
	function getVariablenPixel(firstPixelX, firstPixelY, secondPixelX, secondPixelY, pixelEntfernung)
	{		
		x=math.round(math.sqrt(math.pow(pixelEntfernung,2)/(1+math.pow(((secondPixelY-firstPixelY)/(secondPixelX-firstPixelX)),2))));
		
		//Problem. eine Funktion darf nur einen Y Wert haben. Weil sie sonst nicht definiert ist.
		//sprich anstieg unendlich geht nicht
		if((secondPixelX-firstPixelX)==0)
		{
			y=pixelEntfernung;
		}
		else
		{
			y=math.round(((secondPixelY-firstPixelY)/(secondPixelX-firstPixelX))*x);
		}
		
		return {x:x+firstPixelX, y:y+firstPixelY};
	}