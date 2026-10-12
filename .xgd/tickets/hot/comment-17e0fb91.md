---
uid: comment-17e0fb91
id: COMMENT-5359
type: comment
title: Comment on chat CHAT-61
created_by: xgd
created_at: '2026-10-12T15:17:25.294012+00:00'
updated_at: '2026-10-12T15:18:32.516635+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-a516d6c6
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b71bc2af-b567-4206-96fa-b68914783c1b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ffae1ede-ec53-4720-aa23-939307ba9361-user" -->

<!-- xgd-chat role="user" ts="2026-10-12T15:17:09.298149+00:00" -->
#### You
I am doing a beta test but we are a little stuck, my beta tester has hit the cloudflare login - can I create a cloudflare identity that will let him access the app?

<!-- xgd-turn id="ffae1ede-ec53-4720-aa23-939307ba9361-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-12T15:18:32.347405+00:00" -->
#### Claude
Checking how the app admits people — there's an invites module that may already handle the Access side.

Found the relevant code — checking the sign-in bypass notes and how a new person gets admitted.

Yes, you can. There are two gates, though, and the Cloudflare login is only the first. Getting through it still leaves him at the builder's own admission check.

**The two gates**

1. **Cloudflare Access at the edge.** `app.1stcontact.io` is a Zero Trust application. It uses One-time PIN login and allows a list of individual emails; per `apps/control-app/ACCESS.md`, the only human on that list is you. Anyone else gets the Cloudflare login page.
2. **The Worker's `admit` check.** After Access lets someone through, the Worker still needs a `users` row and a membership for that email. Without them it refuses with `no_user` or `no_membership` (`apps/control-app/src/identity.ts:1068`).

**Option 1: add him to Access (fastest)**

1. In the Cloudflare dashboard, go to Zero Trust → Access → Applications → `app.1stcontact.io` → Policies.
2. Edit the allow policy and add his exact email under Include → Emails. Use his address, not his domain: `ACCESS.md` explains that a domain rule would let in anyone who ever holds an address there.
3. He'll then get a PIN by email at the Cloudflare page and pass the edge.
4. He still needs the second gate. Add him as a person on the business he's testing and give him a membership; the Users/People tab is the place. Until that exists he'll get a "denied" page from the app instead of the Cloudflare one.
5. Add a row to the "Granted identities" table in `ACCESS.md` saying who he is and why. That file is meant to be the record of the policy, and it's a doc change, so no ticket is needed.

**Option 2: the magic-link sign-in (how customers are meant to get in)**

REQ-202 added `/sign-in`, which runs ahead of Access. It only works if Access has a bypass policy for those paths, which someone sets up by hand in Cloudflare. If you've set that up:

1. Add him as a contact on his business and press **Invite**. He'll get an emailed sign-in link.
2. Point him at `https://app.1stcontact.io/sign-in`, not the root URL. The root sends anyone without a session cookie to the Cloudflare login, and that's probably where he ended up.

Opening `https://app.1stcontact.io/sign-in` in a private window tells you whether the bypass exists. If you see the 1st Contact address form, it does. If you see the Cloudflare PIN page, it doesn't, and Option 1 is the quickest way in.

I haven't touched your Cloudflare settings and can't see the Access policies from here. If you'd like me to check them through the API, I'll need a `CLOUDFLARE_API_TOKEN` with Access: Apps and Policies read access.

<!-- xgd-chat-end -->