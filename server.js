    var express = require('express');  
    var path = require("path");   
    var bodyParser = require('body-parser');  
    var mongo = require("mongoose");
	var config = require("./config.json");
	
	var url="mongodb://"+config.host+":"+config.dbPort+"/"+config.db;	
    var db = mongo.connect(url, { useNewUrlParser: true }, function(error){
		if(error)
		{ 
			console.log("Connection Error" + error);
		}
	});
      
       
    var app = express(); 
	app.use(bodyParser.urlencoded({extended:true})); 
    app.use(bodyParser.json({limit:'5mb'}));   
     
       
      
    app.use(function (req, res, next) {        
         res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');    
         res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');    
         res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');      
         res.setHeader('Access-Control-Allow-Credentials', true);       
         next();  
     });  
      
     var Schema = mongo.Schema;  
      
    var messwerteSchema = new Schema({      
     value: { type: Number   },       
     timeStamp: { type: Date   },   
    },{ versionKey: false });  
       
      
    var model = mongo.model('random', messwerteSchema);
      
     app.get("/api/getMesswerte",function(req,res){  
        model.find({},function(err,data){  
                  if(err){  
                      res.send(err);  
                  }  
                  else{                
                      res.send(data);  
                      }  
              });  
      })  
      
      
    app.listen(config.restPort, function () {  
        
     console.log('REST-Service listening on port '+config.restPort+'!')  
    })  