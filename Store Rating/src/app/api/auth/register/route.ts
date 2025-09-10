import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const { name, email, address, password } = await request.json()

    // Validate input
    if (!name || !email || !address || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        address,
        password: hashedPassword,
        role: UserRole.NORMAL_USER
      }
    })

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}