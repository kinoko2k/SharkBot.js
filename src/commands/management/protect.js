// sharkbot.py/cogs/mod.py (protect part)
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('protect')
        .setDescription('サーバーの保護設定を行います。')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcmd => 
            subcmd
                .setName('dm')
                .setDescription('DMスパム保護のON/OFFを設定します。')
                .addBooleanOption(option => option.setName('enabled').setDescription('有効にするかどうか').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('invite')
                .setDescription('招待リンク保護のON/OFFを設定します。')
                .addBooleanOption(option => option.setName('enabled').setDescription('有効にするかどうか').setRequired(true))
        ),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const enabled = interaction.options.getBoolean('enabled');

        try {
            const updateData = subcommand === 'dm' ? { protectDm: enabled } : { protectInvite: enabled };

            await client.db.guildSetting.upsert({
                where: { guildId },
                update: updateData,
                create: { guildId, ...updateData }
            });

            const targetName = subcommand === 'dm' ? 'DMスパム保護' : '招待リンク保護';
            const statusStr = enabled ? '有効' : '無効';

            return interaction.editReply({
                embeds: [new EmbedBuilder().setTitle('設定完了').setDescription(`${targetName} を **${statusStr}** にしました。`).setColor('Green')]
            });
        } catch (error) {
            console.error('[ProtectCmd Error]', error);
            return interaction.editReply({ content: '設定の保存に失敗しました。', embeds: [] });
        }
    }
};
