// sharkbot.py/cogs/setting.py
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription('サーバー設定を行います。')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcmd => 
            subcmd.setName('welcome')
                .setDescription('新規メンバー参加時の歓迎メッセージを設定します。')
                .addChannelOption(opt => opt.setName('channel').setDescription('送信先チャンネル').setRequired(true))
                .addStringOption(opt => opt.setName('message').setDescription('メッセージ内容（{user} がメンションに置換されます）').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('leave')
                .setDescription('メンバー退出時のメッセージを設定します。')
                .addChannelOption(opt => opt.setName('channel').setDescription('送信先チャンネル').setRequired(true))
                .addStringOption(opt => opt.setName('message').setDescription('メッセージ内容（{user} が名前に置換されます）').setRequired(true))
        ),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');

        try {
            if (subcommand === 'welcome') {
                await client.db.guildSetting.upsert({
                    where: { guildId },
                    update: { welcomeChannelId: channel.id, welcomeMessage: message },
                    create: { guildId, welcomeChannelId: channel.id, welcomeMessage: message }
                });
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('設定完了').setDescription(`参加メッセージを ${channel} に設定しました。`).setColor('Green')]
                });
            } else if (subcommand === 'leave') {
                await client.db.guildSetting.upsert({
                    where: { guildId },
                    update: { leaveChannelId: channel.id, leaveMessage: message },
                    create: { guildId, leaveChannelId: channel.id, leaveMessage: message }
                });
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('設定完了').setDescription(`退出メッセージを ${channel} に設定しました。`).setColor('Green')]
                });
            }
        } catch (error) {
            console.error('設定コマンドエラー: ', error);
            return interaction.editReply('設定の保存に失敗しました。');
        }
    }
};
