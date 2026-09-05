// sharkbot.py/cogs/logging.py
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('logging')
        .setDescription('サーバーのログ出力設定を行います。')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcmd => 
            subcmd.setName('setup')
                .setDescription('ログの出力先チャンネルを設定します。')
                .addChannelOption(opt => opt.setName('channel').setDescription('出力先チャンネル').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('disable')
                .setDescription('ログ出力を無効化します。')
        ),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            if (subcommand === 'setup') {
                const channel = interaction.options.getChannel('channel');

                await client.db.guildSetting.upsert({
                    where: { guildId },
                    update: { logChannelId: channel.id },
                    create: { guildId, logChannelId: channel.id }
                });

                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('設定完了').setDescription(`ログチャンネルを ${channel} に設定しました。`).setColor('Green')]
                });
            } else if (subcommand === 'disable') {
                await client.db.guildSetting.update({
                    where: { guildId },
                    data: { logChannelId: null }
                });

                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('設定完了').setDescription('ログ出力を無効化しました。').setColor('Red')]
                });
            }
        } catch (error) {
            console.error('ログコマンドエラー: ', error);
            return interaction.editReply('設定の保存に失敗しました。');
        }
    }
};
