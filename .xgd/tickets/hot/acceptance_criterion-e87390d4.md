---
uid: acceptance_criterion-e87390d4
id: AC-854
type: acceptance_criterion
title: Reference coverage is reported every run — mirrored-vs-referenced media and
  page height per captured section
created_by: xgd
created_at: '2026-08-06T03:13:03.652072+00:00'
updated_at: '2026-08-07T23:54:20.822637+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Every cross-gate run reports **reference coverage** — cheap, browser-free proxies for
"did the capture actually record this page", read from the bundle alone. Both numbers
were already computed by the pipeline and never surfaced as a signal.

Reported always, on passing runs as well as failing ones:
- **media coverage** — how many image assets the capture mirrored into the bundle, how
  many of those some element of the reference manifest carries as its media source, and
  the local paths of the ones nothing references (truncated in the human-readable output
  when the list is long);
- **segmentation density** — how many sections the capture segmented the reference page
  into, the reference page's full document height, and the height per section.

Coverage is measured once, against the widest resting-state projection on the reference's
primary engine — coverage is a whole-page question, asked at the width the full-page
screenshot was taken at rather than averaged across the width ladder.

Either proxy coming back suspect is reported as a named coverage finding with a sentence
saying what was measured and why it reads as a gap: mirrored image bytes attributed to
no element, or a page segmented into bands so long that under-segmentation is the likely
reading. A long band is not wrong by itself — a uniformly-styled page is legitimately one
section — so a coverage finding is evidence that shapes the verdict, never a failure on
its own.

## Verification
Run the reconciliation against a bundle whose mirrored images exceed those any element
references and assert the report states both counts, lists the unreferenced paths, and
raises the media finding. Run it against a bundle whose page height per section is far
over the density proxy and assert the segmentation finding is raised with both numbers.
Assert a bundle whose coverage is clean still reports all of the counts, and that a
coverage finding alone — with the perceptual eye within its floor — does not fail the run.