const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const { map } = require('./map.js');
const Robot = require('./robot.js');
const cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json())
app.use(cors({
    origin: "*"
}))

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

const robot = new Robot();

io.on('connection', (socket) => {
    console.log('a user connected');
    
    const interval = setInterval(() => {
        const state = robot.getState();
        socket.emit('state', state);
        
        if (state.health <= 0) {
            socket.emit('died');
        }

    }, 1000);
    // возобновление работы после смерти
    socket.on('restart', () => {
        robot.restart();
    });

    // переключение режимов
    socket.on('changeMode', () => {
        robot.changeMode();
    });

    socket.on('heal', () => {
        robot.heal();
    });

    // управление
    socket.on('moveForward', () => {
        robot.moveForward();
    });

    socket.on('moveBackward', () => {
        robot.moveBackward();
    });

    socket.on('turnLeft', () => {
        robot.turnLeft();
    });

    socket.on('turnRight', () => {
        robot.turnRight();
    });

    socket.on('moveLeft', () => {
        robot.moveLeft();
    });

    socket.on('moveRight', () => {
        robot.moveRight();
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        clearInterval(interval);
    });
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});