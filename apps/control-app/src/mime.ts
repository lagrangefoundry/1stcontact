/**
 * The MIME parser — ours, because the platform does not supply one
 * ([[REQ-267]] §1).
 *
 * WHAT CLOUDFLARE HANDS AN EMAIL WORKER is an envelope (`from`, `to`), a
 * `Headers` of the top-level headers, and `raw` as a stream of bytes. Everything
 * below the headers — which part is the body a human typed, which parts are
 * attachments, what transfer encoding each arrived under — is a structure this
 * module has to recover.
 *
 * WHY NOT A LIBRARY. This repository's standing rule is that the cost of code is
 * its maintenance and a dependency is somebody else's maintenance you cannot
 * see; a mail parser in a Worker bundle is a large, security-relevant surface
 * parsing hostile input from anonymous senders. What is actually needed is
 * narrow — find the parts, decode three transfer encodings, keep the bytes — and
 * it is narrow enough to read in one sitting.
 *
 * IT IS DELIBERATELY TOTAL. Every function here answers for malformed input
 * rather than throwing: a message with no boundary is one part, an unknown
 * transfer encoding is `8bit`, an undecodable charset is UTF-8 with
 * replacement characters. A parser that throws on a malformed message is a
 * parser that loses the customer's mail to a spammer's broken client — and the
 * one thing this pipeline may never do is swallow a message silently.
 *
 * NOTHING HERE TRUSTS ANYTHING IT READS. A filename is a string a stranger
 * chose; it reaches a ticket field and never a path. A body is a string a
 * stranger chose; it reaches a ticket body and is rendered as text
 * ([[REQ-267]] §9).
 */

/** One decoded part of a message that is not the body. */
export interface MimeAttachment {
  /** What the sender called it — a stranger's string, never a path. */
  filename: string
  contentType: string
  bytes: Uint8Array
}

/** A message, as the pipeline wants it. */
export interface ParsedMessage {
  /** Every header, folded lines joined, names lower-cased. */
  headers: Map<string, string[]>
  /** The `text/plain` part, decoded. Empty when the message carried none. */
  text: string
  /** The `text/html` part, as received and never sanitised. Empty when none. */
  html: string
  attachments: MimeAttachment[]
}

/** The first value of a header, or the empty string. */
export function headerValue(headers: Map<string, string[]>, name: string): string {
  const values = headers.get(name.toLowerCase())
  return values && values.length > 0 ? values[0] : ''
}

/**
 * Parse one message.
 *
 * THE WHOLE MESSAGE IS HELD AS A BINARY STRING — one character per byte — for
 * the structural pass. Boundaries, headers and transfer encodings are all ASCII,
 * so the split can be done on characters; a leaf part's payload is turned back
 * into bytes before anything looks at it as content. Doing it the other way
 * round — hunting for boundaries in a `Uint8Array` — is the same algorithm with
 * every string operation written out by hand.
 */
export function parseMessage(raw: Uint8Array): ParsedMessage {
  const message = binaryString(raw)
  const parsed: ParsedMessage = { headers: new Map(), text: '', html: '', attachments: [] }
  const { headers, body } = splitHeaders(message)
  parsed.headers = headers
  collect(headers, body, parsed, 0)
  return parsed
}

/**
 * How deep a nested multipart is followed.
 *
 * A BOUND AND NOT A BELIEF. `multipart/mixed` holding `multipart/alternative` is
 * ordinary and is two levels; anything past this is a sender being interesting,
 * and an unbounded recursion over hostile input is a Worker that dies on one
 * message. What a part below the bound loses is its structure, not its
 * existence: it is kept as an attachment.
 */
const MAX_DEPTH = 8

