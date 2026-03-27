import './layout.css'
import { useImmer } from 'use-immer'
import { FC, FunctionComponent, useEffect, useRef, useState } from 'react'
import uniqid from 'uniqid'
import { CardID, ICardView, ICardViewConstructor } from './cards/shared'
import { HiCard } from './cards/Hi'
import { original } from 'immer'
import { YoutubeCard } from './cards/Youtube'
import { EditorCard } from './cards/Editor'
import { EmptyPlaceholder } from './cards/EmptyPlaceholder'
import { ImageCard } from './cards/Image'
import { LSUI, SHUI } from './utils'
import { CalendarCard } from './cards/Calendar'

export type Span = number
export type ViewsRecord = Record<CardID, ICardView | FC<any>>
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
  const doc = top.document
  const elRef = useRef(null)
  let childrenSpanAcc = 0

  return (
    <div className={`wp-tile-layout ${gridClass} ${spanClass} as-${direction}`}
         data-group={group}
         data-key={tkey}
         id={id}
         ref={elRef}
         tabIndex={0}
         onKeyUp={(e) => {
           if (e.key === 'Enter') {
             if (doc.activeElement === elRef.current) {
               (view as ICardView)?.onEnter(e.target)
             }
           }
         }}
    >
      {/* card view */}
      {!childrenLen && (View ?
        (<div className={'wp-tile-layout-view'}>
          <View tid={id} tkey={tkey}/>
        </div>) :
        (<div className={'wp-tile-layout-view-placeholder'}>
          <EmptyPlaceholder
            tileLayout={attrs}
            cardsViewRegistry={cardsViewRegistry}/>
        </div>))}

      {!childrenLen && (
        <div
          className={'wp-tile-layout-toolbar absolute flex justify-between bg-secondary shadow w-full top-0 left-0 p-2 items-center'}>
          <b className={'wp-tile-label-text'}>
            {tkey} ({span}, {id})
          </b>
          <div className={'flex items-center gap-2'}>
            {View && <button
              data-action={'remove-view'}
              className={'px-2 flex items-center'}>
              <SHUI.TablerIcon name={'trash'}/>
            </button>}
            <button
              data-action={'set-view'}
              className={'px-2 flex items-center'}>
              <SHUI.TablerIcon name={'circle-plus'}/>
            </button>

            <button data-action={'split-v'}
                    className={'flex items-center mr-1'}>
              <SHUI.TablerIcon name={'circle-half'}/>
            </button>
            <button data-action={'split-h'}
                    className={'flex items-center mr-1'}>
              <SHUI.TablerIcon name={'circle-half-vertical'}/>
            </button>
            <button data-action={'remove'}
                    className={'mr-1 flex items-center text-red-700'}>
              <SHUI.TablerIcon name={'x'}/>
            </button>
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

          if (isFlexibleSpan(props.span)) {
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
const parsePrevSiblingTkey = (s: string) => s?.replace(/-(\d+)$/, (s, p1) => `-${p1 - 1}`)
const parseNextSiblingTkey = (s: string) => s?.replace(/-(\d+)$/, (s, p1) => `-${p1 + 1}`)

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
  // do not resize the only child
  if (refChildren?.length === 1) return draftData

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
    if (!parentTkey || isRootTkey(parentTkey)) return
    const [_, parentRefChildren] = parseTileDataWithTkey(parentTkey, draftData)
    if (parentRefChildren?.length === 1) return
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
  // do not resize the only child
  if (refChildren?.length === 1) return draftData

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
    if (!parentTkey || isRootTkey(parentTkey)) return
    const [_, parentRefChildren] = parseTileDataWithTkey(parentTkey, draftData)
    if (parentRefChildren?.length === 1) return
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
    const [_, parentRefChildren] = parseTileDataWithTkey(parentTkey, draftData)
    if (parentRefChildren?.length === 1) return
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
    if (!parentTkey || isRootTkey(parentTkey)) return
    const [_, parentRefChildren] = parseTileDataWithTkey(parentTkey, draftData)
    if (parentRefChildren?.length === 1) return
    return resizeTileDown(parentTkey, draftData)
  }

  if (isNumber(value)) refChildren[idx] = { span: value }

  return resizeTileNextSibling(
    { idx, value, refChildren },
    draftData)
}

export function splitVertical(tkey: string, draftData: any, callback?: Function) {
  const [value, refChildren, _refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  if (isNumber(value)) refChildren[idx] = { span: value, id: uniqid() }
  const valueRef = !refChildren ? value : refChildren[idx]
  const spanId = valueRef.id
  const newSpanId = uniqid()

  if (!_refParent || _refParent?.direction === 'row') {
    if (!_refParent) valueRef.direction = 'col'
    valueRef.id = uniqid()
    valueRef.children = [{ span: gridN / 2, id: spanId }, { span: gridN / 2, id: newSpanId }]
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
    refChildren[idx + 1] = { span: span2, id: newSpanId }
  }

  callback?.(newSpanId)

  return draftData
}

export function splitHorizontal(tkey: string, draftData: any, callback?: Function) {
  const [value, refChildren, _refParent, idx] = parseTileDataWithTkey(tkey, draftData)
  if (isNumber(value)) refChildren[idx] = { span: value, id: uniqid() }
  const valueRef = !refChildren ? value : refChildren[idx]
  const spanId = valueRef.id
  const newSpanId = uniqid()

  if (_refParent?.direction !== 'row') {
    valueRef.direction = 'row'
    valueRef.id = uniqid()
    valueRef.children = [{ span: gridN / 2, id: spanId }, { span: gridN / 2, id: newSpanId }]
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
    refChildren[idx + 1] = { span: span2, id: newSpanId }
  }

  callback?.(newSpanId)

  return draftData
}

export function removeTile(tkey: string, draftData: any, callback?: (v: any) => void, back?: boolean) {
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

  if (!back) {
    callback?.apply(null, [original(value)])
  }

  refChildren.splice(idx, 1)

  if (!back && refChildren.length === 0) {
    removeTile(parseParentTkey(tkey), draftData, callback)
  } else if (refChildren.length === 1) { // back
    const childTkey = parsePrevSiblingTkey(tkey)
    const [childValue] = parseTileDataWithTkey(childTkey, draftData)
    // TODO: deep nested children
    if (childValue.children?.length < 2) {
      const [parentValue] = parseTileDataWithTkey(parseParentTkey(tkey), draftData)
      parentValue.id = refChildren[0].id
      removeTile(childTkey, draftData, callback, true)
    }
  }

  return draftData
}

// ─── tmux-inspired layout algorithms ────────────────────────────────────────
//
// 新算法优势整理
// ──────────────
// 当前实现（基于 span）:
//   • 每个 pane 都带一个整数 span（总网格 gridN = 64）。
//   • 多次 split / remove / resize 之后，span 会逐渐漂移成 16、22、7、19…
//   • 只能做局部调整，缺少“整体重新均衡”与“一键套用预设布局”的能力。
//
// 这里借鉴的 tmux 思路:
//   • layout_spread_cells：在每一层把可用空间重新均匀分配给所有兄弟节点，
//     用来解决长期编辑后的比例失衡问题。
//   • 五种经典预设布局：even-horizontal、even-vertical、main-horizontal、
//     main-vertical、tiled，可以在保留叶子 pane 身份（id）的同时整体重排。
//
// 相比旧方式，这套算法的优势是:
//   • 更稳：可以把累计漂移的 span 拉回均衡状态。
//   • 更快：常见布局可以直接切换，不必手工多次拖拽。
//   • 更友好：接口表达的是“布局意图”，而不只是底层 span 编辑。
//
// 需要特别说明：tmux 本身并不是严格意义上的“二叉树布局系统”。
//   • tmux 的内部布局节点可以维护一组 cell / pane，重点是“容器 + 方向 +
//     空间分配”，并不要求每个非叶子节点只能有两个孩子。
//   • 这个项目同样不直接照搬 tmux 的内部结构，而是继续沿用现有的
//     direction + children + span 数据模型，因为它已经和当前渲染、拖拽、
//     split / resize API 紧密耦合。
//   • 也就是说，这里复用的是 tmux 的“布局算法思想”，不是它的底层数据结构：
//     我们只引入“均衡分配”和“预设重排”，避免为了文档化的新能力去推翻现有树模型。
//
// The functions below bring these ideas to the existing span-based tree model.
// They stay compatible with immer draft objects and the current resize / split
// APIs instead of replacing the underlying data structure with tmux internals.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The five tmux-style layout presets supported by this plugin.
 */
export type TmuxLayoutPreset = 'even-h' | 'even-v' | 'main-h' | 'main-v' | 'tiled'

/**
 * Metadata for each tmux layout preset, useful for building toolbars or menus.
 *
 * label   – short display text
 * title   – longer tooltip / accessible name
 * shortcut – keyboard shortcut hint (leading key is Ctrl+X)
 */
export const TMUX_LAYOUT_PRESETS: Array<{
  id: TmuxLayoutPreset
  label: string
  title: string
  shortcut: string
}> = [
  { id: 'even-h',  label: '⬜⬜ Even H',   title: 'Even Horizontal – equal-width columns',          shortcut: 'Ctrl+X 1' },
  { id: 'even-v',  label: '☰ Even V',     title: 'Even Vertical – equal-height rows',              shortcut: 'Ctrl+X 2' },
  { id: 'main-h',  label: '▤ Main H',     title: 'Main Horizontal – large pane on top',            shortcut: 'Ctrl+X 3' },
  { id: 'main-v',  label: '▥ Main V',     title: 'Main Vertical – large pane on left',             shortcut: 'Ctrl+X 4' },
  { id: 'tiled',   label: '⊞ Tiled',      title: 'Tiled – balanced grid',                          shortcut: 'Ctrl+X 5' },
]

/**
 * Walk the layout tree and collect the id of every leaf node (a node without
 * children).  Plain-number children have no id; a fresh id is generated for
 * them so they can be addressed after restructuring.
 *
 * Analogous to tmux's internal pane enumeration used before layout_spread_cells.
 */
function gatherLeafIds(data: any): string[] {
  if (isNumber(data) || !data) return [uniqid()]
  if (!data.children?.length)  return [data.id || uniqid()]
  return (data.children as any[]).flatMap((child: any) => gatherLeafIds(child))
}

/**
 * Evenly redistribute spans among siblings at *every* level of the layout tree
 * without changing its structure.
 *
 * **tmux equivalent:** `layout_spread_cells`
 *
 * Current behaviour: spans can accumulate rounding errors after repeated
 * splits and removals (e.g. 16 + 22 + 7 + 19 in one row).
 * After calling this function every sibling group is normalised so that spans
 * sum to exactly gridN, with at most 1 extra unit distributed to leading
 * children to absorb the integer remainder.
 *
 * Works as an immer-compatible mutating function:
 * ```ts
 * setLayoutData(draft => equalizeChildSpans(draft))
 * ```
 */
export function equalizeChildSpans(draftData: any): any {
  if (isNumber(draftData) || !draftData) return draftData
  if (!draftData.children?.length) return draftData

  const children = draftData.children as any[]
  const n = children.length
  const baseSpan = Math.floor(gridN / n)
  const remainder = gridN - baseSpan * n

  for (let i = 0; i < n; i++) {
    const span = baseSpan + (i < remainder ? 1 : 0)
    if (isNumber(children[i])) {
      children[i] = { span }
    } else {
      children[i].span = span
    }
    equalizeChildSpans(children[i])
  }

  return draftData
}

/**
 * Apply the **even-horizontal** preset (tmux: `even-horizontal`).
 *
 * All leaf panes are arranged as equal-width columns in a single row.
 * The pane tree is completely restructured; leaf ids are preserved so that
 * associated views remain intact.
 *
 * ```
 * Before (any layout)   After
 * ┌────┬────┐           ┌──┬──┬──┐
 * │    │ ┌─┤           │  │  │  │
 * │    │ └─┤           └──┴──┴──┘
 * └────┴────┘
 * ```
 */
export function applyLayoutEvenH(draftData: any): any {
  const ids = gatherLeafIds(draftData)
  const n = ids.length
  if (n <= 1) return draftData

  const baseSpan = Math.floor(gridN / n)
  const remainder = gridN - baseSpan * n

  draftData.direction = 'row'
  draftData.children = ids.map((id, i) => ({
    id,
    span: baseSpan + (i < remainder ? 1 : 0),
  }))

  return draftData
}

/**
 * Apply the **even-vertical** preset (tmux: `even-vertical`).
 *
 * All leaf panes are stacked as equal-height rows.
 *
 * ```
 * ┌────┐
 * ├────┤
 * └────┘
 * ```
 */
export function applyLayoutEvenV(draftData: any): any {
  const ids = gatherLeafIds(draftData)
  const n = ids.length
  if (n <= 1) return draftData

  const baseSpan = Math.floor(gridN / n)
  const remainder = gridN - baseSpan * n

  draftData.direction = 'col'
  draftData.children = ids.map((id, i) => ({
    id,
    span: baseSpan + (i < remainder ? 1 : 0),
  }))

  return draftData
}

/**
 * Split gridN into a larger "main" half and a smaller "side" half.
 * Used by both applyLayoutMainV and applyLayoutMainH.
 * Returns [mainSpan, sideSpan] where mainSpan ≥ sideSpan.
 */
function splitHalf(): [number, number] {
  const mainSpan = Math.ceil(gridN / 2)
  return [mainSpan, gridN - mainSpan]
}

/**
 * Apply the **main-vertical** preset (tmux: `main-vertical`).
 *
 * The first leaf pane occupies the left half of the workspace.  The remaining
 * panes are stacked in equal-height rows in the right half.
 *
 * ```
 * ┌──┬──┐
 * │  │  │
 * │  ├──┤
 * │  │  │
 * └──┴──┘
 * ```
 */
export function applyLayoutMainV(draftData: any): any {
  const ids = gatherLeafIds(draftData)
  const n = ids.length
  if (n <= 1) return draftData

  const [mainSpan, sideSpan] = splitHalf()
  const restN   = n - 1
  const baseSpan = Math.floor(gridN / restN)
  const remainder = gridN - baseSpan * restN

  draftData.direction = 'row'
  draftData.children = [
    { id: ids[0], span: mainSpan },
    {
      id: uniqid(),
      span: sideSpan,
      direction: 'col',
      children: ids.slice(1).map((id, i) => ({
        id,
        span: baseSpan + (i < remainder ? 1 : 0),
      })),
    },
  ]

  return draftData
}

/**
 * Apply the **main-horizontal** preset (tmux: `main-horizontal`).
 *
 * The first leaf pane occupies the top half of the workspace.  The remaining
 * panes are arranged as equal-width columns in the bottom half.
 *
 * ```
 * ┌────┐
 * ├─┬─┬┤
 * └─┴─┴┘
 * ```
 */
export function applyLayoutMainH(draftData: any): any {
  const ids = gatherLeafIds(draftData)
  const n = ids.length
  if (n <= 1) return draftData

  const [mainSpan, sideSpan] = splitHalf()
  const restN    = n - 1
  const baseSpan = Math.floor(gridN / restN)
  const remainder = gridN - baseSpan * restN

  draftData.direction = 'col'
  draftData.children = [
    { id: ids[0], span: mainSpan },
    {
      id: uniqid(),
      span: sideSpan,
      direction: 'row',
      children: ids.slice(1).map((id, i) => ({
        id,
        span: baseSpan + (i < remainder ? 1 : 0),
      })),
    },
  ]

  return draftData
}

/**
 * Apply the **tiled** preset (tmux: `tiled`).
 *
 * Panes are arranged in a balanced grid of ⌈√n⌉ columns and ⌈n/cols⌉ rows.
 * Each row independently distributes its panes across the full width, so the
 * last (potentially shorter) row fills the space correctly.
 *
 * ```
 * ┌─┬─┐
 * ├─┼─┤
 * └─┴─┘
 * ```
 */
export function applyLayoutTiled(draftData: any): any {
  const ids = gatherLeafIds(draftData)
  const n = ids.length
  if (n <= 1) return draftData

  const cols = Math.ceil(Math.sqrt(n))
  const rows = Math.ceil(n / cols)
  const rowBaseSpan = Math.floor(gridN / rows)
  const rowRemainder = gridN - rowBaseSpan * rows

  draftData.direction = 'col'
  draftData.children = []

  for (let r = 0; r < rows; r++) {
    const rowIds = ids.slice(r * cols, (r + 1) * cols)
    if (rowIds.length === 0) break

    const rowSpan = rowBaseSpan + (r < rowRemainder ? 1 : 0)

    if (rowIds.length === 1) {
      draftData.children.push({ id: rowIds[0], span: rowSpan })
    } else {
      const colBase = Math.floor(gridN / rowIds.length)
      const colRem  = gridN - colBase * rowIds.length
      draftData.children.push({
        id: uniqid(),
        span: rowSpan,
        direction: 'row',
        children: rowIds.map((id, c) => ({
          id,
          span: colBase + (c < colRem ? 1 : 0),
        })),
      })
    }
  }

  return draftData
}

/**
 * Apply any tmux layout preset by name.
 *
 * This is the preferred high-level entry point:
 * ```ts
 * setLayoutData(draft => applyTmuxLayout('tiled', draft))
 * ```
 */
export function applyTmuxLayout(preset: TmuxLayoutPreset, draftData: any): any {
  switch (preset) {
    case 'even-h': return applyLayoutEvenH(draftData)
    case 'even-v': return applyLayoutEvenV(draftData)
    case 'main-h': return applyLayoutMainH(draftData)
    case 'main-v': return applyLayoutMainV(draftData)
    case 'tiled':  return applyLayoutTiled(draftData)
  }
}
// ─────────────────────────────────────────────────────────────────────────────

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
    setLayoutData: Function,
    ops: { doRemove: Function, doSplitV: Function, doSplitH: Function, doLayout: Function }
  }
) {
  const { views, layoutData, setLayoutData, ops } = props
  const lastFocusTidRef = useRef(null)
  const [isKeyLeading, setIsKeyLeading] = useState<any>(false)
  const doc = top.document

  const doFocus = (tid: string, delay = 0) => {
    const fn = () => {
      const tile: HTMLElement = doc.getElementById(tid)
      if (!tile) return
      const view = props.views?.[tid] as ICardView

      // trigger prev view blur
      if (lastFocusTidRef.current && lastFocusTidRef.current !== tid) {
        const prevView = props.views?.[lastFocusTidRef.current] as ICardView
        prevView?.onBlur?.(tile)
      }

      tile.focus()
      view?.onFocus?.(tile)
      lastFocusTidRef.current = tid
    }

    if (delay > 0) {
      setTimeout(fn, delay)
    } else {
      fn()
    }
  }

  const doMove = (
    tkey: string,
    arrowDirection: string,
    opts: { isResizeFlag: boolean, isFocusFlag: boolean } = { isResizeFlag: false, isFocusFlag: true }
  ) => {
    const { isFocusFlag, isResizeFlag } = opts

    const getPrevClosestTile = (tkey: string, direction: string = 'col') => {
      const [value, refChildren, _refParent, idx] = parseTileDataWithTkey(tkey, props.layoutData)

      // root
      if (isRootTkey(tkey)) return

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

    let tile = null

    switch (arrowDirection) {
      case 'ArrowLeft':
        if (isResizeFlag) {
          return setLayoutData(draft => {
            return resizeTileLeft(tkey, draft)
          })
        }

        if (isFocusFlag) {
          tile = getPrevClosestTile(tkey, 'col')
        }
        break
      case 'ArrowRight':
        if (isResizeFlag) {
          return setLayoutData(draft => {
            return resizeTileRight(tkey, draft)
          })
        }

        if (isFocusFlag) {
          tile = getNextClosestTile(tkey, 'col')
        }
        break
      case 'ArrowUp':
        if (isResizeFlag) {
          return setLayoutData(draft => {
            return resizeTileUp(tkey, draft)
          })
        }

        if (isFocusFlag) {
          tile = getPrevClosestTile(tkey, 'row')
        }
        break
      case 'ArrowDown':
        if (isResizeFlag) {
          return setLayoutData(draft => {
            return resizeTileDown(tkey, draft)
          })
        }

        if (isFocusFlag) {
          tile = getNextClosestTile(tkey, 'row')
        }
        break
      default:
    }

    tile && doFocus(tile.id)
  }

  // leading key handler & restore focus
  useEffect(() => {
    const gLeadingHandler = (e: KeyboardEvent) => {
      let tileContainer = doc.activeElement?.closest('.wp-tile-layout')

      if (!tileContainer) {
        // TODO: infer the latest tile container
        if (lastFocusTidRef.current) {
          tileContainer = doc.getElementById(lastFocusTidRef.current)
        } else {
          const selectedBlock = doc.querySelector('.ls-block.selected')
          if (selectedBlock) {
            tileContainer = selectedBlock.closest('.wp-tile-layout')
          }
        }
      }

      if (!tileContainer) return

      if (isKeyLeading) {
        const moveOpts = { isResizeFlag: e.ctrlKey, isFocusFlag: !e.ctrlKey }
        const tkey = tileContainer.getAttribute('data-key')

        clearTimeout(isKeyLeading)
        setIsKeyLeading(false)

        switch (e.key) {
          case 'h':
            return doMove(tkey, 'ArrowLeft', moveOpts)
          case 'j':
            return doMove(tkey, 'ArrowDown', moveOpts)
          case 'k':
            return doMove(tkey, 'ArrowUp', moveOpts)
          case 'l':
            return doMove(tkey, 'ArrowRight', moveOpts)
          case '=':
            return ops.doSplitV(tkey, (tid: string) => doFocus(tid, 64))
          case '-':
            return ops.doSplitH(tkey, (tid: string) => doFocus(tid, 64))
          case 'd':
            return ops.doRemove(tkey)
          // tmux-style preset layout shortcuts (Ctrl+X → 1-5, e)
          case '1': return ops.doLayout('even-h')
          case '2': return ops.doLayout('even-v')
          case '3': return ops.doLayout('main-h')
          case '4': return ops.doLayout('main-v')
          case '5': return ops.doLayout('tiled')
          case 'e': return setLayoutData((draft: any) => equalizeChildSpans(draft))
        }
      }

      if (e.ctrlKey && e.code === 'KeyX') {
        const leadingTimer = setTimeout(() => {setIsKeyLeading(false)}, 2000)
        setIsKeyLeading(leadingTimer)
      }
    }

    doc.addEventListener('keydown', gLeadingHandler)
    return () => {
      doc.removeEventListener('keydown', gLeadingHandler)
    }
  }, [isKeyLeading])

  // tile movement handler
  useEffect(() => {
    const groupContainer = doc.getElementById(`lsp-wp-${props.group}`)

    const moveHandler = (e: KeyboardEvent) => {
      const tileContainer = doc.activeElement?.closest('.wp-tile-layout')
      if (!tileContainer) {
        const isDirectionKey = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
        if (isDirectionKey && lastFocusTidRef.current) {
          doFocus(lastFocusTidRef.current)
        }

        return
      }

      const tkey = tileContainer.getAttribute('data-key')
      const isResizeFlag = e.ctrlKey || e.metaKey
      const isFocusFlag = e.altKey
      const arrowDirection = e.key

      doMove(tkey, arrowDirection, { isResizeFlag, isFocusFlag })
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
cardsViewRegistry.set(CalendarCard.name, CalendarCard)

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

let _setLastLayoutUpdate = null

export function persistLayoutAndViewState() {
  _setLastLayoutUpdate?.(Date.now())
}

let _setViews = null

export function applyCardViewInTile(
  tid: string,
  view: string | ICardViewConstructor,
  opts?: any
) {
  const ViewCtor = typeof view === 'string' ? getCardViewCtorFromRegistry(view) : view
  if (!ViewCtor) return

  _setViews((v: ViewsRecord) => {
    return {
      ...v,
      [tid]: new ViewCtor({ id: tid }, opts)
    }
  })
}

export function TileLayoutRoot(props: {
  onRequireCardView: (t: Partial<TileLayoutAttrs>, e?: any) => void
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
    _setLastLayoutUpdate = setLastLayoutUpdate1
    _setViews = setViews
    return () => {
      _setLastLayoutUpdate = null
      _setViews = null
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

  // ops
  const doRemove = (tkey: string) => {
    setLayoutData(draft => {
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
  }

  const doSplitV = (tkey: string, callback?: Function) => {
    setLayoutData(draft => {
      return splitVertical(tkey, draft, callback)
    })
  }

  const doSplitH = (tkey: string, callback?: Function) => {
    setLayoutData(draft => {
      return splitHorizontal(tkey, draft, callback)
    })
  }

  const doLayout = (preset: TmuxLayoutPreset) => {
    setLayoutData(draft => applyTmuxLayout(preset, draft))
  }

  return (
    <>
      {mounted && <MovementObserver
        group={group}
        views={views}
        layoutData={layoutData}
        setLayoutData={setLayoutData}
        ops={{ doRemove, doSplitV, doSplitH, doLayout }}
      />}
      <div className={'wp-tile-layout-root'}
           id={`lsp-wp-${group}`}
           onClick={(e) => {
             const target = (e.target as HTMLElement).closest('button')
             if (!target) return
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
                 return doSplitV(tkey)
               case 'split-h':
                 return doSplitH(tkey)
               case 'remove':
                 return doRemove(tkey)
               case 'set-view':
                 return props.onRequireCardView({ id: tid }, e)
               case 'remove-view':
                 return setViews((v) => {
                   delete v[tid]
                   return { ...v }
                 })
               // tmux layout preset buttons
               case 'layout-even-h':  return doLayout('even-h')
               case 'layout-even-v':  return doLayout('even-v')
               case 'layout-main-h':  return doLayout('main-h')
               case 'layout-main-v':  return doLayout('main-v')
               case 'layout-tiled':   return doLayout('tiled')
               case 'layout-equalize':
                 return setLayoutData(draft => equalizeChildSpans(draft))
               default:
             }
           }}
      >
        {/* tmux-style layout preset toolbar */}
        <div className={'wp-layout-toolbar'}>
          {TMUX_LAYOUT_PRESETS.map(({ id, label, title, shortcut }) => (
            <button
              key={id}
              data-action={`layout-${id}`}
              title={`${title} (${shortcut})`}
              className={'wp-layout-preset-btn'}
            >
              {label}
            </button>
          ))}
          <button
            data-action={'layout-equalize'}
            title={'Equalize spans – redistribute space evenly at every tree level (Ctrl+X e)'}
            className={'wp-layout-preset-btn'}
          >
            ⊜ Equalize
          </button>
        </div>
        <TileLayout group={group} depth={0} index={0} views={views} {...layoutData}/>
      </div>
    </>
  )
}
