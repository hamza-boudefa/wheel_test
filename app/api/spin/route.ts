import { type NextRequest, NextResponse } from "next/server"
import { getAvailableVoucher, incrementVoucherUsage, updateUserAfterSpin, getUser } from "@/lib/database"

const prizes = [
  { text: "ما في نصيب هل مرة", probability: 0.22 }, // 2 sections (22% total)
  { text: "$10", probability: 0.22 }, // 2 sections (22% total)
  { text: "$20", probability: 0.22 }, // 2 sections (22% total)
  { text: "$30", probability: 0.11 }, // 1 section (11% total)
  { text: "$40", probability: 0.11 }, // 1 section (11% total)
  { text: "$50", probability: 0.12 }, // 1 section (12% total)
]

export async function POST(request: NextRequest) {
  try {
    const { userEmail, wheelPrize } = await request.json()
    console.log("Wheel Prize:", wheelPrize)

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 })
    }

    if (!wheelPrize) {
      return NextResponse.json({ error: "Wheel prize is required" }, { status: 400 })
    }

    // Check if user exists and has credits
    const user = await getUser(userEmail)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (user.credits <= 0) {
      return NextResponse.json({ error: "No credits available" }, { status: 400 })
    }

    // Use the wheel prize directly instead of calculating probability
    let finalPrize = wheelPrize

    // Check if it's a monetary prize and try to find a voucher
    const prizeAmount = wheelPrize.startsWith("$") ? Number.parseInt(wheelPrize.replace("$", "")) : null
    const voucher = prizeAmount ? await getAvailableVoucher(prizeAmount) : null

    if (voucher) {
      // Use the voucher and return the code
      await incrementVoucherUsage(voucher.id)
      finalPrize = voucher.code
      console.log("Voucher found:", voucher.code, "for amount:", prizeAmount)
    } else if (wheelPrize.startsWith("$")) {
      // No vouchers available, give "no luck" instead
      finalPrize = "ما في نصيب هل مرة"
      console.log("No voucher available for amount:", prizeAmount, "giving no luck")
    }

    // Update user after spin
    await updateUserAfterSpin(userEmail, finalPrize)

    return NextResponse.json({
      prize: finalPrize,
      isVoucher: finalPrize.startsWith("UMSPIN"),
      originalPrize: wheelPrize,
    })
  } catch (error) {
    console.error("Spin API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
