const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member, client) {
        try {
            const settings = await client.db.guildSetting.findUnique({
                where: { guildId: member.guild.id }
            });

            if (!settings || !settings.leaveChannelId) return;

            const channel = member.guild.channels.cache.get(settings.leaveChannelId);
            if (!channel || !channel.isTextBased()) return;

            const message = settings.leaveMessage || '{user} さんが退出しました。';
            const formattedMessage = message.replace(/{user}/g, member.user.username);

            await channel.send({ content: formattedMessage });
        } catch (error) {
            console.error('leaveメッセージエラー: ', error);
        }
    }
};
