'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Step {
  id: number
  humor_flavor_id: number
  order_by: number
  humor_flavor_step_type_id: number | null
  llm_model_id: number | null
  llm_temperature: number | null
  description: string | null
  [key: string]: unknown
}

interface Model {
  id: number
  name: string
}

interface StepType {
  id: number
  slug: string
  description: string | null
}

interface InputType {
  id: number
  slug: string
  description: string | null
}

interface Props {
  flavorId: number
  steps: Step[]
  models: Model[]
  stepTypes: StepType[]
  inputTypes: InputType[]
}

function StepCard({
  step,
  index,
  total,
  models,
  stepTypes,
  inputTypes,
  flavorId,
  onRefresh,
}: {
  step: Step
  index: number
  total: number
  models: Model[]
  stepTypes: StepType[]
  inputTypes: InputType[]
  flavorId: number
  onRefresh: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [moving, setMoving] = useState(false)
  const [error, setError] = useState('')

  const [stepTypeId, setStepTypeId] = useState(String(step.humor_flavor_step_type_id ?? ''))
  const [inputTypeId, setInputTypeId] = useState(String(step.llm_input_type_id ?? ''))
  const [modelId, setModelId] = useState(String(step.llm_model_id ?? ''))
  const [temperature, setTemperature] = useState(String(step.llm_temperature ?? '0.7'))
  const [description, setDescription] = useState(step.description ?? '')
  const [saving, setSaving] = useState(false)

  const modelName = models.find((m) => m.id === step.llm_model_id)?.name ?? `#${step.llm_model_id}`
  const stepTypeName = stepTypes.find((s) => s.id === step.humor_flavor_step_type_id)?.slug ?? `#${step.humor_flavor_step_type_id}`

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/flavors/${flavorId}/steps/${step.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humor_flavor_step_type_id: stepTypeId ? Number(stepTypeId) : null,
          llm_input_type_id: inputTypeId ? Number(inputTypeId) : null,
          llm_model_id: modelId ? Number(modelId) : null,
          llm_temperature: temperature ? Number(temperature) : null,
          description,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      setEditing(false)
      onRefresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/flavors/${flavorId}/steps/${step.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to delete')
      }
      onRefresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeleting(false)
    }
  }

  const handleMove = async (direction: 'up' | 'down') => {
    setMoving(true)
    setError('')
    try {
      const res = await fetch(`/api/flavors/${flavorId}/steps/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId: step.id, direction }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to reorder')
      }
      onRefresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setMoving(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        {/* Order badge + move buttons */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => handleMove('up')}
            disabled={index === 0 || moving}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
            title="Move up"
          >
            ▲
          </button>
          <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-sm font-bold">
            {step.order_by}
          </span>
          <button
            onClick={() => handleMove('down')}
            disabled={index === total - 1 || moving}
            className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
            title="Move down"
          >
            ▼
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {!editing ? (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-mono">
                  {stepTypeName}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{modelName}</span>
                {step.llm_temperature != null && (
                  <span className="text-xs text-slate-400 dark:text-slate-600">temp: {step.llm_temperature}</span>
                )}
              </div>
              {step.description && (
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-1">{step.description}</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {error && (
                <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Step Type</label>
                  <select
                    value={stepTypeId}
                    onChange={(e) => setStepTypeId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">— none —</option>
                    {stepTypes.map((st) => (
                      <option key={st.id} value={st.id}>{st.slug}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Input Type</label>
                  <select
                    value={inputTypeId}
                    onChange={(e) => setInputTypeId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">— none —</option>
                    {inputTypes.map((it) => (
                      <option key={it.id} value={it.id}>{it.slug}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">LLM Model</label>
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="">— none —</option>
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Temperature</label>
                <input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="w-32 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Step description..."
                  className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setError('') }}
                  className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!editing && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(true)}
              className="px-2.5 py-1.5 rounded text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2.5 py-1.5 rounded text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
            >
              {deleting ? '...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {error && !editing && (
        <div className="px-4 pb-3 text-xs text-red-600 dark:text-red-400">{error}</div>
      )}
    </div>
  )
}

export default function StepsManager({ flavorId, steps: initialSteps, models, stepTypes, inputTypes }: Props) {
  const router = useRouter()
  const [steps, setSteps] = useState(initialSteps)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newStepTypeId, setNewStepTypeId] = useState('')
  const [newInputTypeId, setNewInputTypeId] = useState('')
  const [newModelId, setNewModelId] = useState('')
  const [newTemperature, setNewTemperature] = useState('0.7')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const handleRefresh = () => {
    router.refresh()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch(`/api/flavors/${flavorId}/steps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          humor_flavor_step_type_id: newStepTypeId ? Number(newStepTypeId) : null,
          llm_input_type_id: newInputTypeId ? Number(newInputTypeId) : null,
          llm_model_id: newModelId ? Number(newModelId) : null,
          llm_temperature: newTemperature ? Number(newTemperature) : 0.7,
          description: newDescription || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create step')
      }
      const newStep = await res.json()
      setSteps((prev) => [...prev, newStep])
      setShowNewForm(false)
      setNewStepTypeId('')
      setNewInputTypeId('')
      setNewModelId('')
      setNewTemperature('0.7')
      setNewDescription('')
      router.refresh()
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Prompt Chain Steps</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {steps.length} step{steps.length !== 1 ? 's' : ''} — executed in order
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
        >
          + Add Step
        </button>
      </div>

      {/* New step form */}
      {showNewForm && (
        <form onSubmit={handleCreate} className="mb-6 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/50 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">New Step</h3>

          {createError && (
            <p className="text-xs text-red-600 dark:text-red-400">{createError}</p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Step Type</label>
              <select
                value={newStepTypeId}
                onChange={(e) => setNewStepTypeId(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">— none —</option>
                {stepTypes.map((st) => (
                  <option key={st.id} value={st.id}>{st.slug}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Input Type <span className="text-red-500">*</span></label>
              <select
                value={newInputTypeId}
                onChange={(e) => setNewInputTypeId(e.target.value)}
                required
                className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">— select —</option>
                {inputTypes.map((it) => (
                  <option key={it.id} value={it.id}>{it.slug}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">LLM Model</label>
              <select
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">— none —</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Temperature</label>
            <input
              type="number"
              min="0"
              max="2"
              step="0.1"
              value={newTemperature}
              onChange={(e) => setNewTemperature(e.target.value)}
              className="w-32 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="What does this step do?"
              className="w-full px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-1.5 rounded bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors disabled:opacity-50"
            >
              {creating ? 'Adding...' : 'Add Step'}
            </button>
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setCreateError('') }}
              className="px-4 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Steps list */}
      <div className="flex flex-col gap-3">
        {steps.map((step, index) => (
          <StepCard
            key={step.id}
            step={step}
            index={index}
            total={steps.length}
            models={models}
            stepTypes={stepTypes}
            inputTypes={inputTypes}
            flavorId={flavorId}
            onRefresh={handleRefresh}
          />
        ))}

        {steps.length === 0 && (
          <div className="text-center py-12 text-slate-400 dark:text-slate-600">
            <p className="text-3xl mb-2">🔗</p>
            <p className="font-medium text-sm">No steps yet</p>
            <p className="text-xs mt-1">Add steps to define this humor flavor&#39;s prompt chain</p>
          </div>
        )}
      </div>
    </div>
  )
}
