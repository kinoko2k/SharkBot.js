// sharkbot.py/cogs/nick.py
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nick')
        .setDescription('ニックネームを編集します。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .addSubcommand(subcmd => 
            subcmd
                .setName('edit')
                .setDescription('メンバーのニックネームを変更します。')
                .addUserOption(option => 
                    option.setName('target')
                        .setDescription('変更するメンバー')
                        .setRequired(true)
                )
                .addStringOption(option => 
                    option.setName('name')
                        .setDescription('新しいニックネーム（空にするとリセット）')
                        .setRequired(false)
                )
        ),
    async execute(interaction) {
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return interaction.reply({ content: 'Botに「ニックネームの管理」権限がありません。', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('target');
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        const newName = interaction.options.getString('name') || '';

        if (!targetMember) {
            return interaction.reply({ content: 'メンバーが見つかりませんでした。', ephemeral: true });
        }

        try {
            await targetMember.setNickname(newName);
            if (newName === '') {
                await interaction.reply({ content: `${targetUser.tag} のニックネームをリセットしました。` });
            } else {
                await interaction.reply({ content: `${targetUser.tag} のニックネームを **${newName}** に変更しました。` });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: '権限が不足しているか、Botより上の役職を持つメンバーのニックネームは変更できません。', ephemeral: true });
        }
    }
};
