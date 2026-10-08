import { z } from 'zod'

// Normalise first, validate second: in Zod 4 a format check added by z.email()
// runs before later transforms, so trimming has to happen in its own step.
export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Adresse email invalide.'))

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Mot de passe requis.'),
})

export type LoginInput = z.infer<typeof loginSchema>
