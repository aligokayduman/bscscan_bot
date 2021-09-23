'use strict';

import express from 'express';
import path from 'path';
import fetchHash,{fetchAddress,fetchToken,fetchHolder, fetchLiquid, fetchSource} from './cron.js';

const app = express();
const __dirname = path.resolve(path.dirname(''));

//BodyParser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// view engine setup
app.set('views', path.join(__dirname, './'));
app.set('view engine', 'ejs');

//Routes
app.get('/',function(req,res){
    res.render(path.join(__dirname+'/monitor'));
  });

//Server Up
app.listen(3001,() =>{
    console.log('http://localhost:3001');    
});

 
setInterval(fetchHash,60000);
setInterval(fetchAddress,300);
setInterval(fetchToken,300);
setInterval(fetchHolder,3000);
setInterval(fetchLiquid,300);
setInterval(fetchSource,300);