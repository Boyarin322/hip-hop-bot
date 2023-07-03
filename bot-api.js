const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot('6161847915:AAGiRwV7ESay48IO45wYjY9sPDBtGB1iWpw', { polling: true });
const sqlite3 = require('sqlite3').verbose();
const dbPath = 'database.db'
const userOps = require('./userOperations')
const User = require('./user');
const db = new sqlite3.Database(dbPath);
//v 0.2

bot.onText(/\/echo (.+)/, (message, match) =>{
    const chatId = message.chat.id;
    const response = match[1];
    bot.sendMessage(chatId, response);
});

let waitingForNickname = false;
let waitingForRequestMMR = false;
bot.onText(/\/start/, (message) => {
    const chatId = message.chat.id;
    bot.sendMessage(chatId, 'Hi, are you new to Hip-Hop? Tell me your nickname and we will register you to our cult')
        .then(() => {
            waitingForNickname = true;
        }).catch(error => {
        bot.sendMessage(chatId, 'Error, try again');
        console.log(`Failed to send message to ${message.from.username}`);
    });
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
        case 'commands':{
            bot.sendMessage(chatId,
                `\t/start = register new user\n
            /menu = check our menu\n
            /add {nickname} {mmr number} = add mmr to chosen user\n
            /reduce {nickname} {mmr number} = reduce mmr from chosen user\n
            /leaderboard = check current leaderboard`);
            break;
        }
        case 'request-mmr': {
            if (!waitingForRequestMMR) {
                waitingForRequestMMR = true;

                bot.sendMessage(chatId, 'Describe your hip-hop achievement in details');

                bot.once('message', async (message) => {
                    const response = message.text;
                    const adminChatId = message.chat.id; // Replace with your admin chat ID
                    console.log(response, adminChatId);
                    await bot.sendMessage(adminChatId, response);

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
        const users = await userOps.getAllUsers();

        // Sort users in descending order based on MMR
        users.sort((x, y) => y.mmr - x.mmr);

        // Format the users data into a table
        const tableRows = users.map((user, index) => {
            const { nickname, mmr, level, title } = user;
            return `${index + 1}. ${nickname} - MMR: ${mmr}, Level: ${level}, Title: ${title}`;
        });
        const table = tableRows.join('\n');

        // Send the table as a message in Telegram
        bot.sendMessage(chatId, `Current leaderboard:\n${table}`);
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
        userOps.createUser(nickname)
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