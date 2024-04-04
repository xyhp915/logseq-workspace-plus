import './workspace.css'
import React, {
  FunctionComponent,
  PropsWithChildren,
} from 'react'
import { TileLayoutRoot } from './Layout'
import { LSUI, SHUI } from './utils'

// @ts-ignore
const Components = logseq.Experiments.Components

export function initTestCustomRoute() {
  logseq.Experiments.registerRouteRenderer(
    'x-route',
    {
      path: '/x-route',
      render: () => {
        return (
          <TileLayoutRoot requireCardView={async () => {
            const name = ['charlie', 'test'][Math.floor(Math.random() * 2)]
            return () => {
              return (
                <LSUI.Card className={'p-2 w-full'}>
                  <LSUI.CardHeader>
                    <LSUI.CardTitle>
                      <a onClick={async () => {
                        const b = await logseq.Editor.getPage('charlie')
                        logseq.Editor.openInRightSidebar(b.uuid)
                      }}>
                        [[{name}]]
                      </a>
                    </LSUI.CardTitle>
                    <LSUI.CardDescription>
                      This is a description
                    </LSUI.CardDescription>
                  </LSUI.CardHeader>
                  <LSUI.CardContent>
                    <Components.Editor page={name}/>
                  </LSUI.CardContent>
                </LSUI.Card>
              )
            }
          }}/>
        )
      }
    })

  return
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