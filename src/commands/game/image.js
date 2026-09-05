// sharkbot.py/cogs/fun.py
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('画像を取得したり生成したりします。')
        .addSubcommand(subcmd => 
            subcmd
                .setName('cat')
                .setDescription('猫の画像を取得します。')
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('dog')
                .setDescription('犬の画像を取得します。')
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('5000')
                .setDescription('5000兆円ほしい！風の画像を生成します。')
                .addStringOption(option => 
                    option.setName('top')
                        .setDescription('上の文字 (例: 5000兆円)')
                        .setRequired(true)
                )
                .addStringOption(option => 
                    option.setName('bottom')
                        .setDescription('下の文字 (例: 欲しい！)')
                        .setRequired(true)
                )
                .addBooleanOption(option => 
                    option.setName('no_alpha')
                        .setDescription('背景を透過しない場合はTrue')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('textmoji')
                .setDescription('テキストを絵文字風の画像にします。')
                .addStringOption(option => 
                    option.setName('color')
                        .setDescription('文字色')
                        .setRequired(true)
                        .addChoices(
                            { name: '赤', value: 'FF0000' },
                            { name: '青', value: '1111FF' },
                            { name: '黒', value: '000000' }
                        )
                )
                .addStringOption(option => 
                    option.setName('text')
                        .setDescription('画像化するテキスト')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'cat') {
                const response = await axios.get('https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg&format=json&has_breeds=true&order=RANDOM&page=0&limit=1');
                const embed = new EmbedBuilder()
                    .setTitle('🐱 猫の画像')
                    .setColor('Green')
                    .setImage(response.data[0].url);
                return interaction.editReply({ embeds: [embed] });
            } 
            
            else if (subcommand === 'dog') {
                const response = await axios.get('https://dog.ceo/api/breeds/image/random');
                const embed = new EmbedBuilder()
                    .setTitle('🐶 犬の画像')
                    .setColor('Green')
                    .setImage(response.data.message);
                return interaction.editReply({ embeds: [embed] });
            } 
            
            else if (subcommand === '5000') {
                const top = encodeURIComponent(interaction.options.getString('top'));
                const bottom = encodeURIComponent(interaction.options.getString('bottom'));
                const noAlpha = interaction.options.getBoolean('no_alpha');
                
                let url = `https://gsapi.cbrx.io/image?top=${top}&bottom=${bottom}`;
                if (noAlpha) {
                    url += '&noalpha=true';
                }

                const embed = new EmbedBuilder()
                    .setTitle('5000兆円ほしい！')
                    .setColor('Green')
                    .setImage(url);
                return interaction.editReply({ embeds: [embed] });
            } 
            
            else if (subcommand === 'textmoji') {
                const color = interaction.options.getString('color');
                const text = encodeURIComponent(interaction.options.getString('text'));
                
                const url = `https://emoji-gen.ninja/emoji?align=center&back_color=00000000&color=${color}FF&font=notosans-mono-bold&locale=ja&public_fg=true&size_fixed=true&stretch=true&text=${text}`;

                const embed = new EmbedBuilder()
                    .setTitle('テキスト絵文字')
                    .setColor('Green')
                    .setImage(url);
                return interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('画像コマンドのエラー: ', error);
            await interaction.editReply({ content: '画像の取得・生成に失敗しました。', embeds: [] });
        }
    }
};
