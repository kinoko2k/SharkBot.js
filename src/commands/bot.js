// sharkbot.py/cogs/help.py
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const config = yaml.parse(fs.readFileSync(path.join(__dirname, '../../config.yml'), 'utf8'));

function getCpuUsage() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    for (let cpu in cpus) {
        user += cpus[cpu].times.user;
        nice += cpus[cpu].times.nice;
        sys += cpus[cpu].times.sys;
        idle += cpus[cpu].times.idle;
        irq += cpus[cpu].times.irq;
    }
    const total = user + nice + sys + idle + irq;
    return { idle, total };
}

let startMeasure = getCpuUsage();

function createBar(percentage, length = 20) {
    const filled = Math.floor((percentage / 100) * length);
    return "⬛".repeat(filled) + "⬜".repeat(length - filled);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Botに関する情報を表示します。')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping')
                .setDescription('Pingを見ます。')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('about')
                .setDescription('Botの情報を見ます。')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('permission')
                .setDescription('Botの持っている権限を見ます。')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('debug')
                .setDescription('サーバーのステータスを取得します。')
        ),

    async execute(interaction, client) {
        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'ping') {
            const startTimestamp = Date.now();
            const logChannelId = config.pingLogChannelId;
            let latency = 0;

            if (logChannelId) {
                try {
                    const channel = await client.channels.fetch(logChannelId);
                    if (channel && channel.isTextBased()) {
                        const msg = await channel.send(`Pingを測定しています・・\n実行者: ${interaction.user.username} (${interaction.user.id})`);
                        latency = msg.createdTimestamp - startTimestamp;
                        await msg.reply(`Pong!\nDiscordAPI: ${Math.round(client.ws.ping)}ms\nMessageSent: ${latency}ms`);
                    }
                } catch (e) {
                    console.error("Pingログチャンネルへの送信に失敗しました:", e);
                }
            }

            if (latency === 0) {
                latency = Date.now() - startTimestamp;
            }

            const embed = new EmbedBuilder()
                .setTitle("Pingを測定しました。")
                .setDescription(`DiscordAPI: ${Math.round(client.ws.ping)}ms\nMessageSent: ${latency}ms`)
                .setColor('Green');

            await interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'about') {
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('招待リンク')
                        .setURL('https://discord.com/oauth2/authorize?client_id=1322100616369147924&permissions=1759218604441591&integration_type=0&scope=bot+applications.commands')
                        .setStyle(ButtonStyle.Link),
                    new ButtonBuilder()
                        .setLabel('サポートサーバー')
                        .setURL('https://discord.gg/mUyByHYMGk')
                        .setStyle(ButtonStyle.Link),
                    new ButtonBuilder()
                        .setLabel('サーバー掲示板')
                        .setURL('https://www.sharkbot.xyz/server')
                        .setStyle(ButtonStyle.Link)
                );

            const guildCount = client.guilds.cache.size;
            const userCount = client.users.cache.size;
            const channelCount = client.channels.cache.size;
            const emojiCount = client.emojis.cache.size;

            let ownerName = "取得不可";
            try {
                const owner = await client.users.fetch(config.ownerId);
                if (owner) ownerName = owner.displayName || owner.username;
            } catch (e) {}

            let modsName = "取得不可";
            try {
                const supportGuild = await client.guilds.fetch(config.supportGuildId);
                if (supportGuild) {
                    const modRole = await supportGuild.roles.fetch(config.modRoleId);
                    if (modRole) {
                        const members = modRole.members.filter(m => m.id !== config.ownerId);
                        modsName = members.map(m => m.displayName).join('\n') || "なし";
                    }
                }
            } catch (e) {
                modsName = "（サポートサーバーに参加していないか、権限がありません）";
            }

            const embed = new EmbedBuilder()
                .setTitle("`SharkBot`の情報")
                .setColor('Green')
                .addFields(
                    { name: 'サーバー数', value: `${guildCount}サーバー`, inline: true },
                    { name: 'ユーザー数', value: `${userCount}人`, inline: true },
                    { name: 'チャンネル数', value: `${channelCount}個`, inline: false },
                    { name: '絵文字数', value: `${emojiCount}個`, inline: false },
                    { name: 'オーナー', value: ownerName, inline: false },
                    { name: 'モデレーター', value: modsName, inline: false }
                );

            await interaction.editReply({ embeds: [embed], components: [row] });

        } else if (subcommand === 'permission') {
            const PERMISSION_TRANSLATIONS = {
                Administrator: "管理者",
                ViewAuditLog: "監査ログの表示",
                ViewGuildInsights: "サーバーインサイトの表示",
                ManageGuild: "サーバーの管理",
                ManageRoles: "ロールの管理",
                ManageChannels: "チャンネルの管理",
                KickMembers: "メンバーのキック",
                BanMembers: "メンバーのBAN",
                CreateInstantInvite: "招待の作成",
                ChangeNickname: "ニックネームの変更",
                ManageNicknames: "ニックネームの管理",
                ManageEmojisAndStickers: "絵文字とステッカーの管理",
                ManageWebhooks: "Webhookの管理",
                ViewChannel: "チャンネルの閲覧",
                SendMessages: "メッセージの送信",
                SendTTSMessages: "TTSメッセージの送信",
                ManageMessages: "メッセージの管理",
                EmbedLinks: "埋め込みリンクの送信",
                AttachFiles: "ファイルの添付",
                ReadMessageHistory: "メッセージ履歴の閲覧",
                UseExternalEmojis: "外部絵文字の使用",
                MentionEveryone: "everyone のメンション",
                AddReactions: "リアクションの追加",
                Connect: "ボイスチャンネルへの接続",
                Speak: "発言",
                Stream: "配信",
                MuteMembers: "メンバーのミュート",
                DeafenMembers: "メンバーのスピーカーミュート",
                MoveMembers: "ボイスチャンネルの移動",
                UseVAD: "音声検出の使用",
                ManageThreads: "スレッドの管理",
                ModerateMembers: "メンバーのタイムアウト"
            };

            const me = interaction.guild.members.me;
            const allowed = [];
            const denied = [];

            for (const [permName, flag] of Object.entries(PermissionsBitField.Flags)) {
                if (typeof flag === 'bigint') {
                    const jpName = PERMISSION_TRANSLATIONS[permName] || permName;
                    if (me.permissions.has(flag)) {
                        allowed.push(jpName);
                    } else {
                        denied.push(jpName);
                    }
                }
            }

            const allowedStr = allowed.length > 0 ? allowed.join(', ') : "ありません";
            const deniedStr = denied.length > 0 ? denied.join(', ') : "ありません";

            const safeAllowedStr = allowedStr.length > 1024 ? allowedStr.substring(0, 1021) + "..." : allowedStr;
            const safeDeniedStr = deniedStr.length > 1024 ? deniedStr.substring(0, 1021) + "..." : deniedStr;

            const embed = new EmbedBuilder()
                .setTitle(`SharkBotの持っている権限`)
                .setColor('Green')
                .addFields(
                    { name: '許可された権限', value: safeAllowedStr },
                    { name: '拒否された権限', value: safeDeniedStr }
                );

            await interaction.editReply({ embeds: [embed] });

        } else if (subcommand === 'debug') {
            const endMeasure = getCpuUsage();
            const idleDiff = endMeasure.idle - startMeasure.idle;
            const totalDiff = endMeasure.total - startMeasure.total;
            const cpuUsage = totalDiff === 0 ? 0 : 100 - Math.floor(100 * idleDiff / totalDiff);
            startMeasure = endMeasure; 

            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const usedMem = totalMem - freeMem;
            const memoryPercent = Math.floor((usedMem / totalMem) * 100);

            const globalChatJoined = "データ移行後実装";
            const globalAdsJoined = "データ移行後実装";
            const sharkAccountCount = "データ移行後実装";

            const embed = new EmbedBuilder()
                .setTitle("サーバーのシステムステータス")
                .setColor('Blue')
                .addFields(
                    { name: "CPU 使用率", value: `${cpuUsage}%\n${createBar(cpuUsage)}`, inline: false },
                    { name: "メモリ 使用率", value: `${memoryPercent}% (${Math.floor(usedMem / (1024**2))}MB / ${Math.floor(totalMem / (1024**2))}MB)\n${createBar(memoryPercent)}`, inline: false },
                    { name: "機能を使用しているサーバー数", value: `グローバルチャット: ${globalChatJoined}\nグローバル宣伝: ${globalAdsJoined}`, inline: false },
                    { name: "機能を使用しているユーザー数", value: `Sharkアカウント: ${sharkAccountCount}`, inline: false }
                );

            await interaction.editReply({ embeds: [embed] });
        }
    },
};
