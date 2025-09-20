import { neon } from "@neondatabase/serverless"
import type { NextRequest } from "next/server"

const sql = neon(
  "postgresql://neondb_owner:npg_UJGV6t7ONWhw@ep-solitary-grass-agzevtrj-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
)

export interface Admin {
  id: number
  username: string
  email: string
  password_hash: string
  created_at: Date
  last_login?: Date
}

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "fortune_wheel_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

let authInitialized = false

const ensureAuthInitialized = async () => {
  if (authInitialized) return

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id VARCHAR(255) PRIMARY KEY,
        admin_id INTEGER REFERENCES admins(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_accessed TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id)
    `
    await sql`
      CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at)
    `

    const existingAdmin = await sql`
      SELECT * FROM admins WHERE username = 'admin'
    `

    if (existingAdmin.length === 0) {
      const passwordHash = await hashPassword("Q1JOoa76KLtl3iK")
      await sql`
        INSERT INTO admins (username, email, password_hash, created_at)
        VALUES ('admin', 'admin@fortunewheel.com', ${passwordHash}, NOW())
      `
    }

    await sql`DELETE FROM admin_sessions WHERE expires_at < NOW()`

    authInitialized = true
  } catch (error) {
    console.error("Auth initialization failed:", error)
    throw error
  }
}

export const authenticateAdmin = async (username: string, password: string): Promise<Admin | null> => {
  await ensureAuthInitialized()

  const result = await sql`
    SELECT * FROM admins WHERE username = ${username} OR email = ${username}
  `

  if (result.length === 0) {
    return null
  }

  const admin = result[0]
  const isValidPassword = await verifyPassword(password, admin.password_hash)

  if (!isValidPassword) {
    return null
  }

  await sql`
    UPDATE admins SET last_login = NOW() WHERE id = ${admin.id}
  `

  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    password_hash: admin.password_hash,
    created_at: admin.created_at,
    last_login: new Date(),
  }
}

export const getAdminById = async (id: number): Promise<Admin | null> => {
  await ensureAuthInitialized()

  const result = await sql`
    SELECT * FROM admins WHERE id = ${id}
  `

  if (result.length === 0) {
    return null
  }

  return {
    id: result[0].id,
    username: result[0].username,
    email: result[0].email,
    password_hash: result[0].password_hash,
    created_at: result[0].created_at,
    last_login: result[0].last_login,
  }
}

export const createSession = async (adminId: number): Promise<string> => {
  await ensureAuthInitialized()

  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await sql`
    INSERT INTO admin_sessions (id, admin_id, expires_at, created_at, last_accessed)
    VALUES (${sessionId}, ${adminId}, ${expiresAt}, NOW(), NOW())
  `

  await sql`DELETE FROM admin_sessions WHERE expires_at < NOW()`

  return sessionId
}

export const validateSession = async (sessionId: string): Promise<Admin | null> => {
  await ensureAuthInitialized()

  const sessionResult = await sql`
    SELECT admin_id, expires_at FROM admin_sessions 
    WHERE id = ${sessionId} AND expires_at > NOW()
  `

  if (sessionResult.length === 0) {
    await sql`DELETE FROM admin_sessions WHERE id = ${sessionId}`
    return null
  }

  const session = sessionResult[0]

  const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await sql`
    UPDATE admin_sessions 
    SET last_accessed = NOW(), expires_at = ${newExpiresAt}
    WHERE id = ${sessionId}
  `

  return await getAdminById(session.admin_id)
}

export const destroySession = async (sessionId: string): Promise<void> => {
  await ensureAuthInitialized()
  await sql`DELETE FROM admin_sessions WHERE id = ${sessionId}`
}

export const initializeAuth = async () => {
  try {
    await ensureAuthInitialized()
    return true
  } catch (error) {
    console.error("Auth initialization failed:", error)
    return false
  }
}

export const verifyAdminSession = async (request: NextRequest): Promise<Admin | null> => {
  try {
    await ensureAuthInitialized()

    // Get session ID from cookies
    const sessionId = request.cookies.get("admin_session")?.value

    if (!sessionId) {
      return null
    }

    // Validate the session and return admin if valid
    return await validateSession(sessionId)
  } catch (error) {
    console.error("Session verification failed:", error)
    return null
  }
}
