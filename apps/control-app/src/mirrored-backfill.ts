/**
 * The mirrored-subresource index backfill (BUG-84), run as a Cron Trigger.
 *
 * WHY IT EXISTS. The rights gate on `POST /api/import` answers "did we mirror
 * these bytes?" from an index that `r2ReferenceStore` writes when a capture
 * member lands under `assets/`. Captures written before that index existed have
 * no entries, so their bytes would pass the gate. Indexing them inside the
 * import request is exactly the unbounded work the gate was rebuilt to avoid
 * (Architecture Policy #2, #31, #35), so it is a background job instead
 * (Policy #8).
 *
 * ONE BOUNDED STEP PER TICK. Each tick visits at most `MIRRORED_BACKFILL_PAGE`
 * keys and saves the R2 list cursor in R2, so the job's progress is durable
 * state rather than process memory: a killed tick resumes from the last saved
 * cursor, and a step repeated after a crash rewrites identical entries. Once the
 * whole bucket has been visited the state says `done` and every later tick is a
 * single GET.
 */
import { backfillMirroredIndex } from '../../../tools/generate/src/store/r2-reference-store'

/** Where the backfill keeps its cursor — outside every tenant prefix. */
export const MIRRORED_BACKFILL_STATE_KEY = 'ops/mirrored-index-backfill.json'

interface BackfillState {
  cursor?: string
  done: boolean
}

/** Run one step of the backfill against `BLOBS`; the state after it. */
export async function runMirroredBackfillTick(env: { BLOBS: R2Bucket }): Promise<BackfillState> {
  const saved = await env.BLOBS.get(MIRRORED_BACKFILL_STATE_KEY)
  const state: BackfillState = saved ? ((await saved.json()) as BackfillState) : { done: false }
  if (state.done) return state

  const progress = await backfillMirroredIndex(env.BLOBS, { cursor: state.cursor })
  const next: BackfillState = progress.done ? { done: true } : { cursor: progress.cursor, done: false }
  await env.BLOBS.put(MIRRORED_BACKFILL_STATE_KEY, JSON.stringify(next), {
    httpMetadata: { contentType: 'application/json' },
  })
  return next
}
