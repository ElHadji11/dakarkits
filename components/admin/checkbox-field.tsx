'use client'

import { useId, useState } from 'react'

import { useFieldPatch } from '@/components/admin/field-patch'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

/**
 * Radix's checkbox is a button, so it posts nothing. This pairs it with a
 * hidden input that mirrors its state, matching the "on" / absent convention
 * the Zod `checkbox` preprocessor expects.
 */
export function CheckboxField({
  name,
  label,
  hint,
  defaultChecked = false,
}: {
  name: string
  label: string
  hint?: string
  defaultChecked?: boolean
}) {
  const [checked, setChecked] = useState(defaultChecked)
  const id = useId()

  useFieldPatch(name, (patched) => setChecked(patched === 'on'))

  return (
    <div className="flex items-start gap-3">
      {checked ? <input type="hidden" name={name} value="on" /> : null}
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => setChecked(value === true)}
        className="mt-1"
      />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="font-normal">
          {label}
        </Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  )
}
