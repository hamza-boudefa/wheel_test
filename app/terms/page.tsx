import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Scale } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/">
            <Button
              variant="outline"
              className="bg-black border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-black"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Game
            </Button>
          </Link>
          <div className="flex items-center space-x-2 text-lime-400">
            <Scale className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Terms & Conditions</h1>
          </div>
        </div>

        <Card className="bg-black border-2 border-lime-400 shadow-2xl shadow-lime-400/20">
          <CardHeader className="text-center border-b border-lime-400/30">
            <CardTitle className="text-3xl font-bold text-lime-400">Terms & Conditions</CardTitle>
            <p className="text-lg text-gray-300 mt-2">
              "Score More with Every Task" Game Campaign for Ultima Markets MENA Region
            </p>
          </CardHeader>

          <CardContent className="p-8 space-y-6 text-gray-300 leading-relaxed">
            {/* Organizer */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">Organizer</h2>
              <p>
                This promotional campaign is organized by <strong className="text-lime-400">Ultima Markets Ltd</strong>,
                referred to hereafter as "Ultima Markets" or "the Company".
              </p>
            </section>

            {/* Campaign Details */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">
                Campaign Details
              </h2>
              <div className="bg-lime-400/10 border border-lime-400/30 p-4 rounded-lg">
                <p>
                  <strong className="text-lime-400">Campaign Name:</strong> Score More with Every Task
                </p>
                <p>
                  <strong className="text-lime-400">Start Date:</strong> Juin 15, 2025
                </p>
                <p>
                  <strong className="text-lime-400">End Date:</strong> Until further notice
                </p>
              </div>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">
                1. Eligibility
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Open to new and existing clients of Ultima Markets, except those in restricted jurisdictions as
                  defined in Ultima Markets' general terms and conditions.
                </li>
                <li>Participants must be 18 years or older.</li>
                <li>
                  Employees, affiliates, and immediate family members of Ultima Markets are not eligible to participate.
                </li>
              </ul>
            </section>

            {/* How to Participate */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">
                2. How to Participate
              </h2>
              <p className="mb-4">
                Participants must complete specific engagement tasks to earn spins on the promotional "wheel." The tasks
                include:
              </p>
              <div className="bg-lime-400/10 border border-lime-400/30 p-4 rounded-lg">
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>Follow Ultima Markets on Instagram</strong> – 1 spin
                  </li>
                  <li>
                    <strong>Comment on a designated post</strong> – 1 spin
                  </li>
                  <li>
                    <strong>Open a live trading account with Ultima Markets</strong> – Claim prize from spin
                  </li>
                  <li>
                    <strong>Join our Telegram community and answer 5 quiz questions</strong> – +1 spin
                  </li>
                  <li>
                    <strong>Tag 5 trading-interested friends on Instagram</strong> – +1 spin
                  </li>
                  <li>
                    <strong>Like 5 Ultima Markets posts on IG, LinkedIn, or Facebook</strong> – +1 spin (proof required)
                  </li>
                  <li>
                    <strong>Share your supported team in the Club World Cup as an IG story</strong> – +1 spin
                  </li>
                </ul>
              </div>
            </section>

            {/* Wheel Prizes */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">
                3. Wheel Prizes
              </h2>
              <p className="mb-4">The prize wheel includes the following outcomes:</p>
              <div className="bg-lime-400/10 border border-lime-400/30 p-4 rounded-lg">
                <ul className="list-disc list-inside space-y-2">
                  <li>
                    <strong>No chance</strong> (No prize)
                  </li>
                  <li>
                    <strong>$5 bonus credit</strong> (2x)
                  </li>
                  <li>
                    <strong>$10 bonus credit</strong> (2x)
                  </li>
                  <li>
                    <strong>$15 bonus credit</strong>
                  </li>
                  <li>
                    <strong>$20 bonus credit</strong>
                  </li>
                  <li>
                    <strong>$25 bonus credit</strong>
                  </li>
                  <li>
                    <strong>$30 bonus credit</strong>
                  </li>
                  <li>
                    <strong>$35 bonus credit</strong>
                  </li>
                </ul>
              </div>
              <p className="mt-4 text-sm text-gray-400">
                <strong>Note:</strong> All bonus credits are non-withdrawable, but profits generated from them are
                withdrawable, in line with Ultima Markets' existing promotional bonus policy.
              </p>
            </section>

            {/* Prize Redemption */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">
                4. Prize Redemption Conditions
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Participants must have an active live trading account to redeem any monetary bonus.</li>
                <li>Bonuses will be applied as credit, subject to Ultima Markets' promotional bonus policies.</li>
                <li>Participants must complete identity verification (KYC) before prizes can be credited.</li>
              </ul>
            </section>

            {/* Spin Limit */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">
                5. Spin Limit and Fair Use
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Each participant may spin a maximum of 7 times per week.</li>
                <li>
                  Abuse of the system through fake accounts, bots, or repetitive/fraudulent activity will lead to
                  disqualification and forfeiture of any bonus.
                </li>
                <li>
                  Ultima Markets reserves the right to verify participant activity and request additional documentation.
                </li>
              </ul>
            </section>

            {/* General Conditions */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">
                6. General Conditions
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>This game is purely promotional and does not constitute an investment offer.</li>
                <li>Bonus credit is governed by Ultima Markets' existing Bonus Terms & Conditions.</li>
                <li>Bonuses are not withdrawable.</li>
                <li>Profit made using bonuses is withdrawable per the company's policy.</li>
                <li>
                  If a client withdraws capital before meeting trading requirements, bonus credit may be partially or
                  fully removed.
                </li>
                <li>Refer to Ultima Markets' full bonus policy for more information.</li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-xl font-semibold text-lime-400 mb-3 border-b border-lime-400/30 pb-2">
                7. Disclaimer & Rights
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Ultima Markets reserves the right to amend, suspend, or cancel the promotion at its sole discretion.
                </li>
                <li>Participation in this game constitutes acceptance of these Terms & Conditions.</li>
                <li>All decisions made by Ultima Markets regarding this promotion are final and binding.</li>
                <li>This promotion is subject to applicable laws and regulations.</li>
              </ul>
            </section>

            {/* Contact Information */}
            {/* <section className="bg-lime-400/10 border border-lime-400/30 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-lime-400 mb-3">Contact Information</h2>
              <p>For questions regarding this promotion, please contact Ultima Markets customer support:</p>
              <div className="mt-3 space-y-1">
                <p>
                  <strong className="text-lime-400">Email:</strong> support@ultimamarkets.com
                </p>
                <p>
                  <strong className="text-lime-400">Website:</strong> www.ultimamarkets.com
                </p>
                <p>
                  <strong className="text-lime-400">Phone:</strong> +971-4-XXX-XXXX
                </p>
              </div>
            </section> */}

            {/* Last Updated */}
            {/* <div className="text-center text-sm text-gray-500 border-t border-lime-400/30 pt-4">
              <p>Last updated: December 15, 2024</p>
              <p>Version 1.0</p>
            </div> */}
          </CardContent>
        </Card>

        {/* Back to Game Button */}
        <div className="text-center mt-6">
          <Link href="/">
            <Button className="bg-lime-400 text-black hover:bg-lime-500 px-8 py-3 text-lg font-semibold">
              Return to Fortune Wheel Game
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
