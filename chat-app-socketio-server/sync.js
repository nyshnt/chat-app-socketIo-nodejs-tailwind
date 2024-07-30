const sequelize = require('./models');
// const Chat = require('./models/chat');
// const ChatRoom = require('./models/chatroom');

(async () => {
    try {
        await sequelize.sync({ force: true }); // Use { force: true } for development only, this will drop tables if they exist
        console.log("All models were synchronized successfully.");
    } catch (error) {
        console.error("Unable to synchronize the models:", error);
    } finally {
        await sequelize.close();
    }
})();
