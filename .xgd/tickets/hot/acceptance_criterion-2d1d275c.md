---
uid: acceptance_criterion-2d1d275c
id: AC-1350
type: acceptance_criterion
title: The page's centred content column is recovered as a document constant, rejected
  unless it reproduces every sample
created_by: xgd
created_at: '2026-08-20T12:53:17.686158+00:00'
updated_at: '2026-08-20T12:56:52.109722+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: fail
---

## Criterion
The page's centred content column is recovered from the capture as a **document
constant** — the container maximum, the horizontal inset, and (where the page's content
stops short of that container) a content cap — fitted to where content actually sits at
each captured width.

**What the fit is measured from.** Only *content* boxes are evidence: a text-bearing
element narrower than the viewport. A full-bleed band spans the viewport and says nothing
about the column its contents are laid out in, so it is excluded.

- The column's **origin** at a width is the **modal** left edge of that content — the edge
  the most content shares, not the minimum. A real page has more than one gutter (a header
  set wider than its content column), and the extreme is whichever gutter happens to be
  widest, which is not the column the page is laid out in. Taking the minimum makes the fit
  fail outright.
- The column's **extent** at a width is measured among that column's **own** runs — the
  modal right edge of the boxes sharing the modal left edge — so a wide footer bar or an
  outdented header cannot set the content width.
- **inset** is the origin at the narrowest sampled width, where the container is not yet
  binding and only the padding shows; **container** is derived from any width at which the
  origin has risen above that inset, and every such width must agree on it to within a
  pixel.
- The **content cap** is the extent wherever the column has stopped growing — the smallest
  such extent — and is emitted only where some sampled width shows content narrower than
  the column would allow.

**The fit is a reproduction test, not a resemblance test.** It is verified against *every*
sampled width on *both* axes — the reconstructed origin and the reconstructed extent must
each land within a pixel of the measured one — and the whole column is **rejected** if any
sample misses. A page with no centred column therefore keeps its keyframes untouched
rather than acquiring an approximate column. A fit also requires enough evidence to be
identifiable: at least three sampled widths, and at least one width where the origin has
risen above the inset.

The recovered column is carried on the **document**, and only when some node actually
anchors to it — a column nothing refers to is not emitted.

## Verification
Fold a multi-width capture of a page laid out in a centred `max-width` column with
horizontal padding, and assert the folded document carries a column whose container, inset
and content cap equal the reference's, and that the column reproduces every sampled origin
and extent within a pixel.

Modal origin: give the same page a header set a few pixels wider than its content column
and assert the fit still recovers the content column (the modal edge) rather than failing
or fitting the header's gutter — asserting the recovered inset is the content column's.

Full-bleed exclusion: add a full-bleed band at every width and assert the recovered column
is unchanged, so the band contributed no evidence.

Content cap: fold a page whose content stops short of its container and assert a cap equal
to that stopped extent; fold one whose content fills the container and assert no cap is
emitted.

Rejection: fold a capture of a page with **no** centred column (content whose origin does
not follow one container-plus-inset rule across the ladder) and assert no column is
emitted and every node keeps its keyframes; perturb one sampled origin of an otherwise
clean fixture beyond a pixel and assert the whole column is rejected rather than fitted to
the remaining samples. Fold a capture of only two widths and assert no column is emitted.

Assert a document whose nodes all keep their keyframes carries no column even where a fit
was possible.