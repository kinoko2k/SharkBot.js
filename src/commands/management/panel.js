// sharkbot.py/cogs/panel.py
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('panel')
        .setDescription('ロールパネルを作成・編集します。')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcmd => {
            subcmd.setName('role')
                .setDescription('ロールパネルを作成します。')
                .addStringOption(opt => opt.setName('title').setDescription('タイトル').setRequired(true))
                .addStringOption(opt => opt.setName('description').setDescription('説明').setRequired(true))
                .addBooleanOption(opt => opt.setName('show_mentions').setDescription('ロール一覧（メンション）を表示するか').setRequired(true))
                .addRoleOption(opt => opt.setName('role1').setDescription('ロール1').setRequired(true));
            
            for (let i = 2; i <= 10; i++) {
                subcmd.addRoleOption(opt => opt.setName(`role${i}`).setDescription(`ロール${i}`).setRequired(false));
            }
            return subcmd;
        }),
    async execute(interaction, client) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'role') {
            const title = interaction.options.getString('title');
            const description = interaction.options.getString('description');
            const showMentions = interaction.options.getBoolean('show_mentions');
            
            const roles = [];
            for (let i = 1; i <= 10; i++) {
                const role = interaction.options.getRole(`role${i}`);
                if (role) roles.push(role);
            }

            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor('Green');

            if (showMentions) {
                const mentions = roles.map(r => r.toString()).join('\n');
                embed.addFields({ name: 'ロール一覧', value: mentions });
            }

            const components = [];
            let currentRow = new ActionRowBuilder();

            roles.forEach((role, index) => {
                const button = new ButtonBuilder()
                    .setCustomId(`rolepanel_v1_${role.id}`)
                    .setLabel(role.name)
                    .setStyle(ButtonStyle.Primary);

                currentRow.addComponents(button);

                if (currentRow.components.length === 5 || index === roles.length - 1) {
                    components.push(currentRow);
                    currentRow = new ActionRowBuilder();
                }
            });

            await interaction.channel.send({ embeds: [embed], components: components });
            return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('作成しました。').setColor('Green')] });
        }
    }
};
