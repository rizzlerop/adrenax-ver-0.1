'use client'

import { useState } from 'react'
import { Layers3, Plus } from 'lucide-react'
import { Input, Select } from '@/components/ui/input'

type Category = { id: string; name: string }

export function CollectionPicker({ categories, defaultCategoryId, allowNewCollection = true }: { categories: Category[]; defaultCategoryId?: string | null; allowNewCollection?: boolean }) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing')

  return <fieldset>
    <legend className="text-xs font-medium text-white/55">Product collection</legend>
    <p className="mt-1 text-xs text-white/35">Choose an existing collection or create one while saving this product.</p>
    <div className={`mt-3 grid gap-3 ${allowNewCollection ? 'sm:grid-cols-2' : ''}`}>
      <label className="cursor-pointer">
        <input className="peer sr-only" type="radio" name="collection_mode" value="existing" checked={mode === 'existing'} onChange={() => setMode('existing')} />
        <span className={`flex min-h-12 items-center gap-2 rounded-xl border px-4 text-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-neon/60 ${mode === 'existing' ? 'border-neon/50 bg-neon/[.07] text-white' : 'border-white/10 bg-black/10 text-white/55 hover:border-white/20'}`}><Layers3 size={16} className={mode === 'existing' ? 'text-neon' : 'text-white/35'} />Use an existing collection</span>
      </label>
      {allowNewCollection && <label className="cursor-pointer">
        <input className="peer sr-only" type="radio" name="collection_mode" value="new" checked={mode === 'new'} onChange={() => setMode('new')} />
        <span className={`flex min-h-12 items-center gap-2 rounded-xl border px-4 text-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-neon/60 ${mode === 'new' ? 'border-neon/50 bg-neon/[.07] text-white' : 'border-white/10 bg-black/10 text-white/55 hover:border-white/20'}`}><Plus size={16} className={mode === 'new' ? 'text-neon' : 'text-white/35'} />Create a new collection</span>
      </label>}
    </div>
    <div className="mt-4">
      {mode === 'existing' || !allowNewCollection ? <label className="block text-xs font-medium text-white/55">Choose collection<Select name="category_id" defaultValue={defaultCategoryId ?? ''} className="mt-2"><option value="">No collection</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></label>
        : <label className="block text-xs font-medium text-white/55">New collection name<Input name="new_collection_name" required minLength={2} maxLength={80} placeholder="e.g. Training Essentials" className="mt-2" /><span className="mt-2 block text-xs leading-5 text-white/35">This collection will be created and assigned to the product when you save.</span></label>}
    </div>
  </fieldset>
}
