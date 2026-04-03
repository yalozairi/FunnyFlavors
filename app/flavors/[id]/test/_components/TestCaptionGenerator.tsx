'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const API_BASE = 'https://api.almostcrackd.ai'

type Step = 'idle' | 'presign' | 'upload' | 'register' | 'captions' | 'done' | 'error'
type Mode = 'test' | 'upload'

interface TestImage {
  id: number
  url: string
}

interface Caption {
  id: string
  content: string
  [key: string]: unknown
}

export default function TestCaptionGenerator({
  flavorId,
  flavorSlug,
  testImages,
}: {
  flavorId: number
  flavorSlug: string
  testImages: TestImage[]
}) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('test')
  const [selectedTestImage, setSelectedTestImage] = useState<TestImage | null>(null)

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
    if (mode === 'test' && !selectedTestImage) return
    if (mode === 'upload' && !file) return

    setErrorMsg('')
    setCaptions([])
    setUploadedImageUrl(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')

      const authHeader = { Authorization: `Bearer ${token}` }

      let imageId: number

      if (mode === 'test' && selectedTestImage) {
        // Test image is already registered — skip upload steps
        imageId = selectedTestImage.id
        setUploadedImageUrl(selectedTestImage.url)
      } else {
        // Step 1: Presign
        setStep('presign')
        const presignRes = await fetch(`${API_BASE}/pipeline/generate-presigned-url`, {
          method: 'POST',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentType: file!.type }),
        })
        if (!presignRes.ok) throw new Error(`Presign failed: ${presignRes.status}`)
        const { presignedUrl, cdnUrl } = await presignRes.json()

        // Step 2: Upload
        setStep('upload')
        const uploadRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file!.type },
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
        const data = await registerRes.json()
        imageId = data.imageId
      }

      // Generate captions with the specific humor flavor
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
    captions: mode === 'test' ? 'Step 1/1 — Generating captions...' : 'Step 4/4 — Generating captions...',
    done: '',
    error: '',
  }

  const isLoading = ['presign', 'upload', 'register', 'captions'].includes(step)
  const canGenerate = mode === 'test' ? !!selectedTestImage : !!file

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        Generate Test Captions
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Generate captions using the <span className="font-mono text-purple-600 dark:text-purple-400">{flavorSlug}</span> humor flavor
      </p>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => { setMode('test'); setStep('idle'); setErrorMsg(''); setCaptions([]); setUploadedImageUrl(null) }}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'test' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Test Images
        </button>
        <button
          onClick={() => { setMode('upload'); setStep('idle'); setErrorMsg(''); setCaptions([]); setUploadedImageUrl(null) }}
          className={`flex-1 py-1.5 rounded-md text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Custom Upload
        </button>
      </div>

      {/* Test Images grid */}
      {mode === 'test' && (
        testImages.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center mb-4">
            <p className="text-slate-400 dark:text-slate-600 text-sm">No test images found in the database.</p>
          </div>
        ) : (
          <div className="flex gap-3 mb-4">
            {/* Scrollable thumbnail grid */}
            <div className="flex-1 min-w-0 h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 p-1.5">
              <div className="flex flex-wrap gap-1.5">
                {testImages.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedTestImage(img)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 w-14 h-14 ${selectedTestImage?.id === img.id ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}
                  >
                    <img src={img.url} alt={`Test image ${img.id}`} className="w-full h-full object-cover" />
                    {selectedTestImage?.id === img.id && (
                      <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                        <span className="bg-purple-600 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            {/* Selected image preview */}
            {selectedTestImage && (
              <div className="flex-shrink-0 w-48 h-48 rounded-xl overflow-hidden border-2 border-purple-500 ring-2 ring-purple-500/30">
                <img src={selectedTestImage.url} alt="Selected" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )
      )}

      {/* Custom upload */}
      {mode === 'upload' && (
        <>
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
        </>
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
        disabled={!canGenerate || isLoading}
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
          {uploadedImageUrl && mode === 'upload' && (
            <img src={uploadedImageUrl} alt="Uploaded" className="w-full max-h-40 object-cover rounded-xl mb-4" />
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
