const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban, client) {
        if (ban.user.bot) return;
        try {
            await client.db.bANRanking.upsert({
                where: { userId: ban.user.id },
                update: { ban_count: { increment: 1 }, name: ban.user.username, avatar: ban.user.displayAvatarURL() },
                create: { userId: ban.user.id, ban_count: 1, name: ban.user.username, avatar: ban.user.displayAvatarURL() }
            });
        } catch (error) {
            console.error('[GuildBanAdd Error]', error);
        }
    }
};
