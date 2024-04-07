import './workspace.css'
import React from 'react'
import { getCardViewCtorFromRegistry, TileLayoutRoot } from './Layout'

export function initTestCustomRoute() {
  logseq.Experiments.registerRouteRenderer(
    'x-route',
    {
      path: '/x-route',
      render: () => {
        return (
          <TileLayoutRoot requireCardView={async (t) => {
            const cardID = ['HiCard', 'ImageCard', 'EditorCard', 'YoutubeCard'][Math.floor(Math.random() * 3)]
            const CardCtor = getCardViewCtorFromRegistry(cardID)
            if (cardID === 'EditorCard') {
              return new CardCtor(t, { name: ['charlie', 'test'][Math.floor(Math.random() * 2)] })
            }

            return new CardCtor(t)
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