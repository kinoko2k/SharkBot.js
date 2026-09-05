const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.MessageDelete,
    async execute(message, client) {
        if (!message.guild || message.author?.bot) return;

        try {
            const settings = await client.db.guildSetting.findUnique({
                where: { guildId: message.guild.id }
            });

            if (!settings || !settings.logChannelId) return;

            const logChannel = message.guild.channels.cache.get(settings.logChannelId);
            if (!logChannel || !logChannel.isTextBased()) return;

            const embed = new EmbedBuilder()
                .setTitle('メッセージ削除')
                .setColor('Red')
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setDescription(`**チャンネル:** ${message.channel}\n**内容:**\n${message.content || '*内容なし*'}`)
                .setFooter({ text: `Message ID: ${message.id}` })
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('メッセージ削除エラー: ', error);
        }
    }
};
