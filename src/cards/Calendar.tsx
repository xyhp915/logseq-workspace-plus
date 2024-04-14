import { TileLayoutAttrs } from '../Layout'
import { ICardView } from './shared'
import React from 'react'
import { LSUI } from '../utils'

export class CalendarCard implements ICardView {
  static name = 'CalendarCard'
  private _id: string = 'CalendarCard'
  private _title: string = 'Calendar Card'
  private readonly _tileLayout: Partial<TileLayoutAttrs>

  constructor(tileLayout: Partial<TileLayoutAttrs>) {
    this._tileLayout = tileLayout
    this.render = this.render.bind(this)
  }

  render(props: any): React.ReactElement {
    return (
      <div className={'flex h-full items-center justify-center w-full'}>
        <LSUI.Calendar />
      </div>
    )
  }

  get id(): string {
    return this._id
  }

  get title(): string {
    return this._title
  }

  get tileLayout(): Partial<TileLayoutAttrs> {
    return this._tileLayout
  }

  toJSON(): {} {
    return {
      id: this.id,
      title: this.title,
      tileLayout: this.tileLayout
    }
  }
}

