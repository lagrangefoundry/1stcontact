import type { BehaviorComponent } from '@1stcontact/framework'

/**
 * REQ-85 negative fixture (test infrastructure, NOT a shipping module): a
 * deliberately non-isolated capability whose core throws during SSR, crashing the
 * page build. The `isolation` dimension must flag this as
 * `isolation.render-throws` — proof the check is not a no-op.
 */
export const throwsOnRender: BehaviorComponent = () => {
  throw new Error('capability core crashed during render')
}