/** Walk one part, filling the bodies and attachment list as it goes. */
function collect(
  headers: Map<string, string[]>,
  body: string,
  into: ParsedMessage,
  depth: number,
): void {
  const contentType = headerValue(headers, 'content-type')
  const type = mediaTypeOf(contentType)
  const disposition = headerValue(headers, 'content-disposition')
  const filename = parameterOf(disposition, 'filename') || parameterOf(contentType, 'name')

  if (type.startsWith('multipart/') && depth < MAX_DEPTH) {
    const boundary = parameterOf(contentType, 'boundary')
    // NO BOUNDARY IS NOT AN ERROR — it is a broken sender, and what is in front
    // of us is still text somebody meant to send. Treated as one part, which
    // preserves it rather than discarding it as unparseable.
    if (boundary !== '') {
      for (const part of splitParts(body, boundary)) {
        const inner = splitHeaders(part)
        collect(inner.headers, inner.body, into, depth + 1)
      }
      return
    }
  }

  const encoding = headerValue(headers, 'content-transfer-encoding').trim().toLowerCase()
  // ATTACHED BY DISPOSITION OR BY HAVING A NAME, not by media type. A PDF with
  // no `Content-Disposition` is still an attachment, and an inline image a
  // sender's client named is still a file the operator may one day want; the
  // only parts that are BODY are the two text types nobody attached.
  //
  // A `multipart/*` THAT REACHED HERE HAS NO USABLE BOUNDARY, and is treated as
  // text rather than as a file: what a broken sender produced is still words
  // somebody typed, and filing them as an unopenable attachment would hide the
  // message from the one surface that exists to show it.
  const textual = type === '' || type.startsWith('text/') || type.startsWith('multipart/')
  const attached = !textual || disposition.trim().toLowerCase().startsWith('attachment')

  if (attached) {
    into.attachments.push({
      filename: filename || 'attachment',
      contentType: type || 'application/octet-stream',
      bytes: toBytes(decodePayload(body, encoding)),
    })
    return
  }

  const decoded = decodeText(decodePayload(body, encoding), parameterOf(contentType, 'charset'))
  // FIRST ONE WINS, per type. A `multipart/alternative` carries the same message
  // twice and the plain part is conventionally first; a later part restating it
  // is the same words, and concatenating would show the operator the message
  // twice.
  if (type === 'text/html') {
    if (into.html === '') into.html = decoded
  } else if (into.text === '') {
    into.text = decoded
  }
}

/** The header block and the body, split at the first empty line. */
function splitHeaders(message: string): { headers: Map<string, string[]>; body: string } {
  const crlf = message.indexOf('\r\n\r\n')
  const lf = message.indexOf('\n\n')
  // WHICHEVER COMES FIRST, because a message may be stored with either ending
  // and a mixture is common enough that preferring one would mis-split real
  // mail. A `\r\n\r\n` at position n also contains `\n\n` at n+1, so comparing
  // positions is what distinguishes them rather than testing for one at a time.
  let at = -1
  let width = 0
  if (crlf !== -1 && (lf === -1 || crlf <= lf)) {
    at = crlf
    width = 4
  } else if (lf !== -1) {
    at = lf
    width = 2
  }
  const block = at === -1 ? message : message.slice(0, at)
  const body = at === -1 ? '' : message.slice(at + width)
  return { headers: parseHeaders(block), body }
}

/**
 * The header block, unfolded, lower-cased and grouped.
 *
 * A LIST PER NAME because `Received` occurs many times and so does
 * `Authentication-Results` — and the authentication one is the header the
 * alignment verdict is read out of, so collapsing duplicates would be dropping
 * exactly the evidence [[REQ-267]] §4 is about.
 */
export function parseHeaders(block: string): Map<string, string[]> {
  const headers = new Map<string, string[]>()
  let current = ''
  const push = (line: string): void => {
    const colon = line.indexOf(':')
    if (colon <= 0) return
    const name = line.slice(0, colon).trim().toLowerCase()
    const value = line.slice(colon + 1).trim()
    const list = headers.get(name)
    if (list) list.push(value)
    else headers.set(name, [value])
  }
  for (const line of block.split('\n')) {
    const text = line.endsWith('\r') ? line.slice(0, -1) : line
    // A CONTINUATION IS A LINE THAT STARTS WITH WHITESPACE (RFC 5322 folding).
    // Joined with a single space, which is what unfolding means — the folding
    // whitespace is not part of the value.
    if (/^[ \t]/.test(text) && current !== '') {
      current += ` ${text.trim()}`
      continue
    }
    if (current !== '') push(current)
    current = text
  }
  if (current !== '') push(current)
  return headers
}

/** The media type, lower-cased, without its parameters. */
export function mediaTypeOf(contentType: string): string {
  const semicolon = contentType.indexOf(';')
  return (semicolon === -1 ? contentType : contentType.slice(0, semicolon)).trim().toLowerCase()
}

/**
 * One parameter off a structured header value — `boundary`, `charset`,
 * `filename`.
 *
 * QUOTED AND BARE BOTH, because both occur in real mail. RFC 2231's continued
 * and language-tagged form is deliberately not implemented: it appears on long
 * non-ASCII filenames, and what it costs to omit is a less pretty filename on a
 * file this ticket does not serve.
 */
