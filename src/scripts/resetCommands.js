require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const token = process.env.ENV_MODE === 'beta' ? process.env.BETA_TOKEN : process.env.DISCORD_TOKEN;

if (!token || token === 'MAIN_BOT_TOKEN') {
    console.error('トークンが設定されていません。.env ファイルを確認してください。');
    process.exit(1);
}

client.once('ready', async () => {
    try {
        console.log(`ログイン成功: ${client.user.tag}`);
        console.log('スラッシュコマンドのリセット（削除）を開始します...');
        
        await client.application.commands.set([]);
        
        console.log('グローバルコマンドの削除が完了しました！');
        
        const guildId = 'YOUR_GUILD_ID';
        await client.application.commands.set([], guildId);
        console.log(`サーバー(${guildId})のコマンド削除が完了しました！`);


        console.log('リセット作業が完了したため、プロセスを終了します。');
        process.exit(0);
    } catch (error) {
        console.error('エラーが発生しました:', error);
        process.exit(1);
    }
});

client.login(token);
