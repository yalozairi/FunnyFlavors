interface Caption {
  id: string
  content: string
  created_datetime_utc: string
  images: { id: string; url: string }[] | null
}

export default function FlavorCaptions({ captions }: { captions: Caption[] }) {
  if (captions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Previous Captions</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
          No captions have been generated with this flavor yet
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Previous Captions</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
        Most recent {captions.length} caption{captions.length !== 1 ? 's' : ''} generated with this flavor
      </p>

      <div className="flex flex-col gap-3">
        {captions.map((caption) => (
          <div
            key={caption.id}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4"
          >
            {caption.images?.[0]?.url && (
              <img
                src={caption.images[0].url}
                alt="Caption image"
                className="w-full max-h-32 object-cover rounded-lg mb-3"
              />
            )}
            <p className="text-sm text-slate-800 dark:text-slate-200">{caption.content}</p>
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
              {new Date(caption.created_datetime_utc).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
