import { ICardView } from './shared'
import React from 'react'
import { TileLayoutAttrs } from '../Layout'

export class HiCard implements ICardView {
  private _id: string = 'HiCard'
  private _title: string = 'A card to say Hi for beginners!'
  private readonly _tileLayout: Partial<TileLayoutAttrs>

  constructor(tileLayout: Partial<TileLayoutAttrs>) {
    this._tileLayout = tileLayout
    this.render = this.render.bind(this)
  }

  render(props: any): React.ReactElement {
    return (
      <div className={'flex h-full items-center justify-center w-full'}>
        <h1 className={'text-3xl text-pink-500'}>Hi 🃏 for you, in
          <button className={'bg-green-600 text-white'}
                  onClick={() => alert(JSON.stringify(this))}
          >
            ${this._tileLayout.id}</button>
          !
        </h1>
      </div>
    )
  }

  // hooks
  onFocus(e: any) {
    console.info('===>> focus:', this.tileLayout.id, '<<==>>', e)
  }

  static async onBeforeAddView(tileData: Partial<TileLayoutAttrs>) {
    // TODO: Add a new card to the layout
  }

  get tileLayout(): Partial<TileLayoutAttrs> {
    return this._tileLayout
  }

  get id(): string {
    return this._id
  }

  get title(): string {
    return this._title
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      tileLayout: this.tileLayout
    }
  }
}