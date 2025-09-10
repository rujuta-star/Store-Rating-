import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { UserRole } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      db.user.count(),
      db.store.count(),
      db.rating.count()
    ])

    return NextResponse.json({
      totalUsers,
      totalStores,
      totalRatings
    })
  } catch (error) {
    console.error("Stats API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}