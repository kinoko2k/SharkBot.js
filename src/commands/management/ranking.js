const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ranking')
        .setDescription('様々なランキングを見ます。')
        .addStringOption(opt => 
            opt.setName('item')
            .setDescription('項目')
            .setRequired(true)
            .addChoices(
                { name: 'BAN回数', value: 'ban' },
                { name: 'コマンド実行回数', value: 'commands' },
                { name: 'メッセージ削除回数', value: 'delete' },
                { name: 'メッセージ編集回数', value: 'edit' },
                { name: 'DisboardBump回数', value: 'bump' },
                { name: 'メンション回数', value: 'mention' },
                { name: 'ポイント億万長者', value: 'point' },
                { name: '私の統計', value: 'mycount' }
            )
        ),
    async execute(interaction, client) {
        await interaction.deferReply();
        const val = interaction.options.getString('item');

        try {
            if (val === 'ban') {
                const topUsers = await client.db.bANRanking.findMany({
                    orderBy: { ban_count: 'desc' },
                    take: 15
                });
                if (topUsers.length === 0) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('BAN回数').setColor('Green').setDescription('まだBANされていません。')] });
                }
                let rankingMessage = "";
                for (let i = 0; i < topUsers.length; i++) {
                    const u = topUsers[i];
                    const member = await client.users.fetch(u.userId).catch(() => null);
                    const username = member ? `${member.username} (${u.userId})` : `Unknown (${u.userId})`;
                    rankingMessage += `${i + 1}. **${username}** - ${u.ban_count} 回\n`;
                }
                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('<:Success:1362271281302601749> BAN回数').setColor('Green').setDescription(rankingMessage)] });
            } 
            else if (val === 'commands') {
                const topUsers = await client.db.commandRunRanking.findMany({
                    orderBy: { run_count: 'desc' },
                    take: 15
                });
                if (topUsers.length === 0) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('コマンド実行回数').setColor('Green').setDescription('まだ実行されていません。')] });
                }
                let rankingMessage = "";
                for (let i = 0; i < topUsers.length; i++) {
                    const u = topUsers[i];
                    const member = await client.users.fetch(u.userId).catch(() => null);
                    const username = member ? `${member.displayName} (${u.userId})` : `Unknown (${u.userId})`;
                    rankingMessage += `${i + 1}. **${username}** - ${u.run_count} 回\n`;
                }
                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('<:Success:1362271281302601749> コマンド実行回数').setColor('Green').setDescription(rankingMessage)] });
            }
            else if (val === 'delete') {
                const topUsers = await client.db.messageDeleteRanking.findMany({
                    orderBy: { delete_count: 'desc' },
                    take: 15
                });
                if (topUsers.length === 0) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('メッセージ削除回数').setColor('Green').setDescription('まだ削除されていません。')] });
                }
                let rankingMessage = "";
                for (let i = 0; i < topUsers.length; i++) {
                    const u = topUsers[i];
                    const member = await client.users.fetch(u.userId).catch(() => null);
                    const username = member ? `${member.displayName} (${u.userId})` : `Unknown (${u.userId})`;
                    rankingMessage += `${i + 1}. **${username}** - ${u.delete_count} 回\n`;
                }
                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('<:Success:1362271281302601749> メッセージ削除回数').setColor('Green').setDescription(rankingMessage)] });
            }
            else if (val === 'edit') {
                const topUsers = await client.db.messageEditRanking.findMany({
                    orderBy: { edit_count: 'desc' },
                    take: 15
                });
                if (topUsers.length === 0) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('メッセージ編集回数').setColor('Green').setDescription('まだ編集されていません。')] });
                }
                let rankingMessage = "";
                for (let i = 0; i < topUsers.length; i++) {
                    const u = topUsers[i];
                    const member = await client.users.fetch(u.userId).catch(() => null);
                    const username = member ? `${member.displayName} (${u.userId})` : `Unknown (${u.userId})`;
                    rankingMessage += `${i + 1}. **${username}** - ${u.edit_count} 回\n`;
                }
                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('<:Success:1362271281302601749> メッセージ編集回数').setColor('Green').setDescription(rankingMessage)] });
            }
            else if (val === 'bump') {
                const topUsers = await client.db.bumpRanking.findMany({
                    orderBy: { bump_count: 'desc' },
                    take: 15
                });
                if (topUsers.length === 0) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('DisboardBump回数').setColor('Green').setDescription('まだBumpされていません。')] });
                }
                let rankingMessage = "";
                for (let i = 0; i < topUsers.length; i++) {
                    const u = topUsers[i];
                    const member = await client.users.fetch(u.userId).catch(() => null);
                    const username = member ? `${member.displayName} (${u.userId})` : `Unknown (${u.userId})`;
                    rankingMessage += `${i + 1}. **${username}** - ${u.bump_count} 回\n`;
                }
                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('<:Success:1362271281302601749> DisboardBump回数').setColor('Green').setDescription(rankingMessage)] });
            }
            else if (val === 'mention') {
                const topUsers = await client.db.mentionRanking.findMany({
                    orderBy: { count: 'desc' },
                    take: 15
                });
                if (topUsers.length === 0) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('メンション回数').setColor('Green').setDescription('まだメンションされていません。')] });
                }
                let rankingMessage = "";
                for (let i = 0; i < topUsers.length; i++) {
                    const u = topUsers[i];
                    const member = await client.users.fetch(u.userId).catch(() => null);
                    const username = member ? `${member.displayName} (${u.userId})` : `Unknown (${u.userId})`;
                    rankingMessage += `${i + 1}. **${username}** - ${u.count} 回\n`;
                }
                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('<:Success:1362271281302601749> メンション回数').setColor('Green').setDescription(rankingMessage)] });
            }
            else if (val === 'point') {
                const topUsers = await client.db.userEconomy.findMany({
                    orderBy: { wallet: 'desc' },
                    take: 15
                });
                if (topUsers.length === 0) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('ポイント所持数').setColor('Green').setDescription('まだポイントが所持されていません。')] });
                }
                let rankingMessage = "";
                for (let i = 0; i < topUsers.length; i++) {
                    const u = topUsers[i];
                    const member = await client.users.fetch(u.userId).catch(() => null);
                    const username = member ? `${member.displayName} (${u.userId})` : `Unknown (${u.userId})`;
                    rankingMessage += `${i + 1}. **${username}** - ${u.wallet} 回\n`;
                }
                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('<:Success:1362271281302601749> ポイント所持数').setColor('Green').setDescription(rankingMessage)] });
            }
            else if (val === 'mycount') {
                const userId = interaction.user.id;
                
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
                        .setTitle(`\`${interaction.user.username}\`さんの統計`)
                        .setColor('Blue')
                        .setDescription(`BAN回数: ${ban_count}回\nメッセージ削除回数: ${message_delete_count}回\nメッセージ編集回数: ${message_edit_count}回\nDisboardのBump回数: ${bump_disboard_count}回\nコマンド実行回数: ${command_run_count}回\nメンション回数: ${men}回\nSharkポイント所持数: ${point}ポイント\n`)
                        .setImage(chartUrl)
                    ]
                });
            }
        } catch (error) {
            console.error('[RankingCmd Error]', error);
            return interaction.editReply('エラーが発生しました。');
        }
    }
};
