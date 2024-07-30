const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const ChatRoom = sequelize.define('ChatRoom', {
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
    createdOn: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_on',
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'chat_rooms',
    timestamps: false
});

module.exports = ChatRoom;
