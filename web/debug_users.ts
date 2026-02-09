import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const users = await prisma.user.findMany({ include: { organization: true } })
    console.log('--- USERS START ---')
    for (const u of users) {
        console.log(`ID:${u.id}`)
        console.log(`UN:${u.username}`)
        console.log(`EM:${u.email}`)
        console.log(`RL:${u.role}`)
        console.log(`OR:${u.organization?.slug}`)
        console.log('---')
    }
    console.log('--- USERS END ---')
}
main().catch(console.error).finally(() => prisma.$disconnect())
