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

    const stores = await db.store.findMany({
      include: {
        ratings: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    const storesWithRatings = stores.map(store => {
      const ratings = store.ratings.map(r => r.rating)
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
        : null

      return {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address,
        createdAt: store.createdAt,
        averageRating
      }
    })

    return NextResponse.json(storesWithRatings)
  } catch (error) {
    console.error("Stores API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== UserRole.SYSTEM_ADMIN) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { name, email, address } = await request.json()

    if (!name || !email || !address) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if store already exists
    const existingStore = await db.store.findUnique({
      where: { email }
    })

    if (existingStore) {
      return NextResponse.json(
        { error: "Store with this email already exists" },
        { status: 400 }
      )
    }

    // Create store
    const store = await db.store.create({
      data: {
        name,
        email,
        address
      }
    })

    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    console.error("Create store API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}