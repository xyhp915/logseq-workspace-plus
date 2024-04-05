import { CardID, ICardView } from './shared'
import * as console from 'console'
import { TileLayoutAttrs } from '../Layout'
import { useEffect, useState } from 'react'

export class YoutubeCard implements ICardView {
  static name = 'YoutubeCard'
  private _id: string = 'YoutubeCard'
  private _title: string = 'Youtube Card'
  private readonly _tileLayout: any
  private readonly _opts: any = {}

  constructor(tileLayout: any, opts: any = {}) {
    this._tileLayout = tileLayout
    this._opts = opts
    this.render = this.render.bind(this)
  }

  render(props: any) {
    const { title, url } = this._opts
    const [url1, setUrl1] = useState(url)

    useEffect(() => {
      if (url1) {
        this._opts.url = url1
      }
    }, [url1])

    return (
      <div className={'flex h-full items-center justify-center w-full flex-col'}>
        {!url1 && <h1 className={'text-3xl text-pink-500'}>Youtube Card</h1>}
        {typeof url1 === 'string' ? (
          <iframe width="100%" height="100%"
                  style={{ margin: 0 }}
                  src={`https://www.youtube.com/embed/${url1.split('v=')[1]}`}
                  title="YouTube video player" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin" allowFullScreen></iframe>
        ) : (
          <div className={'flex items-center gap-2'}>
            <input
              type="text"
              defaultValue={url1}
              placeholder={'Enter youtube video url'}
              className={'p-2 border border-gray-300 rounded w-96'}
            />
            <button
              onClick={(e) => {
                const url1 = (e.target as any).previousElementSibling.value
                setUrl1(url1)
              }}
            >
              Load
            </button>
          </div>
        )}
      </div>
    )
  }

  // hooks
  onFocus(e: any) {
    console.info('===>> focus:', this.tileLayout.id, '<<==>>', e)
  }

  get tileLayout(): Partial<TileLayoutAttrs> {
    return this._tileLayout
  }

  get id(): CardID {
    return this._id
  }

  get title(): string {
    return this._title
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      tileLayout: this.tileLayout,
      ...this._opts
    }
  }
}