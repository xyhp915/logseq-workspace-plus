import './workspace.css'
import React from 'react'
import { applyCardViewInTile, getCardViewCtorFromRegistry, TileLayoutRoot } from './Layout'
import { LSUI, SHUI, toClj, toJs } from './utils'

export function initTestCustomRoute() {
  logseq.Experiments.registerRouteRenderer(
    'x-route',
    {
      path: '/x-route',
      render: () => {
        return (
          <TileLayoutRoot
            onRequireCardView={async (t, e) => {
              const cardTypes = ['HiCard', 'ImageCard', 'EditorCard', 'YoutubeCard']

              SHUI.popupShow(e.target, (p1) => {
                p1 = toJs(p1)

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

              // const cardID = ['HiCard', 'ImageCard', 'EditorCard', 'YoutubeCard'][Math.floor(Math.random() * 4)]
              // const CardCtor = getCardViewCtorFromRegistry(cardID)
              // if (cardID === 'EditorCard') {
              //   return new CardCtor(t, { name: ['charlie', 'test'][Math.floor(Math.random() * 2)] })
              // }
              //
              // return new CardCtor(t)
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