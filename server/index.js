const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: 'http://localhost:5173', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

let onlineUsers = {};    // socket.id -> username
let userSockets = {};    // username -> socket.id

io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  socket.on('setUsername', (username) => {
    onlineUsers[socket.id] = username;
    userSockets[username] = socket.id;
    io.emit('updateUsers', Object.values(onlineUsers));
  });

  socket.on('sendMessage', (data) => {
    console.log('🌐 Global Message:', data);
    io.emit('receiveMessage', data);
  });

  socket.on('sendPrivateMessage', ({ recipient, message }) => {
    const toSocketId = userSockets[recipient];
    if (toSocketId) {
      io.to(toSocketId).emit('privateMessage', message);
    }
  });

  socket.on('typing', (username) => {
    socket.broadcast.emit('userTyping', username);
  });

  socket.on('disconnect', () => {
    const username = onlineUsers[socket.id];
    delete userSockets[username];
    delete onlineUsers[socket.id];
    io.emit('updateUsers', Object.values(onlineUsers));
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

server.listen(5000, () => {
  console.log('🚀 Server running on http://localhost:5000');
});
