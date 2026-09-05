const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

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
    },
};
