---
uid: comment-463798e9
id: COMMENT-2983
type: comment
title: Comment on bug BUG-91
created_by: xgd
created_at: '2026-09-14T03:59:26.254858+00:00'
updated_at: '2026-09-14T04:15:17.789416+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d3a73e81
  kind: chat_transcript
---

<!-- xgd-turn id="8206ca3e-d299-4f37-93cf-ec167cdc9996-user" -->

<!-- xgd-chat role="user" ts="2026-09-14T03:58:54.575658+00:00" -->
#### You
There is an issue with the site builder - all I see is: Module not found in catalog: 'contact-form' v5. Known modules: contact-form@7, carousel@3, account-portal@1, account-chrome@2. 

Where the site preview should be

<!-- xgd-turn id="8206ca3e-d299-4f37-93cf-ec167cdc9996-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-14T04:15:15.892843+00:00" -->
#### Claude
Diagnosed. Let me write up the ticket before touching code.

**Diagnosis**: this is BUG-85's failure recurring. `contact-form` was bumped 5→6→7 (REQ-241, REQ-243). Both bumps declared their migrations correctly and updated the repo fixtures — but the live D1 store was never carried, because nothing carries it. `upgradeSiteModules` is opt-in and the bumping commit can't reach D1 anyway. Five of your six local sites hold `contact-form@5`.

**Fix**: upgrade on load in `assembleSite` — the same choke point where REQ-114 already resolves the palette overlay. A *loaded* site has current-contract instances, just as it has literal colours. Nothing is written back; the existing `1c module upgrade --write` repair stays as-is and still reports them stale. Proceeding.

Now the implementation.

Now check that `@1stcontact/framework/worker` resolves from `tools/generate` and typechecks.

Now the UAT test.

Now the test.

Now merge back to `xgd-working`.

Fixed and landed on `xgd-working`.

## What was wrong

This is BUG-85's failure recurring. `contact-form` was bumped 5→6 (REQ-241) and 6→7 (REQ-243). Both bumps were done correctly *by the letter* — migrations declared, `missingMigrations` guard green, repo fixtures under `storage/sites/` carried to v7. Neither reached D1, because a commit can't. Five of your six local sites were left on `contact-form@5`:

```
site_62d3d009…  home.json         contact-form@5 (beta-form)
site_d669b155…  home.json         contact-form@5 ×2
site_936dd7c9…  home.json         contact-form@5 (enquiry)
site_bca807fc…  home.json + whitepapers.json   contact-form@5 (signup)
```

Which is exactly what `upgrade.ts`'s own doc comment predicts: *"a migration performed by editing files in the repo can only ever reach the fixtures, and the live stores are structurally guaranteed to be missed."*

## The fix

`assembleSite` now carries stale instances to the current contract before validating — the same choke point where REQ-114 already resolves the palette overlay. A *loaded* site has current-contract instances, just as it has literal colours; the stored pin is the store's business.

The justification is that a bump **cannot land** without a declared migration reaching it, so a stored instance can always be carried. Refusing to render one was refusing over a difference the framework already knows how to erase.

Ordering matters and is load-bearing: the upgrade runs *before* `validateSite`, so the definition validated is the definition rendered, and migrations that author L1 (account-chrome v1→v2 synthesises cards borrowing a possibly-referenced text colour) get the dangling-ref check and palette resolution.

**Nothing is written.** `1c module upgrade --write` / `POST /api/modules/upgrade` are unchanged and still report these instances as stale — because they are. Only the dark site is gone.

## Verification

7 UATs in `tests/test_UAT_FC_BUG-91_upgrade_on_load.test.ts`, over the real orphan lifted verbatim out of your store. Three of them fail without the fix. Targeted regression scope (storage port, BUG-85 upgrade, request-time render, generate, content modules) passes.

Full sweep: 4046 passed, 11 failed — all pre-existing. I checked: those files fail identically with and without my change when run in isolation (2 real failures — `bug32-webui-scope-rebrand` and `BUG-67 backend settings`); the other 9 are jsdom global-state cross-talk under parallel load (`Not implemented: navigation` leaking between files sharing the jsdom env).

## On your end

Reload the builder — wrangler dev picks the change up. If you want the store itself repaired rather than just rendered around it, say the word and I'll run the upgrade against your local D1.

<!-- xgd-chat-end -->