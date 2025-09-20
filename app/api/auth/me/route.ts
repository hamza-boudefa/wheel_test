import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("admin_session")?.value

    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    const admin = await validateSession(sessionId)

    if (!admin) {
      // Clear invalid session cookie
      cookieStore.delete("admin_session")
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        created_at: admin.created_at,
        last_login: admin.last_login,
      },
    })
  } catch (error: any) {
    console.error("Session validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
