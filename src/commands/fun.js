// sharkbot.py/cogs/fun.py
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fun')
        .setDescription('おもしろ・便利機能')
        .addSubcommand(subcmd => 
            subcmd
                .setName('random_color')
                .setDescription('ランダムな色を生成します。')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'random_color') {
            const randomColor = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
            const hex = `#${randomColor}`;
            
            const embed = new EmbedBuilder()
                .setTitle(`ランダムカラー: ${hex}`)
                .setColor(hex)
                .setImage(`https://dummyimage.com/200x200/${randomColor}/${randomColor}.png`);
            
            await interaction.reply({ embeds: [embed] });
        }
    }
};
