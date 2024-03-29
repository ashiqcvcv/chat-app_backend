var express = require('express');
var socket = require('socket.io');
const { Router } = require('express');
const cors = require('cors');

// App setup
var app = express();
app.use(cors());
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
app.set('port',process.env.PORT || 3000);
var server = app.listen(app.get('port'), function () {
    console.log('listening for requests on port 3000');
});

app.get('/getOnlineList', (req,res, next) => {
    res.send(Object.keys(active));
})

// Socket setup
var io = socket(server);
var active = {}

io.on('connection', onConnect);

function getUser(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function onConnect(socket) {
    console.log(`New connection made ${socket.id}`)
    socket.on('create', function (userinfo) {
        if (userinfo[0] in active) {
            socket.emit('updateName', {
                message: "user name already exit",
                response: false
            })
            console.log("user already exits")
        } else {
            var temp = getUser(active, socket.id);
            delete active[temp]
            active[userinfo[0]] = userinfo[1]
            socket.emit('updateName', {
                message: 'username updated',
                response: true,
                username: userinfo[0]
            })
            console.log("user added", active)
        }
    })

    socket.on('joinOne', function (checkfriend) {
        if (checkfriend in active) {
            var sender = getUser(active, socket.id);
            io.to(active[checkfriend]).emit('joinChat', {
                message: "join to chat with " + sender,
                friendname: sender
            });
            io.to(active[sender]).emit('joinChat', {
                message: "join can chat with " + checkfriend,
                friendname: checkfriend
            })
            console.log(sender + ' and ' + checkfriend + 'are new friends')
        }
    })

    socket.on('sendMessage', function (message) {
        io.to(active[message.sndr]).emit('updateMessage', message)
        io.to(active[message.rcvr]).emit('updateMessage', message)
    })

    socket.on('getOnlineList', function () {

    })

    socket.on('disconnect', function () {
        var deletedUser = getUser(active, socket.id)
        console.log(deletedUser + " is disconnected")
        delete active[deletedUser]
        console.log(active)
    });

}

