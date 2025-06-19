"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Chatbot } from "@/components/chatbot"
import { ArrowLeft, CheckCircle, AlertCircle, Info } from "lucide-react"
import Image from "next/image"

const FLASK_API_BASE_URL = process.env.NEXT_PUBLIC_FLASK_API_URL || "http://localhost:5000";

interface PredictionResult { 
  class: string;
  confidence: number;
}

interface AnalysisResult {
  prediction: PredictionResult; 
  explanation_image_url: string;
  original_image_url: string;
  message?: string;
}


export default function ResultsPage() {
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedResult = sessionStorage.getItem("analysisResult")
    if (storedResult) {
    const parsedResult = JSON.parse(storedResult);
    
    if (parsedResult.prediction && typeof parsedResult.prediction === 'object' && 
        'class' in parsedResult.prediction && 'confidence' in parsedResult.prediction) {
      setResult({
        prediction: parsedResult.prediction, 
        original_image_url: parsedResult.original_image_url || parsedResult.originalImage, 
        explanation_image_url: parsedResult.explanation_image_url || parsedResult.limeImage, 
        message: parsedResult.message,
      });
    } else {
        // Jeśli struktura prediction jest niepoprawna, przekieruj lub pokaż błąd
        console.error("Invalid prediction format received:", parsedResult);
        router.push("/");
    }
  } else {
    router.push("/");
  }
  }, [router])

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    )
  }

const getResultColor = (predictionData: PredictionResult) => {
  if (!predictionData || typeof predictionData.class !== 'string') {
    return "bg-slate-100 text-slate-800 border-slate-200";
  }
  switch (predictionData.class.toLowerCase()) {
    case "normal":
      return "bg-green-100 text-green-800 border-green-200"
    case "covid":
      return "bg-red-100 text-red-800 border-red-200"
    case "viral pneumonia": 
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "pneumonia":
      return "bg-red-100 text-red-800 border-red-200" 
    default:
      return "bg-slate-100 text-slate-800 border-slate-200"
  }
}
const getResultIcon = (predictionData: PredictionResult) => {
  if (!predictionData || typeof predictionData.class !== 'string') {
    return <Info className="h-5 w-5" />; 
  }
  switch (predictionData.class.toLowerCase()) {
    case "normal":
      return <CheckCircle className="h-5 w-5" />
    case "covid":
      return <AlertCircle className="h-5 w-5" />
    case "viral pneumonia":
      return <AlertCircle className="h-5 w-5" />
    case "pneumonia":
      return <AlertCircle className="h-5 w-5" />
    default:
      return <Info className="h-5 w-5" />
  }
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
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
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Upload
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Results Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-4">Analysis Results</h1>
            <p className="text-slate-600">AI-powered chest X-ray diagnosis with visual explanations</p>
          </div>

          {/* Prediction Results */}
          <Card className="mb-8 border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getResultIcon(result.prediction)} {}
                Diagnostic Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Predicted Class</h3>
                  <Badge className={`text-lg px-4 py-2 ${getResultColor(result.prediction)} pointer-events-none`}>
                    {result.prediction.class} {}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-3">Confidence Score</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${result.prediction.confidence}%` }}
                      ></div>
                    </div>
                      <span className="text-xl font-bold text-slate-800">{result.prediction.confidence.toFixed(1)}%</span> {}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Comparison */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Original Image */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle>Original X-Ray</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square relative bg-slate-100 rounded-lg overflow-hidden">
                  <Image
                    src={FLASK_API_BASE_URL + (result.original_image_url || "/placeholder.svg")}
                    alt="Original chest X-ray"
                    fill
                    className="object-contain"
                  />
                </div>
              </CardContent>
            </Card>

            {/* LIME Explanation */}
            <Card className="border-slate-200 shadow-lg">
              <CardHeader>
                <CardTitle>LIME Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square relative bg-slate-100 rounded-lg overflow-hidden">
                  {result.explanation_image_url ? ( 
                  <Image
                    src={FLASK_API_BASE_URL + (result.explanation_image_url || "/placeholder.svg")}
                    alt="LIME explanation visualization"
                    fill
                    className="object-contain"
                  />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-slate-600">Generating explanation...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>LIME Explanation:</strong> Highlighted regions show areas that most influenced the AI's
                    decision. Green areas support the prediction, while red areas contradict it.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 text-center">
            <Button
              onClick={() => router.push("/")}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Analyze Another Image
            </Button>
          </div>

          {/* Medical Disclaimer */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Important:</strong> This AI analysis is for educational and research purposes only. These results
              should not replace professional medical diagnosis. Always consult with qualified healthcare professionals.
            </p>
          </div>
        </div>
      </main>

      <Chatbot />
    </div>
  )
}
