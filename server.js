require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const Message = require('./models/message');
const User = require('./models/user');

connectDB();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/news', require('./routes/news'));

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

// HTTP server + Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Authenticate socket connections with JWT
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('firstName lastName');
    if (!user) return next(new Error('User not found'));
    socket.userId = decoded.id;
    socket.userFullName = `${user.firstName} ${user.lastName}`;
    next();
  } catch {
    next(new Error('Authentication error'));
  }
});

// Track online users: userId -> socketId
const onlineUsers = new Map();

io.on('connection', (socket) => {
  onlineUsers.set(socket.userId, socket.id);
  socket.broadcast.emit('user_online', { userId: socket.userId });

  // Join a conversation/group room
  socket.on('join_conversation', ({ conversationId }) => {
    socket.join(conversationId);
  });

  socket.on('leave_conversation', ({ conversationId }) => {
    socket.leave(conversationId);
  });

  // Send a message: saves to DB and broadcasts to room
  socket.on('send_message', async ({ conversationId, content, recipientId }) => {
    try {
      let conversation;

      if (conversationId) {
        conversation = await Message.findById(conversationId);
      } else if (recipientId) {
        // Find or create DM conversation
        conversation = await Message.findOne({
          conversationType: 'direct',
          participants: { $all: [socket.userId, recipientId] },
        });
        if (!conversation) {
          conversation = await Message.create({
            conversationType: 'direct',
            participants: [socket.userId, recipientId],
            messages: [],
          });
          // Auto-join the new room
          socket.join(conversation._id.toString());
          // Notify recipient if online
          const recipientSocketId = onlineUsers.get(recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('new_conversation', {
              conversationId: conversation._id.toString(),
            });
          }
        }
      }

      if (!conversation) return;

      const newMsg = { sender: socket.userId, content, timestamp: new Date() };
      conversation.messages.push(newMsg);
      await conversation.save();

      const saved = conversation.messages[conversation.messages.length - 1];

      // Broadcast to everyone in the room (including sender)
      io.to(conversation._id.toString()).emit('new_message', {
        conversationId: conversation._id.toString(),
        message: {
          _id: saved._id,
          sender: { _id: socket.userId, fullName: socket.userFullName },
          content,
          timestamp: saved.timestamp,
        },
      });

      // Tell sender the conversationId (for new DM flow)
      socket.emit('conversation_ready', {
        conversationId: conversation._id.toString(),
      });
    } catch (err) {
      console.error('send_message error:', err.message);
    }
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(conversationId).emit('typing', {
      userId: socket.userId,
      fullName: socket.userFullName,
      isTyping,
    });
  });

  socket.on('disconnect', () => {
    onlineUsers.delete(socket.userId);
    socket.broadcast.emit('user_offline', { userId: socket.userId });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
