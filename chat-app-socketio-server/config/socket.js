const { Server } = require("socket.io")

var io;

module.exports = {
    init: (server, opts) => {
        io = new Server(server, opts)
        return io;
    },
    get: () => {
        if (!io) {
            throw new Error("socket is not initialized");
        }
        return io;
    }
};