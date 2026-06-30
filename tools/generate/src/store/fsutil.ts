import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

/**
 * Small, deterministic filesystem helpers shared by the store and renderer.
 *
 * Determinism matters: directory listings are always sorted, JSON is written
 * with stable formatting, and byte copies are exact — so snapshots are
 * reproducible and diffs are stable across machines (DOC-12 §8).
 */

export function pathExists(p: string): boolean {
  return existsSync(p)
}

export function ensureDir(p: string): void {
  mkdirSync(p, { recursive: true })
}

/** Remove a path entirely if present (recursive, no error if missing). */
export function removePath(p: string): void {
  rmSync(p, { recursive: true, force: true })
}

/** Empty a directory's contents, creating it if absent. */
export function emptyDir(p: string): void {
  removePath(p)
  ensureDir(p)
}

export function readJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T
}

/** Write JSON with stable 2-space indentation and a trailing newline. */
export function writeJson(p: string, value: unknown): void {
  ensureDir(path.dirname(p))
  writeFileSync(p, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

export function writeText(p: string, text: string): void {
  ensureDir(path.dirname(p))
  writeFileSync(p, text, 'utf8')
}

/**
 * List every file under `dir` as POSIX-style relative paths, sorted. Returns an
 * empty array when `dir` does not exist. Directories themselves are not listed,
 * only their files — an empty directory contributes nothing.
 */
export function listFilesRel(dir: string): string[] {
  if (!existsSync(dir)) return []
  const out: string[] = []
  const walk = (abs: string, rel: string): void => {
    for (const name of readdirSync(abs).sort()) {
      const childAbs = path.join(abs, name)
      const childRel = rel ? `${rel}/${name}` : name
      if (statSync(childAbs).isDirectory()) {
        walk(childAbs, childRel)
      } else {
        out.push(childRel)
      }
    }
  }
  walk(dir, '')
  return out.sort()
}

/** Recursively copy a directory tree as an exact byte copy. */
export function copyDir(src: string, dest: string): void {
  ensureDir(path.dirname(dest))
  cpSync(src, dest, { recursive: true })
}

/** True when two files have byte-identical contents. */
export function sameBytes(a: string, b: string): boolean {
  return readFileSync(a).equals(readFileSync(b))
}

/** Immediate child directory names of `dir`, sorted; empty if `dir` is absent. */
export function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((name) => statSync(path.join(dir, name)).isDirectory())
    .sort()
}
