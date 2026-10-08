/** "Maillot Sénégal domicile 24/25" -> "maillot-senegal-domicile-24-25" */
export function slugify(input: string): string {
  const slug = input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/, '')

  return slug || 'maillot'
}

/**
 * Appends -2, -3, … until the slug is free. `taken` answers for the table being
 * written to, and should exclude the row currently being edited.
 */
export async function uniqueSlug(
  base: string,
  taken: (candidate: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(base)
  let candidate = root

  for (let n = 2; await taken(candidate); n++) {
    candidate = `${root}-${n}`
  }

  return candidate
}
