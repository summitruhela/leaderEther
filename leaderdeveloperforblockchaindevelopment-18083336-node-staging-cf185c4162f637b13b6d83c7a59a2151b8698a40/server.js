const express = require('express')
const app = express();
const config = require('./config/config')
const mongoose = require('mongoose')
let adminRoutes = require('./routes/adminRoutes');
let userRoutes = require('./routes/userRoutes');
let ethRoutes = require('./routes/ethRoutes');
let testRoutes = require('./routes/testRoutes');
let router=require('./routes/staticContentRoutes')
let adminHandler=require('./fileHandler/adminHandler.js')
let func=require('./fileHandler/function.js')
const bodyParser = require('body-parser');
const morgan = require('morgan');
var cors = require('cors');
const path = require('path');

app.use(morgan('dev'))
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
mongoose.connect(config.mongo_url);
app.use('/admin/n1',router);
app.use('/admin', adminRoutes)
app.use('/user', userRoutes)
app.use('/eth', ethRoutes)
app.use('/test', testRoutes)

/*.................attach a front end website..................*/
app.use(express.static(path.join(__dirname, '/dist')));
app.get('*', function (req, res) {  //always use * b refresh time it gives error.. 
   res.sendFile(__dirname + '/dist/index.html');
 });

app.listen(config.server_port,()=>{
	console.log("test server connected on port ==>",config.server_port)
})