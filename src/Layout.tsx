import './layout.css'
import { useImmer } from 'use-immer'
import { FC, FunctionComponent, useCallback, useState } from 'react'
import uniqid from 'uniqid'

type Span = number
type TileLayoutAttrs = {
  group: string,
  depth: number,
  index: number,
  id?: string,
  tid?: string,
  direction?: 'row' | 'col',
  span?: Span,
  children?: Array<Span | Partial<TileLayoutAttrs>>,
  parent?: TileLayoutAttrs
  views?: Record<string, FC<any>>
  card?: any
}

export const gridN = 64

export function TileLayout(attrs: TileLayoutAttrs) {
  const span = attrs?.span
  const group = attrs?.group
  const direction = attrs?.direction ?? 'col'
  const id = attrs?.id
  const tid = attrs?.tid ?? 0
  const parent = attrs?.parent
  const childrenLen = attrs?.children?.length
  const spanClass = parent?.direction ? `${parent?.direction}-span-${span}` : ''
  const gridClass = !childrenLen ? 'flex justify-center items-center' : `grid-${direction}s-${gridN}`
  const View = attrs.views?.[id] || attrs.views?.[tid]
  let childrenSpanAcc = 0

  return (
    <div className={`wp-tile-layout ${gridClass} ${spanClass} as-${direction}`}
         data-group={group}
         data-key={tid}
         tabIndex={0}
    >
      <b className={'absolute bg-amber-500 text-white p-2 top-2 left-2 text-sm'}>
        {tid} ({span}, {id})
      </b>

      {/* card view */}
      {!childrenLen && View && (
        <div className={'card-view absolute top-32 left-16 p-4 bg-green-600 text-white rounded'}>
          <View/>
        </div>
      )}

      {!childrenLen && (
        <div className={'flex-1'}>
          <span className={'grid grid-cols-2 grid-rows-2'}>
            <button data-action={'left'} className={'px-2 text-white'}>⬅️</button>
            <button data-action={'right'} className={'px-2 text-white'}>➡️</button>
            <button data-action={'up'} className={'px-2 text-white'}>⬆️</button>
            <button data-action={'down'} className={'px-2 text-white'}>⬇️</button>
            <div className={'flex items-center absolute bottom-2 right-4'}>
              <button data-action={'split-v'} className={'px-2 bg-green-600 text-white mr-1 rounded'}>❙</button>
              <button data-action={'split-h'} className={'px-1 bg-green-600 text-white ml-1 rounded'}>━</button>
              <button data-action={'remove'} className={'px-2 bg-red-600 text-white ml-1 rounded'}>Ⅹ</button>
            </div>
          </span>
        </div>
      )}

      {attrs.children?.map((child, index) => {
          let props: TileLayoutAttrs =
            { depth: attrs.depth + 1, tid: `${tid}-${index}`, index, group }

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

export function parseTileDataWithTid(tid: string, draftData: any) {
  // remove root index
  const indexes = tid.split('-').map(Number)?.slice(1)
  const ret = indexes.reduce(([value, refChildren, refParent], idx) => {
    return value.children ? [value.children[idx], value.children, value, idx] : [value, refChildren, refParent, idx]
  }, [draftData, false, false, 0])

  ret.push(tid)
  return ret
}

const isNumber = (s: any) => typeof s === 'number'
const isObject = (obj: any) => { return typeof obj === 'object' && obj !== null && !Array.isArray(obj)}
const isFlexibleSpan = (s: any) => (!s || s === -1 || s.span === -1 || (isObject(s) && s.span == undefined))
const parseParentTid = (s: string) => s?.replace(/-\d+$/, '')

type RawTileData = number | ({ span: number, children?: Array<RawTileData> } & Partial<TileLayoutAttrs>)
type RawTileDataProxy = { span: number, children?: Array<RawTileData> } & Partial<TileLayoutAttrs>
type IndexedTileData = {
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

export function resizeTileLeft(tid: string, draftData: any, step: number = 1) {
  const [value, refChildren, refParent, idx] = parseTileDataWithTid(tid, draftData)
  const isInRows = refParent?.direction === 'row'

  if (isInRows) {
    const parentTid = parseParentTid(tid)
    if (!parentTid) return
    return resizeTileLeft(parentTid, draftData, step)
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

export function resizeTileRight(tid: string, draftData: any, step: number = 1) {
  const [value, refChildren, refParent, idx] = parseTileDataWithTid(tid, draftData)
  const isInRows = refParent?.direction === 'row'

  if (isInRows) {
    const parentTid = parseParentTid(tid)
    if (!parentTid) return
    return resizeTileRight(parentTid, draftData, step)
  }

  if (isNumber(value)) refChildren[idx] = { span: value }

  return resizeTileNextSibling(
    { idx, value, refChildren, refParent },
    draftData, step)
}

export function resizeTileUp(tid: string, draftData: any, step: number = 1) {
  const [value, refChildren, refParent, idx] = parseTileDataWithTid(tid, draftData)
  const isInCols = refParent?.direction !== 'row'

  if (isInCols) {
    const parentTid = parseParentTid(tid)
    if (!parentTid) return
    return resizeTileUp(parentTid, draftData, step)
  }

  if (isNumber(value)) refChildren[idx] = { span: value }

  return resizeTilePrevSibling(
    { idx, value, refChildren, refParent },
    draftData, step)
}

export function resizeTileDown(tid: string, draftData: any) {
  const [value, refChildren, refParent, idx] = parseTileDataWithTid(tid, draftData)
  const isInCols = refParent?.direction !== 'row'

  if (isInCols) {
    const parentTid = parseParentTid(tid)
    if (!parentTid) return
    return resizeTileDown(parentTid, draftData)
  }

  if (isNumber(value)) refChildren[idx] = { span: value }

  return resizeTileNextSibling(
    { idx, value, refChildren },
    draftData)
}

export function splitVertical(tid: string, draftData: any) {
  const [value, refChildren, _refParent, idx] = parseTileDataWithTid(tid, draftData)
  if (isNumber(value)) refChildren[idx] = { span: value, id: uniqid() }
  refChildren[idx].children = [{ span: gridN / 2, id: uniqid(), }, { span: gridN / 2, id: uniqid() }]
  return draftData
}

export function splitHorizontal(tid: string, draftData: any) {
  const [value, refChildren, _refParent, idx] = parseTileDataWithTid(tid, draftData)
  if (isNumber(value)) refChildren[idx] = { span: value, id: uniqid() }
  refChildren[idx].direction = 'row'
  refChildren[idx].children = [{ span: gridN / 2, id: uniqid() }, { span: gridN / 2, id: uniqid() }]
  return draftData
}

export function removeTile(tid: string, draftData: any) {
  const [value, refChildren, _refParent, idx] = parseTileDataWithTid(tid, draftData)
  const prevSiblingRef = refChildren[idx - 1]
  const nextSiblingRef = refChildren[idx + 1]

  if (prevSiblingRef && !isNumber(prevSiblingRef)) {
    prevSiblingRef.span += value.span
  } else if (nextSiblingRef && !isNumber(nextSiblingRef)
    && nextSiblingRef.span !== -1) {
    nextSiblingRef.span += value.span
  }

  refChildren.splice(idx, 1)
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

export function TileLayoutRoot() {
  const group = 'charlie-1'
  const [layoutData, setLayoutData] = useImmer<Partial<TileLayoutAttrs>>(
    inflateTileData({
      direction: 'row',
      children: [
        {
          span: 24,
          children: [16, { id: 'test-id', span: 22 }, 7, -1]
        },
        10,
        {
          span: 23,
          children: [12, 12, 8, { span: 12, direction: 'row', children: [32, 32] }, -1]
        },
        { children: [23, 12, -1] }
      ]
    })
  )

  const [views, setViews] =
    useState<{ [id: string]: FunctionComponent<any> }>({
      'test-id': () => <button>Hi, Card View!</button>
    })

  return (
    <div className={'wp-tile-layout-root'}
         id={`lsp-wp-${group}`}
         onClick={(e) => {
           const target = e.target as HTMLElement
           const action = target.getAttribute('data-action')
           const tid = target.closest('.wp-tile-layout')?.getAttribute('data-key')

           switch (action) {
             case 'left':
               return setLayoutData(draft => {
                 return resizeTileLeft(tid, draft)
               })
             case 'right':
               return setLayoutData(draft => {
                 return resizeTileRight(tid, draft)
               })
             case 'up':
               return setLayoutData(draft => {
                 return resizeTileUp(tid, draft)
               })
             case 'down':
               return setLayoutData(draft => {
                 return resizeTileDown(tid, draft)
               })
             case 'split-v':
               return setLayoutData(draft => {
                 return splitVertical(tid, draft)
               })
             case 'split-h':
               return setLayoutData(draft => {
                 return splitHorizontal(tid, draft)
               })
             case 'remove':
               return setLayoutData(draft => {
                 return removeTile(tid, draft)
               })
             default:
           }
         }}
    >
      <TileLayout group={group} depth={0} index={0} views={views} {...layoutData}/>
    </div>
  )
}