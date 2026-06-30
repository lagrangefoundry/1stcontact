import path from 'node:path'
import type { ChangeSet } from './history'
import { listFilesRel, sameBytes } from './fsutil'

/**
 * Compute the file-change list between two complete snapshots (DOC-12 §4).
 *
 * The comparison spans the whole snapshot — page definitions, assets, and
 * site-level metadata alike — classifying every path as `added`, `modified`, or
 * `removed`. Pass `prevDir = null` for the first publish, where every file is
 * `added`. All lists are sorted for stable output.
 */
export function diffSnapshots(prevDir: string | null, nextDir: string): ChangeSet {
  const prev = prevDir ? listFilesRel(prevDir) : []
  const next = listFilesRel(nextDir)
  const prevSet = new Set(prev)
  const nextSet = new Set(next)

  const added: string[] = []
  const modified: string[] = []
  const removed: string[] = []

  for (const rel of next) {
    if (!prevSet.has(rel)) {
      added.push(rel)
    } else if (prevDir && !sameBytes(path.join(prevDir, rel), path.join(nextDir, rel))) {
      modified.push(rel)
    }
  }
  for (const rel of prev) {
    if (!nextSet.has(rel)) removed.push(rel)
  }

  return { added: added.sort(), modified: modified.sort(), removed: removed.sort() }
}
