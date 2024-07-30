const http = require("http");
const jwt = require("jsonwebtoken");
const express = require('express');
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require('uuid');

const prisma = require('./config/prismaInIt.js');

const app = express();
const server = http.createServer(app);

app.use(function (req, res, next) {
    var origin = req.headers.origin;

    if (typeof origin == "undefined") {
        res.setHeader("Access-Control-Allow-Origin", "*");
    } else {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "X-Requested-With,content-type,Cache-Control, Connection, Cookie,Authorization,token,Accept-Language"
    );

    res.setHeader("credentials", "include");

    res.setHeader("Access-Control-Allow-Credentials", true);

    next();
});

app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.text({ limit: "50mb" }));

const verifyToken = (req, res, next) => {
    const token = req.headers.token;
    if (!token) {
        return res.status(403).send("Token is required for authentication!");
    }
    try {
        const decoded = jwt.verify(token, "test");
        req.user = decoded;
    } catch (err) {
        return res.status(401).send("Invalid Token");
    }
    return next();
};

app.post('/start-chat', verifyToken, async (req, res) => {
    const firstUserId = req.user.uuid;
    const secondUserId = req.body.secondUserId;
    try {
        let chatRoom = await prisma.chatroom.findFirst({
            where: {
                OR: [
                    { firstUserId, secondUserId },
                    { firstUserId: secondUserId, secondUserId: firstUserId }
                ]
            }
        });

        if (!chatRoom) {
            chatRoom = await prisma.chatroom.create({
                data: {
                    firstUserId,
                    secondUserId,
                    roomId: uuidv4(),
                    createdOn: new Date()
                }
            });
        }

        res.json(chatRoom);
    } catch (error) {
        console.error("Error finding or creating chat room:", error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/previous-chats', async (req, res) => {
    const { roomId } = req.body;
    try {
        const chats = await prisma.chats.findMany({
            where: { chatRoomId: roomId },
            orderBy: { createdOn: 'asc' },
        });
        res.json(chats);
    } catch (error) {
        console.error("Error fetching chats:", error);
        res.status(500).json({ error: 'An error occurred while fetching chats.' });
    }
});

server.listen(3000, () => {
    console.log("Server started running on " + 3000);
});

const io = require('./config/socket.js').init(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        jwt.verify(token, "test", function (err, decoded) {
            if (err) {
                console.error('Token verification error:', err);
                return next(new Error('Authentication error'));
            }
            socket.decoded = decoded;
            next();
        });
    } else {
        console.error('No token provided');
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    socket.on('joinRoom', (data) => {
        const { rId, name } = data;
        socket.join(rId);
        console.log("User joinded ", rId)
        io.to(rId).emit('message', `${name} joined room ${rId}`);
    });

    socket.on('message', async (value) => {
        const firstUserId = value.sender;
        const secondUserId = value.receiver;
        const message = value.message;
        const roomId = value.room;


        try {
            await prisma.chats.create({
                data: {
                    firstUserId,
                    secondUserId,
                    message,
                    chatRoomId: roomId,
                    createdOn: new Date()
                }
            });

            const makeObj = {
                message: message,
                room: roomId,
                sender: firstUserId,
                receiver: secondUserId,
            };

            console.log("Room :", value.room)
            console.log("Obj :", makeObj)
            io.to(value.room).emit('received', makeObj);
            console.log("Message emitted to room :", value.room)
        } catch (error) {
            console.error("Error saving chat:", error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});
