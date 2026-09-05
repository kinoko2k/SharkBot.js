async function getCountingData(prisma, dbType, guildId, channelId) {
    const data = await prisma.counting.findUnique({
        where: {
            guildId_channelId: {
                guildId,
                channelId
            }
        }
    });
    return data;
}

async function setCountingData(prisma, dbType, guildId, channelId, data) {
    const now = data.now !== undefined ? data.now : 0;
    const resetOnMistake = data.resetOnMistake !== undefined ? data.resetOnMistake : true;

    await prisma.counting.upsert({
        where: {
            guildId_channelId: {
                guildId,
                channelId
            }
        },
        update: {
            now,
            resetOnMistake
        },
        create: {
            guildId,
            channelId,
            now,
            resetOnMistake
        }
    });
}

async function deleteCountingData(prisma, dbType, guildId, channelId) {
    try {
        await prisma.counting.delete({
            where: {
                guildId_channelId: {
                    guildId,
                    channelId
                }
            }
        });
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    getCountingData,
    setCountingData,
    deleteCountingData
};
