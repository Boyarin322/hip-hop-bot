// userOperations.js
const User = require('./user');

const userOperations = {
    createUser: async (nickname, chatId) => {
        try {
            const user = await User.create({ nickname, chatId});
            console.log('User created:', user.toJSON());
            return user;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    },
    IsUserRegistered: async (chatId)=>{
        try {
            const user = await User.findOne({ where: { chatId: chatId } });
            console.log(user);
            if (user) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            console.error(`Error checking user registration: ${error}, ${chatId}`);
            throw error;
        }

    },

    changeMMR: async (nickname, mmr) => {
        try {
            const user = await User.findOne({ where: { nickname } });
            if (!user) {
                throw new Error('User not found');
            }

            const updatedMMR = Math.max(user.mmr + mmr, 0);
            user.set('mmr', updatedMMR);
            await user.save();

            console.log(`MMR changed for user '${nickname}': ${mmr}`);

            return user;
        } catch (error) {
            console.error('Error changing MMR:', error);
            throw error;
        }
    },

    getAllUsers: async () => {
        try {
            const users = await User.findAll({
                attributes: ['nickname', 'mmr', 'level', 'title', 'chatId'],
            });

            return users.map((user) => {
                const { nickname, mmr, chatId } = user;
                const level = Math.floor(mmr/100); // Access the level property directly
                const title = getTitle(level); // Access the title property directly
                console.log(`User: ${nickname}, MMR: ${mmr}, Level: ${level}, Title: ${title}, ChatId: ${chatId}`);
                return { nickname, mmr, level, title, chatId };
            });
        } catch (error) {
            console.error('Error retrieving users:', error);
            throw error;
        }
    },

};
function getTitle(level) {
    if (level >= 0 && level < 10) {
        return 'Clown';
    } else if (level >= 10 && level < 20) {
        return 'Student';
    } else if (level >= 20 && level < 30) {
        return 'Senior student';
    } else if (level >= 30 && level < 40) {
        return 'Disciple';
    } else if (level >= 40 && level < 50) {
        return 'Bachelor';
    } else if (level >= 50 && level < 60) {
        return 'Master';
    } else if (level >= 60 && level < 70) {
        return 'Aspirant';
    } else if (level >= 70 && level < 80) {
        return 'Dozent';
    } else if (level >= 80 && level < 90) {
        return 'Legend';
    } else if (level >= 90 && level < 100) {
        return 'Godlike';
    } else if (level >= 100) {
        return 'God';
    } else {
        return 'Unknown';
    }
}

module.exports = userOperations;
