import { neon } from "@neondatabase/serverless"

// this is the first database that hase vouchers table : not found
// const sql = neon(
//   "postgresql://neondb_owner:npg_UJGV6t7ONWhw@ep-solitary-grass-agzevtrj-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
// )
const sql = neon(
  "postgresql://neondb_owner:npg_nyxLQ6sDq3tF@ep-little-lake-a28jzgtp-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
)

export interface User {
  id: string
  name: string
  email: string
  credits: number
  last_played?: Date
  total_spins: number
  prizes: string[]
  created_at: Date
}

export interface GameResult {
  id: number
  user_email: string
  prize: string
  timestamp: Date
}

export interface Voucher {
  id: number
  code: string
  prize_amount: number
  max_uses: number
  current_uses: number
  created_at: Date
}

export const createUser = async (name: string, email: string): Promise<User> => {
  const result = await sql`
    INSERT INTO users (email, name, credits, total_spins, prizes, created_at)
    VALUES (${email}, ${name}, 1, 0, '{}', NOW())
    RETURNING *
  `

  return {
    id: result[0].email,
    name: result[0].name,
    email: result[0].email,
    credits: result[0].credits,
    last_played: result[0].last_played,
    total_spins: result[0].total_spins,
    prizes: result[0].prizes,
    created_at: result[0].created_at,
  }
}

export const getUser = async (email: string): Promise<User | null> => {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `

  if (result.length === 0) {
    return null
  }

  return {
    id: result[0].email,
    name: result[0].name,
    email: result[0].email,
    credits: result[0].credits,
    last_played: result[0].last_played,
    total_spins: result[0].total_spins,
    prizes: result[0].prizes,
    created_at: result[0].created_at,
  }
}

export const getAvailableVoucher = async (prizeAmount: number): Promise<Voucher | null> => {
  const result = await sql`
    SELECT * FROM vouchers 
    WHERE prize_amount = ${prizeAmount} 
    AND current_uses < max_uses 
    ORDER BY current_uses ASC, id ASC 
    LIMIT 1
  `

  if (result.length === 0) {
    return null
  }

  return {
    id: result[0].id,
    code: result[0].code,
    prize_amount: result[0].prize_amount,
    max_uses: result[0].max_uses,
    current_uses: result[0].current_uses,
    created_at: result[0].created_at,
  }
}

export const incrementVoucherUsage = async (voucherId: number): Promise<void> => {
  await sql`
    UPDATE vouchers 
    SET current_uses = current_uses + 1 
    WHERE id = ${voucherId}
  `
}

export const updateUserAfterSpin = async (email: string, prize: string) => {
  await sql`
    UPDATE users 
    SET 
      credits = GREATEST(credits - 1, 0),
      total_spins = total_spins + 1,
      prizes = array_append(prizes, ${prize}),
      last_played = NOW()
    WHERE email = ${email}
  `

  await sql`
    INSERT INTO game_results (user_email, prize, timestamp)
    VALUES (${email}, ${prize}, NOW())
  `
}

export const getAllUsers = async (): Promise<User[]> => {
  const result = await sql`
    SELECT * FROM users 
    ORDER BY total_spins DESC, created_at DESC
  `

  return result.map((row: any) => ({
    id: row.email,
    name: row.name,
    email: row.email,
    credits: row.credits,
    last_played: row.last_played,
    total_spins: row.total_spins,
    prizes: row.prizes,
    created_at: row.created_at,
  }))
}

export const addCreditsToUser = async (email: string, credits: number): Promise<User> => {
  const result = await sql`
    UPDATE users 
    SET credits = credits + ${credits}
    WHERE email = ${email}
    RETURNING *
  `

  if (result.length === 0) {
    throw new Error(`User with email ${email} not found`)
  }

  return {
    id: result[0].email,
    name: result[0].name,
    email: result[0].email,
    credits: result[0].credits,
    last_played: result[0].last_played,
    total_spins: result[0].total_spins,
    prizes: result[0].prizes,
    created_at: result[0].created_at,
  }
}

export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

export const initializeDatabase = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        credits INTEGER DEFAULT 1,
        total_spins INTEGER DEFAULT 0,
        prizes TEXT[] DEFAULT '{}',
        last_played TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS game_results (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) REFERENCES users(email),
        prize VARCHAR(255) NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS vouchers (
        id SERIAL PRIMARY KEY,
        code VARCHAR(255) UNIQUE NOT NULL,
        prize_amount INTEGER NOT NULL,
        max_uses INTEGER NOT NULL,
        current_uses INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_results_user_email ON game_results(user_email)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_game_results_timestamp ON game_results(timestamp)
    `

    return true
  } catch (error) {
    console.error("Database initialization failed:", error)
    return false
  }
}

export const getAllVouchers = async (): Promise<Voucher[]> => {
  const result = await sql`
    SELECT * FROM vouchers 
    ORDER BY prize_amount ASC, code ASC
  `

  return result.map((row: any) => ({
    id: row.id,
    code: row.code,
    prize_amount: row.prize_amount,
    max_uses: row.max_uses,
    current_uses: row.current_uses,
    created_at: row.created_at,
  }))
}

