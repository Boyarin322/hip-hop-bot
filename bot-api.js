const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot('6161847915:AAGiRwV7ESay48IO45wYjY9sPDBtGB1iWpw', { polling: true });
const sqlite3 = require('sqlite3').verbose();
const dbPath = 'database.db'
const userOps = require('./userOperations')
const User = require('./user');
const db = new sqlite3.Database(dbPath);
//v 0.8

const adminChatId = '714447767'; //should be Bogdan

bot.onText(/\/echo (.+)/, (message, match) =>{
    const chatId = message.chat.id;
    const response = match[1];
    bot.sendMessage(chatId, response);
});

//todo: Change it, it is complete BS
let waitingForNickname = false;
let waitingForRequestMMR = false;
bot.onText(/\/start/, async (message) => {
    const chatId = message.chat.id;
    const isUserRegistered = await userOps.IsUserRegistered(chatId);

    if (!isUserRegistered) {
        bot.sendMessage(chatId, 'Hi, are you new to Hip-Hop? Tell me your nickname and we will register you to our cult')
            .then(() => {
                waitingForNickname = true;
            }).catch(error => {
            bot.sendMessage(chatId, 'Error, try again');
            console.log(`Failed to send message to ${message.from.username}: ${error}`);
        });
    }
    else {
       await bot.sendMessage(chatId, 'Sorry, you already registered');
    }
});

bot.onText(/\/menu/, (message) =>{
    const chatId = message.chat.id;

    const menu = {
        disable_notification: true,
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Profile', callback_data: 'profile' }],
                //todo: Create commands in menu, so user can acces it via buttons, not writting commands
                [{ text: 'Commands', callback_data: 'commands' }],
                [{ text: 'Request MMR', callback_data: 'request-mmr' }],
                [{text: 'Send report', callback_data: 'send-report'}]
            ]
        }
    };
    bot.sendMessage(chatId, 'Choose an option:', menu);
})
bot.on('callback_query', (callbackQuery)=>{
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    switch (data){
        case 'profile':{
            //todo: In order to do this, we need to create registration logic and keep user in session memory

            bot.sendMessage(chatId, 'This function is currently unavailable. We sincerely apologise');
            break;
        }
        case 'commands': {
            const message = `
Available commands:

/start - register new user
/menu - check our menu
/add {nickname} {mmr number} - add MMR to chosen user
/reduce {nickname} {mmr number} - reduce MMR from chosen user
/leaderboard - check current leaderboard
/ban {user id} {user chat id} - ban selected user
`;

            bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            break;
        }

        case 'send-report':{
            bot.sendMessage(chatId, 'Please tell us what do you want to report in maximum details');
            bot.once('message', async (message) =>{
                const response = message.text;
                console.log(response);
                await bot.sendMessage(adminChatId,
                    `MMR Request:${response}
                        \nUser Chat ID: ${chatId}
                        \nUsername: ${message.from.username}
                        \nUser ID:${message.from.id}`);
                await bot.sendMessage(chatId,'Thanks for cooperation. You may get additional MMR for this)')
            })
            break;
        }
        case 'request-mmr': {
            if (!waitingForRequestMMR) {
                waitingForRequestMMR = true;

                bot.sendMessage(chatId, 'Describe your hip-hop achievement in details');

                bot.once('message', async (message) => {
                    const response = message.text;

                    console.log(response, chatId);
                    await bot.sendMessage(adminChatId,
                        `MMR Request:${response}
                        \nUser Chat ID: ${chatId}
                        \nUsername: ${message.from.username}
                        \nUser ID:${message.from.id}`);
                    await bot.sendMessage(chatId, 'Thanks for submitting. Our admin will review it soon');


                    await bot.sendMessage(chatId, 'Do you have any photo proof or video proof? If not, type anything');
                    bot.once('message', async (message) => {
                        if (message.photo && message.photo.length > 0) {
                            // Handle the photo
                            const photo = message.photo[0];
                            const photoId = photo.file_id;

                            // Send the photo to the admin
                            await bot.sendPhoto(adminChatId, photoId)
                                .then(() => bot.sendMessage(chatId, 'Photo sent to admin.'))
                                .catch(() => bot.sendMessage(chatId, 'Fail to process the photo'));
                        } else if (message.video){
                            //Handle the video
                            const videoId = message.video.file_id;
                            console.log(videoId, message);
                            await bot.sendVideo(adminChatId, videoId)
                                .then(() => {
                                    bot.sendMessage(chatId, 'Video sent to admin');
                                })
                                .catch(() => {
                                    bot.sendMessage(chatId, 'Fail to process the video');
                                });

                        }
                        else {
                            await bot.sendMessage(chatId, 'No photo/video provided. You will get lower amount of MMR');
                        }
                    });
                    waitingForRequestMMR = false;
                });
            }
            break;

        }
    }
})
bot.onText(/\/reduce (.+) (\d+)/, (message, match) => {
    const chatId = message.chat.id;
    const nickname = match[1];
    const mmr = parseInt(match[2]);

    if (Number.isNaN(mmr)) {
        bot.sendMessage(chatId, `Invalid MMR value. Please provide a valid number.`);
        return;
    }

    userOps.changeMMR(nickname, -Math.abs(mmr))  // Pass the MMR as a positive value
        .then(() => {
            bot.sendMessage(chatId, `Successfully reduced ${mmr} MMR from ${nickname}.`);
        })
        .catch(error => {
            bot.sendMessage(chatId, `Error reducing MMR: ${error.message}`);
        });
});
bot.onText(/\/ban (.+) (.+)/, (message, match) => {
    //todo: Needed to be tested
    const chatId = message.chat.id;
    const userId = match[1];
    const userChatId = match[2];

    bot.banChatMember(userChatId, userId)
        .then(() => {
            console.log(`Banned user ${userId} from chat ${chatId}`);
            bot.sendMessage(chatId, `User ${userId} has been banned.`);
        })
        .catch((error) => {
            console.error(`Error banning user ${userId} from chat ${chatId}: ${error}`);
            bot.sendMessage(chatId, `Failed to ban user ${userId}. Please try again.`);
        });
});

