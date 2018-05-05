'use strict';

var express = require('express'),
    exphbs  = require('express-handlebars'); // "express-handlebars"
var http = require("http");
var path = require("path");

var app = express();

app.set("port", process.env.PORT || 3000);
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.use(express.static(path.join(__dirname, "public")));

app.get('/', function (req, res) {
    res.render('home');
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Express server listening on port " + app.get("port"));
});
