// sharkbot.py/cogs/tools.py
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tools')
        .setDescription('便利なツールキット')
        .addSubcommand(subcmd => 
            subcmd
                .setName('hello')
                .setDescription('今日が始まってから何時間経ったかを計測します。')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'hello') {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const diffMs = now.getTime() - startOfDay.getTime();
            const diffHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
            
            await interaction.reply(`今日が始まってから約 **${diffHours}時間** 経過しました！`);
        }
    }
};
