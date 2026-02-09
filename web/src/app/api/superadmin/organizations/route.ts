import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'



/**
 * GET /api/superadmin/organizations
 * Lista todas las organizaciones (para el futuro panel de control)
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const requester = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (requester?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: { users: true, tables: true, menuItems: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(organizations)

    } catch (error) {
        console.error('Error in superadmin list API:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
