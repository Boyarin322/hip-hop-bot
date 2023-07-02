const Sequelize = require('sequelize');

// Create a new Sequelize instance
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.db'
});

// Define the User model (assuming the code is similar to what we have in the user.js file)
const User = require('./user');

// Sync the models with the database
sequelize.sync()
    .then(() => {
        console.log('Tables created successfully');
        // You can start using the models here
    })
    .catch(error => {
        console.error('Error creating tables:', error);
    });

module.exports = sequelize;
