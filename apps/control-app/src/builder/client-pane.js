/**
 * Which part of the builder the client has open in the preview ([[BUG-246]]).
 *
 * A MODULE OF ITS OWN, WITH NO IMPORTS, for `view-width.js`'s reason: the names
 * are needed on both sides of the seam. The builder reports which pane is open
 * with every prompt, and the consultant's digest names it — so "Story" on the
 * toggle and "Story" in what the consultant is told are the same word by
 * construction rather than by two tables agreeing.
 *
 * `looks` is the pane's Looks mode ([[BUG-250]]): the alternative looks for a
 * page, shown on their own, offered while the page shown has any.
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
