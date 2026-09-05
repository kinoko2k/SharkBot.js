// sharkbot.py/cogs/game.py
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const axios = require('axios');

const PLAYER_X = "❌";
const PLAYER_O = "⭕";
const EMPTY = "⬜";

function checkWinner(board) {
    const lines = [
        [board[0][0], board[0][1], board[0][2]],
        [board[1][0], board[1][1], board[1][2]],
        [board[2][0], board[2][1], board[2][2]],
        [board[0][0], board[1][0], board[2][0]],
        [board[0][1], board[1][1], board[2][1]],
        [board[0][2], board[1][2], board[2][2]],
        [board[0][0], board[1][1], board[2][2]],
        [board[0][2], board[1][1], board[2][0]]
    ];
    for (const line of lines) {
        if (line[0] !== EMPTY && line[0] === line[1] && line[1] === line[2]) {
            return line[0];
        }
    }
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('game')
        .setDescription('ゲーム・情報関連の機能')
        .addSubcommand(subcmd => 
            subcmd
                .setName('minecraft')
                .setDescription('Minecraftのユーザー情報を取得します。')
                .addStringOption(option => 
                    option.setName('username')
                        .setDescription('Minecraftのユーザーネーム')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcmd => 
            subcmd
                .setName('tictactoe')
                .setDescription('〇✕ゲーム（三目並べ）をします。')
                .addUserOption(option => 
                    option.setName('opponent')
                        .setDescription('対戦相手')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'minecraft') {
            await interaction.deferReply();
            const username = interaction.options.getString('username');
            try {
                const mojangRes = await axios.get(`https://api.mojang.com/users/profiles/minecraft/${username}`);
                const uuid = mojangRes.data.id;
                const name = mojangRes.data.name;

                const embed = new EmbedBuilder()
                    .setTitle('Minecraft ユーザー情報')
                    .setDescription(`ID: ${uuid}\nName: ${name}`)
                    .setColor('Green')
                    .setThumbnail(`https://mc-heads.net/avatar/${uuid}/100`)
                    .setImage(`https://mc-heads.net/body/${uuid}/200`);

                return interaction.editReply({ embeds: [embed] });
            } catch (error) {
                console.error('[Game Error]', error.message);
                return interaction.editReply({ embeds: [new EmbedBuilder().setTitle('ユーザー情報の取得に失敗しました。').setColor('Red')] });
            }
        } 
        else if (subcommand === 'tictactoe') {
            const player1 = interaction.user;
            const player2 = interaction.options.getUser('opponent');

            if (player2.bot) {
                return interaction.reply({ content: 'Botとは対戦できません！', ephemeral: true });
            }
            if (player1.id === player2.id) {
                return interaction.reply({ content: '自分自身とは対戦できません！', ephemeral: true });
            }

            let board = [
                [EMPTY, EMPTY, EMPTY],
                [EMPTY, EMPTY, EMPTY],
                [EMPTY, EMPTY, EMPTY]
            ];
            let turn = 0;
            let currentPlayer = player1;
            let currentMark = PLAYER_X;

            const generateComponents = (disableAll = false) => {
                const rows = [];
                for (let y = 0; y < 3; y++) {
                    const row = new ActionRowBuilder();
                    for (let x = 0; x < 3; x++) {
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`ttt_${x}_${y}`)
                                .setLabel(board[y][x])
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(disableAll || board[y][x] !== EMPTY)
                        );
                    }
                    rows.push(row);
                }
                return rows;
            };

            const embed = new EmbedBuilder()
                .setTitle('〇✕ゲーム対戦中')
                .setDescription(`${currentPlayer} の番です（${currentMark}）`)
                .setColor('Blue');

            const message = await interaction.reply({ 
                content: `${player1} vs ${player2}`,
                embeds: [embed], 
                components: generateComponents(),
                fetchReply: true 
            });

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 }); // 5分でタイムアウト

            collector.on('collect', async i => {
                if (i.user.id !== currentPlayer.id) {
                    await i.reply({ content: 'あなたの番ではありません！', ephemeral: true });
                    return;
                }

                const [_, x, y] = i.customId.split('_').map(Number);
                board[y][x] = currentMark;

                const winnerMark = checkWinner(board);
                if (winnerMark) {
                    embed.setTitle('対戦が終了しました。').setDescription(`${currentPlayer} の勝ち！`).setColor('Green');
                    await i.update({ embeds: [embed], components: generateComponents(true) });
                    collector.stop('win');
                    return;
                }

                turn++;
                if (turn === 9) {
                    embed.setTitle('対戦が終了しました。').setDescription('引き分けです！').setColor('Green');
                    await i.update({ embeds: [embed], components: generateComponents(true) });
                    collector.stop('draw');
                    return;
                }

                currentPlayer = (turn % 2 === 0) ? player1 : player2;
                currentMark = (turn % 2 === 0) ? PLAYER_X : PLAYER_O;
                
                embed.setDescription(`${currentPlayer} の番です（${currentMark}）`);
                await i.update({ embeds: [embed], components: generateComponents() });
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    embed.setTitle('対戦が終了しました。').setDescription('タイムアウトしました。').setColor('Red');
                    message.edit({ embeds: [embed], components: generateComponents(true) }).catch(() => {});
                }
            });
        }
    }
};
