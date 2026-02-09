import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const orgs = await prisma.organization.findMany({ include: { users: true } })
    console.log(`Orgs found: ${orgs.length}`)
    for (const o of orgs) {
        console.log(`Org: ${o.slug}, Users: ${o.users.length}`)
        for (const u of o.users) {
            console.log(`  - User: ${u.username || u.email}, Role: ${u.role}`)
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect())
