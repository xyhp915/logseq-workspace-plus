import { FunctionComponent, PropsWithChildren } from 'react'
import { snakeCase } from 'snake-case'

export function toClj(s) {
  if (!s) return s
  try {
    s = logseq.Experiments.ensureHostScope().logseq.sdk.utils.jsx_to_clj(s)
    return s
  } catch (e) {
    console.error(e)
  }
}

export function toJs(o) {
  if (!o) return o
  return logseq.Experiments.ensureHostScope().logseq.sdk.utils.to_js(o)
}

export const LSUI: {
  [k: string]: FunctionComponent<PropsWithChildren<any>>
} = new Proxy({}, {
  get: (target, prop) => {
    return logseq.Experiments.ensureHostScope().LSUI[prop]
  }
})

export const SHUI: { [k: string]: any } = new Proxy({}, {
  get: (target, prop: string) => {
    const ctx = logseq.Experiments.ensureHostScope().logseq.shui.ui
    if (prop === 'TablerIcon') {
      return (props: any) => ctx.tabler_icon(props.name, toClj(props))
    } else if (prop.startsWith('popup') || prop.startsWith('toast')) {
      return ctx[`${snakeCase(prop)}_BANG_`]
    }

    return ctx[prop]
  }
})
