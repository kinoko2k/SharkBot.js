const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member, client) {
        try {
            const settings = await client.db.guildSetting.findUnique({
                where: { guildId: member.guild.id }
            });

            if (!settings || !settings.welcomeChannelId) return;

            const channel = member.guild.channels.cache.get(settings.welcomeChannelId);
            if (!channel || !channel.isTextBased()) return;

            const message = settings.welcomeMessage || '{user} さん、ようこそ！';
            const formattedMessage = message.replace(/{user}/g, `<@${member.id}>`);

            await channel.send({ content: formattedMessage });
        } catch (error) {
            console.error('welcomeメッセージエラー: ', error);
        }
    }
};
