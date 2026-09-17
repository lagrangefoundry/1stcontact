/**
 * The mark manufactured traffic carries, in flight ([[REQ-268]] §1,
 * [[DOC-54]] §2.1–2.2).
 *
 * WHAT THIS IS FOR. The product's promise is that a business's site *works*, and
 * the only test that can prove a form works is one that fills it in. That test
 * writes to production: a real contact, a real event, a real acceptance. So the
 * thing standing between *we can prove it works* and *we have polluted the
 * customer's record* is this token — the one fact that tells the write layer a
 * submission is manufactured, and the one fact a caller must not be able to
 * invent.
 *
 * IT IS ON THE REQUEST AND NOT ON A ROUTE OF ITS OWN. A separate test endpoint
 * would be a second code path, and a second code path tests itself rather than
 * the product. Everything a probe exercises has to be the same bytes a visitor's
 * submission travels, which means the mark rides the ordinary request.
 *
 * THE ASYMMETRY IS THE WHOLE DESIGN. Forging a mark is the attack worth closing:
 * a caller who could mark real traffic as test would make a competitor's leads
 * vanish from their own dashboard, silently, because a hidden lead looks exactly
 * like a lead nobody sent. Failing to verify an honest mark costs a probe run.
 * So the signature is required and a failure degrades to ordinary traffic
 * ({@link verifyMark} returns `null` and the caller writes a REAL record) rather
 * than refusing the submission — see `lead.ts`, which is where that rule is
 * actually applied and where refusing would have turned a signing bug into lost
 * customer data.
 *
 * WHY IT IS HERE AND NOT IN `control-app`'s `gutter.ts` ([[REQ-267]]). That
 * module is the STORE side of the gutter — the run registry, the reserved
 * address namespace, the blob prefix, the reaper — and it reads D1. This one is
 * the WIRE format, and its two readers are two different Workers: whatever mints
 * a mark, and `public-site`, which cannot import an app it does not deploy with.
 * `packages/framework` is the seam both already reach through.
 *
 * AND IT DOES NOT CONSULT THE RUN REGISTRY, which is the one place the two
 * channels legitimately differ. [[REQ-267]] §7 validates an inbound mark against
 * `synthetic_runs` because *"a local part is an unsigned bearer string, so two
 * of [[DOC-54]] §2.1's] three checks have no carrier here"* — the registry
 * replaces the signature and the window. A signed token carries both, so a
 * lookup would be a third check, buying revocation at the price of a D1 read on
 * the one public write path this product has; and {@link MARK_WINDOW_MS} already
 * bounds a leaked mark far more tightly than a run's own window does.
 *
 * A MODULE OF ITS OWN WITH NO IMPORTS, on `contact-form/fields.ts`'s precedent.
 * Two Workers have to agree on this format and neither can see the other:
 * `public-site` verifies a mark on a form post, and whatever mints one later —
 * a probe, an inbound-email harness, a webhook driver — is somewhere else again.
 * A second implementation of the encoding at either end is a format free to
 * drift by one character in silence.
 *
 * `crypto.subtle` AND NOT A DEPENDENCY. HMAC-SHA-256 is in the Workers runtime,
 * in Node 22 and in every test environment here, so there is nothing to install
 * and nothing to keep patched.
 */

/**
 * The format version, and the first field of what is signed.
 *
 * INSIDE THE SIGNED STRING, NOT BESIDE IT. A version a caller could change
 * without invalidating the signature would let a future, laxer format be
 * asserted over a token minted under this one.
 */
const VERSION = 'g1'

/** What separates the fields. Absent from a run id and from a hex digest. */
const SEPARATOR = '.'

/**
 * How long a mark is good for, in milliseconds.
 *
 * FIVE MINUTES IS A PROBE'S ROUND TRIP AND NOT A SESSION. A mark is minted
 * immediately before the submission it accompanies, so the window only has to
 * cover the network and whatever retry the prober performs — and every extra
 * minute is a minute a leaked mark stays replayable against the business it was
 * minted for.
 *
 * THE WINDOW IS SYMMETRIC, which is what the `Math.abs` in {@link verifyMark}
 * buys. A mark stamped slightly in the future is clock skew between the minter
 * and the edge, not an attack; refusing it would make the gutter fail on exactly
 * the deployments whose clocks are least well behaved, intermittently.
 */
export const MARK_WINDOW_MS = 5 * 60 * 1000

/** What a valid mark says: which run manufactured this, and when it was minted. */
export interface Mark {
  /** The run id, as `newId('run')` mints it. Opaque; never parsed. */
  runId: string
  /** When the mark was minted, in epoch milliseconds. */
  issuedAt: number
}

/**
 * The bytes of a secret or a message, as WebCrypto wants them.
 *
 * THE COPY IS WHAT NAMES THE BUFFER. `TextEncoder.encode` is typed as returning
 * a view over `ArrayBufferLike`, which admits a `SharedArrayBuffer` and which
 * `crypto.subtle` will not take; copying through the `ArrayLike` constructor is
 * the one-line way to say `ArrayBuffer` without asserting it. The strings here
 * are a secret and a short payload, so the allocation is not worth avoiding.
 */
