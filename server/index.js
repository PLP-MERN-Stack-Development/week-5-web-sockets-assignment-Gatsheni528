const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // Change to your Vercel frontend URL after deploying
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

let onlineUsers = {};    // socket.id → username
let userSockets = {};    // username → socket.id

io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);

  // Set username
  socket.on('setUsername', (username) => {
    onlineUsers[socket.id] = username;
    userSockets[username] = socket.id;
    io.emit('updateUsers', Object.values(onlineUsers));
  });

  // Global message
  socket.on('sendMessage', (data) => {
    io.emit('receiveMessage', data);
  });

  // Private message
  socket.on('sendPrivateMessage', ({ recipient, message }) => {
    const toSocketId = userSockets[recipient];
    if (toSocketId) {
      io.to(toSocketId).emit('privateMessage', message);
    }
  });

  // Typing indicator (global only)
  socket.on('typing', (username) => {
    socket.broadcast.emit('userTyping', username);
  });

  // On disconnect
  socket.on('disconnect', () => {
    const username = onlineUsers[socket.id];
    delete userSockets[username];
    delete onlineUsers[socket.id];
    io.emit('updateUsers', Object.values(onlineUsers));
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Use dynamic port for Render
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
