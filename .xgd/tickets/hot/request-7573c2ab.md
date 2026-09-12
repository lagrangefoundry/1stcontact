---
uid: request-7573c2ab
id: REQ-234
type: request
title: A band's backdrop gets WebP too, which means image-set() after all
created_by: EPIC-1
created_at: '2026-09-12T23:32:42.049163+00:00'
updated_at: '2026-09-12T23:59:18.870297+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: medium
  epic_parent: epic-34760bf1
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-222
  chat_comment: comment-d70ad543
---

## The gap

A photograph reaches a visitor two ways: as an `<img>` in the HTML, or as a CSS
background behind a band. [[REQ-222]] serves both at the right **width** —
`srcset` for the first, per-breakpoint rules for the second — and its reopened
`<picture>` work serves the first at the right **format**.

Nothing serves the second at the right format, and that is the half that matters
most. A band's backdrop is the hero photograph: typically the largest single file
on the page, and the reason REQ-222 was widened to cover backgrounds at all. As
things stand, WebP reaches every picture on a client's site except the expensive
one.

## What changes

**A background's per-width rules gain a format choice**, so a visitor whose
browser takes WebP gets WebP and everyone else gets the picture they get today.
The saving is the same one the `<img>` side is taking — roughly a quarter to a
third against JPEG at equivalent quality — applied to the biggest file rather
than the smallest.

**The mechanism is `image-set()` with `type()`**, because in CSS there is nothing
else. `<picture>` is an HTML element and has no reach into a `background-image`
declaration.

## Why this is not the `image-set()` REQ-222 turned down

REQ-222 rejected `image-set()` and its own words are the thing to answer:

> **PER-WIDTH RULES, NOT `image-set()`.** L1 already emits a rule per breakpoint
> and the widths the rules are keyed to are the same widths the geometry
> keyframes describe — which is what makes the choice principled rather than
> guessed. `image-set()` would be a second mechanism with its own support story
> for the same job.

**That reasoning is correct and it does not carry over, because the job is not
the same one.** For *width*, L1 already had a principled answer: it emits a rule
per breakpoint, and it knows the node's real width at each one, so it can choose
the right rendition rather than guess. `image-set()` would have been a second way
to do something already done well.

For *format* there is no first mechanism. A stylesheet cannot vary on `Accept`,
a per-breakpoint rule says nothing about what a browser can decode, and the
publish is static by design. `image-set()` is not a second answer here — it is
the only one.

**So the decision stands where it was made and is not reopened.** Widths continue
to come from the per-breakpoint rules keyed to geometry. `image-set()` enters for
format alone, inside those rules, and must not grow a width vocabulary of its own
— two mechanisms choosing width would be exactly the duplication REQ-222 refused.

## What has to be true for it to be safe

**A browser that cannot parse the declaration must get the picture, not a blank
band.** CSS drops a declaration it does not understand and keeps the last one it
did, so the plain `url()` rule stays and the `image-set()` rule follows it. That
is the ordinary CSS fallback and it wants no cleverness — but it does mean the
rules are emitted in that order, deliberately, and a UAT should pin the order
rather than the mere presence of both.

**The support story is the thing to verify first, and it is two questions, not
one.** `image-set()` itself is one; the `type()` function inside it is newer and
is the one this ticket actually rests on. Confirm both against current
documentation rather than a remembered list — the same discipline REQ-222 applied
to the transform vocabulary — and if `type()` is not reliably available, say so
and stop, because the fallback-only outcome is what we already ship.

**The rule count does not grow; the declaration does.** Backgrounds already emit a
rule per width where the choice changes. This changes what those rules *say*, not
how many there are, so nothing about the per-breakpoint machinery or the
smallest-rung base rule is disturbed.

## What this costs, and why it belongs after the latency work

**Every background rung gains a second rendition**, so the ladder's transform
count for backgrounds doubles — the same arithmetic the `<img>` side is taking,
on the file that is most expensive to transform.

REQ-222's own latency section is explicit that doubling the ladder is why publish
timing stopped being a footnote. **This ticket must not land before that work
does.** Adding the largest picture's second format to an unrationed synchronous
publish is the case that turns a first publish into an open-ended wait.

## What this does not change

**`convert` does not enter the editorial vocabulary.** A format is a delivery
decision — derived, disposable, invisible, never a question the client is asked —
and it belongs on the same side of the line REQ-222 already drew. The assistant
must not acquire a way to hand-pick codecs any more than it has a way to
hand-pick widths.

**Nothing is upscaled and renditions stay content-addressed**, on the original
plus the recipe plus the width plus now the format. A republished background that
has not changed costs no transforms, exactly as today.

**The document stays innocent of delivery.** No schema changes. A background is
still a URL on a box; what the publish does with it is the publish's business.

## Where it sits

The last piece of [[EPIC-1]]'s fourth verb. *Publish at a sane size* is nearly
true: widths reach every picture, and formats reach every picture placed as an
`<img>`. This is the one remaining picture that gets neither the format saving nor
an explanation of why not.

-