import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Add likes to existing posts
  const posts = await prisma.post.findMany({ select: { id: true, title: true } })
  const likeMap = [8, 12, 5, 15, 9, 6, 11, 4, 7, 3, 10, 6]
  for (let i = 0; i < posts.length; i++) {
    await prisma.post.update({
      where: { id: posts[i].id },
      data: { likes: likeMap[i] ?? 0 },
    })
  }

  // Add demo DMs
  await prisma.message.createMany({
    data: [
      {
        fromName: '佐藤 美咲',
        toName: '田中 健',
        content: 'DockerのネットワークのナレッジをGenba Hubで見ました！うちの現場でも同じ問題が起きていて助かりました。もう少し詳しく教えていただけますか？',
        isRead: false,
      },
      {
        fromName: '山田 大輔',
        toName: '高橋 翔',
        content: 'GitHub ActionsのCIをチームに導入しようとしているのですが、matrix戦略の設定を教えてもらえますか？特にキャッシュ周りが知りたいです。',
        isRead: false,
      },
      {
        fromName: '高橋 翔',
        toName: '田中 健',
        content: 'Lambda → Go移行の件ですが、実際にどのくらいの期間でマイグレーションできましたか？コスト面での変化も聞かせていただけると助かります！',
        isRead: true,
      },
    ],
  })

  console.log('Extras seeded: likes + messages')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
