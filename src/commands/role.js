// sharkbot.py/cogs/role.py
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('ロールの管理を行います。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcmd => 
            subcmd
                .setName('add')
                .setDescription('メンバーにロールを付与します。')
                .addUserOption(option => option.setName('user').setDescription('対象のメンバー').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('付与するロール').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('remove')
                .setDescription('メンバーからロールを剥奪します。')
                .addUserOption(option => option.setName('user').setDescription('対象のメンバー').setRequired(true))
                .addRoleOption(option => option.setName('role').setDescription('剥奪するロール').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('create')
                .setDescription('新しいロールを作成します。')
                .addStringOption(option => option.setName('name').setDescription('ロール名').setRequired(true))
                .addStringOption(option => option.setName('color').setDescription('色 (例: #FF0000)').setRequired(false))
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('info')
                .setDescription('ロールの情報を確認します。')
                .addRoleOption(option => option.setName('role').setDescription('確認するロール').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('mute')
                .setDescription('ミュートロールの付与・設定を行います。')
                .addUserOption(option => option.setName('user').setDescription('ミュートするメンバー（省略時は設定モード）').setRequired(false))
                .addRoleOption(option => option.setName('role').setDescription('ミュートロールに設定するロール（設定モード用）').setRequired(false))
        ),
    async execute(interaction, client) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();
        const guild = interaction.guild;

        try {
            if (subcommand === 'add') {
                const user = interaction.options.getMember('user');
                const role = interaction.options.getRole('role');
                if (!user) return interaction.editReply('メンバーが見つかりません。');
                
                await user.roles.add(role);
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('ロール付与成功').setDescription(`${user} に ${role} を付与しました。`).setColor('Green')]
                });
            } 
            else if (subcommand === 'remove') {
                const user = interaction.options.getMember('user');
                const role = interaction.options.getRole('role');
                if (!user) return interaction.editReply('メンバーが見つかりません。');
                
                await user.roles.remove(role);
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('ロール剥奪成功').setDescription(`${user} から ${role} を剥奪しました。`).setColor('Green')]
                });
            } 
            else if (subcommand === 'create') {
                const name = interaction.options.getString('name');
                const color = interaction.options.getString('color') || '#99aab5';
                
                const newRole = await guild.roles.create({ name, color, reason: 'コマンドによる作成' });
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('ロール作成成功').setDescription(`${newRole} を作成しました。`).setColor('Green')]
                });
            } 
            else if (subcommand === 'info') {
                const role = interaction.options.getRole('role');
                const embed = new EmbedBuilder()
                    .setTitle('ロール情報')
                    .setColor(role.color || 'Random')
                    .addFields(
                        { name: 'ロール名', value: `${role.name} (${role.id})`, inline: true },
                        { name: '色 (Hex)', value: role.hexColor, inline: true },
                        { name: 'メンバー数', value: `${role.members.size}人`, inline: true },
                        { name: '作成日時', value: `<t:${Math.floor(role.createdTimestamp / 1000)}:R>`, inline: false }
                    );
                return interaction.editReply({ embeds: [embed] });
            } 
            else if (subcommand === 'mute') {
                const user = interaction.options.getMember('user');
                const roleInput = interaction.options.getRole('role');

                let settings = await client.db.guildSetting.findUnique({ where: { guildId: guild.id } });
                
                if (roleInput) {
                    settings = await client.db.guildSetting.upsert({
                        where: { guildId: guild.id },
                        update: { muteRoleId: roleInput.id },
                        create: { guildId: guild.id, muteRoleId: roleInput.id }
                    });
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('設定完了').setDescription(`ミュートロールを ${roleInput} に設定しました。`).setColor('Green')]
                    });
                }

                if (user) {
                    if (!settings || !settings.muteRoleId) {
                        return interaction.editReply('ミュートロールが設定されていません。先に role オプションで設定してください。');
                    }
                    const muteRole = guild.roles.cache.get(settings.muteRoleId);
                    if (!muteRole) return interaction.editReply('設定されたミュートロールがサーバーに見つかりません。');

                    if (user.roles.cache.has(muteRole.id)) {
                        await user.roles.remove(muteRole);
                        return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('ミュート解除').setDescription(`${user} のミュートを解除しました。`).setColor('Green')] });
                    } else {
                        await user.roles.add(muteRole);
                        return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('ミュート付与').setDescription(`${user} をミュートしました。`).setColor('Red')] });
                    }
                }

                const currentMute = (settings && settings.muteRoleId) ? `<@&${settings.muteRoleId}>` : '未設定';
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle('ミュートロール設定').setDescription(`現在のミュートロール: ${currentMute}`).setColor('Blue')]
                });
            }
        } catch (error) {
            console.error('[RoleCmd Error]', error);
            return interaction.editReply({ content: 'エラーが発生しました。権限が不足している可能性があります。', embeds: [] });
        }
    }
};
