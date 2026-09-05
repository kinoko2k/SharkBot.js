// sharkbot.py/cogs/greeting.py
const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('greeting')
        .setDescription('一日の終わりのあいさつをします。'),
    async execute(interaction) {
        await interaction.deferReply();
        
        try {
            const dt = new Date();
            const year = dt.getFullYear();
            const month = dt.getMonth() + 1;
            const day = dt.getDate();

            const response = await axios.get('https://www3.nhk.or.jp/news/');
            const $ = cheerio.load(response.data);
            
            const titleElement = $('h1.content--header-title').first();
            const url = titleElement.find('a').attr('href');
            
            let message = `今日も一日お疲れ様でした！\n今日は、${year}年${month}月${day}日です！`;
            if (url) {
                const fullUrl = url.startsWith('http') ? url : `https://www3.nhk.or.jp${url}`;
                message += `\n${fullUrl}`;
            }
            
            await interaction.editReply(message);
        } catch (error) {
            console.error('[NHK Error] ニュースの取得に失敗しました:', error);
            await interaction.editReply('ニュースの取得に失敗しましたが、今日も一日お疲れ様でした！');
        }
    }
};
