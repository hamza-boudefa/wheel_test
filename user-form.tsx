"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ExternalLink, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface UserFormProps {
  onSubmit: (name: string, email: string) => void
  loading: boolean
}

export default function UserForm({ onSubmit, loading }: UserFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [showError, setShowError] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowError(false)

    if (!name.trim() || !email.trim()) {
      setShowError(true)
      return
    }

    onSubmit(name.trim(), email.trim())
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Ultima Markets Logo */}
      <div className="text-center mb-6">
        <div className="bg-black rounded-lg p-4 inline-block shadow-2xl border border-lime-400/50">
          <Image src="/images/ultima-logo.png" alt="Ultima Markets" width={200} height={60} className="h-12 w-auto" />
        </div>
      </div>

      <Card className="bg-black border-2 border-lime-400 shadow-2xl shadow-lime-400/20" dir="rtl">
        <CardHeader className="text-center border-b border-lime-400/30">
          <CardTitle className="text-2xl arabic-text text-lime-400">أدخل بياناتك</CardTitle>
          <CardDescription className="arabic-text text-gray-300">
            املأ معلوماتك لتدوير عجلة الحظ والفوز بجوائز مذهلة!
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {showError && (
              <Alert className="border-red-500 bg-red-900/50 backdrop-blur-sm" dir="rtl">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300 arabic-text">يرجى ملء جميع الحقول المطلوبة</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-right block arabic-text text-lime-400 font-semibold">
                الاسم الكامل *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-right arabic-text bg-black border-lime-400/50 text-white placeholder-gray-500 focus:border-lime-400 focus:ring-lime-400/20"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-right block arabic-text text-lime-400 font-semibold">
                البريد الإلكتروني *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-right arabic-text bg-black border-lime-400/50 text-white placeholder-gray-500 focus:border-lime-400 focus:ring-lime-400/20"
                required
              />
            </div>

            {/* Terms Agreement Notice */}
            <div className="space-y-4 p-4 bg-lime-400/10 rounded-lg border border-lime-400/30">
              <div className="flex items-start space-x-3 space-x-reverse">
                <Info className="h-5 w-5 text-lime-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 text-right">
                  <p className="text-sm arabic-text text-lime-300 font-medium mb-2">
                    إشعار مهم: الموافقة على الشروط والأحكام
                  </p>
                  <p className="text-xs arabic-text text-gray-300 leading-relaxed">
                    بالمشاركة في هذه اللعبة، فإنك توافق تلقائياً على{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-lime-400 hover:text-lime-300 underline inline-flex items-center"
                    >
                      الشروط والأحكام
                      <ExternalLink className="h-3 w-3 mr-1" />
                    </Link>{" "}
                    الخاصة بحملة "Score More with Every Task" من Ultima Markets.
                  </p>
                </div>
              </div>

              <div className="text-xs text-gray-400 arabic-text text-right space-y-1 border-t border-lime-400/20 pt-3">
                <p>• يجب أن تكون 18 سنة أو أكثر للمشاركة</p>
                <p>• الجوائز عبارة عن أرصدة مكافآت غير قابلة للسحب</p>
                <p>• الأرباح المحققة من المكافآت قابلة للسحب</p>
                <p>• يتطلب حساب تداول مباشر لاستلام الجوائز</p>
              </div>
            </div>

            {/* Age Confirmation */}
            <div className="bg-gray-900/50 border border-gray-600 p-3 rounded-lg">
              <p className="text-xs text-gray-300 arabic-text text-right">
                <strong>تأكيد العمر:</strong> بالمشاركة في هذه اللعبة، أؤكد أنني أبلغ من العمر 18 سنة أو أكثر وأنني مؤهل
                للمشاركة في هذه الحملة الترويجية.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full arabic-text bg-gradient-to-r from-lime-400 to-lime-500 hover:from-lime-500 hover:to-lime-600 text-black font-bold py-3 shadow-lg shadow-lime-400/30 transition-all duration-300"
              disabled={loading}
            >
              {loading ? "جاري التحميل..." : "المتابعة إلى العجلة"}
            </Button>

            <div className="text-center">
              <Link
                href="/terms"
                target="_blank"
                className="text-sm text-lime-400 hover:text-lime-300 underline inline-flex items-center arabic-text"
              >
                اقرأ الشروط والأحكام كاملة
                <ExternalLink className="h-3 w-3 mr-1" />
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
