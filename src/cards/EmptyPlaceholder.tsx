import React from 'react'
import { CardID, ICardViewConstructor } from './shared'
import { applyCardViewInTile, TileLayoutAttrs } from '../Layout'

export function EmptyPlaceholder(
  props: {
    tileLayout: Partial<TileLayoutAttrs>,
    cardsViewRegistry: Map<CardID, ICardViewConstructor>
  }
) {
  const { tileLayout, cardsViewRegistry } = props

  return (
    <div className={'border border-dashed border-gray-300 m-6 flex flex-1 items-center justify-center'}
         onDragOver={(e) => {
           e.preventDefault()
         }}
         onDrop={async (e) => {
           e.preventDefault()
           console.debug('===>>> drop:', e)
           for (const [_, ctor] of cardsViewRegistry) {
             if (ctor.onEmptyPlaceholderDrop) {
               const ret = await ctor.onEmptyPlaceholderDrop(e)
               if (ret) {
                 // require card view
                 applyCardViewInTile(tileLayout.id, ctor, ret)
                 break
               }
             }
           }
         }}
    >
      <h1 className={'text-lg text-gray-500 opacity-40'}>Empty Card</h1>
    </div>
  )
}