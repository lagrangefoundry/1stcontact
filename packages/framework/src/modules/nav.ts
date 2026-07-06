import type { NavTarget } from '@1stcontact/site-schema'
import { assertSafeUrl } from './safety'

/**
 * Resolve a nav-entry target to an href. Anchors become in-page fragments;
 * pages become root-relative paths keyed by page id (the generator rewrites
 * these to real slugs in REQ-6); urls pass through — after an unsafe-scheme
 * rejection (REQ-46), since a `kind:'url'` target is untrusted content.
 */
export function navHref(target: NavTarget): string {
  switch (target.kind) {
    case 'url':
      return assertSafeUrl(target.href, 'nav target')
    case 'anchor':
      return `#${target.moduleId}`
    case 'page':
      return `/${target.pageId}`
  }
}
