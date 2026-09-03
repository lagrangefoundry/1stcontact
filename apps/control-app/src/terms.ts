import type { Admission, IdentityEnv, UserRow } from './identity'
import { splitBusinessPrefix } from './scope'

/**
 * Terms of service, accepted before the builder loads (REQ-169) — [[DOC-40]] §4.
 *
 * THE VERSION IS THE POINT, NOT THE TIMESTAMP. `tos_accepted_at` alone records
 * *when* somebody clicked and says nothing about *what they clicked*, which is
 * the only question anybody ever asks of it. So acceptance stamps a version
 * identifier as well, and {@link TERMS_VERSION} is a date string rather than an
 * incrementing integer because the thing being identified is a document that was
 * in force on a day.
 *
 * BUMPING THE CONSTANT RE-PROMPTS EVERYBODY. {@link needsAcceptance} compares
 * rather than tests for presence, so the whole of "re-ask when the terms change"
 * is editing one line — and a user accepted at the previous version is prompted
 * again on their next request without anything having to sweep the table.
 *
 * IT BLOCKS THE BUILDER, NOT JUST THE CHROME. [[REQ-147]]'s lesson applies
 * unchanged: bytes served before a check are bytes served to someone who has not
 * passed it. So an unaccepted session is refused every asset and every API route,
 * not merely un-navigated-to — {@link guardTerms} sits beside the Access gate and
 * `admit` in `index.ts`, before a store handle exists and before a path is
 * examined, for the third time for the same reason.
 *
 * DECLINING IS NOT A STATE. There is no control that records a refusal, and the
 * absence is deliberate rather than unfinished: a stored "no" is a state the rest
 * of the system would then have to have an opinion about, forever, in order to
 * express something already expressed by closing the tab. The account is simply
 * never entered.
 *
 * THE TEXT IS LOREM IPSUM AND THAT IS NOT AN OVERSIGHT. The mechanism is what is
 * being built; the copy is a content dependency with its own lead time. It lives
 * in ONE constant, beside the version it is versioned by, so that supplying the
 * real text later is an edit and not a search.
 */

/**
 * The terms in force, identified by the day they came into force.
 *
 * A DATE STRING RATHER THAN A NUMBER, because what has to be recoverable from a
 * `users` row months afterwards is *which document* — and a document is findable
 * by the date it was published in a way it is not by "v3".
 */
export const TERMS_VERSION = '2026-09-01'

/**
 * The terms themselves. Placeholder copy, deliberately (see the file header).
 *
 * ONE CONSTANT, AND IT IS THE ONLY SOURCE THE PAGE IS BUILT FROM. Nothing below
 * restates a word of it, so replacing this value replaces what every caller is
 * shown. A UAT asserts every paragraph here reaches the served page, which is
 * what makes that claim evidence rather than an intention.
 *
 * Paragraphs are separated by a blank line and nothing else — no markup, because
 * the copy is going to be written by somebody who does not write markup.
 */
