'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const API_BASE = 'https://api.almostcrackd.ai'

type Step = 'idle' | 'presign' | 'upload' | 'register' | 'captions' | 'done' | 'error'

interface Caption {
  id: string
  content: string
  [key: string]: unknown
}

export default function TestCaptionGenerator({
  flavorId,
  flavorSlug,
}: {
  flavorId: number
  flavorSlug: string
}) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('idle')
  const [captions, setCaptions] = useState<Caption[]>([])
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    setFile(selected)
    setCaptions([])
    setStep('idle')
    setErrorMsg('')
    setUploadedImageUrl(null)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(selected)
  }

  const handleGenerate = async () => {
    if (!file) return

    setErrorMsg('')
    setCaptions([])
    setUploadedImageUrl(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const authHeader = { Authorization: `Bearer ${token}` }

      // Step 1: Presign
      setStep('presign')
      const presignRes = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType: file.type }),
      })
      if (!presignRes.ok) throw new Error(`Presign failed: ${presignRes.status}`)
      const { presignedUrl, cdnUrl } = await presignRes.json()

      // Step 2: Upload
      setStep('upload')
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)
      setUploadedImageUrl(cdnUrl)

      // Step 3: Register
      setStep('register')
      const registerRes = await fetch(`${API_BASE}/pipeline/upload-image-from-url`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      })
      if (!registerRes.ok) throw new Error(`Register failed: ${registerRes.status}`)
      const { imageId } = await registerRes.json()

      // Step 4: Generate captions with the specific humor flavor
      setStep('captions')
      const captionsRes = await fetch(`${API_BASE}/pipeline/generate-captions`, {
        method: 'POST',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, humorFlavorId: flavorId }),
      })
      if (!captionsRes.ok) throw new Error(`Caption generation failed: ${captionsRes.status}`)
      const captionData = await captionsRes.json()
      setCaptions(Array.isArray(captionData) ? captionData : [])

      setStep('done')
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
      setStep('error')
    }
  }

  const stepLabel: Record<Step, string> = {
    idle: '',
    presign: 'Step 1/4 — Generating upload URL...',
    upload: 'Step 2/4 — Uploading image...',
    register: 'Step 3/4 — Registering image...',
    captions: 'Step 4/4 — Generating captions...',
    done: '',
    error: '',
  }

  const isLoading = ['presign', 'upload', 'register', 'captions'].includes(step)

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Generate Test Captions
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Upload an image to generate captions using the <span className="font-mono text-purple-600 dark:text-purple-400">{flavorSlug}</span> humor flavor
      </p>

      {/* Image picker */}
      <div
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-400 dark:hover:border-purple-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors mb-4"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
          className="hidden"
          onChange={handleFileChange}
        />
        {preview ? (
          <img src={preview} alt="Preview" className="max-h-64 rounded-lg object-contain" />
        ) : (
          <div className="text-center">
            <p className="text-3xl mb-2">📷</p>
            <p className="text-slate-600 dark:text-slate-400 font-medium">Click to select an image</p>
            <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">JPEG, PNG, WebP, GIF, HEIC</p>
          </div>
        )}
      </div>

      {file && (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4">
          {file.name} ({(file.size / 1024).toFixed(1)} KB)
        </p>
      )}

      {/* Status */}
      {isLoading && (
        <div className="flex items-center gap-2 mb-4 text-sm text-purple-600 dark:text-purple-400">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {stepLabel[step]}
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!file || isLoading}
        className="w-full py-3 rounded-xl font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Generating...' : 'Generate Captions'}
      </button>

      {/* Error */}
      {step === 'error' && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-xl p-4 text-red-700 dark:text-red-300 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {step === 'done' && (
        <div className="mt-6">
          {uploadedImageUrl && (
            <img src={uploadedImageUrl} alt="Uploaded" className="w-full max-h-48 object-cover rounded-xl mb-4" />
          )}
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-3">
            Generated Captions ({captions.length})
          </h3>
          {captions.length > 0 ? (
            <div className="flex flex-col gap-2">
              {captions.map((caption, idx) => (
                <div
                  key={caption.id ?? idx}
                  className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-800 dark:text-slate-200"
                >
                  <span className="text-xs text-slate-400 dark:text-slate-600 font-mono mr-2">{idx + 1}.</span>
                  {caption.content}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">No captions were returned.</p>
          )}
        </div>
      )}
    </div>
  )
}
