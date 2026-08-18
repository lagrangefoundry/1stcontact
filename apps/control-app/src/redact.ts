/**
 * Keeping the Worker's secrets out of what it says (REQ-146, AC4).
 *
 * THE HAZARD IS NOT THE CODE THAT MEANS WELL. Nothing here formats a key into a
 * response on purpose. The leak arrives from BELOW: an SDK that puts the request
 * it tried to send into the error it throws, a fetch layer that stringifies its
 * headers, a `JSON.stringify(err)` three frames down. `ANTHROPIC_API_KEY` is a
 * bearer credential for a paid API, so it reaches the client through an error
 * message that nobody wrote and nobody expected.
 *
 * So this is applied at the LAST POINT before a string becomes a response body,
 * and not at the point a message is made. The router has exactly two places a
 * raw error becomes client-visible text — the outer `catch` and the SSE turn —
 * and both go through here. Redacting at the source instead would mean trusting
 * every future error path to remember, which is the assumption that produces
 * this class of bug in the first place.
 *
 * IT IS A BACKSTOP, NOT A LICENCE. The right primary defence is not putting
 * credentials into messages, and the AI host does not. This exists because a
 * backstop is the only defence that still works against the frame you did not
 * write.
 */

/** What a redacted secret is replaced by — recognisable, and not itself a hint. */
export const REDACTED = '[redacted]'

/**
 * Build a scrubber for a fixed set of secret values.
 *
 * WHY VALUES AND NOT PATTERNS. A pattern for "things that look like an API key"
 * is wrong in both directions: it misses a credential in an unexpected shape and
 * it mangles ordinary prose that happens to match. The Worker KNOWS its secrets
 * — they are its own bindings — so the match is exact and total.
 *
 * SHORT VALUES ARE IGNORED, deliberately. An empty or one-character secret is
 * not a credential; treating it as one would replace every occurrence of that
 * character in every error message and destroy the diagnostics this is meant to
 * leave intact. The floor is low enough to catch any real key and high enough
 * that a misconfigured binding cannot blank the output.
 *
 * The returned function is total on strings and does no work when there is
 * nothing to protect, so it is safe to apply unconditionally on every path.
 */
export function redactor(secrets: Array<string | undefined | null>): (text: string) => string {
  const values = secrets
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    // Longest first, so a secret that CONTAINS another is replaced whole rather
    // than being left as a partially-scrubbed string that still reveals its tail.
    .filter((s) => s.length >= 8)
    .sort((a, b) => b.length - a.length)

  if (values.length === 0) return (text) => text

  return (text: string): string => {
    let out = text
    for (const value of values) {
      // `split`/`join` rather than a regex: a secret is arbitrary bytes and may
      // contain regex metacharacters, and escaping them is a second thing to get
      // right for no gain.
      if (out.includes(value)) out = out.split(value).join(REDACTED)
    }
    return out
  }
}
