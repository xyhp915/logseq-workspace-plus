import './layout.css'
import { useImmer } from 'use-immer'
import { FC, FunctionComponent, useEffect, useState } from 'react'
import uniqid from 'uniqid'
import { CardID, ICardView, ICardViewConstructor } from './cards/shared'
import { HiCard } from './cards/Hi'
import { original } from 'immer'
import { YoutubeCard } from './cards/Youtube'
import { EditorCard } from './cards/Editor'
import { EmptyPlaceholder } from './cards/EmptyPlaceholder'
import { ImageCard } from './cards/Image'

export type Span = number
export type ViewsRecord = Record<CardID, ICardView | FunctionComponent<any>>
export type TileLayoutAttrs = {
  group: string,
  depth: number,
  index: number,
  id?: string,
  tkey?: string,
  direction?: 'row' | 'col',
  span?: Span,
  children?: Array<Span | Partial<TileLayoutAttrs>>,
  parent?: TileLayoutAttrs
  views?: ViewsRecord
}

export const gridN = 64

export function TileLayout(attrs: TileLayoutAttrs) {
  const span = attrs?.span
  const group = attrs?.group
  const direction = attrs?.direction ?? 'col'
  const id = attrs?.id || uniqid()
  const tkey = attrs?.tkey ?? 0
  const parent = attrs?.parent
  const childrenLen = attrs?.children?.length
  const spanClass = parent?.direction ? `${parent?.direction}-span-${span}` : ''
  const gridClass = !childrenLen ? 'flex' : `grid-${direction}s-${gridN}`
  const view = attrs.views?.[id] || attrs.views?.[tkey]
  const View = typeof view === 'function' ? view : view?.render
  let childrenSpanAcc = 0

  return (
    <div className={`wp-tile-layout ${gridClass} ${spanClass} as-${direction}`}
         data-group={group}
         data-key={tkey}
         id={id}
         tabIndex={0}
    >
      <b className={'wp-tile-label-text absolute'}>
        {tkey} ({span}, {id})
      </b>

      {/* card view */}
      {!childrenLen && (View ?
        (<div className={'wp-tile-layout-view'}>
          <View tid={id} tkey={tkey}/>
        </div>) :
        (<div className={'wp-tile-layout-view-placeholder'}>
          <EmptyPlaceholder/>
        </div>))}

      {!childrenLen && (
        <div className={'flex-1'}>
          <div className={'grid grid-cols-2 grid-rows-2 absolute left-2 bottom-2'}>
            <button data-action={'left'} className={'px-2 text-white'}>⬅️</button>
            <button data-action={'right'} className={'px-2 text-white'}>➡️</button>
            <button data-action={'up'} className={'px-2 text-white'}>⬆️</button>
            <button data-action={'down'} className={'px-2 text-white'}>⬇️</button>
          </div>
          <div className={'flex items-center absolute bottom-2 right-4'}>
            <button data-action={'split-v'} className={'px-2 bg-green-600 text-white mr-1 rounded'}>❙</button>
            <button data-action={'split-h'} className={'px-1 bg-green-600 text-white ml-1 rounded'}>━</button>
            <button data-action={'remove'} className={'px-2 bg-red-600 text-white ml-1 rounded'}>Ⅹ</button>
          </div>
          <div className={'flex items-center absolute top-2 right-2'}>
            {View && <button data-action={'remove-view'} className={'px-2 bg-red-500 text-white rounded'}>-</button>}
            <button data-action={'set-view'} className={'px-2 bg-purple-600 text-white ml-1 rounded'}>+</button>
          </div>
        </div>
      )}

      {attrs.children?.map((child, index) => {
          let props: TileLayoutAttrs =
            { depth: attrs.depth + 1, tkey: `${tkey}-${index}`, index, group }

          if (typeof child === 'number') {
            props.span = child
          } else {
            props = { ...child, ...props }
          }

          if (typeof props.span !== 'number' || props.span < 0) {
            props.span = gridN - childrenSpanAcc
          }

          props.children = (child as TileLayoutAttrs).children
          props.parent = { ...attrs, direction }
          props.views = attrs.views

          childrenSpanAcc += props.span

          return (
            <TileLayout {...props} />
          )
        }
      )}
    </div>
  )
}

