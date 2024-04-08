import { ICardView } from './shared'
import { LSUI } from '../utils'
import React from 'react'

// @ts-ignore
const Components = window.logseq?.Experiments?.Components

export class EditorCard implements ICardView {
  static name = 'EditorCard'
  private _id: string = 'EditorCard'
  private _title: string = 'Editor Card'
  private readonly _tileLayout: any
  private readonly _opts: any = {}

  constructor(tileLayout: any, opts: any = {}) {
    this.render = this.render.bind(this)
    this._tileLayout = tileLayout
    this._opts = opts
  }

  render(props: any) {
    const { name } = this._opts

    return (
      <LSUI.Card className={'p-2 w-full'}>
        <LSUI.CardHeader>
          <LSUI.CardTitle>
            <a onClick={async () => {
              const b = await logseq.Editor.getPage(name)
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
      ...this._opts
    }
  }
}