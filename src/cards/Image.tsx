import { persistLayoutAndViewState, TileLayoutAttrs } from '../Layout'
import { ICardView } from './shared'
import { useEffect, useState } from 'react'

export class ImageCard implements ICardView {
  static name = 'ImageCard'
  private _id: string = 'ImageCard'
  private _title: string = 'A card to show images!'
  private readonly _tileLayout: Partial<TileLayoutAttrs>
  private readonly _opts: any = {}

  constructor(tileLayout: Partial<TileLayoutAttrs>, opts: any = {}) {
    this._tileLayout = tileLayout
    this._opts = opts
    this.render = this.render.bind(this)
  }

  render(props: any) {
    const { url } = this._opts
    const [url1, setUrl1] = useState(url)

    useEffect(() => {
      if (!url1) {
        const s = 'https://source.unsplash.com/random/800x600'
        fetch(s).finally(() => setUrl1(s))
        return
      }

      this._opts.url = url1
      persistLayoutAndViewState()
    }, [url1])

    return (
      <div className={'flex h-full items-center justify-center w-full'}>
        {url1 ? <img src={url1}
                     draggable={true}
                     alt={'random image'}
                     className={'w-full h-full object-cover'}/> : <h1>Loading...</h1>}
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
      tileLayout: this.tileLayout,
      ...this._opts
    }
  }

  static async onEmptyPlaceholderDrop(e: any) {
    let items = e.dataTransfer?.items
    if (!items?.length) return

    const uris = await Promise.all(Array.from(items).map((it: DataTransferItem) => {
      return new Promise<string | undefined>((resolve) => {
        if (it.kind === 'string' && it.type === 'text/uri-list') {
          return it.getAsString(s => resolve(s))
        } else {
          resolve(undefined)
        }
      })
    }))

    const validUrl = uris?.find((u) => (!!u && u.startsWith('http')))

    if (validUrl) {
      // as opts
      return { url: validUrl }
    }
  }
}
