/**
 * [[REQ-312]] — reading the `google/fonts` checkout the mirror is built from.
 *
 * WHY A CHECKOUT AND NOT HTTP. The corpus is 2.45 GB across ~3,800 files.
 * Acquiring that by individual HTTPS request is the slowest and least reliable
 * route to it — `raw.githubusercontent.com` rate-limits an unauthenticated
 * caller within minutes — and "acquired like a dependency" is what the ticket
 * asks for, which is what a checkout already is everywhere else in this repo.
 * The checkout's own commit is then the provenance of every mirrored byte: a git
 * sha, rather than whatever a CDN served that afternoon.
 *
 * THE CATALOGUE SAYS WHERE TO LOOK. `fonts/catalogue.json` records each family's
 * `licence_source` — `ofl/roboto/METADATA.pb`, the very file its licence was read
 * from — so the mirror never infers a directory from a slug. That inference is
 * exactly what [[EPIC-21]] recorded as unreliable: six `Edu *` families were
 * renamed upstream and a slug-based join missed all of them.
 */

import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

// ── The textual protobuf METADATA.pb is written in ───────────────────────────

/** A parsed text-proto message: field name → every value given for it, in order. */
export type PbMessage = Map<string, PbValue[]>
export type PbValue = string | number | PbMessage

/**
 * Parse the subset of protobuf text format `METADATA.pb` uses.
 *
 * Scalars (`weight: 400`), quoted strings (`filename: "Roboto[wght].ttf"`) and
 * nested messages (`fonts { … }`) — repeated fields simply appear more than once,
 * which is why every field reads back as a list. Comments (`#`) and the optional
 * `:` before a message body are both accepted, because both occur upstream.
 *
 * A hand-written parser rather than a protobuf dependency: the schema is three
 * field types deep and the alternative is a code-generation toolchain in the
 * build for one file format.
 */
