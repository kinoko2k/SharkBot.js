require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const { connectDatabase } = require('./config/database');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

client.commands = new Collection();

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const loadCommands = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                loadCommands(fullPath);
            } else if (file.endsWith('.js')) {
                const command = require(fullPath);
                if ('data' in command && 'execute' in command) {
                    client.commands.set(command.data.name, command);
                } else {
                    console.log(`${fullPath} は、data または execute プロパティがありません。`);
                }
            }
        }
    };
    loadCommands(commandsPath);
}

(async () => {
    client.db = await connectDatabase();

    const token = process.env.ENV_MODE === 'beta' ? process.env.BETA_TOKEN : process.env.DISCORD_TOKEN;

    if (!token || token === 'MAIN_BOT_TOKEN') {
        console.error('[ERROR] トークンが設定されていません。.env ファイルを確認してください。');
        process.exit(1);
    }
    await client.login(token);
})();
