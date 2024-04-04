import { FunctionComponent, PropsWithChildren } from 'react'

export function toClj(s) {
  if (!s) return s
  logseq.Experiments.ensureHostScope().logseq.sdk.utils.to_clj(s)
}

export const LSUI: {
  [k: string]: FunctionComponent<PropsWithChildren<any>>
} = new Proxy({}, {
  get: (target, prop) => {
    return logseq.Experiments.ensureHostScope().LSUI[prop]
  }
})

export const SHUI: { [k: string]: any } = new Proxy({}, {
  get: (target, prop) => {
    const ctx = logseq.Experiments.ensureHostScope().logseq.shui.ui
    if (prop === 'TablerIcon') {
      return (props: any) => ctx.tabler_icon(props.name, toClj(props))
    }

    return ctx[prop]
  }
})
