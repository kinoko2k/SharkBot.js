const { EmbedBuilder } = require('discord.js');

const messages = {
    "0:0": "0時です。おやすみなさい。",
    "1:0": "1時です。まだ寝てるかな？",
    "2:0": "2時です。まだ寝てるよね？",
    "3:0": "3時です。まだ寝てるはずだよ？",
    "4:0": "4時です。そろそろ朝ですね。",
    "5:0": "5時です。もうすぐ起きてくるかな？",
    "6:0": "6時です。おはようございます。",
    "7:0": "7時です。おはようございます。",
    "8:0": "8時です。学校か仕事に行く時間かな？",
    "9:0": "9時です。授業1時間目がもうすぐ終わるかな？",
    "10:0": "10時です。今は何してるのかなぁ・・？",
    "11:0": "11時です。もうすぐお昼です。何食べるのかな？",
    "12:0": "12時です。昼ご飯の時間です。何食べるの？",
    "13:0": "13時です。昼休みの時間かな？",
    "14:0": "14時です。眠いですね。",
    "15:0": "15時です。そろそろおやつの時間ですね。",
    "16:0": "16時です。暗くなってきたかな？",
    "17:0": "17時です。放課後です。何をしますか？",
    "18:0": "18時です。夜ごはんの時間かな？",
    "19:0": "19時です。お風呂入るのかな？",
    "20:0": "20時です。そろそろ寝るの？それとも勉強？それとも？",
    "21:0": "21時です。そろそろ眠くなってきました。",
    "22:0": "22時です。そろそろVCするかな？",
    "23:0": "23時です。もう寝る時間です。おやすみなさい。",
    "23:40": "23時40分です。おやすみなさい。",
    "23:58": "23時58分です。もうすぐあけおめ？()"
};

const randomOdai = [
    "昨日、何食べた？", "今日、何食べた？", "今日、もしくは明日何をする予定？", "明日は何をするの？",
    "好きなものは何？", "好きな食べ物は何？", "好きなゲームは何？", "いつも何時に寝てるの？"
];

function getRandomTopic() {
    return randomOdai[Math.floor(Math.random() * randomOdai.length)];
}

function getClosestMessage() {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let closestMsg = messages["0:0"];
    let maxMinutes = -1;

    for (const key of Object.keys(messages)) {
        const [hour, min] = key.split(':').map(Number);
        const timeMinutes = hour * 60 + min;
        if (timeMinutes <= currentMinutes && timeMinutes > maxMinutes) {
            maxMinutes = timeMinutes;
            closestMsg = messages[key];
        }
    }

    if (maxMinutes === -1) {
        return messages["23:58"];
    }

    return closestMsg;
}

let timeSignalInterval = null;

function startTimeSignalTask(client) {
    if (timeSignalInterval) return;

    timeSignalInterval = setInterval(async () => {
        const now = new Date();
        const key = `${now.getHours()}:${now.getMinutes()}`;

        if (messages[key]) {
            const timeMsg = messages[key];
            const topicMsg = getRandomTopic();

            try {
                const configs = await client.db.timeSignal.findMany();

                for (const conf of configs) {
                    const channel = client.channels.cache.get(conf.channelId);
                    if (channel && channel.isTextBased()) {
                        await channel.send({
                            embeds: [
                                new EmbedBuilder().setTitle('時報').setDescription(timeMsg).setColor('Blue'),
                                new EmbedBuilder().setTitle('お題').setDescription(topicMsg).setColor('Blue')
                            ]
                        }).catch(() => {});
                    }
                }
            } catch (err) {
                console.error('時報タスクエラー: ', err);
            }
        }
    }, 60 * 1000);

    console.log('時報タスクが開始されました。');
}

module.exports = {
    startTimeSignalTask,
    getRandomTopic,
    getClosestMessage
};
