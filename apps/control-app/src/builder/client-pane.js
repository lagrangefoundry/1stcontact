/**
 * Which part of the builder the client has open in the preview ([[BUG-246]]).
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, for `view-width.js`'s reason: the names
 * are needed on both sides of the seam. The builder reports which pane is open
 * with every prompt, and the consultant's digest names it — so "Story" on the
 * toggle and "Story" in what the consultant is told are the same word by
 * construction rather than by two tables agreeing.
 *
 * `looks` IS NOT A MODE OF THE PANE: a look is shown in View, as a page of its
 * own. It is reported as a pane because to the client it is one — the looks band
 * is what they are looking at, not the draft.
 */

/** The panes, in the order the toggle offers them; `looks` last. */
export const CLIENT_PANES = ['view', 'edit', 'story', 'comparisons', 'looks']

/** What the builder calls each pane — the toggle's labels, and the digest's. */
export const PANE_LABELS = {
  view: 'View',
  edit: 'Edit',
  story: 'Story',
  comparisons: 'Comparisons',
  looks: 'Looks',
}