export function parameterOf(value: string, name: string): string {
  const pattern = new RegExp(`;\\s*${name}\\s*=\\s*("([^"]*)"|[^;\\s]+)`, 'i')
  const match = pattern.exec(value)
  if (!match) return ''
  return (match[2] ?? match[1] ?? '').trim()
}

/** The parts between one boundary's delimiters. */
function splitParts(body: string, boundary: string): string[] {
  const delimiter = `--${boundary}`
  const parts: string[] = []
  const lines = body.split('\n')
  let current: string[] | null = null
  for (const line of lines) {
    const text = line.endsWith('\r') ? line.slice(0, -1) : line
    if (text === delimiter || text === `${delimiter}--`) {
      if (current) parts.push(current.join('\r\n'))
      // THE CLOSING DELIMITER ENDS THE WALK, and the epilogue after it is
      // discarded — it is not part of any part, and some senders put a mail
      // client's signature there.
      current = text === delimiter ? [] : null
      continue
    }
    if (current) current.push(text)
  }
  if (current) parts.push(current.join('\r\n'))
  return parts
}

/** One part's payload, with its transfer encoding undone. */
function decodePayload(payload: string, encoding: string): string {
  if (encoding === 'base64') return decodeBase64(payload)
  if (encoding === 'quoted-printable') return decodeQuotedPrintable(payload)
  return payload
}

/**
 * Base64, whitespace-tolerant.
 *
 * `atob` IS THE RUNTIME'S OWN and is what every Worker has; what it will not
 * tolerate is the line breaks every mailer inserts, so they come out first. A
 * payload it still refuses comes back empty rather than throwing — a corrupt
 * attachment is a fact about one part and must not cost the message.
 */
function decodeBase64(payload: string): string {
  const clean = payload.replace(/[^A-Za-z0-9+/=]/g, '')
  try {
    return atob(clean)
  } catch {
    return ''
  }
}

/** Quoted-printable: `=XX` escapes and `=` soft line breaks. */
function decodeQuotedPrintable(payload: string): string {
  return payload
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_all, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
}

/**
 * A decoded payload as text.
 *
 * UTF-8 UNLESS THE PART SAYS OTHERWISE, and `fatal: false` throughout: a byte
 * sequence that is not valid in the declared charset becomes a replacement
 * character rather than an exception. The operator seeing one mangled character
 * is strictly better than the operator seeing no message.
 */
function decodeText(payload: string, charset: string): string {
  const label = (charset || 'utf-8').trim().toLowerCase()
  const bytes = toBytes(payload)
  try {
    return new TextDecoder(label, { fatal: false, ignoreBOM: false }).decode(bytes)
  } catch {
    return new TextDecoder('utf-8', { fatal: false, ignoreBOM: false }).decode(bytes)
  }
}

/**
 * RFC 2047 encoded words — `=?utf-8?B?…?=` — as they appear in `Subject` and
 * `From`.
 *
 * DECODED FOR DISPLAY AND NEVER FOR MATCHING. An address is resolved from the
 * ENVELOPE, which is never encoded; this is what stops a subject line reading as
 * mojibake in the operator's list, and nothing branches on its result.
 */
export function decodeWords(value: string): string {
  return value.replace(
    /=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g,
    (_all, charset: string, kind: string, text: string) => {
      const payload =
        kind.toLowerCase() === 'b'
          ? decodeBase64(text)
          : decodeQuotedPrintable(text.replace(/_/g, ' '))
      return decodeText(payload, charset)
    },
  )
}

/**
 * The address inside a `From:`-style header value.
 *
 * FOR DISPLAY AND FOR NOTHING ELSE. `Nathan <nathan@example.com>` is one address
 * and `"Smith, J" <j@example.com>` is one address with a comma in its name, and
 * getting either wrong costs a mis-drawn line in a list. What the pipeline
 * RESOLVES from is the envelope sender, which arrives as a bare address on the
 * message itself and never passes through here.
 */
export function addressIn(value: string): string {
  const angled = /<([^>]*)>/.exec(value)
  if (angled) return angled[1].trim()
  return value.trim()
}

/** Every byte as one character — the form the structural pass works in. */
function binaryString(bytes: Uint8Array): string {
  let out = ''
  // CHUNKED, because `String.fromCharCode(...bytes)` spreads one argument per
  // byte and blows the argument limit somewhere around a hundred thousand of
  // them — which a message with an attachment reaches easily.
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return out
}

/** The inverse: one character per byte, back to bytes. */
function toBytes(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length)
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 0xff
  return bytes
}
