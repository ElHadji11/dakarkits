'use client'

import { useId, useState } from 'react'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const NONE = 'none'

/** Radix select plus a hidden input, so the value reaches the Server Action. */
export function SelectField({
  name,
  label,
  options,
  defaultValue,
  placeholder = 'Aucun',
  allowEmpty = true,
}: {
  name: string
  label: string
  options: ReadonlyArray<{ value: string; label: string }>
  defaultValue: string | null
  placeholder?: string
  allowEmpty?: boolean
}) {
  const [value, setValue] = useState(defaultValue ?? (allowEmpty ? NONE : options[0]!.value))
  const id = useId()

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value === NONE ? '' : value} />
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger id={id} className="h-12 w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? <SelectItem value={NONE}>{placeholder}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
