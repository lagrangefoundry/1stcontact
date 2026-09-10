/**
 * REQ-211 — the two projections of a text node's copy.
 *
 * `text` is now a union (a string, or an ordered list of runs), and almost
 * everything downstream of the schema wants one of exactly two things: the
 * **words**, for a label, a journal entry, a search or a join key; or the
 * **runs**, for the renderer and the editor. Both are stated once, here, because
 * a union with a dozen hand-written `typeof === 'string'` branches is how the
 * fold comes to join runs differently from the way the renderer emits them —
 * and a join that disagrees with the render is a page whose fidelity oracle
 * cannot pair its own text.
 *
 * Neither projection invents anything. A run carries its own separating spaces
 * verbatim ({@link L1TextRun.text}), so joining is concatenation and the words
 * of a multi-run node are byte-identical to the string the same copy would have
 * been written as.
 */
import type { L1TextContent, L1TextRun } from './types'

/**
 * The words a text node holds, whatever shape it holds them in.
 *
 * This is the projection every consumer that does not care about variation
 * should take: a label, a change-journal entry, the analytic evaluator's leaf
 * text, the fidelity oracle's join key.
 */
export function l1PlainText(content: L1TextContent): string {
  return typeof content === 'string' ? content : content.map((run) => run.text).join('')
}

/**
 * The node's copy as runs — a string becomes the single run it is.
 *
 * The renderer and the editor both walk runs; normalising here means neither
 * carries a branch for the string case, and the string case therefore cannot
 * drift from the run case. It is a READ projection only: a single-run list is
 * not a legal document (`l1TextContentSchema` requires two), so nothing built
 * from this may be written back without collapsing it again.
 */
export function l1TextRuns(content: L1TextContent): readonly L1TextRun[] {
  return typeof content === 'string' ? [{ text: content }] : content
}
