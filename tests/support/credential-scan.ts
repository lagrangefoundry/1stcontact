/**
 * The shapes a committed credential takes, and the one exception ([[BUG-59]]).
 *
 * ONE DEFINITION SITE, BECAUSE THERE WERE TWO. REQ-144 wrote this scan and
 * AC-1342 restated it verbatim over a wider file list, so the same three regexes
 * and the same loop existed twice. That was tolerable while both were four lines
 * long; it stopped being tolerable when the scan needed to learn something, since
 * a rule that has to be taught twice is one that will eventually be taught once.
 * Both call sites now read from here and keep their own file lists, which is the
 * part that genuinely differs between them.
 *
 * THE SHAPES ARE ASSEMBLED RATHER THAN WRITTEN OUT, which is the property both
 * originals were careful about: a file that spells `sk-ant-api` in full is its
 * own counter-example, and a scan that trips on its own source teaches everyone
 * to ignore it.
 */

/** A credential shape, paired with what to say when it matches. */
export type CredentialShape = readonly [what: string, shape: RegExp]

/**
 * MATCHED ON THE VALUE. A provider-prefixed key and a private-key block are
 * credentials whatever they are assigned to, so no exception applies to these and
 * none should: they read the text exactly as committed.
 */
const VALUE_SHAPES: readonly CredentialShape[] = [
  ['a provider-prefixed API key', new RegExp(['sk', 'ant', 'api'].join('-'))],
  ['a private-key block', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
]

/**
 * MATCHED ON THE NAME, which is why it needs an exception at all: it finds an
 * assignment that LOOKS like a credential because of what it is called, and a
 * name is a much weaker signal than a value.
 */
const NAME_SHAPE: CredentialShape = [
  'a credential-named assignment carrying a literal value',
  /\b[A-Za-z0-9_-]*(?:SECRET|TOKEN|API_KEY|PASSWORD)[A-Za-z0-9_-]*\s*=\s*["'][^"'$][^"']{7,}/,
]

/** Every shape, for a caller that wants to check one against a string of its own. */
export const CREDENTIAL_SHAPES: readonly CredentialShape[] = [...VALUE_SHAPES, NAME_SHAPE]

/**
 * A `*_IDENTITIES` var names WHO A CREDENTIAL IS, never what it is.
 *
 * `SERVICE_TOKEN_IDENTITIES` carries `name=address` pairs binding a Cloudflare
 * Service Auth `common_name` to the person whose automation it is — both halves
 * public, neither of them authenticating anything. It contains `TOKEN` because
 * that is what Cloudflare calls the credential it maps, and the alternative was
 * to rename a var away from its own domain term to dodge a regex, which would
 * cost every future reader more than this exception costs.
 */
const EXEMPT_NAMES: ReadonlySet<string> = new Set(['SERVICE_TOKEN_IDENTITIES'])

const IDENTITY_ASSIGNMENT = /^[ \t]*([A-Za-z0-9_]*_IDENTITIES)[ \t]*=[ \t]*"([^"]*)"/gm

/** `name=address`, the whole entry and nothing else. */
const NAME_EQUALS_ADDRESS = /^\s*[A-Za-z0-9._-]+\s*=\s*[^@\s,]+@[^@\s,]+\.[^@\s,]+\s*$/

/**
 * Every entry an exempt var carries, so a caller can hold them to the grammar.
 *
 * THE EXCEPTION POLICES ITSELF rather than being taken on trust. A secret parked
 * in an exempted var fails on this grammar, at the same moment and in the same
 * run as it would have failed on the shape — so the exception narrows what is
 * checked without narrowing what is caught.
 */
export function exemptIdentityEntries(text: string): string[] {
  const entries: string[] = []
  for (const [, name, value] of text.matchAll(IDENTITY_ASSIGNMENT)) {
    if (!EXEMPT_NAMES.has(name)) continue
    for (const entry of value.split(',')) {
      if (entry.trim() !== '') entries.push(entry)
    }
  }
  return entries
}

/** Whether an entry is the `name=address` pair an exempt var is allowed to hold. */
export function isNameAddressPair(entry: string): boolean {
  return NAME_EQUALS_ADDRESS.test(entry)
}

/**
 * The shapes that match `text`, with exempt assignments blanked for the
 * name-matched shape only.
 *
 * THE VALUE-MATCHED SHAPES READ THE TEXT WHOLE, exempted var included, because
 * those match on the value and a value is exactly what this exception must not
 * stop looking at. An `sk-ant-api…` string assigned to `SERVICE_TOKEN_IDENTITIES`
 * is still found, by the first shape, unexempted.
 */
export function credentialShapesIn(text: string): string[] {
  let masked = text
  for (const [assignment, name] of text.matchAll(IDENTITY_ASSIGNMENT)) {
    if (EXEMPT_NAMES.has(name)) masked = masked.replace(assignment, `${name} = ""`)
  }
  const found = VALUE_SHAPES.filter(([, shape]) => shape.test(text)).map(([what]) => what)
  if (NAME_SHAPE[1].test(masked)) found.push(NAME_SHAPE[0])
  return found
}