export function parseTileDataWithTkey(tkey: string, draftData: any) {
  // remove root index
  const indexes = tkey.split('-').map(Number)?.slice(1)
  const ret = indexes.reduce(([value, refChildren, refParent], idx) => {
    return value.children ? [value.children[idx], value.children, value, idx] : [value, refChildren, refParent, idx]
  }, [draftData, false, false, 0])

  ret.push(tkey)
  return ret
}

const FlexSpan = -1
const isNumber = (s: any) => typeof s === 'number'
const isObject = (obj: any) => { return typeof obj === 'object' && obj !== null && !Array.isArray(obj)}
const isFlexibleSpan = (s: any) => (!s || s === FlexSpan || s.span === FlexSpan || (isObject(s) && s.span == undefined))
const isRootTkey = (s: string) => s === '0' || !s
const parseParentTkey = (s: string) => s?.replace(/-\d+$/, '')

export type RawTileData = number | ({ span: number, children?: Array<RawTileData> } & Partial<TileLayoutAttrs>)
export type RawTileDataProxy = { span: number, children?: Array<RawTileData> } & Partial<TileLayoutAttrs>
export type IndexedTileData = {
  idx: number,
  value: RawTileData,
  refChildren?: Array<RawTileData>,
  refParent?: RawTileData
}

function resizeTilePrevSibling(
  { idx, refChildren, }: IndexedTileData,
  draftData: any,
  step = 1
) {
  const valueRef = refChildren[idx] as RawTileDataProxy
  const valueLeft = refChildren[idx - 1]
  if (valueLeft && isNumber(valueLeft)) refChildren[idx - 1] = { span: valueLeft as number }
  const valueLeftRef = valueLeft && refChildren[idx - 1] as RawTileDataProxy
  const valueRight = refChildren[idx + 1]
  if (valueRight && isNumber(valueRight)) refChildren[idx + 1] = { span: valueRight as number }
  const valueRightRef = valueRight && refChildren[idx + 1] as RawTileDataProxy

  if (valueLeft) {
    valueLeftRef.span -= step
    if (!isFlexibleSpan(valueRef)) valueRef.span += step
  } else {
    if (!isFlexibleSpan(valueRef)) valueRef.span -= step
    if (!isFlexibleSpan(valueRight)) valueRightRef.span += step
  }

  return draftData
}

