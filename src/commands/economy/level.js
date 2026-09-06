const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('レベルを有効化&無効化します。')
        .addSubcommand(subcmd => 
            subcmd.setName('setting')
                .setDescription('レベル機能を有効化・無効化します。')
        )
        .addSubcommand(subcmd => 
            subcmd.setName('show')
                .setDescription('レベルを見ます。')
                .addUserOption(opt => opt.setName('user').setDescription('確認するユーザー（省略時は自分）'))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('channel')
                .setDescription('レベルアップの通知のチャンネルを設定します。')
                .addChannelOption(opt => opt.setName('channel').setDescription('通知先チャンネル（省略時は削除）'))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('role')
                .setDescription('特定のレベルになるとロールを付けます。')
                .addIntegerOption(opt => opt.setName('level').setDescription('レベル').setRequired(true))
                .addRoleOption(opt => opt.setName('role').setDescription('付与するロール（省略時は削除）'))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('edit')
                .setDescription('レベルを編集します。')
                .addUserOption(opt => opt.setName('user').setDescription('ユーザー').setRequired(true))
                .addIntegerOption(opt => opt.setName('level').setDescription('レベル').setRequired(true))
                .addIntegerOption(opt => opt.setName('xp').setDescription('XP').setRequired(true))
        ),
    async execute(interaction, client) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand(false) || 'setting';
        const guildId = interaction.guildId;

        const checkLevelEnabled = async (gid) => {
            const data = await client.db.levelingSetting.findUnique({ where: { guildId: gid } });
            return !!data;
        };

        try {
            if (subcommand === 'setting') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
                    return interaction.editReply('権限がありません。');
                }
                const msg = await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('レベリングをONにしますか？')
                        .setDescription('<:Check:1325247594963927203> .. ON\n<:Cancel:1325247762266193993> .. OFF')
                        .setColor('Green')
                    ],
                    fetchReply: true
                });

                await msg.react('<:Check:1325247594963927203>').catch(()=>{});
                await msg.react('<:Cancel:1325247762266193993>').catch(()=>{});

                const filter = (reaction, user) => {
                    return ['1325247594963927203', '1325247762266193993'].includes(reaction.emoji.id) && user.id === interaction.user.id && !user.bot;
                };

                const collected = await msg.awaitReactions({ filter, max: 1, time: 30000, errors: ['time'] }).catch(() => null);

                if (!collected) {
                    return interaction.followUp({ content: 'タイムアウトしました。', ephemeral: true });
                }

                const reaction = collected.first();
                if (reaction.emoji.id === '1325247594963927203') {
                    await client.db.levelingSetting.upsert({
                        where: { guildId },
                        update: {},
                        create: { guildId }
                    });
                    await interaction.channel.send({ embeds: [new EmbedBuilder().setTitle('レベリングをONにしました。').setColor('Green')] });
                } else {
                    await client.db.levelingSetting.deleteMany({ where: { guildId } });
                    await interaction.channel.send({ embeds: [new EmbedBuilder().setTitle('レベリングをOFFにしました。').setColor('Red')] });
                }
            } 
            else if (subcommand === 'show') {
                const enabled = await checkLevelEnabled(guildId);
                if (!enabled) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('レベルは無効です。').setColor('Red')] });
                }

                const user = interaction.options.getUser('user') || interaction.user;
                const avatar = user.displayAvatarURL();
                
                const levelData = await client.db.userLevel.findUnique({
                    where: { guildId_userId: { guildId, userId: user.id } }
                });

                if (!levelData) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle(`\`${user.username}\`のレベル`)
                            .setDescription(`レベル: 「0レベル」\nXP: 「0XP」`)
                            .setColor('Blue')
                            .setThumbnail(avatar)
                        ]
                    });
                }

                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle(`\`${user.username}\`のレベル`)
                        .setDescription(`レベル: 「${levelData.level}レベル」\nXP: 「${levelData.xp}XP」`)
                        .setColor('Blue')
                        .setThumbnail(avatar)
                    ]
                });
            }
            else if (subcommand === 'channel') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.editReply('権限がありません。');
                const enabled = await checkLevelEnabled(guildId);
                if (!enabled) return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('レベルは無効です。').setColor('Red')] });

                const channel = interaction.options.getChannel('channel');
                if (channel) {
                    await client.db.levelingUpAlertChannel.upsert({
                        where: { guildId },
                        update: { channelId: channel.id },
                        create: { guildId, channelId: channel.id }
                    });
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('レベルアップの通知チャンネルを設定しました。').setColor('Green')] });
                } else {
                    await client.db.levelingUpAlertChannel.deleteMany({ where: { guildId } });
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('レベルアップの通知チャンネルを削除しました。').setColor('Green')] });
                }
            }
            else if (subcommand === 'role') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) return interaction.editReply('権限がありません。');
                const enabled = await checkLevelEnabled(guildId);
                if (!enabled) return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('レベルは無効です。').setColor('Red')] });

                const level = interaction.options.getInteger('level');
                const role = interaction.options.getRole('role');

                if (!role) {
                    await client.db.levelingUpRole.deleteMany({ where: { guildId, level } });
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`${level}レベルになってもロールをもらえなくしました。`).setColor('Green')] });
                } else {
                    await client.db.levelingUpRole.upsert({
                        where: { guildId_level: { guildId, level } },
                        update: { roleId: role.id },
                        create: { guildId, level, roleId: role.id }
                    });
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`${level}レベルになるとロールを付与するようにしました。`).setColor('Green')] });
                }
            }
            else if (subcommand === 'edit') {
                if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) return interaction.editReply('権限がありません。');
                const enabled = await checkLevelEnabled(guildId);
                if (!enabled) return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('レベルは無効です。').setColor('Red')] });

                const targetUser = interaction.options.getUser('user');
                const level = interaction.options.getInteger('level');
                const xp = interaction.options.getInteger('xp');

                await client.db.userLevel.upsert({
                    where: { guildId_userId: { guildId, userId: targetUser.id } },
                    update: { level, xp },
                    create: { guildId, userId: targetUser.id, level, xp }
                });

                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle(`${targetUser.username}のレベルを編集しました。`).setDescription(`レベル: ${level}\nXP: ${xp}`).setColor('Green')] });
            }
        } catch (error) {
            console.error('[LevelCmd Error]', error);
            return interaction.editReply('エラーが発生しました。');
        }
    }
};
