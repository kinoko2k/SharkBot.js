const { Events, ActivityType, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const config = yaml.parse(fs.readFileSync(path.join(__dirname, '../../config.yml'), 'utf8'));

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.clear();

        console.log(`---[Logging]-------------------------------`);
        console.log(`BotName: ${client.user.username}`);
        console.log(`Ready.`);
        
        const isBeta = process.env.ENV_MODE === 'beta';
        
        const updatePresence = () => {
            const guildCount = client.guilds.cache.size;
            const userCount = client.users.cache.size; 
            
            const helpCommand = isBeta ? '!!.help' : '/help';
            const space = isBeta ? ' ' : '  ';

            client.user.setPresence({
                activities: [{ 
                    name: 'Custom Status',
                    type: ActivityType.Custom,
                    state: `${guildCount}鯖 / ${userCount}人${space}| ${helpCommand}`
                }],
                status: 'online',
            });
        };

        updatePresence();
        setInterval(updatePresence, 10 * 1000);
        
        try {
            const channelId = config.startupLogChannelId;
            if (!channelId) {
                console.warn('startupLogChannelId が config.json に設定されていません。起動通知をスキップします。');
            } else {
                const channel = await client.channels.fetch(channelId);
                if (channel && channel.isTextBased()) {
                    const embed = new EmbedBuilder()
                        .setTitle('Botが起動しました。')
                        .setColor('Green')
                        .addFields({ name: '導入サーバー数', value: `${client.guilds.cache.size}サーバー` });
                    
                    await channel.send({ embeds: [embed] });
                }
            }
        } catch (error) {
            console.error('[Error] 起動通知チャンネルの取得・送信に失敗しました:', error);
        }

        try {
            console.log('スラッシュコマンドの登録を開始します...');
            const commandsData = client.commands.map(cmd => cmd.data.toJSON());
            
            await client.application.commands.set(commandsData);
            
            console.log(`[Success] ${commandsData.length}個のスラッシュコマンドの登録が完了しました。`);
        } catch (error) {
            console.error('[Error] スラッシュコマンドの登録中にエラーが発生しました:', error);
        }
    },
};
