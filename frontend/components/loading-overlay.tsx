"use client"

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-8 max-w-sm mx-4 text-center shadow-2xl">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Processing your image...</h3>
        <p className="text-slate-600 text-sm">Our AI is analyzing your chest X-ray. This may take a few moments.</p>
      </div>
    </div>
  )
}
