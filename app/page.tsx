"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import UserForm from "@/components/user-form"
import { createUser, getUser, initializeDatabase, type User } from "@/lib/database"
import { Trophy, RotateCcw, Copy, Check } from "lucide-react"
import ConnectionStatus from "@/components/connection-status"
import Image from "next/image"
import FortuneWheel from "@/components/fortune-wheel"
export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(true)
  const [prize, setPrize] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [dbInitialized, setDbInitialized] = useState(false)
  const [isVoucher, setIsVoucher] = useState(false)
  const [originalPrize, setOriginalPrize] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isResultTransitioning, setIsResultTransitioning] = useState(false)

  useEffect(() => {
    const initDb = async () => {
      try {
        await initializeDatabase()
        setDbInitialized(true)
      } catch (error) {
        console.error("Failed to initialize database:", error)
      }
    }
    initDb()
  }, [])

  const handleUserSubmit = async (name: string, email: string) => {
    setLoading(true)
    try {
      let userData = await getUser(email)

      if (!userData) {
        userData = await createUser(name, email)
      }

      setUser(userData)
      setShowForm(false)
    } catch (error: any) {
      console.error("Error handling user:", error)

      let errorMessage = "حدث خطأ. يرجى المحاولة مرة أخرى."

      if (error.message.includes("network") || error.message.includes("connection")) {
        errorMessage = "خطأ في الشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى."
      } else if (error.message.includes("timeout")) {
        errorMessage = "انتهت مهلة الطلب. يرجى المحاولة مرة أخرى."
      } else if (error.message) {
        errorMessage = error.message
      }

      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSpin = async (wheelPrize: string) => {
    console.log(wheelPrize)
    if (!user) return

    setIsResultTransitioning(true)

    try {
      const response = await fetch("/api/spin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userEmail: user.email,
          wheelPrize:wheelPrize
         }),
      })

      if (!response.ok) {
        throw new Error("Failed to process spin")
      }

      const result = await response.json()
      const wonPrize = result.prize

      setPrize(wonPrize)
      setIsVoucher(result.isVoucher || false)
      setOriginalPrize(result.originalPrize || wonPrize)

      setTimeout(() => {
        setShowResult(true)
        setIsResultTransitioning(false)
      }, 3000)

      setUser((prev) =>
        prev
          ? {
              ...prev,
              credits: prev.credits - 1,
              total_spins: prev.total_spins + 1,
              prizes: [...prev.prizes, wonPrize],
            }
          : null,
      )
    } catch (error) {
      console.error("Error processing spin:", error)
      alert("حدث خطأ أثناء معالجة الدوران.")
      setIsResultTransitioning(false)
    }
  }

  const copyVoucherCode = async () => {
    if (prize && isVoucher) {
      try {
        await navigator.clipboard.writeText(prize)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error("Failed to copy:", error)
      }
    }
  }

  const resetGame = () => {
    setPrize(null)
    setShowResult(false)
    setIsVoucher(false)
    setOriginalPrize(null)
    setCopied(false)
    setIsResultTransitioning(false)

    if (user && user.credits <= 0) {
      setUser(null)
      setShowForm(true)
    }
  }
const winningPrize= (wonPrize:any)=>{
  console.log("Prize from wheel:", wonPrize)
}
  if (!dbInitialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto text-center bg-black border-lime-400">
          <CardContent className="p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400 mx-auto mb-4"></div>
            <p className="text-lime-300 arabic-text">جاري تهيئة قاعدة البيانات...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <ConnectionStatus />
          <UserForm onSubmit={handleUserSubmit} loading={loading} />
        </div>
      </div>
    )
  }

  if (showResult && prize) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <ConnectionStatus />
        <Card className="w-full max-w-md mx-auto text-center bg-black border-2 border-lime-400" dir="rtl">
          {prize !== "ما في نصيب هالمرة" && (
            <CardHeader>
              <CardTitle className="text-2xl arabic-text text-lime-400">
                {isVoucher ? "مبروك! لقد فزت بكوبون خصم:" : "مبروك! لقد فزت بـ:"}
              </CardTitle>
              <div className="flex justify-center mb-4">
                <Trophy className="h-16 w-16 text-lime-400" />
              </div>
            </CardHeader>
          )}
          <CardContent className="space-y-4">
            {isVoucher ? (
              <div className="space-y-4">
                <div className="bg-lime-400/10 border border-lime-400/30 rounded-lg p-4">
                  <p className="text-sm text-lime-300 mb-2 arabic-text">كود الكوبون:</p>
                  <div className="flex items-center justify-center space-x-2 bg-black border border-lime-400 rounded p-3">
                    <code className="text-xl font-mono text-lime-400 tracking-wider">{prize}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={copyVoucherCode}
                      className="text-lime-400 hover:bg-lime-400/20"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 arabic-text">قيمة الكوبون: {originalPrize}</p>
                  <p className="text-xs text-lime-300 mt-1 arabic-text">انقر على أيقونة النسخ لنسخ الكود</p>
                </div>
              </div>
            ) : (
              <div className="text-4xl font-bold text-lime-400 arabic-text">{prize}</div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-400 arabic-text">النقاط المتبقية: {user?.credits || 0}</p>
              <p className="text-sm text-gray-400 arabic-text">إجمالي المحاولات: {user?.total_spins || 0}</p>
            </div>
            <Button onClick={resetGame} className="w-full arabic-text bg-lime-400 hover:bg-lime-500 text-black">
              {/* <RotateCcw className="h-4 w-4 ml-2" /> */}
              رجوع للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <ConnectionStatus />

        <div className="text-center mb-6">
          <div className="bg-black rounded-lg p-4 inline-block shadow-2xl border border-lime-400/30">
            <Image src="/ultima-logo.png" alt="Ultima Markets" width={450} height={100} className="h-18  w-32" />
          </div>
        </div>

        <div className="text-center mb-8">
          {user && (
            <Card className="max-w-md mx-auto mb-6 bg-black border-lime-400/50" dir="rtl">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-right">
                    <Badge
                      variant={user.credits > 0 ? "default" : "destructive"}
                      className={`arabic-text ${user.credits > 0 ? "bg-lime-400 text-black" : ""}`}
                    >
                      {user.credits} نقطة
                    </Badge>
                    <p className="text-xs text-gray-400 mt-1 arabic-text">إجمالي المحاولات: {user.total_spins}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold arabic-text text-lime-400">{user.name}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <FortuneWheel onSpin={handleSpin} disabled={!user || user.credits <= 0 || isResultTransitioning}   getWonPrize={winningPrize} 
  />

        {user && user.credits <= 0 && (
          <Card className="max-w-md mx-auto mt-6 text-center bg-black border-2 border-lime-400/50" dir="rtl">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-2 arabic-text text-lime-400">لا توجد نقاط متبقية</h3>
              <p className="text-gray-400 mb-4 arabic-text">
                لقد أتممت كل محاولاتك. يمكنك كسب فرص إضافية من خلال تنفيذ التحديات على إنستغرام.
              </p>
              <Button
                onClick={resetGame}
                variant="outline"
                className="arabic-text border-lime-400 text-lime-400 hover:bg-lime-400 hover:text-black bg-transparent"
              >
                رجوع للصفحة الرئيسية
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
