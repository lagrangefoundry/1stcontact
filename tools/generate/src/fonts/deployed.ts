/**
 * [[REQ-412]] — has the platform font mirror changed since it was last deployed
 * HERE?
 *
 * WHAT WAS WRONG. [[REQ-315]] made `bin/deploy --fonts` its own invocation,
 * because detecting change by re-reading and re-hashing a 1.35 GB corpus would
 * add up to an hour to every code deploy. So a code deploy never touched the
 * fonts — and on 2026-10-19 a fixed font encoder was built, deployed and
 * restarted while every dev store kept serving the broken woff2 it had been
 * seeded with a month earlier, because nobody knew to run the second command.
 *
 * WHY IT IS NOW FREE TO ASK. The cost was in DETECTING change from the bytes.
 * `fonts/platform.json` already records a sha256 for every font it stages, so
 * "has the mirror changed?" is a comparison of one small file's object set
 * against a record of the set last delivered — not a scan of the corpus.
 *
 * THE RECORD LIVES IN THE DESTINATION ITSELF — one object in the bucket the
 * fonts went to, beside them — and is written by the delivery (`runPublish`,
 * `runSeed`) after every object has landed. So it cannot disagree with what is
 * actually there the way a file on this machine could: production is one
 * bucket that another machine may have published to, and a wiped
 * `.wrangler/state` takes its record with it. It is written only when the whole
 * manifest was delivered; a partial delivery leaves the old record (or none),
 * so the next deploy delivers again rather than trusting a half.
 *
 * AND IT IS OUTSIDE THE SERVED PREFIX: `platform/fonts/` is what `/_fonts/…`
 * answers from, and a deploy record is not a font.
 */

import { createHash } from 'node:crypto'
import type { PlatformFontManifest } from '@1stcontact/site-schema'
import { LICENCE_INDEX_FILE, licenceIndex } from './mirror'

/** The record's key — beside the served prefix, never inside it. */
export const DEPLOYED_RECORD_KEY = 'platform/fonts-deployed.json'

/** What a destination says about the last full font delivery it received. */
export interface DeployedRecord {
  /** Over {@link objects}, so two records compare in one string. */
  digest: string
  /** Mirror-relative path → digest ({@link mirrorDigests}), for every object the delivery put. */
  objects: Record<string, string>
  deployedAt: string
}

/**
 * The mirror's object set as path → digest, read from the MANIFEST ALONE.
 *
 * Nothing staged is read, and that is the property the whole check rests on:
 * a machine deploying code to a bucket that is already current need not hold
 * the 1.35 GB mirror at all, and 7,000 fonts are not re-hashed to find out
 * nothing changed. Fonts take the sha256 the mirror recorded for the bytes it
 * wrote. The other objects carry no digest in the manifest, so each takes a
 * digest of what DETERMINES its bytes: a family's licence notice is copied from
 * upstream at the pinned commit its `source` names, and the aggregate index is
 * `licenceIndex` of the manifest — taken here with its generation date blanked,
 * since a date that moved is not a mirror that changed.
 */
export function mirrorDigests(manifest: PlatformFontManifest): Record<string, string> {
  const hex = (text: string): string => createHash('sha256').update(text).digest('hex')
  const digests: Record<string, string> = {}
  for (const family of manifest.families) {
    for (const file of family.files) digests[file.path] = file.sha256
    digests[family.licence_file] = hex(`licence ${family.source}`)
  }
  digests[LICENCE_INDEX_FILE] = hex(licenceIndex(manifest, ''))
  return digests
}

/** One digest over a whole object set, independent of insertion order. */
export function digestOf(objects: Record<string, string>): string {
  const hash = createHash('sha256')
  for (const key of Object.keys(objects).sort()) hash.update(`${key} ${objects[key]}\n`)
  return hash.digest('hex')
}

/** The record a delivery writes once every object in `objects` has landed. */
export function deployedRecord(objects: Record<string, string>, now: Date = new Date()): DeployedRecord {
  return { digest: digestOf(objects), objects, deployedAt: now.toISOString() }
}

/** How many of `current`'s objects a delivery against `record` would send. */
export function objectsToMove(current: Record<string, string>, record: DeployedRecord | null): number {
  if (!record) return Object.keys(current).length
  return Object.entries(current).filter(([key, sha]) => record.objects[key] !== sha).length
}

/**
 * A record as read back from a destination, or `null`.
 *
 * AN UNREADABLE RECORD IS NO RECORD — it can only cause a full delivery, which
 * is digest-checked per object and therefore safe, never a skip.
 */
export function parseDeployedRecord(text: string | null | undefined): DeployedRecord | null {
  if (!text) return null
  try {
    const parsed = JSON.parse(text) as Partial<DeployedRecord>
    if (typeof parsed.digest !== 'string' || typeof parsed.objects !== 'object' || parsed.objects === null) return null
    if (digestOf(parsed.objects) !== parsed.digest) return null
    return { digest: parsed.digest, objects: parsed.objects, deployedAt: String(parsed.deployedAt ?? '') }
  } catch {
    return null
  }
}
