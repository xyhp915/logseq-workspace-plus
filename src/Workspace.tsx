import './workspace.css'
import React from 'react'
import { applyCardViewInTile, getCardViewCtorFromRegistry, TileLayoutRoot } from './Layout'
import { LSUI, SHUI, toClj, toJs } from './utils'

export function initTestCustomRoute() {
  // @ts-ignore
  logseq.Experiments.registerRouteRenderer(
    'x-route',
    {
      path: '/x-route',
      render: () => {
        return (
          <TileLayoutRoot
            onRequireCardView={async (t, e) => {
              const cardTypes = ['HiCard', 'ImageCard', 'EditorCard', 'YoutubeCard', 'CalendarCard']

              SHUI.popupShow(e.target, (_p1) => {
                return (
                  <div className={'p-3 w-60 flex gap-2 flex-wrap'}>
                    {cardTypes.map(it => {
                      return (
                        <LSUI.Button
                          size={'sm'}
                          onClick={(e) => {
                            const CardCtor = getCardViewCtorFromRegistry(it)
                            const opts = {}

                            if (it === 'EditorCard') {
                              SHUI.popupShow(e, () => {
                                const demoPages = ['Charlie', 'Test', 'Contents']
                                return (
                                  <>
                                    {demoPages.map(p => {
                                      return (<LSUI.DropdownMenuItem
                                        onClick={() => {
                                          applyCardViewInTile(t.id, CardCtor, { name: p.toLowerCase() })
                                          SHUI.popupHideAll()
                                        }}>
                                        [[{p}]]</LSUI.DropdownMenuItem>)
                                    })}
                                  </>
                                )
                              }, toClj({[`as-dropdown?`]: true}))
                              return
                            }

                            applyCardViewInTile(t.id, CardCtor, opts)
                            SHUI.popupHide()
                          }}
                        >
                          {it}
                        </LSUI.Button>
                      )
                    })}
                  </div>
                )
              })
            }}/>
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