---
uid: acceptance_criterion-b6e7c9b7
id: AC-2485
type: acceptance_criterion
title: 'A stored picture comes back as an image: PNG untouched, other formats rasterised
  to PNG by the browser with bytes inlined, then reduced like a page shot; undecodable
  refused'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:03:33.853079+00:00'
updated_at: '2026-11-09T21:56:35.975750+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A stored picture is returned by `screenshot` as an image, the same as a page shot. A stored PNG (recognised by its bytes, not its stored type) is passed through untouched, without leasing a browser, at its own dimensions. Any other format (JPEG, WebP, GIF, AVIF, SVG, …) is rasterised to PNG by the browser: its bytes are handed to the browser directly — the browser is never sent to fetch the picture from any address, and the address it is navigated to does not carry the picture (BUG-80) — and the PNG is taken at the picture's laid-out size. The result is then reduced exactly as a page shot is (1024px longest edge, same byte ceiling), and the reported size is after that reduction. A stored picture the browser will not decode is refused, naming the picture and its stored type, instead of a blank picture being returned.

## Verification
With a stubbed browser that records navigations, deliveries and leases: screenshot a stored PNG and assert the returned PNG equals the stored bytes (or their reduction), no browser was leased, and the size is the PNG's own. Screenshot a stored JPEG and assert a browser was leased, the picture's bytes reached the browser through its delivery channel rather than in the navigated address (no request to any picture URL), and a PNG image block came back. Screenshot an oversized stored picture and assert the returned size has a longest edge of at most 1024. Make the browser report a failed decode and assert the refusal names the picture and its stored type and carries no image block.
