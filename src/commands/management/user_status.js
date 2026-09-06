const { ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('統計')
        .setType(ApplicationCommandType.User),
    async execute(interaction, client) {
        await interaction.deferReply();
        const targetUser = interaction.targetUser;
        const userId = targetUser.id;
        
        try {
            const banData = await client.db.bANRanking.findUnique({ where: { userId } });
            const ban_count = banData ? banData.ban_count : 0;
            
            const delData = await client.db.messageDeleteRanking.findUnique({ where: { userId } });
            const message_delete_count = delData ? delData.delete_count : 0;
            
            const editData = await client.db.messageEditRanking.findUnique({ where: { userId } });
            const message_edit_count = editData ? editData.edit_count : 0;
            
            const cmdData = await client.db.commandRunRanking.findUnique({ where: { userId } });
            const command_run_count = cmdData ? cmdData.run_count : 0;
            
            const bumpData = await client.db.bumpRanking.findUnique({ where: { userId } });
            const bump_disboard_count = bumpData ? bumpData.bump_count : 0;
            
            const menData = await client.db.mentionRanking.findUnique({ where: { userId } });
            const men = menData ? menData.count : 0;
            
            const pointData = await client.db.userEconomy.findUnique({ where: { userId } });
            const point = pointData ? pointData.wallet : 0;

            const chartConfig = {
                type: 'bar',
                data: {
                    labels: ['BAN', 'MessageDelete', 'MessageEdit', 'Bump', 'SharkPoint'],
                    datasets: [{
                        label: 'Counts',
                        data: [ban_count, message_delete_count, message_edit_count, bump_disboard_count, point],
                        backgroundColor: 'rgba(54, 162, 235, 0.5)'
                    }]
                },
                options: {
                    title: { display: true, text: 'Event Counts' },
                    scales: { yAxes: [{ ticks: { beginAtZero: true } }] }
                }
            };
            const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}`;

            return interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setTitle(`\`${targetUser.username}\`さんの統計`)
                    .setColor('Blue')
                    .setDescription(`BAN回数: ${ban_count}回\nメッセージ削除回数: ${message_delete_count}回\nメッセージ編集回数: ${message_edit_count}回\nDisboardのBump回数: ${bump_disboard_count}回\nコマンド実行回数: ${command_run_count}回\nメンション回数: ${men}回\nSharkポイント所持数: ${point}ポイント\n`)
                    .setImage(chartUrl)
                ]
            });
        } catch (error) {
            console.error('[UserStatus Error]', error);
            return interaction.editReply('エラーが発生しました。');
        }
    }
};
