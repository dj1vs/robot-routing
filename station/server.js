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
    socket.on('moveForward', (delay) => {
            robot.moveForward()
    });
    socket.on('moveBackward', (delay) => {
            robot.moveBackward()
    });
    socket.on('moveLeft', (delay) => {
            robot.moveLeft()
    });
    socket.on('moveRight', (delay) => {
            robot.moveRight()
    });

    socket.on('turnLeft', () => {
        robot.turnLeft();
    });

    socket.on('turnRight', () => {
        robot.turnRight();
    });

    socket.on('currentLocation', (payload, callback) => {
        callback(robot.getCurrentLocation())
    })

    socket.on('coordinates', (payload, callback) => {
        callback(robot.coordinates)
    });

    socket.on('block', (data, callback) => {
        const coords = robot.coordinates
        const map_copy = map
        const robot_dir = robot.direction

        const dir_offsets = {
            'север': { front: [0, 1, 0], back: [0, -1, 0], right: [-1, 0, 0], left: [1, 0, 0] },
            'юг': { front: [0, -1, 0], back: [0, 1, 0], right: [1, 0, 0], left: [-1, 0, 0] },
            'восток': { front: [1, 0, 0], back: [-1, 0, 0], right: [0, 1, 0], left: [0, -1, 0] },
            'запад': { front: [-1, 0, 0], back: [1, 0, 0], right: [0, -1, 0], left: [0, 1, 0] }
        };

        if (data.pos === 'under') {
            callback(map_copy[coords[0]][coords[2]][coords[1]-1]);
        }

        if (dir_offsets[robot_dir] && dir_offsets[robot_dir][data.pos]) {
            let [dx, dy, dz] = dir_offsets[robot_dir][data.pos];
            if (data.eyelevel) dz = 1;
            callback(map_copy[coords[0] + dx][coords[2] + dy][coords[1] + dz]);
        }
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        clearInterval(interval);
    });
});

server.listen(3000, () => {
    console.log('server running at http://localhost:3000');
});