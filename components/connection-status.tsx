"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { WifiOff, Database } from "lucide-react"
import { checkDatabaseConnection } from "@/lib/database"

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [isDatabaseConnected, setIsDatabaseConnected] = useState(true)
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    const checkConnection = async () => {
      const online = navigator.onLine
      setIsOnline(online)

      if (online) {
        try {
          const dbConnected = await checkDatabaseConnection()
          setIsDatabaseConnected(dbConnected)
          setShowAlert(!dbConnected)
        } catch (error) {
          setIsDatabaseConnected(false)
          setShowAlert(true)
        }
      } else {
        setIsDatabaseConnected(false)
        setShowAlert(true)
      }
    }

    checkConnection()

    const handleOnline = () => {
      setIsOnline(true)
      checkConnection()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsDatabaseConnected(false)
      setShowAlert(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    const interval = setInterval(checkConnection, 30000)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      clearInterval(interval)
    }
  }, [])

  if (!showAlert) {
    return null
  }

  return (
    <Alert className="mb-4 border-red-200 bg-red-50" dir="rtl">
      {!isOnline ? <WifiOff className="h-4 w-4 text-red-600" /> : <Database className="h-4 w-4 text-red-600" />}
      <AlertDescription className="text-red-800 text-right">
        {!isOnline
          ? "أنت غير متصل بالإنترنت حالياً. يرجى التحقق من اتصالك بالإنترنت."
          : "غير قادر على الاتصال بقاعدة البيانات. يرجى تحديث الصفحة."}
      </AlertDescription>
    </Alert>
  )
}
