const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`${interaction.commandName} は存在しないコマンドです。`);
                return;
            }

            try {
                await command.execute(interaction, client);
            } catch (error) {
                console.error(`${interaction.commandName} の実行中にエラーが発生しました。`);
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'コマンド実行中にエラーが発生しました。', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            if (interaction.customId.startsWith('rolepanel_v1_')) {
                await interaction.deferReply({ ephemeral: true });
                const roleId = interaction.customId.replace('rolepanel_v1_', '');
                const role = interaction.guild.roles.cache.get(roleId);
                const member = interaction.member;

                if (!role) {
                    return interaction.editReply('ロールが見つかりませんでした。');
                }

                try {
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(role);
                        return interaction.editReply(`ロール ${role.name} を剥奪しました。`);
                    } else {
                        await member.roles.add(role);
                        return interaction.editReply(`ロール ${role.name} を付与しました。`);
                    }
                } catch (e) {
                    console.error('ロールパネルエラー: ', e);
                    return interaction.editReply('権限不足等の理由でロールの付与・剥奪に失敗しました。');
                }
            }
        }
    },
};
