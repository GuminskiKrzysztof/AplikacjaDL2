"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, X, FileImage } from "lucide-react"
import Image from "next/image"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  selectedFile: File | null
}

export function FileUpload({ onFileSelect, selectedFile }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        onFileSelect(file)
        const previewUrl = URL.createObjectURL(file)
        setPreview(previewUrl)
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".bmp", ".tiff"],
    },
    multiple: false,
  })

  const removeFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    onFileSelect(null as any)
  }

  if (selectedFile && preview) {
    return (
      <div className="space-y-4">
        <div className="relative">
          <div className="aspect-square max-w-md mx-auto bg-slate-100 rounded-lg overflow-hidden border-2 border-slate-200">
            <Image
              src={preview || "/placeholder.svg"}
              alt="Selected X-ray preview"
              width={400}
              height={400}
              className="w-full h-full object-contain"
            />
          </div>
          <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-center">
          <p className="text-sm text-slate-600">
            <strong>Selected:</strong> {selectedFile.name}
          </p>
          <p className="text-xs text-slate-500">Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-blue-400 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"}
      `}
    >
      <input {...getInputProps()} />

      <div className="space-y-4">
        <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          {isDragActive ? (
            <Upload className="h-8 w-8 text-blue-600" />
          ) : (
            <FileImage className="h-8 w-8 text-slate-400" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {isDragActive ? "Drop your X-ray here" : "Upload Chest X-Ray"}
          </h3>
          <p className="text-slate-600 mb-4">Drag and drop your X-ray image, or click to browse</p>
          <Button variant="outline" className="border-slate-300">
            Choose File
          </Button>
        </div>

        <div className="text-xs text-slate-500">Supported formats: PNG, JPG, JPEG, BMP, TIFF (Max 10MB)</div>
      </div>
    </div>
  )
}
