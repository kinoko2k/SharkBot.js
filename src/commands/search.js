// sharkbot.py/cogs/search.py
const { SlashCommandBuilder, EmbedBuilder, time } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('情報検索機能')
        .addSubcommand(subcmd => 
            subcmd
                .setName('user')
                .setDescription('指定したユーザーの詳細情報を表示します。')
                .addUserOption(option => 
                    option.setName('target')
                        .setDescription('情報を確認したいユーザー')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('target');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        const embed = new EmbedBuilder()
            .setTitle(`${targetUser.tag} の情報`)
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor('Blurple')
            .addFields(
                { name: '👤 ユーザーID', value: targetUser.id, inline: true },
                { name: '🤖 Botか？', value: targetUser.bot ? 'はい' : 'いいえ', inline: true },
                { name: '📅 アカウント作成日時', value: time(targetUser.createdAt, 'F'), inline: false }
            );

        if (targetMember) {
            embed.addFields(
                { name: '📥 サーバー参加日時', value: time(targetMember.joinedAt, 'F'), inline: false },
                { name: '🏷️ ニックネーム', value: targetMember.nickname || 'なし', inline: true },
                { name: '👑 最上位ロール', value: targetMember.roles.highest.name, inline: true }
            );
        } else {
            embed.setFooter({ text: '※このユーザーは現在のサーバーに参加していません。' });
        }

        await interaction.reply({ embeds: [embed] });
    }
};
