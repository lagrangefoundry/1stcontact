---
uid: comment-d21dfbcd
id: COMMENT-7794
type: comment
title: Claude response for fix_reconciliation_review report
created_by: xgd
created_at: '2026-11-04T21:42:27.661182+00:00'
updated_at: '2026-11-04T21:42:27.661182+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0af23f8d
  kind: note
---

I've addressed all six material gaps from report-0cfddba5, but none of the new or extended tests have been run. The fix prompt says not to run them, and no lint or typecheck covers `tests/`, so the workflow's suite run will be their first execution. No production code changed: there are four test-file edits plus matrix edits. I filed the completion report as report-0af23f8d with `progress_made=true, needs_more_work=false`.

**The six gaps:**
1. **AC-2276 (local mail capture):** the test now checks that `capturingMailer().sent` holds the messages in send order. I also reworded the AC: that list belongs to the local adapter, and through `mailerFor` the console line is what you can observe.
2. **AC-2240 (slug change):** after the slug changes to `shop`, the test edits and republishes under the new slug. It checks for a second revision, the same site key, and `/site/<key>/` serving the new copy.
3. **AC-2247 / AC-2179 (primary address):** the AC-2247 test moves the primary flag to the newer address. It checks that the list, the detail view, the address order and login all follow it. A new AC-2179 test does the same through the real `GET /api/people` route.
4. **AC-2157 (`/api/businesses` person):** the test now checks `person.name` is null before a name exists, equals the current name, and follows a name change.
5. **AC-2257 (only ownership reads the role):** a new test gives someone a `staff` membership. It checks they get in and can read the business like an owner, but get 403 at invite, record edit and sign-in status, and 404 at add-a-business. The AC now treats this as the main evidence and keeps the source scan as a backup.
6. **Provision a business from any business:** I added AC-2323 with a test that pins what happens today. From a customer business, an address only that business holds gets a 404. An address a 1st Contact person also holds creates a business owned by that unrelated person's account. I reworded AC-2202 to match how the control is actually offered, and recorded this as a code defect on both stories. It is not fixed, only documented, so it needs a follow-up ticket.

**Optional items I also did:**
- The AC-2242 `forget` test now proves a sibling site in the same business and a same-slug site in another business keep their rows and objects, and are still served.
- I corrected the wording the review flagged on story-7d255580, AC-2239 (scoped to keys this repo mints) and AC-2153 (provisioning isn't one atomic write).
- I recorded the two `messages.ts` defects on story-219b4217: a storage failure after the provider accepts marks the message `failed`, and a late `delivered` can overwrite `bounced`.

**Left alone:**
- The other optional suggestions (the AC-2310 decision, an AC for the `/api/publish` URL, the oldest-address fallback rule) are untouched.
- No FC-orphan report exists for this anchor, so I didn't touch any `test_UAT_FC_*` files.

**Needs your confirmation:** the review says the operator should confirm two recorded divergences:
- retiring BUG-55's "`1c assets` reports indexed, not primed" bullet;
- REQ-190's R2 bucket wipe, recorded as a deployment act.