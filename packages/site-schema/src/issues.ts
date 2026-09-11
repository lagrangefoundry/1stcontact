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
 * A union can also discriminate on SHAPE rather than on a literal, and one in
 * the schema does: a behavior slot's value is `z.union([node, node[]])`. No
 * literal excludes anything there, so the rule above finds no tag — and every
 * schema error anywhere inside a behavior slot used to collapse to the slot's
 * own path with Zod's default message, while the identical error in the page's
 * own `l1` tree named the offending key ([[BUG-76]] Defect 3). A branch that
 * failed at the union's own position was never the shape being written; a branch
 * that failed deeper is the right shape with bad content. One survivor by that
 * test is the branch the author meant.
 *
 * When no branch is distinguishable — the tag itself is missing or names no
 * member — nothing is guessed about WHERE the fault is: the union's own issue is
 * kept, because "this node is not a node" *is* the accurate report in that case.
 * What is added is WHAT would have been accepted: if every branch was excluded
 * by the same key, the message names that key and its closed set instead of
 * saying "Invalid input" ([[BUG-76]] Defect 3b).
 */

/** The subset of a Zod issue this projection reads. */
interface Issue {
  readonly code?: string
  readonly path: readonly PropertyKey[]
  readonly message: string
  /** Present on `invalid_union`: the issues each branch produced, in order. */
  readonly errors?: readonly (readonly Issue[])[]
  /** Present on `invalid_value`: the literals the branch would have accepted. */
  readonly values?: readonly unknown[]
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

/** Did this branch fail at the union's own position — i.e. on SHAPE, not content? */
function mismatchesAtRoot(branch: readonly Issue[]): boolean {
  return branch.some((issue) => issue.code === 'invalid_type' && issue.path.length === 0)
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
  if (chosen) return chosen

  /*
   * NO TAG, BUT STILL ONE SURVIVOR — the union discriminates on SHAPE rather
   * than on a literal ([[BUG-76]] Defect 3).
   *
   * A branch that failed with a type mismatch at the union's own position was
   * never the shape the author was writing; a branch that failed DEEPER is the
   * right shape with bad content inside it. When exactly one branch failed only
   * deeper, that is the branch they meant, and its issues carry the real paths.
   *
   * The case this exists for is a behavior slot, whose position wraps the node
   * union in a second union — `z.union([l1NodeSchema, z.array(l1NodeSchema)])`.
   * The array branch fails `invalid_type` at the root and the node branch fails
   * somewhere inside, so no literal excludes anything, `chooseBranch` used to
   * return null, and every schema error anywhere in a behavior slot's subtree
   * collapsed to "Invalid input" at the slot's own path — while the identical
   * error in the page's own `l1` tree named the offending key. Behavior slots
   * are exactly where modal and dialog authoring happens.
   *
   * Stated on shape rather than on slots, so any shape-discriminated union in
   * the schema localises the same way.
   */
  const deep = branches.filter((branch) => !mismatchesAtRoot(branch))
  if (deep.length === 1 && deep.length < branches.length) return deep[0]

  /*
   * Both branches survived that test, so neither was refused outright — which is
   * what a REPEATED slot looks like. The value is an array, so the array branch
   * parses at the root and fails somewhere inside it; the node branch fails on a
   * nested union rather than on a plain type, so it too reports at the root and
   * not before it. The tie-break is how far each branch gets once localised: a
   * branch that reaches a key three levels down was reading the author's shape,
   * and one that stops at the root was not. Unique deepest wins, and a tie is
   * left ambiguous rather than guessed.
   */
  const depths = deep.map(localisedDepth)
  const deepest = Math.max(...depths, 0)
  if (deepest === 0) return null
  const winners = deep.filter((_, i) => depths[i] === deepest)
  return winners.length === 1 ? winners[0] : null
}

/**
 * How far a branch's issues reach once localised, in path segments.
 *
 * Localised rather than raw, because a branch whose own issue sits at the root
 * may still be a union that resolves to a key several levels down — which is
 * exactly the node branch of a slot's union.
 */
function localisedDepth(branch: readonly Issue[]): number {
  let deepest = 0
  for (const error of projectIssues(branch)) {
    deepest = Math.max(deepest, error.path === '/' ? 0 : error.path.split('/').length - 1)
  }
  return deepest
}

/**
 * The valid values of the tag every branch rejected, when there is one
 * ([[BUG-76]] Defect 3b).
 *
 * When no branch survives, nothing is guessed about WHERE the fault is — the
 * union's own issue is the accurate report. But its message is Zod's default,
 * and `kind: "picture"` (the real name is `image`) reported "Invalid input" at a
 * correct and useless path. If every branch was excluded by the same key, that
 * key is the tag and the branches between them hold the closed set it admits;
 * naming both costs nothing and is the most self-correctable sentence the
 * envelope can emit.
 */
function tagVocabulary(
  branches: readonly (readonly Issue[])[],
): { key: string; values: string[] } | null {
  const byKey = new Map<string, Set<string>>()
  for (const branch of branches) {
    for (const issue of branch) {
      if (issue.code !== 'invalid_value' && issue.code !== 'invalid_literal') continue
      if (issue.path.length !== 1) continue
      const key = String(issue.path[0])
      const seen = byKey.get(key) ?? new Set<string>()
      for (const value of issue.values ?? []) seen.add(String(value))
      byKey.set(key, seen)
    }
  }
  for (const [key, values] of byKey) {
    // Every branch rejected on this key, so it is the tag rather than a field
    // that merely happened to be an enum in one member.
    const excluded = branches.filter((branch) => mismatchesTag(branch, key)).length
    if (excluded === branches.length && values.size > 0) {
      return { key, values: [...values] }
    }
  }
  return null
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
    const union = issue.code === 'invalid_union' && issue.errors ? issue.errors : null
    const branch = union ? chooseBranch(union) : null
    if (branch) {
      out.push(...projectIssues(branch, at))
      continue
    }
    const tag = union ? tagVocabulary(union) : null
    out.push({
      path: pointer(at),
      message: tag ? `${tag.key} is not one of: ${tag.values.join(', ')}` : issue.message,
    })
  }
  return out
}
