const { Events, EmbedBuilder } = require('discord.js');
const { getCountingData, setCountingData } = require('../utils/dbHelper');

const cooldowns = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        const dbType = process.env.DB_TYPE || 'sqlite';
        const guildId = message.guildId;
        const channelId = message.channel.id;

        const countData = await getCountingData(client.db, dbType, guildId, channelId).catch(() => null);
        if (!countData) return;

        const numPattern = /^\d+$/;
        if (!numPattern.test(message.content.trim())) {
            return;
        }

        const inputNumber = parseInt(message.content.trim(), 10);

        const now = Date.now();
        const lastMessageTime = cooldowns.get(guildId) || 0;
        if (now - lastMessageTime < 1000) return;
        cooldowns.set(guildId, now);

        const expectedNumber = (countData.now || 0) + 1;

        if (inputNumber !== expectedNumber) {
            if (countData.resetOnMistake !== false) {
                await message.reply({ 
                    embeds: [new EmbedBuilder().setTitle('カウントに失敗しました・・').setDescription('1から数えなおそう！').setColor('Red')] 
                });
                await setCountingData(client.db, dbType, guildId, channelId, { ...countData, now: 0 });
            } else {
                await message.reply({ 
                    embeds: [new EmbedBuilder().setTitle('カウントに失敗しました・・').setDescription('気にしないで！\n続きから数えよう！').setColor('Red')] 
                });
            }
            return;
        }

        await setCountingData(client.db, dbType, guildId, channelId, { ...countData, now: inputNumber });
        await message.react('✅').catch(() => {});
    }
};
