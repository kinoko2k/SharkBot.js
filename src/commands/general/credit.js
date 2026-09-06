const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credit')
        .setDescription('サーバー内信頼度スコアを管理します。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcmd => 
            subcmd.setName('add')
                .setDescription('サーバー内信頼度スコアを追加します。')
                .addUserOption(opt => opt.setName('member').setDescription('対象メンバー').setRequired(true))
                .addIntegerOption(opt => opt.setName('score').setDescription('追加スコア').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('remove')
                .setDescription('サーバー内信頼度スコアを減らします。')
                .addUserOption(opt => opt.setName('member').setDescription('対象メンバー').setRequired(true))
                .addIntegerOption(opt => opt.setName('score').setDescription('減らすスコア').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('check')
                .setDescription('サーバー内信頼度スコアをチェックします。')
                .addUserOption(opt => opt.setName('member').setDescription('対象メンバー').setRequired(true))
        ),
    async execute(interaction, client) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand(false) || 'add';
        const member = interaction.options.getUser('member');
        const guildId = interaction.guildId;

        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles) && subcommand !== 'check') {
            return interaction.editReply({
                embeds: [new EmbedBuilder().setTitle('サーバー内信頼度スコアを追加できませんでした。').setColor('Red').setDescription('権限エラーです。')]
            });
        }

        try {
            if (subcommand === 'add') {
                const score = interaction.options.getInteger('score');
                const user_data = await client.db.guildCredit.findUnique({
                    where: { guildId_userId: { guildId, userId: member.id } }
                });

                if (user_data) {
                    await client.db.guildCredit.update({
                        where: { guildId_userId: { guildId, userId: member.id } },
                        data: { credit: { increment: score } }
                    });
                } else {
                    await client.db.guildCredit.create({
                        data: { guildId, userId: member.id, credit: score + 100 }
                    });
                }
                
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('サーバー内信頼度スコアを追加しました。').setColor('Green')]
                });
            } 
            else if (subcommand === 'remove') {
                const score = interaction.options.getInteger('score');
                const user_data = await client.db.guildCredit.findUnique({
                    where: { guildId_userId: { guildId, userId: member.id } }
                });

                if (user_data) {
                    await client.db.guildCredit.update({
                        where: { guildId_userId: { guildId, userId: member.id } },
                        data: { credit: { decrement: score } }
                    });
                } else {
                    await client.db.guildCredit.create({
                        data: { guildId, userId: member.id, credit: 100 - score }
                    });
                }
                
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('サーバー内信頼度スコアを減らしました。').setColor('Green')]
                });
            } 
            else if (subcommand === 'check') {
                const user_data = await client.db.guildCredit.findUnique({
                    where: { guildId_userId: { guildId, userId: member.id } }
                });

                if (user_data) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('サーバー内信頼度スコアを参照しました。').setDescription(`${user_data.credit}/100`).setColor('Blue')]
                    });
                } else {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('サーバー内信頼度スコアを参照しました。').setDescription('100/100').setColor('Blue')]
                    });
                }
            }
        } catch (error) {
            console.error('[CreditCmd Error]', error);
            return interaction.editReply({
                embeds: [new EmbedBuilder().setTitle('サーバー内信頼度スコアを変更できませんでした。').setColor('Red').setDescription('エラーが発生しました。')]
            });
        }
    }
};
