import { type NextRequest, NextResponse } from "next/server"
import { destroySession } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("admin_session")?.value

    if (sessionId) {
      await destroySession(sessionId)
    }

    // Clear the cookie
    cookieStore.delete("admin_session")

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