export const TERMS_TEXT = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.

Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.`

/** Where the terms are served, and where the accept control posts to. */
export const TERMS_PATH = '/terms'
export const TERMS_ACCEPT_PATH = '/api/terms/accept'

/**
 * What a sub-resource request from an unaccepted session is told.
 *
 * PROSE RATHER THAN A REDIRECT. This refusal is answered to an `<img>`, a module
 * script or a `fetch()` — none of which navigate — so there is nothing to redirect
 * *to*. The person is at a page that already says what to do; this is for the
 * developer console and for anybody driving the API directly.
 */
export const TERMS_REQUIRED_MESSAGE =
  'The 1st Contact terms of service have not been accepted for this account. ' +
  `Open ${TERMS_PATH} and accept them; nothing behind them is served until you do.`

/**
 * Does this person still owe an acceptance?
 *
 * A COMPARISON, NOT A NULL CHECK. `tos_version IS NULL` would answer "has this
 * person ever accepted anything", which is the same question only until the first
 * time the terms change — and then it is silently the wrong one for everybody who
 * accepted the old document. The version is injectable so a UAT can bump it
 * without editing this file.
 */
export function needsAcceptance(
  user: Pick<UserRow, 'tos_version'>,
  version: string = TERMS_VERSION,
): boolean {
  return (user.tos_version ?? '') !== version
}

/**
 * Record the acceptance: both columns, in one statement.
 *
 * BOTH, ALWAYS. A version with no timestamp cannot answer "when", and a timestamp
 * with no version cannot answer "to what" — the pair is the record, and writing
 * them apart is how one of them ends up missing on a path somebody added later.
 *
 * IDEMPOTENT by construction: re-accepting the same version rewrites the same
 * value and moves the timestamp forward, which is the honest reading of a second
 * click.
 */
export async function acceptTerms(
  env: IdentityEnv,
  userId: string,
  version: string = TERMS_VERSION,
  now: Date = new Date(),
): Promise<void> {
  const stamp = now.toISOString()
  await env.DB.prepare(
    'UPDATE users SET tos_version = ?, tos_accepted_at = ?, updated_at = ? WHERE id = ?',
  )
    .bind(version, stamp, stamp, userId)
    .run()
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * The interstitial, and why it references nothing.
 *
 * SELF-CONTAINED — no stylesheet link, no module script, no import map. It has to
 * be: this page is served to a session that is being refused every asset, so a
 * page that linked one would render as unstyled text with a button that does
 * nothing, which is the worst possible presentation of a legal agreement. Inline
 * is not a shortcut here, it is the only correct shape.
 *
 * `outstanding` FALSE STILL SERVES THE DOCUMENT, WITHOUT THE CONTROL. Terms that
 * become unreadable the moment they are accepted are terms nobody can check they
 * agreed to, so {@link TERMS_PATH} answers for an accepted caller too — with the
 * date they accepted in place of the button.
 */
export function termsHtml(options: {
  version?: string
  outstanding: boolean
  acceptedAt?: string | null
}): string {
  const version = options.version ?? TERMS_VERSION
  const paragraphs = TERMS_TEXT.split(/\n\s*\n/)
    .map((para) => `<p>${escapeHtml(para.trim())}</p>`)
    .join('\n')

  // The control, or the record of it having been used. Never a decline button —
  // see the file header for why a refusal is not a state.
  const action = options.outstanding
    ? `<button id="accept" type="button">I agree to these terms</button>
<p class="note" id="error" hidden>That did not save. Please try again.</p>`
    : `<p class="note">Accepted${
        options.acceptedAt ? ` on ${escapeHtml(options.acceptedAt.slice(0, 10))}` : ''
      }.</p>`

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Terms of service &mdash; 1st Contact</title>
<style>
:root { color-scheme: light; }
body { margin: 0; background: #f4f2ee; color: #1d1b18;
  font: 16px/1.6 ui-serif, Georgia, "Times New Roman", serif; }
main { max-width: 42rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
h1 { font-size: 1.75rem; letter-spacing: -0.01em; margin: 0 0 0.25rem; }
.version { font: 500 0.8125rem/1.4 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.08em; text-transform: uppercase; color: #6b6459; margin: 0 0 2.5rem; }
.terms { max-height: 26rem; overflow-y: auto; padding: 1.5rem 1.75rem;
  background: #fffdf9; border: 1px solid #ddd6ca; border-radius: 2px; }
.terms p { margin: 0 0 1.25rem; }
.terms p:last-child { margin-bottom: 0; }
button { margin-top: 2rem; padding: 0.85rem 2rem; border: 0; border-radius: 2px;
  background: #1d1b18; color: #fffdf9; cursor: pointer;
  font: 500 0.9375rem/1 ui-sans-serif, system-ui, sans-serif; }
button:disabled { opacity: 0.5; cursor: default; }
.note { font: 0.875rem/1.5 ui-sans-serif, system-ui, sans-serif; color: #6b6459; margin-top: 1rem; }
</style>
</head>
<body>
<main>
<h1>Terms of service</h1>
<p class="version">Version ${escapeHtml(version)}</p>
<div class="terms">
${paragraphs}
</div>
${action}
</main>
<script>
(function () {
  var button = document.getElementById('accept')
  if (!button) return
  button.addEventListener('click', function () {
    button.disabled = true
    // Reloading rather than navigating somewhere is what "continues to where they
    // were going" means here: the interstitial was served AT the requested URL, so
    // the same URL now answers with the thing that was asked for.
    fetch(${JSON.stringify(TERMS_ACCEPT_PATH)}, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ version: ${JSON.stringify(version)} }),
    }).then(function (res) {
      if (res.ok) { location.reload(); return }
      throw new Error(String(res.status))
    }).catch(function () {
      button.disabled = false
      document.getElementById('error').hidden = false
    })
  })
})()
</script>
</body>
</html>
`
}

