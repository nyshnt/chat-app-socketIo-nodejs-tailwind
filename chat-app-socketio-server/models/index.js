const { Sequelize } = require('sequelize');

// Initialize Sequelize
const sequelize = new Sequelize('postgres', 'postgres', 'postgres', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
});

// Test the connection
sequelize.authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

module.exports = sequelize;
