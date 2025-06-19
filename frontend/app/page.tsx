"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUpload } from "@/components/file-upload"
import { LoadingOverlay } from "@/components/loading-overlay"
import { Chatbot } from "@/components/chatbot"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Shield, Activity } from "lucide-react"

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("image", selectedFile)

      const response = await fetch("/api/predict", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        // Store result in sessionStorage to pass to results page
        sessionStorage.setItem(
          "analysisResult",
          JSON.stringify({
            prediction: result.prediction, 
            original_image_url: result.original_image_url,
            explanation_image_url: result.explanation_image_url,
            message: result.message,
          }),
        )
        router.push("/results")
      } else {
        throw new Error("Analysis failed")
      }
    } catch (error) {
      console.error("Error analyzing image:", error)
      alert("Failed to analyze image. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {isLoading && <LoadingOverlay />}

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src="/lung-icon.png"
              alt="Lung icon"
              className="h-12 w-12 sm:h-16 sm:w-16 drop-shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 hover:drop-shadow-xl hover:shadow-blue-500/30 flex-shrink-0"
            />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                MedAI <span className="font-semibold text-blue-700">Diagnosis</span>
              </h1>
              <div className="hidden sm:block w-px h-6 bg-slate-300"></div>
              <p className="text-sm sm:text-base text-slate-600 font-medium">Chest X-Ray Analysis Platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Upload Chest X-Ray</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Advanced AI-powered analysis for chest X-ray diagnosis. Upload your image to get instant results with
              confidence scores and visual explanations.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">AI Analysis</h3>
                <p className="text-sm text-slate-600">Advanced machine learning models for accurate diagnosis</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Secure & Private</h3>
                <p className="text-sm text-slate-600">Your medical data is processed securely and privately</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                  <Stethoscope className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">Clinical Grade</h3>
                <p className="text-sm text-slate-600">Designed for healthcare professionals and clinicians</p>
              </CardContent>
            </Card>
          </div>

          {/* Upload Section */}
          <Card className="border-slate-200 shadow-lg">
            <CardContent className="p-8">
              <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />

              <div className="mt-8 text-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || isLoading}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
                >
                  Analyze Image
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Medical Disclaimer:</strong> This tool is for educational and research purposes only. Always
              consult with qualified healthcare professionals for medical diagnosis and treatment decisions.
            </p>
          </div>
        </div>
      </main>

      <Chatbot />
    </div>
  )
}
