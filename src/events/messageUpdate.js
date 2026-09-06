const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage, client) {
        if (!oldMessage.guild || oldMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // 埋め込み追加などの更新は無視

        try {
            if (!newMessage.author.bot) {
                await client.db.messageEditRanking.upsert({
                    where: { userId: newMessage.author.id },
                    update: { edit_count: { increment: 1 }, name: newMessage.author.username, avatar: newMessage.author.displayAvatarURL() },
                    create: { userId: newMessage.author.id, edit_count: 1, name: newMessage.author.username, avatar: newMessage.author.displayAvatarURL() }
                });
            }

            const settings = await client.db.guildSetting.findUnique({
                where: { guildId: newMessage.guild.id }
            });

            if (!settings || !settings.logChannelId) return;

            const logChannel = oldMessage.guild.channels.cache.get(settings.logChannelId);
            if (!logChannel || !logChannel.isTextBased()) return;

            const embed = new EmbedBuilder()
                .setTitle('メッセージ編集')
                .setColor('Orange')
                .setAuthor({ name: oldMessage.author.tag, iconURL: oldMessage.author.displayAvatarURL() })
                .setDescription(`**チャンネル:** ${oldMessage.channel} [ジャンプ](${newMessage.url})`)
                .addFields(
                    { name: '変更前', value: oldMessage.content || '*内容なし*', inline: false },
                    { name: '変更後', value: newMessage.content || '*内容なし*', inline: false }
                )
                .setFooter({ text: `Message ID: ${newMessage.id}` })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('メッセージ更新エラー: ', error);
        }
    }
};
