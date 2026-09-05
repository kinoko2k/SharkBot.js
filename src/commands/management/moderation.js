// sharkbot.py/cogs/mod.py
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderation')
        .setDescription('モデレーション管理を行います。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcmd => 
            subcmd.setName('warn')
                .setDescription('ユーザーに警告を与えます。')
                .addUserOption(opt => opt.setName('user').setDescription('対象ユーザー').setRequired(true))
                .addStringOption(opt => opt.setName('reason').setDescription('理由').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('history')
                .setDescription('ユーザーの警告履歴を確認します。')
                .addUserOption(opt => opt.setName('user').setDescription('対象ユーザー').setRequired(true))
        ),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: false });
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;
        const targetUser = interaction.options.getUser('user');

        try {
            if (subcommand === 'warn') {
                const reason = interaction.options.getString('reason');

                await client.db.warning.create({
                    data: {
                        guildId,
                        targetUserId: targetUser.id,
                        moderatorId: interaction.user.id,
                        reason
                    }
                });

                const count = await client.db.warning.count({
                    where: { guildId, targetUserId: targetUser.id }
                });

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('警告')
                        .setDescription(`${targetUser} に警告を与えました。 (現在の累積警告数: **${count}**回)`)
                        .addFields({ name: '理由', value: reason })
                        .setColor('Red')
                    ]
                });
            } else if (subcommand === 'history') {
                const warnings = await client.db.warning.findMany({
                    where: { guildId, targetUserId: targetUser.id },
                    orderBy: { createdAt: 'desc' },
                    take: 10
                });

                if (warnings.length === 0) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('警告履歴なし').setDescription(`${targetUser.tag} には警告履歴がありません。`).setColor('Green')]
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle(`${targetUser.tag} の警告履歴 (直近10件)`)
                    .setColor('Orange');

                warnings.forEach((warn, index) => {
                    const date = warn.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
                    embed.addFields({
                        name: `[ID: ${warn.id}] ${date}`,
                        value: `実行者: <@${warn.moderatorId}>\n理由: ${warn.reason}`
                    });
                });

                return interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('モデレーターコマンドエラー: ', error);
            return interaction.editReply('エラーが発生しました。');
        }
    }
};
