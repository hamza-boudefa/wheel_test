import { type NextRequest, NextResponse } from "next/server"
import { 
  getAllVouchers, 
  getVoucherStats, 
  getVoucherDistributionHistory,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getVoucherById,
  checkVoucherCodeExists,
  resetVoucherUsage
} from "@/lib/database"
import { verifyAdminSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminSession(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    switch (type) {
      case "stats":
        const stats = await getVoucherStats()
        return NextResponse.json({ success: true, stats })

      case "history":
        const history = await getVoucherDistributionHistory()
        return NextResponse.json({ success: true, history })

      case "single":
        if (!id) {
          return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }
        const voucher = await getVoucherById(Number.parseInt(id))
        if (!voucher) {
          return NextResponse.json({ error: "Voucher not found" }, { status: 404 })
        }
        return NextResponse.json({ success: true, voucher })

      default:
        const vouchers = await getAllVouchers()
        return NextResponse.json({ success: true, vouchers })
    }
  } catch (error) {
    console.error("Vouchers API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminSession(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, prizeAmount, maxUses } = body

    // Validation
    if (!code || !prizeAmount || !maxUses) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (typeof prizeAmount !== 'number' || prizeAmount <= 0) {
      return NextResponse.json({ error: "Invalid prize amount" }, { status: 400 })
    }

    if (typeof maxUses !== 'number' || maxUses <= 0) {
      return NextResponse.json({ error: "Invalid max uses" }, { status: 400 })
    }

    // Check if code already exists
    const codeExists = await checkVoucherCodeExists(code)
    if (codeExists) {
      return NextResponse.json({ error: "Voucher code already exists" }, { status: 400 })
    }

    const voucher = await createVoucher(code, prizeAmount, maxUses)
    return NextResponse.json({ success: true, voucher }, { status: 201 })
  } catch (error) {
    console.error("Create voucher error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminSession(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, code, prizeAmount, maxUses, currentUses, action } = body

    if (!id) {
      return NextResponse.json({ error: "Voucher ID is required" }, { status: 400 })
    }

    // Handle special actions
    if (action === 'reset') {
      const voucher = await resetVoucherUsage(id)
      return NextResponse.json({ success: true, voucher })
    }

    // Prepare updates object
    const updates: any = {}
    
    if (code !== undefined) {
      // Check if code already exists (excluding current voucher)
      const codeExists = await checkVoucherCodeExists(code, id)
      if (codeExists) {
        return NextResponse.json({ error: "Voucher code already exists" }, { status: 400 })
      }
      updates.code = code
    }

    if (prizeAmount !== undefined) {
      if (typeof prizeAmount !== 'number' || prizeAmount <= 0) {
        return NextResponse.json({ error: "Invalid prize amount" }, { status: 400 })
      }
      updates.prize_amount = prizeAmount
    }

    if (maxUses !== undefined) {
      if (typeof maxUses !== 'number' || maxUses <= 0) {
        return NextResponse.json({ error: "Invalid max uses" }, { status: 400 })
      }
      updates.max_uses = maxUses
    }

    if (currentUses !== undefined) {
      if (typeof currentUses !== 'number' || currentUses < 0) {
        return NextResponse.json({ error: "Invalid current uses" }, { status: 400 })
      }
      updates.current_uses = currentUses
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const voucher = await updateVoucher(id, updates)
    return NextResponse.json({ success: true, voucher })
  } catch (error) {
    console.error("Update voucher error:", error)
    if (error instanceof Error && error.message === 'Voucher not found') {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminSession(request)
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Voucher ID is required" }, { status: 400 })
    }

    const success = await deleteVoucher(Number.parseInt(id))
    
    if (!success) {
      return NextResponse.json({ error: "Voucher not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Voucher deleted successfully" })
  } catch (error) {
    console.error("Delete voucher error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
