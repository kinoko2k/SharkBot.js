// sharkbot.py/cogs/mod.py (note part)
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('note')
        .setDescription('ユーザーのメモを管理します。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcmd => 
            subcmd
                .setName('set')
                .setDescription('ユーザーのメモを追加します。')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('対象のユーザー')
                        .setRequired(true)
                )
                .addStringOption(option => 
                    option.setName('content')
                        .setDescription('メモの内容')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('show')
                .setDescription('ユーザーのメモを確認します。')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('対象のユーザー')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('remove')
                .setDescription('ユーザーのメモを削除します。')
                .addUserOption(option => 
                    option.setName('user')
                        .setDescription('対象のユーザー')
                        .setRequired(true)
                )
                .addIntegerOption(option => 
                    option.setName('note_id')
                        .setDescription('削除するメモのID (省略した場合はすべてのメモを削除します)')
                        .setRequired(false)
                )
        ),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser('user');
        const guildId = interaction.guildId;

        if (subcommand === 'set') {
            const content = interaction.options.getString('content');
            
            await client.db.userNote.create({
                data: {
                    guildId,
                    targetUserId: targetUser.id,
                    authorId: interaction.user.id,
                    content
                }
            });

            return interaction.editReply({
                embeds: [new EmbedBuilder().setTitle('メモを追加しました。').setColor('Green')]
            });
        } 
        else if (subcommand === 'show') {
            const notes = await client.db.userNote.findMany({
                where: { guildId, targetUserId: targetUser.id },
                orderBy: { createdAt: 'asc' }
            });

            if (notes.length === 0) {
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('メモはありません。').setColor('Red')]
                });
            }

            const embed = new EmbedBuilder()
                .setTitle(`${targetUser.tag} のメモ`)
                .setColor('Blue');
            
            notes.forEach((note, index) => {
                const date = note.createdAt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
                embed.addFields({ 
                    name: `[ID: ${note.id}] ${date}`, 
                    value: `<@${note.authorId}>: ${note.content}` 
                });
            });

            return interaction.editReply({ embeds: [embed] });
        }
        else if (subcommand === 'remove') {
            const noteId = interaction.options.getInteger('note_id');

            if (noteId) {
                const deleted = await client.db.userNote.deleteMany({
                    where: { guildId, targetUserId: targetUser.id, id: noteId }
                });

                if (deleted.count > 0) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle(`ID: ${noteId} のメモを削除しました。`).setColor('Green')]
                    });
                } else {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('指定されたIDのメモが見つかりません。').setColor('Red')]
                    });
                }
            } else {
                const deleted = await client.db.userNote.deleteMany({
                    where: { guildId, targetUserId: targetUser.id }
                });

                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle(`${deleted.count}件のメモをすべて削除しました。`).setColor('Green')]
                });
            }
        }
    }
};
