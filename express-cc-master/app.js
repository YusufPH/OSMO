var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var sqlite = require('sqlite-sync');

// Authentication packages
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var MySQLStore = require('express-mysql-session')(session);
var bcrypt = require('bcrypt');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();
var session = require('express-session');
var SQLiteStore = require('connect-sqlite3')(session);


require('dotenv').config();

sqlite.connect(__dirname + '/db/meetings.db');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.use(session({
    secret: 'abcdefg',
    resave: false,
    store: new SQLiteStore,
    saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

app.use(function (req, res, next) {
   res.locals.isAuthenticated = req.isAuthenticated();
   next();
});

app.use('/', index);
app.use('/admin', users);

passport.use(new LocalStrategy(function (username, password, done) {
        console.log(username);
        console.log(password);


        sqlite.run("SELECT id, password FROM users WHERE username = '"+ username +"'", function (results) {
            console.log("Results: "+JSON.stringify(results));
            if (results.length === 0) {
                done(null, false);
            } else{

                const hash = results[0].password.toString();

                bcrypt.compare(password, hash, function (err, response) {
                    if (response === true) {
                        console.log("Response true");
                        console.log("ID:" + results[0].id);
                        return done(null, {user_id: results[0].id});
                    } else {
                        console.log("Response false");
                        return done(null, false);
                    }
                });
            }
        });






    }
));

app.get('/*', function (req, res) {
    var fileName = (__dirname + "/" + req.params[0]);
    console.log(fileName);
    if (fs.existsSync(fileName)){
        res.sendFile(fileName);
    } else {
        res.status(404).end("Not Found");
    }
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


// Handlebars default config
const hbs = require('hbs');
const fs = require('fs');

const commonDir = __dirname + '/views/common';

const filenames = fs.readdirSync(commonDir);

filenames.forEach(function (filename) {
    const matches = /^([^.]+).hbs$/.exec(filename);
    if (!matches) {
        return;
    }
    const name = matches[1];
    const template = fs.readFileSync(commonDir + '/' + filename, 'utf8');
    hbs.registerPartial(name, template);
});

hbs.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2);
});


module.exports = app;
