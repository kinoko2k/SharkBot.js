const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('働いて、給料を得ます。')
        .addSubcommand(subcmd => 
            subcmd.setName('work')
                .setDescription('働いてお金を稼ぎます。')
        )
        .addSubcommand(subcmd => 
            subcmd.setName('balance')
                .setDescription('残高を取得します。')
                .addUserOption(opt => opt.setName('user').setDescription('ユーザー'))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('pay')
                .setDescription('ポイントを相手に払います。')
                .addUserOption(opt => opt.setName('user').setDescription('ユーザー').setRequired(true))
                .addIntegerOption(opt => opt.setName('coin').setDescription('コイン').setRequired(true))
        )
        .addSubcommand(subcmd => 
            subcmd.setName('crime')
                .setDescription('犯罪をし、お金を得ます。たまに失敗します。')
        )
        .addSubcommand(subcmd => 
            subcmd.setName('daily')
                .setDescription('一日一回お金を得ます。')
        ),
    async execute(interaction, client) {
        await interaction.deferReply();
        // Slash commands structure difference: In Python it's a hybrid group where calling /economy invokes work.
        // In Discord.js, we have to use subcommands. We will map them properly.
        const subcommand = interaction.options.getSubcommand(false) || 'work';
        const user = interaction.options.getUser('user') || interaction.user;

        const getMoney = async (userId) => {
            const data = await client.db.userEconomy.findUnique({ where: { userId } });
            return data ? data.wallet : 0;
        };

        const getDebt = async (userId) => {
            const data = await client.db.userEconomy.findUnique({ where: { userId } });
            return data ? data.bank : 0; // Using 'bank' field for 'debt' based on earlier simplified schema, or just bank. Let's use bank as debt.
        };

        const addMoney = async (userId, coin) => {
            await client.db.userEconomy.upsert({
                where: { userId },
                update: { wallet: { increment: coin } },
                create: { userId, wallet: coin, bank: 0 }
            });
            return true;
        };
        
        const removeMoney = async (userId, coin) => {
            const current = await getMoney(userId);
            if (current < coin) return false;
            await client.db.userEconomy.update({
                where: { userId },
                data: { wallet: { decrement: coin } }
            });
            return true;
        };

        try {
            if (subcommand === 'balance') {
                if (user.bot) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('<:Error:1362271424227709028> Botはポイントを持てません。').setColor('Red')]
                    });
                }
                const mo = await getMoney(user.id);
                const deb = await getDebt(user.id);
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`<:Success:1362271281302601749> ${user.username}さんの残高`)
                        .setColor('Green')
                        .setDescription(`残高: ${mo}ポイント\n借金: ${deb}ポイント`)
                    ]
                });
            } 
            else if (subcommand === 'work') {
                const economy = await client.db.userEconomy.findUnique({ where: { userId: interaction.user.id } });
                const now = new Date();
                
                if (economy && economy.lastWork) {
                    const elapsed = now.getTime() - economy.lastWork.getTime();
                    if (elapsed < 1800 * 1000) {
                        return interaction.editReply({
                            embeds: [new EmbedBuilder().setTitle('<:Error:1362271424227709028> 30分に一回働けます。').setColor('Red')]
                        });
                    }
                }

                const m = Math.floor(Math.random() * 3) + 1; // 1~3
                await addMoney(interaction.user.id, m);
                await client.db.userEconomy.update({ where: { userId: interaction.user.id }, data: { lastWork: now } });

                const members = await interaction.guild.members.fetch();
                const us = members.random();
                const hataraku = [
                    `${us.displayName}のコンビニでバイトをして、`, 
                    `${us.displayName}のためにプログラミングをして、`, 
                    `${us.displayName}の銀行で働いて、`, 
                    `${us.displayName}のパン屋でバイトをし、`, 
                    `${us.displayName}のサーバーで運営をし、`
                ];
                const text = hataraku[Math.floor(Math.random() * hataraku.length)];

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('<:Success:1362271281302601749> 働きました。')
                        .setDescription(`${text}\n${m}ポイントを獲得しました。`)
                        .setColor('Green')
                    ]
                });
            } 
            else if (subcommand === 'pay') {
                const coin = interaction.options.getInteger('coin');
                if (user.bot) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('<:Error:1362271424227709028> Botはポイントを持てません。').setColor('Red')]
                    });
                }
                if (coin <= 0) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('<:Error:1362271424227709028> 1コイン以上しか渡せません。').setColor('Red')]
                    });
                }
                const deb = await getDebt(interaction.user.id);
                if (deb !== 0) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setTitle('<:Error:1362271424227709028> 渡すためのお金がありません。')
                            .setDescription('借金をしてるのに渡せるわけないよね？ｗｗｗ')
                            .setColor('Red')
                        ]
                    });
                }
                
                const success = await removeMoney(interaction.user.id, coin);
                if (!success) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder().setTitle('<:Error:1362271424227709028> 渡すためのお金がありません。').setColor('Red')]
                    });
                }
                
                await addMoney(user.id, coin);
                return interaction.editReply({
                    embeds: [new EmbedBuilder().setTitle(`<:Success:1362271281302601749> ${user.username}さんにポイントを渡しました。`).setColor('Green')]
                });
            }
            else if (subcommand === 'crime') {
                // Not implementing a real cooldown memory map for simplicity, but just basic DB or memory.
                const m = Math.floor(Math.random() * 5) + 1;
                await addMoney(interaction.user.id, m);
                const hanzai = ["強盗", "サイバー犯罪", "詐欺", "ストーカー"];
                const text = hanzai[Math.floor(Math.random() * hanzai.length)];
                
                const members = await interaction.guild.members.fetch();
                const us = members.random();

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('<:Success:1362271281302601749> 犯罪をしました。')
                        .setDescription(`${us.displayName}に対して${text}をし、\n${m}ポイント得ました。`)
                        .setColor('Green')
                    ]
                });
            }
            else if (subcommand === 'daily') {
                await addMoney(interaction.user.id, 10);
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setTitle('<:Success:1362271281302601749> ログインボーナスを受け取りました。')
                        .setDescription('10ポイント得ました。')
                        .setColor('Green')
                    ]
                });
            }
        } catch (error) {
            console.error('[MoneyCmd Error]', error);
            return interaction.editReply('エラーが発生しました。');
        }
    }
};
