var express         = require('express');
var Duplex          = require('stream').Duplex;
var browserChannel  = require('browserchannel').server;
var livedb          = require('livedb');
var sharejs         = require('share');
var shareCodeMirror = require('share-codemirror');
var backend         = livedb.client (livedb.memory ());
var share           = sharejs.server.createClient ({ backend: backend });
var app             = express ();
var server          = require('http').createServer(app);
var io              = require('socket.io').listen(server);
var please          = require ('pleasejs');
var es              = require('elasticsearch');

var es_client       = new es.Client({
  host: 'localhost:9200',
  log: 'trace'
});


//TODO, break this out into a config file.
var port            = 3000;

server.listen (port, function () {
    console.info ('Server listening at port %d', port);
});

app.use (express.static (__dirname));
app.use (browserChannel (function (client) {
    var stream = new Duplex ({ objectMode: true });

    stream._write = function (chunk, encoding, callback) {
      if (client.state !== 'closed') {
        client.send (chunk);
      }
      callback ();
    };

    stream._read = function () {
        // Nothing special here; just reading from the stream...
    };

    stream.headers = client.headers;
    stream.remoteAddress = stream.address;

    client.on ('message', function (data) {
      stream.push (data);
    });

    stream.on ('error', function (message) {
      client.stop ();
    });

    client.on ('close', function (reason) {
      stream.emit ('close');
      stream.emit ('end');
      stream.end ();
    });

    return share.listen (stream);
}));

app.get('/chat/:padid/:start', function(req, res) {
  console.log(req.param('padid'), req.param('start'));
  es_client.search({
    index: 'visionpad',
    type: 'chat',
    size: 50,
    q: "pad_id:" + req.param('padid'),
    sort: "timestamp:desc",
    from: req.param('start')

  }).then(function(results) { res.json(results.hits.hits)});
});


/*
 *  Everything chat related
 */
var chat   = io.of('/chat');
var stamps = io.of('/stamps');

var ChatRoom = ChatRoom || {};
ChatRoom.colors = {};

chat.on('connection', function(socket) {
  console.info ("Someone has connected");

  ChatRoom.pad_id = '';

  ChatRoom.setPad = function (data, callback) {
    ChatRoom.pad_id = data.pad_id;
    if (!(data.pad_id in ChatRoom.colors)) {
      ChatRoom.colors[data.pad_id] = [];
    }
    callback (data);
  }

  ChatRoom.newColor = function (message) {
    return please.make_color ({
      saturation : 1.0,
      value      : 0.8
    })[0];
  }

  ChatRoom.addUser = function (message) {
    ChatRoom.colors[ChatRoom.pad_id].push ({
      client: message.client,
      color: ChatRoom.newColor ()
    });
  }

  // Searches the colors object for the user
  ChatRoom.searchForColor = function (message) {
    for (var i = 0; i < ChatRoom.colors[ChatRoom.pad_id].length; i++) {
      if (ChatRoom.colors[ChatRoom.pad_id][i].client === message.client) {
        return ChatRoom.colors[ChatRoom.pad_id][i].color;
      }
    }
  }

  // Removes the user from the colors object
  ChatRoom.removeUser = function (disconnect) {
    for (var i = 0; i < ChatRoom.colors[ChatRoom.pad_id].length; i++) {
      if (ChatRoom.colors[ChatRoom.pad_id][i].client === disconnect.client) {
        delete ChatRoom.colors[ChatRoom.pad_id][i];
        return;
      }
    }
  }

  socket.on('message', function(message) {
    // Sets the pad the sender is in
    ChatRoom.setPad (message, function (message) {
      // Processes color assignment for the user
      if (ChatRoom.colors[ChatRoom.pad_id].length !== 0) {
        message.color = ChatRoom.searchForColor (message);
        if (typeof message.color === 'undefined') {
          ChatRoom.addUser (message);
          message.color = ChatRoom.searchForColor (message);
        }
      } else {
        ChatRoom.addUser (message);
        message.color = ChatRoom.searchForColor (message);
      }

      // Sends the message to everyone except the sender
      socket.broadcast.to(ChatRoom.pad_id).emit('message', message);

      // Adds the message to ElasticSearch
      es_client.create({
        index: 'visionpad',
        type:  'chat',
        body:  message
      });
    });
  });

  //remove the user from the list of active colors.
  socket.on('disconnect', function (disconnect) {
    ChatRoom.setPad (disconnect, ChatRoom.removeUser);
  });

  //re-broadcast typing data to everyone else.
  socket.on('typing', function(data) {
    socket.broadcast.to(data.pad_id).emit('typing', data);
    console.log(data.client + " is typing on pad " + data.pad_id + ": " + data.value);
  });

  //put the socket in the room for the pad they're on.
  socket.on('subscribe', function(pad) {
    socket.join(pad);
  });
});

stamps.on('connection', function(socket) {
  console.log('Someone\'s about to edit the pad (stamps)');

  socket.on('stamps', function(data) {
    socket.broadcast.to(data.pad_id).emit('stamps', data);
    //TODO store the data in elasticsearch
  });

  socket.on('subscribe', function(pad) {
    socket.join(pad);
  });
});
