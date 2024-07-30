const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Chat = sequelize.define('Chat', {
    firstUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'first_user_id'
    },
    secondUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'second_user_id'
    },
    roomId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'room_id'
    },
    messageType: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'message_type'
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'message'
    },
    createdOn: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_on',
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'chats',
    timestamps: false
});

module.exports = Chat;
