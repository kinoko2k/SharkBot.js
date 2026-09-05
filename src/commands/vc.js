// sharkbot.py/cogs/vc.py
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vc')
        .setDescription('VCの管理機能です。')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addSubcommand(subcmd => 
            subcmd
                .setName('move')
                .setDescription('指定したVC内の全員を別のVCへ一括移動させます。')
                .addChannelOption(option => 
                    option.setName('from')
                        .setDescription('移動元のボイスチャンネル')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice)
                )
                .addChannelOption(option => 
                    option.setName('to')
                        .setDescription('移動先のボイスチャンネル')
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildVoice)
                )
        ),
    async execute(interaction) {
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return interaction.reply({ content: 'Botに「メンバーを移動」権限がありません。', ephemeral: true });
        }

        const fromChannel = interaction.options.getChannel('from');
        const toChannel = interaction.options.getChannel('to');

        if (fromChannel.id === toChannel.id) {
            return interaction.reply({ content: '移動元と移動先が同じチャンネルです。', ephemeral: true });
        }

        const membersToMove = fromChannel.members;

        if (membersToMove.size === 0) {
            return interaction.reply({ content: '移動元のチャンネルには誰もいません。', ephemeral: true });
        }

        await interaction.deferReply();

        let movedCount = 0;
        let errorCount = 0;

        for (const [memberId, member] of membersToMove) {
            try {
                await member.voice.setChannel(toChannel);
                movedCount++;
            } catch (err) {
                console.error(err);
                errorCount++;
            }
        }

        await interaction.editReply(`✅ **${movedCount}人** のメンバーを \`${fromChannel.name}\` から \`${toChannel.name}\` へ移動しました！` + (errorCount > 0 ? `\n⚠️ ${errorCount}人の移動に失敗しました。` : ''));
    }
};
