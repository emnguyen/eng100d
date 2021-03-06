'use strict';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  require('dotenv').config();
}

var express = require('express'),
    exphbs  = require('express-handlebars'); // "express-handlebars"
var http = require("http");
var path = require("path");
var bodyParser = require('body-parser')
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var session = require('express-session');

// Routes
var home = require("./routes/home");
var assess = require("./routes/assess");
var admin = require("./routes/admin");
var markets = require("./routes/markets");
var data = require("./routes/data");

// Database
const sqlite3 = require('sqlite3');
const assessments = new sqlite3.Database('assessment.db');
const userdb = new sqlite3.Database('users_accounts.db');
const marketdb = new sqlite3.Database('./markets.db');

var app = express();

var hbs = exphbs.create({
    // Specify helpers which are only registered on this instance.
    defaultLayout: 'main',
    helpers: {
        ifEquals: function(arg1, arg2, options) { return (arg1 == arg2) ? options.fn(this) : options.inverse(this); },
        ifNotEquals: function(arg1, arg2, options) { return (arg1 != arg2) ? options.fn(this) : options.inverse(this); },
        concat: function(arg1, arg2) { return arg1 + "|" + arg2; }
    }
});

app.set("port", process.env.PORT || 3000);
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
//app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, "public")));

//express-session set up
app.use(session({
  secret: 'qewrsdfasdf',
  saveUninitialized: false,
  resave: false,
  cookie: { secure: false }
}));


//passport set up
app.use(passport.initialize());
app.use(passport.session());

//variable to check if code has been entered
let datalogin = false;


//setting up global isAunthenticted var
app.use(function(req , res, next){
  res.locals.isAuthenticated = req.isAuthenticated()
  next();
});


app.get("/", home.view);
app.get("/assess", assess.view);
app.get("/assessment/:market/:time", assess.viewAssessment);
app.get("/delete-assessment/:market/:time", authenticationMiddleware(), assess.deleteAssessment);
app.get("/assess-edit", authenticationMiddleware(), assess.edit);
app.post("/assess-save", authenticationMiddleware(), assess.save);
app.post("/assess-verify-code", assess.verifyCode);
app.post("/assess-save-market", assess.saveMarket);
app.post("/assess-submit", assess.submit);
app.get("/admin-login", admin.loginView);
app.get("/admin",authenticationMiddleware(), admin.view);
app.get("/data", authenticationLogin (), data.view);
app.get("/data-login", data.loginView);
app.get("/markets", markets.view);

//ends the session and returns to main page
app.get('/logout', function(req, res, next){
      req.logout();
      res.redirect('admin-login');
});

//code that searches for the user account in database
passport.use(new LocalStrategy(function(username, password, done) {
  userdb.get('SELECT user FROM users_accounts WHERE user= ? AND id = 1', username, function(err, row) {
    //failed to find user in database
    if (!row){
       return done(null, false);
    }
    userdb.get('SELECT user, id FROM users_accounts WHERE user = ? AND password = ?', username, password, function(err, row) {
      //got the wrong password but correct user
      if (!row) {
        return done(null, false);
      }
      return done(null, row);
    });
  });
}));

//data login post code
app.post('/data-login', function(req, res, next){
      userdb.get('SELECT user FROM users_accounts WHERE password= ?', req.body.code, function(err, row) {
      //got the wrong password but correct user
      if (!row) {
        res.redirect('data-login');
      }else{
      datalogin =true;
      res.redirect('data');
    };
    });
});

//login POST call checks for authentication
app.post('/admin-login', passport.authenticate('local', { successRedirect: '/admin', failureRedirect: '/admin-login'}));

//initializes session when user first loges in creates a cookie
passport.serializeUser(function(user, done) {
  return done(null, user.id);
});

//check if session is valid after other callses
passport.deserializeUser(function(id, done) {
  userdb.get('SELECT id, user FROM users_accounts WHERE id = ?', id, function(err, row) {
    if (!row) return done(null, false);
    return done(null, row);
  });
});

//function that check if code was entered
function authenticationLogin () {
  return (req, res, next) => {
      if (datalogin){ 
        datalogin = false;
        return next();
      }
      res.redirect('/data-login')
  }
};

//function that check if user was logged in
function authenticationMiddleware () {
  return (req, res, next) => {
      if (req.isAuthenticated()) return next();
      res.redirect('/admin-login')
  }
};
//POST request for pre-assessment
/*
app.post('/assess-save-market', (req, res) => {
  assessments.run("INSERT INTO assessmentTable(firstName, lastName, marketName, email)  VALUES(?,?,?,?)",
  req.body.firstName, req.body.lastName, req.body.marketName, req.body.email);
  res.send("FINISHED preassessment for " + req.body.marketName);
});
*/

//GET Request for a specific market
app.get('/markets/:name', (req, res) =>{
  const marketSearch = req.params.name;
  assessments.all('SELECT * FROM assessmentTable WHERE marketName like $name',
    {$name: marketSearch},
    (err, rows) => {
      if(rows.length > 0){
        res.send(rows[0]);
      }else{
        res.send({});
      }
  });
});

//GET Request for all markets
app.get('/marketss', (req,res) => {
  console.log("get request called");
  marketdb.all('SELECT * FROM markets', (err,rows) =>{
    if(rows.length > 0){
      const marketsdb = JSON.parse(rows[0].data);
      console.log(marketsdb);
      res.send(marketsdb);
    }else{
      res.send("There are no markets currently in the database");
    }
  });
});



//TEST POST REQUEST
app.post('/data', (req, res)=>{
  const testMarket = req.body.name;
  console.log("BODY: " + req.body.pass);
  console.log("TEST MARKET: " + testMarket);
  assessments.all('SELECT * FROM assessmentTable WHERE name = $name',
  {$name: testMarket},
  (err, rows) => {
    if(rows.length > 0){
      res.send(testMarket + " already has a database.");
    }else{
      assessments.run('INSERT INTO assessmentTable(name) VALUES(?)', testMarket);
      res.send("Assessment was successfully saved for " + testMarket);
    }
  });
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Express server listening on port " + app.get("port"));
});
