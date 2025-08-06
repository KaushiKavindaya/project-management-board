const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST", "PUT", "DELETE"] }
});

app.use(cors());
app.use(express.json());
app.use((req, res, next) => { req.io = io; next(); });
app.use('/api', require('./routes/api'));

io.on('connection', (socket) => {
    socket.on('joinBoard', (boardId) => socket.join(`board-${boardId}`));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));