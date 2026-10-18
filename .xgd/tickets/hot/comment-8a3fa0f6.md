---
uid: comment-8a3fa0f6
id: COMMENT-5472
type: comment
title: Comment on bug BUG-219
created_by: xgd
created_at: '2026-10-18T00:15:13.276891+00:00'
updated_at: '2026-10-18T00:39:55.759308+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-56b83619
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "04049ba9-d572-4202-b29e-402efcbb08a8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="707be9ae-0921-439e-8783-70ab2a48563b-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T00:13:21.091611+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="707be9ae-0921-439e-8783-70ab2a48563b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T00:19:34.930741+00:00" -->
#### Claude
Still investigating — I've found the diff code and suspect page-style fields under `l1` are skipped. Checking where `set_page_style` writes.

I've found the root cause of Gap 1. It's a single blind spot in the diff that builds the account record, and it explains the whole incident. I haven't changed any code yet.

## Root cause

`set_page_style` writes the page style into the L1 document, at `page.l1.<key>`. That covers the background, text colour, widths, fonts and `resources`. The valid keys come from `L1_DOCUMENT_KEYS` in `packages/site-schema/src/l1/schema.ts:2876`, which is every document key except `root`.

`diffPage` in `tools/generate/src/cli/ai/account-core.ts:309-318` builds the `account.changed` record, and it does this:

```ts
for (const key of unionKeys(before, after)) {
  if (key === 'l1' || key === 'modules') continue   // ← skips the whole l1 object
  diffValue(before[key], after[key], key, { page }, emit)
}
...
diffNodes([rootOf(before)], [rootOf(after)], ...)    // ← walks only l1.root
```

It skips the whole `l1` object so it can walk the element tree separately, but the separate walk only looks at `l1.root`. Every other key under `l1` is never compared. Any `set_page_style` or `use_font` change is therefore missing from the record. That's why the builder's change of document background from cream to near-black showed up only in its own summary.

### A worse consequence: false passes

The host's containment checks (`settleContainment`, line ~1142) read the same record. So when a worker changes the page style:
- A check of the form "only addresses X, Y changed" **passes** when it should fail.
- A check that the page has no changes **passes** when it should fail.

In other words, the host's check doesn't just stay silent — it confirms containment that wasn't kept. The worker's own check caught it this time; the host's would not have.

## Proposed fix (Gap 1)

1. In `diffPage`, also compare the L1 document keys other than `root`. Report each one as `{ page, field: 'l1.<key>' }` (for example `l1.background`), using the existing `diffValue`, so nested values like `resources.fonts` come out as their own entries.
2. Fix how containment reads those entries. `inElementTree` currently counts **any** field starting with `l1.` as part of the element tree. A page-style entry would therefore count as an element field for "fields" checks, which is wrong. It should treat only `l1.root…`, or entries with an address, as inside the tree, so page-style entries count as page-level.
3. Add UATs in `tests/test_UAT_FC_BUG-219_*.test.ts`, alongside the existing REQ-340 UAT, to check that:
   - `set_page_style` changing the background appears in `differences`;
   - an "addresses" containment check fails when the page style changed;
   - an unchanged page style adds no entries.

## Gaps 2 and 3: my recommendations

- **Gap 2 (a fixed "page X's style is unchanged" check):** once the fix above lands, the existing "page" and "addresses" checks already catch this. The epic notes say the proper answer is EPIC-24's frame/section scopes, which refuse the write outright. I'd add no new check wording here, so it doesn't become something else to maintain.
- **Gap 3 (builder guidance: fill the section's own box, never repaint the page):** this is prompt text. It doesn't need the ticket process, but I haven't found where the builder guidance lives yet. I can include it in this ticket's scope or leave it out.

## Decisions for you

1. Is "Gap 1 fix, the `inElementTree` correction and the UATs" the right scope?
2. Should Gap 3's guidance go in this session too?
3. Are you happy to drop Gap 2 in favour of EPIC-24?

<!-- xgd-turn id="5e09ee3b-aa61-4920-846a-3aeb3b65e3e5-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T00:39:50.679087+00:00" -->
#### You
okj go gap 1 and 3 fixes here please

<!-- xgd-chat-end -->