bot.onText(/\/add (.+) (\d+)/, async (message, match) => {
    const chatId = message.chat.id;
    const nickname = match[1];
    const mmr = parseInt(match[2]);

    if (Number.isNaN(mmr)) {
        bot.sendMessage(chatId, `Invalid MMR value. Please provide a valid number.`);
        return;
    }

    try {
        await userOps.changeMMR(nickname, mmr);
        bot.sendMessage(chatId, `Successfully added ${mmr} MMR to ${nickname}.`);
    } catch (error) {
        bot.sendMessage(chatId, `Error adding MMR: ${error.message}`);
    }
});
bot.onText(/\/leaderboard/, async (message) => {
    const chatId = message.chat.id;

    try {
        // Retrieve all users from the database
        let users = await userOps.getAllUsers();
        let legendary = [];
        let university = [];
        let school = [];

        // Sort users in descending order based on MMR
        users.sort((x, y) => y.mmr - x.mmr);

        //sort users for each tier
        for (let i = 0; i < users.length; i++) {
            const user = users[i];

            if (user.mmr >= 7000 && legendary.length < 10) {
                legendary.push(user);
            } else if (user.mmr >= 4000 && user.mmr < 7000 && university.length < 10) {
                university.push(user);
            } else if (school.length < 10) {
                school.push(user);
            }

            // Check if all tiers have the desired number of users
            if (legendary.length === 10 && university.length === 10 && school.length === 10) {
                // Exit the loop once the desired number of users for each tier is collected
                break;
            }
        }
        // Format the users data into tables for each tier
        const tableRowsLegendary = legendary.map((user, index) => {
            const { nickname, mmr, level, title, chatId } = user;
            return `${index + 1}. ${nickname} - MMR: ${mmr}, Level: ${level}, Title: ${title} ${chatId}`;
        });

        const tableRowsUniversity = university.map((user, index) => {
            const { nickname, mmr, level, title, chatId} = user;
            return `${index + 1}. ${nickname} - MMR: ${mmr}, Level: ${level}, Title: ${title} ${chatId}`;
        });

        const tableRowsSchool = school.map((user, index) => {
            const { nickname, mmr, level, title, chatId } = user;
            return `${index + 1}. ${nickname} - MMR: ${mmr}, Level: ${level}, Title: ${title} ${chatId}`;
        });

        // Join the table rows for each tier
        const tableLegendary = tableRowsLegendary.join('\n');
        const tableUniversity = tableRowsUniversity.join('\n');
        const tableSchool = tableRowsSchool.join('\n');

        // Print the tables for each tier
        await bot.sendMessage(chatId, `Legendary tier:\n${tableLegendary}`)
        await bot.sendMessage(chatId, `University tier:\n${tableUniversity}`)
        await bot.sendMessage(chatId, `School tier:\n${tableSchool}`)
    } catch (error) {
        console.error('Error retrieving users:', error);
        bot.sendMessage(chatId, 'Failed to retrieve leaderboard. Please try again.');
    }
});

bot.on('message', (message) => {
    const chatId = message.chat.id;

    if (waitingForNickname) {
        waitingForNickname = false;

        const nickname = message.text;
        console.log('Nickname:', nickname);

        // Perform any actions or logic with the captured nickname here
        userOps.createUser(nickname, chatId)
            .then(() => {
                // Reply with a confirmation or further instructions
                bot.sendMessage(chatId, `Great! Welcome to Hip-Hop Club, ${nickname}!
                \nNext, input /menu for further steps
                \nOr check the current leaderboard /leaderboard
                \nAlso, to add hip-hop MMR to someone, type /add {nickname} {mmr}`);
            })
            .catch(() => {
                bot.sendMessage(chatId, 'Failed to register user. Please try again.');
            });
    }
});