import { type NextRequest, NextResponse } from "next/server"
import { addCreditsToUser, checkDatabaseConnection } from "@/lib/database"
import { validateSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const { email, credits } = await request.json()

    // Validate input
    if (!email || !credits) {
      return NextResponse.json({ error: "Email and credits are required" }, { status: 400 })
    }

    if (typeof credits !== "number" || credits <= 0) {
      return NextResponse.json({ error: "Credits must be a positive number" }, { status: 400 })
    }

    // Validate admin session
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("admin_session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    const admin = await validateSession(sessionId)
    if (!admin) {
      cookieStore.delete("admin_session")
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    // Check database connection
    const isConnected = await checkDatabaseConnection()
    if (!isConnected) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Add credits
    const updatedUser = await addCreditsToUser(email, credits)

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Successfully added ${credits} credits`,
    })
  } catch (error: any) {
    console.error("Add credits error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