export const getVoucherStats = async () => {
  const result = await sql`
    SELECT 
      prize_amount,
      COUNT(*) as total_codes,
      SUM(max_uses) as total_max_uses,
      SUM(current_uses) as total_current_uses,
      SUM(max_uses - current_uses) as remaining_uses
    FROM vouchers 
    GROUP BY prize_amount 
    ORDER BY prize_amount ASC
  `

  return result.map((row: any) => ({
    prize_amount: row.prize_amount,
    total_codes: Number(row.total_codes),
    total_max_uses: Number(row.total_max_uses),
    total_current_uses: Number(row.total_current_uses),
    remaining_uses: Number(row.remaining_uses),
  }))
}

export const getVoucherDistributionHistory = async () => {
  const result = await sql`
    SELECT 
      DATE(gr.timestamp) as date,
      gr.prize as voucher_code,
      v.prize_amount,
      COUNT(*) as times_distributed
    FROM game_results gr
    JOIN vouchers v ON gr.prize = v.code
    WHERE gr.prize LIKE 'UMSPIN%'
    GROUP BY DATE(gr.timestamp), gr.prize, v.prize_amount
    ORDER BY date DESC, v.prize_amount ASC
    LIMIT 50
  `

  return result.map((row: any) => ({
    date: row.date,
    voucher_code: row.voucher_code,
    prize_amount: row.prize_amount,
    times_distributed: Number(row.times_distributed),
  }))
}

// CRUD Operations for Vouchers
export const createVoucher = async (code: string, prizeAmount: number, maxUses: number): Promise<Voucher> => {
  const result = await sql`
    INSERT INTO vouchers (code, prize_amount, max_uses, current_uses)
    VALUES (${code}, ${prizeAmount}, ${maxUses}, 0)
    RETURNING *
  `

  return {
    id: result[0].id,
    code: result[0].code,
    prize_amount: result[0].prize_amount,
    max_uses: result[0].max_uses,
    current_uses: result[0].current_uses,
    created_at: result[0].created_at,
  }
}

export const updateVoucher = async (id: number, updates: Partial<Pick<Voucher, 'code' | 'prize_amount' | 'max_uses' | 'current_uses'>>): Promise<Voucher> => {
  const updateFields = []
  const updateValues = []

  if (updates.code !== undefined) {
    updateFields.push('code = $' + (updateFields.length + 1))
    updateValues.push(updates.code)
  }
  if (updates.prize_amount !== undefined) {
    updateFields.push('prize_amount = $' + (updateFields.length + 1))
    updateValues.push(updates.prize_amount)
  }
  if (updates.max_uses !== undefined) {
    updateFields.push('max_uses = $' + (updateFields.length + 1))
    updateValues.push(updates.max_uses)
  }
  if (updates.current_uses !== undefined) {
    updateFields.push('current_uses = $' + (updateFields.length + 1))
    updateValues.push(updates.current_uses)
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update')
  }

  updateValues.push(id)

  const query = `
    UPDATE vouchers 
    SET ${updateFields.join(', ')}
    WHERE id = $${updateValues.length}
    RETURNING *
  `

  const result = await sql.unsafe(query, updateValues)

  if (result.length === 0) {
    throw new Error('Voucher not found')
  }

  return {
    id: result[0].id,
    code: result[0].code,
    prize_amount: result[0].prize_amount,
    max_uses: result[0].max_uses,
    current_uses: result[0].current_uses,
    created_at: result[0].created_at,
  }
}

export const deleteVoucher = async (id: number): Promise<boolean> => {
  const result = await sql`
    DELETE FROM vouchers 
    WHERE id = ${id}
    RETURNING id
  `

  return result.length > 0
}

export const getVoucherById = async (id: number): Promise<Voucher | null> => {
  const result = await sql`
    SELECT * FROM vouchers 
    WHERE id = ${id}
  `

  if (result.length === 0) {
    return null
  }

  return {
    id: result[0].id,
    code: result[0].code,
    prize_amount: result[0].prize_amount,
    max_uses: result[0].max_uses,
    current_uses: result[0].current_uses,
    created_at: result[0].created_at,
  }
}

export const checkVoucherCodeExists = async (code: string, excludeId?: number): Promise<boolean> => {
  let query = sql`
    SELECT id FROM vouchers 
    WHERE code = ${code}
  `
  
  if (excludeId) {
    query = sql`
      SELECT id FROM vouchers 
      WHERE code = ${code} AND id != ${excludeId}
    `
  }

  const result = await query
  return result.length > 0
}

export const resetVoucherUsage = async (id: number): Promise<Voucher> => {
  const result = await sql`
    UPDATE vouchers 
    SET current_uses = 0
    WHERE id = ${id}
    RETURNING *
  `

  if (result.length === 0) {
    throw new Error('Voucher not found')
  }

  return {
    id: result[0].id,
    code: result[0].code,
    prize_amount: result[0].prize_amount,
    max_uses: result[0].max_uses,
    current_uses: result[0].current_uses,
    created_at: result[0].created_at,
  }
}
