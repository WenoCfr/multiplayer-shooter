const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const players = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  players[socket.id] = {
    x: Math.random() * 500,
    y: Math.random() * 500,
    angle: 0,
    bullets: []
  };

  socket.emit('currentPlayers', players);
  socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

  socket.on('playerMovement', (movementData) => {
    if (players[socket.id]) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].angle = movementData.angle;
      socket.broadcast.emit('playerMoved', { id: socket.id, player: players[socket.id] });
    }
  });

  socket.on('shoot', (bulletData) => {
    if (players[socket.id]) {
      players[socket.id].bullets.push(bulletData);
      io.emit('bulletFired', { id: socket.id, bullet: bulletData });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
