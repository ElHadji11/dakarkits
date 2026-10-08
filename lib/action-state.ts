/**
 * Shared shape for every form Server Action. It lives outside the "use server"
 * modules because those may only export async functions.
 */
export type ActionState = {
  ok: boolean
  error: string | null
  /** Keyed by field name, so the form can show the message next to the input. */
  fieldErrors?: Record<string, string>
  /**
   * What was submitted, echoed back. React resets uncontrolled inputs once an
   * action settles, so a rejected form would otherwise lose everything typed.
   * The form feeds these back as `defaultValue`.
   */
  values?: Record<string, string>
}

/** Pulls the plain text fields out of a submission so they can be echoed back. */
export function submittedValues(formData: FormData, fields: string[]): Record<string, string> {
  const values: Record<string, string> = {}
  for (const field of fields) {
    const value = formData.get(field)
    if (typeof value === 'string') values[field] = value
  }
  return values
}

export const idle: ActionState = { ok: false, error: null }
