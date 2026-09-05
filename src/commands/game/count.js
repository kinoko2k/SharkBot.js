// sharkbot.py/cogs/count.py
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { setCountingData, deleteCountingData, getCountingData } = require('../utils/dbHelper');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('count')
        .setDescription('カウントゲームをします。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcmd => 
            subcmd
                .setName('setup')
                .setDescription('このチャンネルでカウントゲームを開始します。')
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('disable')
                .setDescription('カウントゲームを終了します。')
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('skip')
                .setDescription('カウントゲームの現在の数字を設定します。')
                .addIntegerOption(option => 
                    option.setName('number')
                        .setDescription('現在の数字')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('reset')
                .setDescription('カウントゲームをリセットして1からにします。')
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('settings')
                .setDescription('カウントゲームの詳細設定をします。')
                .addBooleanOption(option => 
                    option.setName('no_reset')
                        .setDescription('間違えたときにリセットしないかどうか')
                        .setRequired(true)
                )
        ),
    async execute(interaction, client) {
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const channelId = interaction.channelId;
        const dbType = process.env.DB_TYPE || 'sqlite';

        await interaction.deferReply();

        if (subcommand === 'setup') {
            await setCountingData(client.db, dbType, guildId, channelId, { now: 0, resetOnMistake: true });
            const embed = new EmbedBuilder()
                .setTitle('カウントをセットアップしました。')
                .setDescription('1から数えてみよう！')
                .setColor('Green');
            return interaction.editReply({ embeds: [embed] });
        }

        const currentData = await getCountingData(client.db, dbType, guildId, channelId);
        if (!currentData && subcommand !== 'setup') {
            return interaction.editReply({ 
                embeds: [new EmbedBuilder().setTitle('このチャンネルではカウントは有効ではありません。').setColor('Red')]
            });
        }

        if (subcommand === 'disable') {
            await deleteCountingData(client.db, dbType, guildId, channelId);
            return interaction.editReply({ 
                embeds: [new EmbedBuilder().setTitle('カウントを無効化しました。').setColor('Red')] 
            });
        } else if (subcommand === 'skip') {
            const num = interaction.options.getInteger('number');
            await setCountingData(client.db, dbType, guildId, channelId, { ...currentData, now: num });
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle('カウントゲームの現在の数字を変更しました。')
                    .setDescription(`次は ${num + 1} からカウントしましょう！`)
                    .setColor('Green')]
            });
        } else if (subcommand === 'reset') {
            await setCountingData(client.db, dbType, guildId, channelId, { ...currentData, now: 0 });
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle('カウントゲームの現在の数字をリセットしました。')
                    .setDescription('次は 1 からカウントしましょう！')
                    .setColor('Green')]
            });
        } else if (subcommand === 'settings') {
            const noReset = interaction.options.getBoolean('no_reset');
            await setCountingData(client.db, dbType, guildId, channelId, { ...currentData, resetOnMistake: !noReset });
            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle('カウントゲームの設定を変更しました。')
                    .setDescription(`間違えたときのリセット: ${!noReset ? '有効' : '無効'}`)
                    .setColor('Green')]
            });
        }
    }
};
