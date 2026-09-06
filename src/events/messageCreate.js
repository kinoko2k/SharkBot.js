const { Events, EmbedBuilder } = require('discord.js');
const { getCountingData, setCountingData } = require('../utils/dbHelper');

const cooldowns = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        if (message.author.bot) return;

        const dbType = process.env.DB_TYPE || 'sqlite';
        const guildId = message.guildId;
        const channelId = message.channel.id;
        if (!message.author.bot && message.mentions.users.size > 0) {
            await client.db.mentionRanking.upsert({
                where: { userId: message.author.id },
                update: { count: { increment: 1 } },
                create: { userId: message.author.id, count: 1 }
            }).catch(()=>{});
        }

        if (message.author.id === '302050872383242240') {
            if (message.embeds.length > 0 && message.embeds[0].description && message.embeds[0].description.includes('表示順をアップ')) {
                const bumerId = message.interaction ? message.interaction.user.id : null;
                if (bumerId) {
                    await client.db.bumpRanking.upsert({
                        where: { userId: bumerId },
                        update: { bump_count: { increment: 1 } },
                        create: { userId: bumerId, bump_count: 1 }
                    }).catch(()=>{});
                }
            }
        }

        if (guildId) {
            try {
                const setting = await client.db.levelingSetting.findUnique({ where: { guildId } });
                if (setting) {
                    const xpGain = Math.floor(Math.random() * 3); // 0 ~ 2 XP
                    
                    const userLevel = await client.db.userLevel.findUnique({
                        where: { guildId_userId: { guildId, userId: message.author.id } }
                    }) || { guildId, userId: message.author.id, level: 0, xp: 1 };
                    
                    userLevel.xp += xpGain;

                    const timingSetting = await client.db.levelingUpTiming.findUnique({ where: { guildId } });
                    const tm = timingSetting ? timingSetting.timing : 100;

                    if (userLevel.xp > tm) {
                        userLevel.level += 1;
                        userLevel.xp = 0;
                        
                        await client.db.userLevel.upsert({
                            where: { guildId_userId: { guildId, userId: message.author.id } },
                            update: { xp: userLevel.xp, level: userLevel.level },
                            create: { guildId, userId: message.author.id, xp: userLevel.xp, level: userLevel.level }
                        });

                        const roleData = await client.db.levelingUpRole.findUnique({
                            where: { guildId_level: { guildId, level: userLevel.level } }
                        });
                        if (roleData && roleData.roleId) {
                            const role = message.guild.roles.cache.get(roleData.roleId);
                            if (role) await message.member.roles.add(role).catch(()=>{});
                        }

                        const alertChannelData = await client.db.levelingUpAlertChannel.findUnique({ where: { guildId } });
                        if (alertChannelData && alertChannelData.channelId) {
                            const alertChannel = message.guild.channels.cache.get(alertChannelData.channelId);
                            if (alertChannel) {
                                await alertChannel.send({
                                    embeds: [new EmbedBuilder().setTitle(`\`${message.author.username}\`さんの\nレベルが${userLevel.level}になったよ！`).setColor('Gold')]
                                }).catch(()=>{});
                            }
                        } else {
                            await message.reply(`レベルが「${userLevel.level}レベル」になったよ！`).catch(()=>{});
                        }
                    } else {
                        await client.db.userLevel.upsert({
                            where: { guildId_userId: { guildId, userId: message.author.id } },
                            update: { xp: userLevel.xp, level: userLevel.level },
                            create: { guildId, userId: message.author.id, xp: userLevel.xp, level: userLevel.level }
                        });
                    }
                }
            } catch (err) {
                console.error('[XP Gain Error]', err);
            }
        }

        const countData = await getCountingData(client.db, dbType, guildId, channelId).catch(() => null);
        if (!countData) return;

        const numPattern = /^\d+$/;
        if (!numPattern.test(message.content.trim())) {
            return;
        }

        const inputNumber = parseInt(message.content.trim(), 10);

        const now = Date.now();
        const lastMessageTime = cooldowns.get(guildId) || 0;
        if (now - lastMessageTime < 1000) return;
        cooldowns.set(guildId, now);

        const expectedNumber = (countData.now || 0) + 1;

        if (inputNumber !== expectedNumber) {
            if (countData.resetOnMistake !== false) {
                await message.reply({ 
                    embeds: [new EmbedBuilder().setTitle('カウントに失敗しました・・').setDescription('1から数えなおそう！').setColor('Red')] 
                });
                await setCountingData(client.db, dbType, guildId, channelId, { ...countData, now: 0 });
            } else {
                await message.reply({ 
                    embeds: [new EmbedBuilder().setTitle('カウントに失敗しました・・').setDescription('気にしないで！\n続きから数えよう！').setColor('Red')] 
                });
            }
            return;
        }

        await setCountingData(client.db, dbType, guildId, channelId, { ...countData, now: inputNumber });
        await message.react('✅').catch(() => {});
    }
};
