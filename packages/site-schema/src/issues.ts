/**
 * Zod-issue → {@link ValidationError} projection, with **union localisation**.
 *
 * The envelope's job is not only to refuse a malformed document but to say
 * *where* it is malformed: DOC-8 §6 / REQ-107 make the actionable message the
 * whole point of the envelope for an AI author, which self-corrects from the
 * path it is handed.
 *
 * A plain `z.union` defeats that. The L1 node vocabulary is a union of six
 * `kind`-tagged object schemas, so when a `box` carries an unrecognised key Zod
 * reports one `invalid_union` issue at the *union's* own path — `/root` — and
 * buries the six per-branch attempts inside it. The author is told the document
 * is invalid and nothing more; the offending field is never named.
 *
 * This module unburies it. When every branch but one failed on the *tag* (the
 * discriminator — `kind` for a node, and discovered empirically rather than
 * hard-coded, so any tagged union in the schema benefits), the surviving branch
 * is the one the author meant. Its issues are the real ones, and their paths are
 * relative to the union's position, so they compose back onto it: a `keyframes`
 * string smuggled onto a box's entrance reports at `/root/reveal`, not `/root`.
 *
 * Recursive by construction — a union nested inside the chosen branch (a child
 * node inside a container's `children`) is localised the same way, so the path
 * reaches all the way down to `/root/children/0/reveal`.
 *
 * When no branch is distinguishable — the tag itself is missing or names no
 * member — nothing is guessed: the union's own issue is kept, because "this node
 * is not a node" *is* the accurate report in that case.
 */

/** The subset of a Zod issue this projection reads. */
interface Issue {
  readonly code?: string
  readonly path: readonly PropertyKey[]
  readonly message: string
  /** Present on `invalid_union`: the issues each branch produced, in order. */
  readonly errors?: readonly (readonly Issue[])[]
}

/** A single structural validation failure (mirrors `ValidationError`). */
interface ProjectedError {
  path: string
  message: string
}

/** JSON-pointer-style rendering of a Zod path segment list. */
function pointer(path: readonly PropertyKey[]): string {
  return '/' + path.map((seg) => String(seg)).join('/')
}

/** Does this branch report a mismatched literal at the single-segment key `key`? */
function mismatchesTag(branch: readonly Issue[], key: string): boolean {
  return branch.some(
    (issue) =>
      (issue.code === 'invalid_value' || issue.code === 'invalid_literal') &&
      issue.path.length === 1 &&
      String(issue.path[0]) === key,
  )
}

/**
 * Choose the branch the author meant, or `null` when the union is genuinely
 * ambiguous.
 *
 * The discriminator is *discovered*: a key is the tag iff mismatching it is
 * exactly what excluded every branch but one. Requiring a single survivor is
 * what makes this safe — a non-tag enum field (a container's `layout`) fails in
 * one branch only, leaving five survivors, so it can never be mistaken for the
 * tag. Among several qualifying keys the most discriminating wins, keeping the
 * choice independent of key iteration order.
 */
function chooseBranch(branches: readonly (readonly Issue[])[]): readonly Issue[] | null {
  if (branches.length < 2) return branches[0] ?? null

  const tags = new Set<string>()
  for (const branch of branches) {
    for (const issue of branch) {
      if ((issue.code === 'invalid_value' || issue.code === 'invalid_literal') && issue.path.length === 1) {
        tags.add(String(issue.path[0]))
      }
    }
  }

  let chosen: readonly Issue[] | null = null
  let bestExcluded = 0
  for (const tag of tags) {
    const survivors = branches.filter((branch) => !mismatchesTag(branch, tag))
    const excluded = branches.length - survivors.length
    if (survivors.length === 1 && excluded > bestExcluded) {
      chosen = survivors[0]
      bestExcluded = excluded
    }
  }
  return chosen
}

/**
 * Project Zod issues to `{ path, message }`, localising every union failure to
 * the branch the author meant. `base` prefixes the whole projection (used to
 * nest an L1 envelope report inside its page).
 */
export function projectIssues(issues: readonly Issue[], base: readonly PropertyKey[] = []): ProjectedError[] {
  const out: ProjectedError[] = []
  for (const issue of issues) {
    const at = [...base, ...issue.path]
    const branch = issue.code === 'invalid_union' && issue.errors ? chooseBranch(issue.errors) : null
    if (branch) {
      out.push(...projectIssues(branch, at))
      continue
    }
    out.push({ path: pointer(at), message: issue.message })
  }
  return out
}
