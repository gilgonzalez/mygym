"use client"

import { useState } from "react"
import { useMediaUpload } from "@/hooks/useMediaUpload"
import { Button } from "@/components/Button"
import { Input } from "@/components/ui/input"

export default function TestUploadPage() {
  const { uploadMedia, isUploading, error } = useMediaUpload()
  const [file, setFile] = useState<File | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setUploadedUrl(null)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      const result = await uploadMedia(file)
      setUploadedUrl(result.publicUrl)
    } catch (err) {
      console.error("Upload failed:", err)
    }
  }

  return (
    <div className="container max-w-md mx-auto py-10 space-y-6">
      <h1 className="text-2xl font-bold">Prueba de Subida a R2</h1>
      
      <div className="space-y-4">
        <Input 
          type="file" 
          onChange={handleFileChange} 
          accept="image/*,video/*,audio/*"
        />
        
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
          className="w-full"
        >
          {isUploading ? "Subiendo..." : "Subir Archivo"}
        </Button>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
          Error: {error}
        </div>
      )}

      {uploadedUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-green-600">¡Subida exitosa!</p>
          <div className="p-2 bg-muted rounded-md break-all text-xs font-mono">
            {uploadedUrl}
          </div>
          
          {file?.type.startsWith('image/') && (
            <div className="mt-4 rounded-lg overflow-hidden border">
              <img src={uploadedUrl} alt="Uploaded preview" className="w-full h-auto" />
            </div>
          )}
          
          {file?.type.startsWith('video/') && (
            <div className="mt-4 rounded-lg overflow-hidden border">
              <video src={uploadedUrl} controls className="w-full h-auto" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}