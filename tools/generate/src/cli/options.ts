import type { EditActor } from '../store'

/**
 * Options every command shares (REQ-145).
 *
 * WHY THIS IS NOT IN `commands.ts`. `edit.ts` is the structured-edit surface
 * and is required to be reachable from a Worker — REQ-142 took the filesystem
 * out of it for exactly that reason. It still imported this interface from
 * `commands.ts`, which reaches `node:path`, the filesystem store and the render
 * writer, and through it the module registry's two `.astro` imports. A
 * type-only import is erased before a bundler sees it, so nothing failed at
 * runtime — but the Worker's typecheck resolved the whole chain and broke on
 * components it will never render.
 *
 * A shared options type is not a reason to drag a filesystem into a Worker, so
 * it lives here, importing nothing but a string union.
 */
/** Options common to every command: working dir + which site tree to target. */
export interface GlobalOptions {
  cwd?: string
  sandbox?: boolean
  /**
   * Who is making this change (REQ-131). Recorded on every journal record so the
   * assistant can say WHO moved something, not only that it moved.
   *
   * Defaults to `cli`, which is what an unattributed caller genuinely is: the
   * two callers that are not a person at a terminal — the AI host and the
   * builder's own routes — each set it where they construct their options, and
   * that is the only place the distinction is knowable. Nothing about detecting
   * a change depends on this field (see `store/journal.ts`), so a caller that
   * forgets it produces a slightly less informative record and never a wrong
   * answer.
   */
  actor?: EditActor
}
