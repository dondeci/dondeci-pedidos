
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        include: {
            organization: true
        }
    })
    console.log('Users found:', users.length)
    users.forEach(u => {
        console.log(`U:${u.username}|E:${u.email}|R:${u.role}|O:${u.organization?.slug}`)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