function page(status: number, body: string | null, contentType?: string): Response {
  const headers: Record<string, string> = {
    ...(contentType ? { 'content-type': contentType } : {}),
    // Neither the terms nor a refusal may be cached or indexed. A cached
    // interstitial outlives the acceptance that should have replaced it, and a
    // cached refusal becomes everybody's answer including the accepted.
    'cache-control': 'no-store',
    'x-robots-tag': 'noindex',
  }
  return new Response(body, { status, headers })
}

/**
 * A request the browser is going to RENDER as a page, rather than fetch into one.
 *
 * `Sec-Fetch-Dest` is the precise answer and every current browser sends it;
 * `Accept` is the fallback for anything that does not. Both are deliberately
 * narrow, and a wildcard `Accept` is NOT a navigation — that is what a module
 * script and an `<img>` send, and answering one of those with an HTML document
 * breaks the page more confusingly than refusing it does. Anything unrecognised
 * is refused, which is the direction a gate should fail in.
 */
function isNavigation(request: Request): boolean {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false
  if (request.headers.get('sec-fetch-dest') === 'document') return true
  return (request.headers.get('accept') ?? '').includes('text/html')
}

/**
 * The gate: a Response to send instead, or nothing to carry on with.
 *
 * IT SITS WHERE THE ACCESS GATE AND `admit` SIT, and the placement is the whole
 * security property — before `resolveScope`, before a store handle, before a path
 * is matched. Putting it in the route table would make it a rule about the routes
 * that remembered it.
 *
 * THREE ANSWERS, and the third is the one that matters:
 *
 *   the accept route   is the one thing an unaccepted session may reach, because
 *                      it is the only way to stop being one.
 *   a navigation       is served the interstitial AT THE URL IT ASKED FOR, so
 *                      acceptance can continue by reloading rather than by
 *                      remembering a destination across a redirect.
 *   everything else    is refused 403 — assets, module scripts, API calls. This
 *                      is "blocks the builder, not just the chrome": a session
 *                      that could still fetch `/builder/main.js` would be a
 *                      session the check had already served.
 */
export async function guardTerms(
  request: Request,
  env: IdentityEnv,
  admission: Extract<Admission, { ok: true }>,
  options: { version?: string; now?: Date } = {},
): Promise<Response | undefined> {
  const version = options.version ?? TERMS_VERSION
  const path = splitBusinessPrefix(new URL(request.url).pathname).path
  const outstanding = needsAcceptance(admission.user, version)

  if (path === TERMS_ACCEPT_PATH) {
    if (request.method !== 'POST') return page(405, 'Accept the terms with POST.', 'text/plain; charset=utf-8')
    // A JSON content type is required so that a cross-site FORM cannot post this.
    // Forms can only send three content types, none of them this one, and anything
    // that can set it has already been through a CORS preflight this Worker never
    // answers. Acceptance of a legal agreement is precisely the thing that must
    // not be forgeable from another origin.
    if (!(request.headers.get('content-type') ?? '').includes('application/json')) {
      return page(415, 'Acceptance must be posted as application/json.', 'text/plain; charset=utf-8')
    }
    await acceptTerms(env, admission.user.id, version, options.now)
    // 204 and no body: the caller that posted this is the interstitial's own
    // script, which reloads on success and has nothing to read.
    return page(204, null)
  }

  if (path === TERMS_PATH && (request.method === 'GET' || request.method === 'HEAD')) {
    return page(
      200,
      termsHtml({ version, outstanding, acceptedAt: admission.user.tos_accepted_at }),
      'text/html; charset=utf-8',
    )
  }

  if (!outstanding) return undefined

  if (isNavigation(request)) {
    return page(200, termsHtml({ version, outstanding: true }), 'text/html; charset=utf-8')
  }

  return page(403, TERMS_REQUIRED_MESSAGE, 'text/plain; charset=utf-8')
}
