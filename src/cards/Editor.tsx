import { ICardView } from './shared'
import { LSUI } from '../utils'
import React, { useEffect, useState } from 'react'
import { applyCardViewInTile, TileLayoutAttrs } from '../Layout'

// @ts-ignore
const Components = window.logseq?.Experiments?.Components
const hostSDKBaseAPIs = window.logseq?.Experiments?.ensureHostScope().logseq.api
const doc = top.document

const isUUIDStr = (s: string) => {
  if (typeof s !== 'string') return
  return /^[a-z,0-9-]{36}$/.test(s)
}

export class EditorCard implements ICardView {
  static name = 'EditorCard'
  private _id: string = 'EditorCard'
  private _title: string = 'Editor Card'
  private _lastEditBlockId: string
  private readonly _tileLayout: Partial<TileLayoutAttrs>
  private readonly _opts: any = {}

  constructor(tileLayout: Partial<TileLayoutAttrs>, opts: any = {}) {
    this.render = this.render.bind(this)
    this._tileLayout = tileLayout
    this._opts = opts
  }

  render(props: any) {
    const { name } = this._opts
    const isBlock = isUUIDStr(name)
    const [ready, setReady] = useState(!isBlock)

    useEffect(() => {
      if (ready) return
      const rt = setTimeout(() => {
        setReady(true)
      }, 32)
      return () => {
        clearTimeout(rt)
      }
    }, [])

    return (
      <div className={'w-full px-2'}>
        {ready ?
          <Components.Editor
            page={name}
            includeUnlinkedRefs={false}
            includeLinkedRefs={false}
            onRedirectToPage={(name: string) => {
              if (!name || name === this._opts.name) return
              applyCardViewInTile(this._tileLayout.id, EditorCard.name, { name })
            }}
            onEscapeEditing={(blockId: string, isEsc: boolean) => {
              this.lastEditBlockId = blockId
              // TODO: handle escape editing
              if (isEsc) {
                const layoutEl = doc.getElementById(this._tileLayout.id)
                layoutEl?.focus()
              }
            }}/> :
          (<h2 className={'py-10 flex items-center w-full'}>Loading...</h2>)
        }
      </div>
    )
  }

  // hooks
  onFocus(e: any) {
    // @ts-ignore
    hostSDKBaseAPIs.clear_selected_blocks()
    if (this._lastEditBlockId) {
      setTimeout(() => {
        hostSDKBaseAPIs.edit_block(this._lastEditBlockId)
      }, 32)
    }
  }

  onEnter(e: any) {
    const hasSelectedBlocks = doc.querySelector('.ls-block.selected')
    if (hasSelectedBlocks) return
    this.onFocus(e)
  }

  static async onEmptyPlaceholderDrop(e: any) {
    const dt = e.dataTransfer as DataTransfer
    const blockId = dt?.getData('block-uuid')
    if (blockId) {
      return { name: blockId }
    }
  }

  set lastEditBlockId(value: string) {
    this._lastEditBlockId = value
    console.log('===>>> pl: set lastEditBlockId..', this._tileLayout.id, ' :: ', value)
  }

  get id(): string {
    return this._id
  }

  get title(): string {
    return this._title
  }

  get tileLayout(): any {
    return this._tileLayout
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      tileLayout: this._tileLayout,
      ...this._opts
    }
  }
}