export function parseTextProto(text: string): PbMessage {
  let at = 0

  const skipSpace = (): void => {
    for (;;) {
      while (at < text.length && /\s/.test(text[at])) at++
      if (text[at] === '#') {
        while (at < text.length && text[at] !== '\n') at++
        continue
      }
      return
    }
  }

  const readString = (): string => {
    const quote = text[at]
    at++
    let out = ''
    while (at < text.length && text[at] !== quote) {
      if (text[at] === '\\') {
        at++
        const esc = text[at]
        out += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc === 'r' ? '\r' : esc
        at++
        continue
      }
      out += text[at]
      at++
    }
    at++ // closing quote
    return out
  }

  const readMessage = (terminated: boolean): PbMessage => {
    const message: PbMessage = new Map()
    for (;;) {
      skipSpace()
      if (at >= text.length) break
      if (text[at] === '}') {
        at++
        break
      }
      const nameStart = at
      while (at < text.length && /[A-Za-z0-9_.]/.test(text[at])) at++
      if (at === nameStart) {
        at++ // an unexpected byte: step over it rather than spin
        continue
      }
      const name = text.slice(nameStart, at)
      skipSpace()
      if (text[at] === ':') {
        at++
        skipSpace()
      }

      let value: PbValue
      if (text[at] === '{') {
        at++
        value = readMessage(true)
      } else if (text[at] === '"' || text[at] === "'") {
        // Adjacent quoted strings concatenate, which is how upstream wraps a long
        // copyright line across several source lines.
        let joined = readString()
        for (;;) {
          const mark = at
          skipSpace()
          if (text[at] === '"' || text[at] === "'") {
            joined += readString()
            continue
          }
          at = mark
          break
        }
        value = joined
      } else {
        const start = at
        while (at < text.length && /[^\s#}]/.test(text[at])) at++
        const raw = text.slice(start, at)
        const numeric = Number(raw)
        value = raw !== '' && Number.isFinite(numeric) ? numeric : raw
      }

      const existing = message.get(name)
      if (existing) existing.push(value)
      else message.set(name, [value])
    }
    if (!terminated && at < text.length) {
      // Top-level parse ended early on a stray `}`; keep reading so a trailing
      // block is not silently dropped.
      for (const [name, values] of readMessage(false)) {
        const existing = message.get(name)
        if (existing) existing.push(...values)
        else message.set(name, values)
      }
    }
    return message
  }

  return readMessage(false)
}

/** The first value of a field, as a string, or `undefined`. */
export function pbString(message: PbMessage, field: string): string | undefined {
  const value = message.get(field)?.[0]
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : undefined
}

/** The first value of a field, as a number, or `undefined`. */
export function pbNumber(message: PbMessage, field: string): number | undefined {
  const value = message.get(field)?.[0]
  return typeof value === 'number' ? value : undefined
}

/** Every nested message given for a repeated field. */
export function pbMessages(message: PbMessage, field: string): PbMessage[] {
  return (message.get(field) ?? []).filter((v): v is PbMessage => v instanceof Map)
}

// ── One upstream family directory ────────────────────────────────────────────

/** One release file a family's `METADATA.pb` declares. */
export interface UpstreamFontFile {
  filename: string
  style: 'normal' | 'italic'
  weight?: number
  copyright?: string
}

/** A family as its own upstream directory describes it. */
export interface UpstreamFamily {
  /** The family name upstream declares for itself — not the directory's. */
  name: string
  /** Repo-relative directory, e.g. `ofl/roboto`. */
  dir: string
  /** The licence file this directory ships, e.g. `OFL.txt`. */
  licenceFile: string
  files: UpstreamFontFile[]
}

/** Raised when a family directory cannot be read as one. */
export class UpstreamError extends Error {}

/**
 * The licence files a family directory may ship, in the order they are looked
 * for. OFL families carry `OFL.txt`; the Apache tree carries `LICENSE.txt`.
 */
const LICENCE_FILENAMES = ['OFL.txt', 'LICENSE.txt', 'UFL.txt'] as const

/** Whether `dir` exists in the checkout — how a family removed upstream is noticed. */
export function upstreamFamilyExists(checkout: string, dir: string): boolean {
  try {
    return statSync(path.join(checkout, dir)).isDirectory()
  } catch {
    return false
  }
}

/**
 * Read one family directory.
 *
 * The file list comes from `METADATA.pb` rather than from a directory listing,
 * because the directory also holds `DESCRIPTION.en_us.html`, article assets and
 * occasionally a stale binary nobody removed — and what upstream *releases* is
 * what its own metadata declares.
 */
export function readUpstreamFamily(checkout: string, dir: string): UpstreamFamily {
  const abs = path.join(checkout, dir)
  const metadataPath = path.join(abs, 'METADATA.pb')
  let metadata: PbMessage
  try {
    metadata = parseTextProto(readFileSync(metadataPath, 'utf8'))
  } catch (err) {
    throw new UpstreamError(`Cannot read ${dir}/METADATA.pb: ${(err as Error).message}`)
  }

  const name = pbString(metadata, 'name')
  if (!name) throw new UpstreamError(`${dir}/METADATA.pb declares no family name.`)

  const files: UpstreamFontFile[] = []
  for (const font of pbMessages(metadata, 'fonts')) {
    const filename = pbString(font, 'filename')
    if (!filename) continue
    const style = pbString(font, 'style') === 'italic' ? 'italic' : 'normal'
    files.push({
      filename,
      style,
      weight: pbNumber(font, 'weight'),
      copyright: pbString(font, 'copyright'),
    })
  }
  if (files.length === 0) throw new UpstreamError(`${dir}/METADATA.pb declares no font files.`)

  let present: string[]
  try {
    present = readdirSync(abs)
  } catch (err) {
    throw new UpstreamError(`Cannot list ${dir}: ${(err as Error).message}`)
  }
  const licenceFile = LICENCE_FILENAMES.find((candidate) => present.includes(candidate))
  if (!licenceFile) {
    // The notice has to travel with the distribution, so a family whose licence
    // text is not in the checkout is not mirrored — serving the bytes without it
    // is the obligation left undischarged, which is the failure this file exists
    // inside a ticket about.
    throw new UpstreamError(
      `${dir} ships no licence file (looked for ${LICENCE_FILENAMES.join(', ')}), so its notice cannot travel with the bytes.`,
    )
  }

  return { name, dir, licenceFile, files }
}

/** Read one file out of the checkout. */
export function readUpstreamFile(checkout: string, dir: string, filename: string): Buffer {
  return readFileSync(path.join(checkout, dir, filename))
}

/** Lowercase hex sha-256 — the digest every identity comparison in the mirror uses. */
export function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}
