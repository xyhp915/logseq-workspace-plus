import React, {
  FunctionComponent,
  PropsWithChildren,
} from 'react'

function toClj(s) {
  if (!s) return s
  logseq.Experiments.ensureHostScope().logseq.sdk.utils.to_clj(s)
}

const LSUI: {
  [k: string]: FunctionComponent<PropsWithChildren<any>>
} = new Proxy({}, {
  get: (target, prop) => {
    return logseq.Experiments.ensureHostScope().LSUI[prop]
  }
})

const SHUI: { [k: string]: any } = new Proxy({}, {
  get: (target, prop) => {
    const ctx = logseq.Experiments.ensureHostScope().logseq.shui.ui
    if (prop === 'TablerIcon') {
      return (props: any) => ctx.tabler_icon(props.name, toClj(props))
    }

    return ctx[prop]
  }
})

// @ts-ignore
const Components = logseq.Experiments.Components

export function initTestCustomRoute() {
  logseq.Experiments.registerRouteRenderer(
    'x-route',
    {
      path: '/x-route',
      render: () => {
        return (
          <div className={'flex items-center flex-col gap-4'}>
            <div className={'flex gap-2 w-full'}>
              <LSUI.Card className={'p-2 w-full'}>
                <LSUI.CardHeader>
                  <LSUI.CardTitle>
                    <a onClick={async () => {
                      const b = await logseq.Editor.getPage('charlie')
                      logseq.Editor.openInRightSidebar(b.uuid)
                    }}>
                      [[Charlie]]
                    </a>
                  </LSUI.CardTitle>
                  <LSUI.CardDescription>
                    This is a description
                  </LSUI.CardDescription>
                </LSUI.CardHeader>
                <LSUI.CardContent>
                  <Components.Editor page={'charlie'}/>
                </LSUI.CardContent>
              </LSUI.Card>
            </div>
          </div>)
      }
    })

  logseq.Experiments.registerDaemonRenderer('cloud-card', {
    render: () => {
      return (
        <div className={'flex items-center gap-2 fixed bg-gray-01 border p-8 rounded text-3xl flex-col shadow'}
             style={{ top: '100px', right: '20px', minHeight: '60vh' }}
        >
          <SHUI.TablerIcon name={'brand-github'}/>
          <span>Cloud Card</span>
          <LSUI.Button
            variant={'destructive'}
            size={'sm'}
            onClick={() => {
              logseq.App.pushState('x-route')
            }}>
            Open X Route
          </LSUI.Button>
        </div>
      )
    }
  })
}

export function initWorkspace() {
  initTestCustomRoute()
}

export const tickEffect = () => {
  return Date.now()
}