export function resizeTileLeft(tkey: string, draftData: any, step: number = 1) {
  const [value, refChildren, refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  const isInRows = refParent?.direction === 'row'

  if (isInRows) {
    const parentTkey = parseParentTkey(tkey)
    if (!parentTkey) return
    return resizeTileLeft(parentTkey, draftData, step)
  }

  if (isNumber(value)) refChildren[idx] = { span: value }

  return resizeTilePrevSibling(
    { idx, value, refChildren, refParent },
    draftData,
    step)
}

function resizeTileNextSibling(
  { idx, refChildren }: IndexedTileData,
  draftData: any,
  step = 1
) {
  const valueRef = refChildren[idx] as RawTileDataProxy
  const valueLeft = refChildren[idx - 1]
  if (valueLeft && isNumber(valueLeft)) refChildren[idx - 1] = { span: valueLeft as number }
  const valueLeftRef = valueLeft && refChildren[idx - 1] as RawTileDataProxy
  const valueRight = refChildren[idx + 1]
  if (valueRight && isNumber(valueRight)) refChildren[idx + 1] = { span: valueRight as number }
  const valueRightRef = valueRight && refChildren[idx + 1] as RawTileDataProxy

  if (valueRight) {
    if (!isFlexibleSpan(valueRef)) valueRef.span += step
    if (!isFlexibleSpan(valueRight)) valueRightRef.span -= step
  } else {
    if (!isFlexibleSpan(valueRef)) valueRef.span -= step
    if (valueLeft) valueLeftRef.span += step
  }

  return draftData
}

export function resizeTileRight(tkey: string, draftData: any, step: number = 1) {
  const [value, refChildren, refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  const isInRows = refParent?.direction === 'row'

  if (isInRows) {
    const parentTkey = parseParentTkey(tkey)
    if (!parentTkey) return
    return resizeTileRight(parentTkey, draftData, step)
  }

  if (isNumber(value)) refChildren[idx] = { span: value }

  return resizeTileNextSibling(
    { idx, value, refChildren, refParent },
    draftData, step)
}

export function resizeTileUp(tkey: string, draftData: any, step: number = 1) {
  const [value, refChildren, refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  const isInCols = refParent?.direction !== 'row'

  if (isInCols) {
    const parentTkey = parseParentTkey(tkey)
    if (isRootTkey(parentTkey)) return
    return resizeTileUp(parentTkey, draftData, step)
  }

  if (isNumber(value)) refChildren[idx] = { span: value }

  return resizeTilePrevSibling(
    { idx, value, refChildren, refParent },
    draftData, step)
}

export function resizeTileDown(tkey: string, draftData: any) {
  const [value, refChildren, refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  const isInCols = refParent?.direction !== 'row'

  if (isInCols) {
    const parentTkey = parseParentTkey(tkey)
    if (isRootTkey(parentTkey)) return
    return resizeTileDown(parentTkey, draftData)
  }

  if (isNumber(value)) refChildren[idx] = { span: value }

  return resizeTileNextSibling(
    { idx, value, refChildren },
    draftData)
}

export function splitVertical(tkey: string, draftData: any) {
  const [value, refChildren, _refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  if (isNumber(value)) refChildren[idx] = { span: value, id: uniqid() }
  const valueRef = !refChildren ? value : refChildren[idx]
  const spanId = valueRef.id

  if (!_refParent || _refParent?.direction === 'row') {
    if (!_refParent) valueRef.direction = 'col'
    valueRef.id = uniqid()
    valueRef.children = [{ span: gridN / 2, id: spanId }, { span: gridN / 2, id: uniqid() }]
  } else {
    const spanVal = isFlexibleSpan(valueRef.span) ? (
      refChildren?.length ? (gridN - (refChildren.reduce((a, v) => {
        v = isNumber(v) ? v : v.span
        return a + (isFlexibleSpan(v) ? 0 : v)
      }), 0)) : gridN
    ) : valueRef.span
    const span1 = Math.floor(spanVal / 2)
    const span2 = spanVal - span1

    valueRef.span = span1
    refChildren[idx + 1] = { span: span2, id: uniqid() }
  }

  return draftData
}

export function splitHorizontal(tkey: string, draftData: any) {
  const [value, refChildren, _refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  if (isNumber(value)) refChildren[idx] = { span: value, id: uniqid() }
  const valueRef = !refChildren ? value : refChildren[idx]
  const spanId = valueRef.id

  if (_refParent?.direction !== 'row') {
    valueRef.direction = 'row'
    valueRef.id = uniqid()
    valueRef.children = [{ span: gridN / 2, id: spanId }, { span: gridN / 2, id: uniqid() }]
  } else {
    const spanVal = isFlexibleSpan(valueRef.span) ? (
      refChildren?.length ? (gridN - (refChildren.reduce((a, v) => {
        v = isNumber(v) ? v : v.span
        return a + (isFlexibleSpan(v) ? 0 : v)
      }), 0)) : gridN
    ) : valueRef.span
    const span1 = Math.floor(spanVal / 2)
    const span2 = spanVal - span1

    valueRef.span = span1
    refChildren[idx + 1] = { span: span2, id: uniqid() }
  }

  return draftData
}

export function removeTile(tkey: string, draftData: any, callback?: (v: any) => void) {
  const [value, refChildren, _refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  const prevSiblingRef = refChildren[idx - 1]
  const nextSiblingRef = refChildren[idx + 1]

  if (prevSiblingRef && !isNumber(prevSiblingRef)) {
    if (value.span === FlexSpan) {
      prevSiblingRef.span = FlexSpan
    } else {
      prevSiblingRef.span += value.span
    }
  } else if (nextSiblingRef && !isNumber(nextSiblingRef)
    && nextSiblingRef.span !== FlexSpan) {
    nextSiblingRef.span += value.span
  }

  if (!refChildren) {
    return draftData
  }

  callback?.apply(null, [original(value)])
  refChildren.splice(idx, 1)

  if (refChildren.length === 0) {
    removeTile(parseParentTkey(tkey), draftData, callback)
  }

  return draftData
}

function inflateTileData(root: Partial<TileLayoutAttrs>) {
  const { children } = root
  if (root?.id == undefined) root.id = uniqid()
  if (!children) return root

  return {
    ...root,
    children: children.map((child: any) => {
      if (isNumber(child)) {
        child = { span: child }
      }
      return inflateTileData(child as Partial<TileLayoutAttrs>)
    })
  }
}

function MovementObserver(
  props: {
    group: string,
    views: ViewsRecord,
    layoutData: Partial<TileLayoutAttrs>,
    setLayoutData: Function
  }
) {
  const { views, layoutData, setLayoutData } = props
  const doc = top.document

  useEffect(() => {
    const groupContainer = doc.getElementById(`lsp-wp-${props.group}`)
    const doFocus = (tid: string) => {
      const tile: HTMLElement = doc.getElementById(tid)
      if (tile) {
        const view = props.views?.[tid] as ICardView
        tile.focus()
        view?.onFocus(tile)
      }
    }

    const moveHandler = (e: KeyboardEvent) => {
      const tileContainer = doc.activeElement?.closest('.wp-tile-layout')
      if (!tileContainer) return

      const getPrevClosestTile = (tkey: string, direction: string = 'col') => {
        const [value, refChildren, _refParent, idx] = parseTileDataWithTkey(tkey, props.layoutData)

        // root
        if (!tkey || tkey === '0') return

        const isStopDirection = (_refParent?.direction || 'col') === direction
        const prevSiblingRef = refChildren[idx - 1]

        if (!isStopDirection || !prevSiblingRef) {
          return getPrevClosestTile(parseParentTkey(tkey), direction)
        }

        if (prevSiblingRef) {
          const pickValidTile = (tile: any) => {
            if (!tile.children?.length) {
              return tile
            }

            // TODO: root original index
            return pickValidTile(tile.children[0])
          }

          return pickValidTile(prevSiblingRef)
        }
      }

      const getNextClosestTile = (tkey: string, direction: string = 'col') => {
        const [value, refChildren, _refParent, idx] = parseTileDataWithTkey(tkey, props.layoutData)

        // root
        if (!tkey || tkey === '0') return

        const isStopDirection = (_refParent?.direction || 'col') === direction
        const nextSiblingRef = refChildren[idx + 1]

        if (!isStopDirection || !nextSiblingRef) {
          return getNextClosestTile(parseParentTkey(tkey), direction)
        }

        if (nextSiblingRef) {
          const pickValidTile = (tile: any) => {
            if (!tile.children?.length) {
              return tile
            }

            // TODO: root original index
            return pickValidTile(tile.children[0])
          }

          return pickValidTile(nextSiblingRef)
        }
      }

      const tkey = tileContainer.getAttribute('data-key')
      const isCtrl = e.ctrlKey || e.metaKey
      const isAlt = e.altKey
      let tile = null

      switch (e.key) {
        case 'ArrowLeft':
          if (isCtrl) {
            return setLayoutData(draft => {
              return resizeTileLeft(tkey, draft)
            })
          }

          if (isAlt) {
            tile = getPrevClosestTile(tkey, 'col')
          }
          break
        case 'ArrowRight':
          if (isCtrl) {
            return setLayoutData(draft => {
              return resizeTileRight(tkey, draft)
            })
          }

          if (isAlt) {
            tile = getNextClosestTile(tkey, 'col')
          }
          break
        case 'ArrowUp':
          if (isCtrl) {
            return setLayoutData(draft => {
              return resizeTileUp(tkey, draft)
            })
          }

          if (isAlt) {
            tile = getPrevClosestTile(tkey, 'row')
          }
          break
        case 'ArrowDown':
          if (isCtrl) {
            return setLayoutData(draft => {
              return resizeTileDown(tkey, draft)
            })
          }

          if (isAlt) {
            tile = getNextClosestTile(tkey, 'row')
          }
          break
        default:
      }

      tile && doFocus(tile.id)
    }

    groupContainer?.addEventListener('keydown', moveHandler)
    return () => {
      groupContainer?.removeEventListener('keydown', moveHandler)
    }
  }, [views, layoutData, setLayoutData])

  return <></>
}

// cards view registry
const cardsViewRegistry = new Map<CardID, ICardViewConstructor>()
cardsViewRegistry.set(HiCard.name, HiCard)
cardsViewRegistry.set(YoutubeCard.name, YoutubeCard)
cardsViewRegistry.set(EditorCard.name, EditorCard)
cardsViewRegistry.set(ImageCard.name, ImageCard)

export const getCardViewCtorFromRegistry = (id: CardID) => cardsViewRegistry.get(id)
export const removeCardViewFromRegistry = (id: CardID) => cardsViewRegistry.delete(id)

export function createCardViewFromJSONMeta(meta: any) {
  const { id, tileLayout, ...opts } = meta
  const Ctor = getCardViewCtorFromRegistry(id)
  if (!Ctor) return

  return new Ctor(tileLayout, opts)
}

function createADemoView(tkey: string) {
  return () => {
    return (
      <div className={'p-4 bg-green-600 text-white rounded-xl flex-1 w-full h-full flex items-center justify-center'}>
        <button>Hi, Card View in #{tkey}!</button>
      </div>
    )
  }
}

let setLastLayoutUpdate: Function = null

export function persistLayoutAndViewState() {
  setLastLayoutUpdate?.(Date.now())
}

export function TileLayoutRoot(props: {
  requireCardView: (t: Partial<TileLayoutAttrs>) => Promise<ICardView | FC<any>>
}) {
  const group = 'lsp-ws-1'
  const [layoutData, setLayoutData] = useImmer<Partial<TileLayoutAttrs>>(inflateTileData({}))
  const [lastLayoutUpdate, setLastLayoutUpdate1] = useState(Date.now())

  const [views, setViews] =
    useState<ViewsRecord>({
      'test-id': () => <button>Hi, Card View!</button>
    })

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    setLastLayoutUpdate = setLastLayoutUpdate1
    return () => {
      setLastLayoutUpdate = null
    }
  }, [])

  // persist the layout & views
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(group, JSON.stringify({ layoutData, views, lastLayoutUpdate }))
    } else {
      // restore the layout and views
      const data = localStorage.getItem(group)
      if (data) {
        const { layoutData, views } = JSON.parse(data)
        setLayoutData(layoutData)

        if (views) {
          Object.entries(views).forEach(([id, viewMeta]) => {
            if (viewMeta) {
              views[id] = createCardViewFromJSONMeta(viewMeta)
            } else {
              delete views[id]
            }
          })

          setViews(views)
        }
      }
    }
  }, [mounted, layoutData, views, lastLayoutUpdate])

  return (
    <>
      {mounted && <MovementObserver
        group={group}
        views={views}
        layoutData={layoutData}
        setLayoutData={setLayoutData}/>}
      <div className={'wp-tile-layout-root'}
           id={`lsp-wp-${group}`}
           onClick={(e) => {
             const target = e.target as HTMLElement
             const action = target.getAttribute('data-action')
             const tkey = target.closest('.wp-tile-layout')?.getAttribute('data-key')
             const tid = target.closest('.wp-tile-layout')?.id

             switch (action) {
               case 'left':
                 return setLayoutData(draft => {
                   return resizeTileLeft(tkey, draft)
                 })
               case 'right':
                 return setLayoutData(draft => {
                   return resizeTileRight(tkey, draft)
                 })
               case 'up':
                 return setLayoutData(draft => {
                   return resizeTileUp(tkey, draft)
                 })
               case 'down':
                 return setLayoutData(draft => {
                   return resizeTileDown(tkey, draft)
                 })
               case 'split-v':
                 return setLayoutData(draft => {
                   return splitVertical(tkey, draft)
                 })
               case 'split-h':
                 return setLayoutData(draft => {
                   return splitHorizontal(tkey, draft)
                 })
               case 'remove':
                 return setLayoutData(draft => {
                   return removeTile(tkey, draft, (t) => {
                     if (t?.id && views[t.id]) {
                       console.log('===>> remove:', t)
                       setViews((v) => {
                         delete v[t.id]
                         return v
                       })
                     }
                   })
                 })
               case 'set-view':
                 return props.requireCardView({ id: tid }).then(View => {
                   return setViews({
                     ...views,
                     [tid]: View
                   })
                 })
               case 'remove-view':
                 return setViews((v) => {
                   delete v[tid]
                   return { ...v }
                 })
               default:
             }
           }}
      >
        <TileLayout group={group} depth={0} index={0} views={views} {...layoutData}/>
      </div>
    </>
  )
}