// sharkbot.py/cogs/time_signal.py
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getClosestMessage, getRandomTopic } = require('../tasks/timeSignalTask');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('time-signal')
        .setDescription('時報・お題を通知するチャンネルを設定します。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(subcmd => 
            subcmd
                .setName('setup')
                .setDescription('このチャンネルを時報チャンネルとして設定します。')
                .addChannelOption(option => option.setName('channel').setDescription('設定するチャンネル（省略時は現在のチャンネル）').setRequired(false))
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('remove')
                .setDescription('このサーバーの時報設定を解除します。')
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('send')
                .setDescription('一時的に一番近い時報とお題を表示します。')
        ),
    async execute(interaction, client) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            if (subcommand === 'setup') {
                const targetChannel = interaction.options.getChannel('channel') || interaction.channel;

                await client.db.timeSignal.upsert({
                    where: { guildId },
                    update: { channelId: targetChannel.id },
                    create: { guildId, channelId: targetChannel.id }
                });

                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('設定完了').setDescription(`時報チャンネルを ${targetChannel} に設定しました。`).setColor('Green')]
                });
            } 
            else if (subcommand === 'remove') {
                try {
                    await client.db.timeSignal.delete({ where: { guildId } });
                } catch (e) {
                    // 存在しない場合は無視
                }
                
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('設定解除').setDescription('時報チャンネルの設定を削除しました。').setColor('Red')]
                });
            } 
            else if (subcommand === 'send') {
                const msg = getClosestMessage();
                const topic = getRandomTopic();

                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder().setTitle('時報').setDescription(msg).setColor('Blue'),
                        new EmbedBuilder().setTitle('お題').setDescription(topic).setColor('Blue')
                    ]
                });
            }
        } catch (error) {
            console.error('[TimeSignalCmd Error]', error);
            return interaction.editReply({ content: '設定の保存に失敗しました。', embeds: [] });
        }
    }
};
