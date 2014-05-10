
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');

var app = express();

var passport = require('passport')
  , FacebookStrategy = require('passport-facebook').Strategy;
TwitterStrategy = require('passport-twitter').Strategy;
var databaseUrl = "nodeExpress";
var collections = ["users", "reports"];
var db = require("mongojs").connect(databaseUrl, collections);

var User = db.users;
app.configure(function() {
  app.use(express.static(__dirname +'/public'));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
});
var mongoose = require("mongoose");
var LocalUserSchema = new mongoose.Schema({
    username: String,
    salt: String,
    hash: String
});
var FacebookUserSchema = new mongoose.Schema({
    fbId: String,
    email: { type : String , lowercase : true},
    name : String
});
var FbUsers = mongoose.model('fbs',FacebookUserSchema);
passport.use(new FacebookStrategy({
    clientID: "679347035440335",
    clientSecret: "a62d337e67d6c941c3846205362cfdb1",
    callbackURL: "http://localhost:3000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // console.log(accessToken);
    // console.log(refreshToken);
    // done(null,{})
    console.log(profile.id);
    // console.log(done);
    // FbUsers.findOne({fbId : profile.id}, function(err, oldUser){

    //     if(oldUser){
    //         done(null,oldUser);
    //     }else{
    //         var newUser = new FbUsers({
    //             fbId : profile.id ,
    //             email : profile.emails[0].value,
    //             name : profile.displayName
    //         }).save(function(err,newUser){
    //             if(err) throw err;
    //             done(null, newUser);
    //         });
    //     }
    // });
    User.findOne({"_id":profile.id}, function(err, user) {
      if (err) { return done(err); }
        if(user)
            done(null, user);
        else{
            user = {"_id":profile.id}
            User.save(user);
            done(null, user);
        }
    });
  }
));
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
// TWITER
passport.use(new TwitterStrategy({
    consumerKey: "QJWrADkAVqDrjZPbaQ6A",
    consumerSecret: "QPfAmJEVtO63LnM8Skz4MFtg0IrgTAfdQtuMtc23as",
    callbackURL: "http://localhost:3000/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
    console.log(profile.id)
    User.findOne({"_id":profile.id}, function(err, user) {
      if (err) { return done(err); }
        if(user)
            done(null, user);
        else{
            user = {"_id":profile.id}
            User.save(user);
            done(null, user);
        }
    });
  }
));
// User.find({sex: "female"}, function(err, users) {
//     console.log(err)
//   if( err || !users) console.log("No female users found");
//   else users.forEach( function(femaleUser) {
//     console.log(femaleUser);
//   } );
// });
// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));



// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);
app.get('/auth/facebook', passport.authenticate('facebook',{ scope: ['publish_actions'] }));
    http.createServer(app).listen(app.get('port'), function(){
      console.log('Express server listening on port ' + app.get('port'));
});

app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', 
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/login' }));
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/',
                                      failureRedirect: '/login' }));