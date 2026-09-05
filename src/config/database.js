const { PrismaClient } = require('@prisma/client');

let prisma;

async function connectDatabase() {
    if (!prisma) {
        console.log('Prisma Client を初期化しています...');
        prisma = new PrismaClient();
        try {
            await prisma.$connect();
            console.log('Prismaを通してデータベースに接続しました！');
        } catch (error) {
            console.error('データベースへの接続に失敗しました。', error);
            process.exit(1);
        }
    }
    return prisma;
}

module.exports = { connectDatabase };