const bytes = (value: string): Uint8Array<ArrayBuffer> =>
  new Uint8Array(new TextEncoder().encode(value))

/** A digest as lowercase hex — the one spelling both ends compare. */
function hex(digest: ArrayBuffer): string {
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * The exact string that is signed.
 *
 * EVERY FIELD OF THE MARK IS IN IT, which is what stops a run id being swapped
 * for another run's, or an issued-at being wound forward, under a signature
 * minted for something else.
 */
function payloadOf(mark: Mark): string {
  return [VERSION, mark.runId, String(mark.issuedAt)].join(SEPARATOR)
}

async function hmac(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    bytes(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return hex(await crypto.subtle.sign('HMAC', key, bytes(payload)))
}

/**
 * Compare two digests without leaking where they first differ.
 *
 * WRITTEN OUT RATHER THAN `a === b`. The comparison is against a value the
 * caller chose, so an early return is a timing oracle a patient attacker can
 * walk one nibble at a time. It is four lines and removes the question.
 *
 * THE LENGTH CHECK IS NOT THE LEAK. Both sides are a fixed-width hex digest, so
 * a length mismatch means the token was malformed rather than that a guess was
 * close, and there is nothing to learn from the fact that it was.
 */
function sameDigest(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let i = 0; i < a.length; i += 1) difference |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return difference === 0
}

/**
 * Mint a mark for `runId`, signed with the platform secret.
 *
 * `now` IS AN ARGUMENT AND HAS NO DEFAULT, which is this package's rule rather
 * than this module's preference: nothing under `packages/framework/src` reads
 * the ambient clock, and [[REQ-152]] enforces it with a source scan precisely so
 * that a future module cannot reach for one and ship a snapshot that is wrong
 * the next morning. `intl.ts` is the precedent — it takes its instant as an
 * argument and therefore needs no exemption, and neither does this. A default of
 * `Date.now()` would have been the convenience that carved the first hole in a
 * guardrail worth more than the two characters it saves.
 *
 * It also buys the thing a default would have taken away: a UAT can mint a mark
 * that is ALREADY outside its window, so the expiry rule is provable rather than
 * merely stated.
 */
export async function signMark(
  secret: string,
  runId: string,
  now: number,
): Promise<string> {
  const mark: Mark = { runId, issuedAt: now }
  const payload = payloadOf(mark)
  return `${payload}${SEPARATOR}${await hmac(secret, payload)}`
}

/**
 * The mark this token carries, or `null` if it carries none we will honour.
 *
 * ONE ANSWER FOR EVERY REFUSAL — empty, malformed, wrong version, bad signature,
 * outside its window, or no secret configured at all. The caller's response to
 * all six is identical (treat this as ordinary traffic), so distinguishing them
 * on the return value would be a distinction nothing could act on, offered to a
 * caller who may be the forger.
 *
 * NO SECRET IS A REFUSAL AND NOT AN ACCEPTANCE — but note which direction that
 * fails in. `lead.ts`'s Turnstile secret fails CLOSED, refusing the submission,
 * because a missing secret there means an unverified write. Here the refusal
 * means *this is not manufactured traffic*, and a deployment that has not
 * configured the gutter takes ordinary leads exactly as it always did. Both are
 * the safe direction; they are opposite responses because they are answers to
 * opposite questions.
 *
 * THE SIGNATURE IS CHECKED BEFORE THE CLOCK. Neither order is exploitable — the
 * payload is public either way — and checking the signature first means a
 * caller's timestamp never reaches a comparison until the string has been proven
 * to be ours.
 *
 * `now` HAS NO DEFAULT, for {@link signMark}'s reason: the clock is read by the
 * Worker that has a request to read it for, never by this package.
 */
export async function verifyMark(
  secret: string | undefined,
  token: string | undefined,
  now: number,
): Promise<Mark | null> {
  const key = (secret ?? '').trim()
  const value = (token ?? '').trim()
  if (key === '' || value === '') return null

  const parts = value.split(SEPARATOR)
  if (parts.length !== 4) return null
  const [version, runId, stamp, signature] = parts
  if (version !== VERSION || runId === '' || stamp === '') return null

  const payload = [version, runId, stamp].join(SEPARATOR)
  if (!sameDigest(signature, await hmac(key, payload))) return null

  // PARSED AFTER THE SIGNATURE, so this is our own number rather than the
  // caller's. `Number.isFinite` still guards it, because a signed mark minted by
  // a broken minter is a thing we would rather refuse than compare against NaN —
  // and `NaN < window` is `false`, which would refuse it anyway, silently and
  // for the wrong reason.
  const issuedAt = Number(stamp)
  if (!Number.isFinite(issuedAt)) return null
  if (Math.abs(now - issuedAt) > MARK_WINDOW_MS) return null

  return { runId, issuedAt }
}
