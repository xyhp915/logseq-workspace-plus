import { test, expect } from 'vitest'
import {
  parseTileDataWithTkey,
  resizeTileLeft,
  resizeTileRight,
  equalizeChildSpans,
  applyLayoutEvenH,
  applyLayoutEvenV,
  applyLayoutMainV,
  applyLayoutMainH,
  applyLayoutTiled,
  applyTmuxLayout,
} from './Layout'
import { produce } from 'immer'

test('tile layout apis 1', async () => {
  const draftData: any = {
    direction: 'row',
    children: [
      { span: 24, children: [16, { span: 22 }, 7, -1] },
      10,
      { span: 23, children: [12, 12, 8, { span: 12, direction: 'row', children: [32, 32] }, -1] },
      { children: [23, 12, -1] }
    ]
  }

  expect(parseTileDataWithTkey('0-0-1', draftData)).toEqual([{ span: 22 }, draftData.children[0].children, draftData.children[0], 1, '0-0-1'])
  expect(parseTileDataWithTkey('0-1', draftData)).toEqual([10, draftData.children, draftData, 1, '0-1'])
  expect(parseTileDataWithTkey('0-2-1', draftData)).toEqual([12, draftData.children[2].children, draftData.children[2], 1, '0-2-1'])

  // resizeTileLeft
  const resizedLeftState: any = produce(draftData, draft => {
    resizeTileLeft('0-0-1', draft)
    resizeTileLeft('0-1', draft)
    resizeTileLeft('0-2-0', draft)
    resizeTileLeft('0-3-2', draft)
    resizeTileLeft('0-2-3-0', draft)
  })

  expect(resizedLeftState.children[0].children[0].span).toBe(15)
  expect(resizedLeftState.children[0].children[1].span).toBe(23)
  expect(resizedLeftState.children[1]).toEqual(10)
  expect(resizedLeftState.children[2].children[0].span).toBe(11)
  expect(resizedLeftState.children[2].children[1].span).toBe(13)
  expect(resizedLeftState.children[3].children[1]).toEqual({ span: 11 })
  expect(resizedLeftState.children[3].children[2]).toEqual({ span: -1 })
  expect(resizedLeftState.children[2].children[2].span).toBe(7)
  expect(resizedLeftState.children[2].children[3].span).toBe(13)

  // resizeTileRight
  const resizedRightState: any = produce(draftData, draft => {
    resizeTileRight('0-0-1', draft)
    resizeTileRight('0-1', draft)
    resizeTileRight('0-3-2', draft)
    resizeTileRight('0-2-3-0', draft)
  })

  expect(resizedRightState.children[0].children[1]).toEqual({ span: 23 })
  expect(resizedRightState.children[0].children[2]).toEqual({ span: 6 })
  expect(resizedRightState.children[1]).toBe(10)
  expect(resizedRightState.children[3].children[2]).toEqual({ span: -1 })
  expect(resizedRightState.children[3].children[1]).toEqual({ span: 13 })
  expect(resizedRightState.children[2].children[3].span).toEqual(13)
  expect(resizedRightState.children[2].children[4].span).toEqual(-1)
})

test('tile layout apis 2', async () => {
  // ── equalizeChildSpans ──────────────────────────────────────────────────────
  // Imbalanced data after hypothetical manual edits: outer spans 16+32+8 ≠ 64.
  const imbalanced: any = {
    direction: 'row',
    children: [
      16,
      32,
      { span: 8, id: 'c', direction: 'row', children: [32, 32] },
    ],
  }

  const equalized: any = produce(imbalanced, (draft: any) => equalizeChildSpans(draft))

  // 3 children → floor(64/3)=21, remainder=1 → [22, 21, 21]
  expect(equalized.children[0].span).toBe(22)
  expect(equalized.children[1].span).toBe(21)
  expect(equalized.children[2].span).toBe(21)
  // The nested pair must also be equalized: 2 children → 32+32
  expect(equalized.children[2].children[0].span).toBe(32)
  expect(equalized.children[2].children[1].span).toBe(32)

  // ── applyLayoutEvenH ───────────────────────────────────────────────────────
  // 3 leaves: 'a' (direct child), 'c' and 'd' (nested inside 'b').
  const nested: any = {
    id: 'root',
    direction: 'col',
    children: [
      { span: 32, id: 'a' },
      {
        span: 32, id: 'b', direction: 'row',
        children: [{ span: 32, id: 'c' }, { span: 32, id: 'd' }],
      },
    ],
  }

  const evenH: any = produce(nested, (draft: any) => applyLayoutEvenH(draft))

  expect(evenH.direction).toBe('row')
  expect(evenH.children.length).toBe(3)                        // flat row of 3 panes
  expect(evenH.children.every((c: any) => !c.children)).toBe(true) // all are leaves
  // 3 panes → [22, 21, 21]
  expect(evenH.children[0].id).toBe('a')
  expect(evenH.children[0].span).toBe(22)
  expect(evenH.children[1].id).toBe('c')
  expect(evenH.children[1].span).toBe(21)
  expect(evenH.children[2].id).toBe('d')
  expect(evenH.children[2].span).toBe(21)

  // ── applyLayoutEvenV ───────────────────────────────────────────────────────
  const evenV: any = produce(nested, (draft: any) => applyLayoutEvenV(draft))

  expect(evenV.direction).toBe('col')
  expect(evenV.children.length).toBe(3)
  expect(evenV.children[0].span).toBe(22) // 64/3 = 21 rem 1
  expect(evenV.children[2].span).toBe(21)

  // ── applyLayoutMainV ───────────────────────────────────────────────────────
  const mainV: any = produce(nested, (draft: any) => applyLayoutMainV(draft))

  expect(mainV.direction).toBe('row')
  expect(mainV.children.length).toBe(2)                       // main | side-column
  expect(mainV.children[0].id).toBe('a')                      // first leaf becomes main
  expect(mainV.children[0].span).toBe(32)                     // ceil(64/2) = 32
  expect(mainV.children[1].span).toBe(32)                     // 64 - 32 = 32
  expect(mainV.children[1].direction).toBe('col')
  expect(mainV.children[1].children.length).toBe(2)           // 2 remaining panes
  // 2 side panes → floor(64/2)=32, rem=0
  expect(mainV.children[1].children[0].span).toBe(32)
  expect(mainV.children[1].children[1].span).toBe(32)

  // ── applyLayoutMainH ───────────────────────────────────────────────────────
  const mainH: any = produce(nested, (draft: any) => applyLayoutMainH(draft))

  expect(mainH.direction).toBe('col')
  expect(mainH.children.length).toBe(2)                       // main (top) | bottom-row
  expect(mainH.children[0].id).toBe('a')
  expect(mainH.children[0].span).toBe(32)                     // ceil(64/2) = 32
  expect(mainH.children[1].direction).toBe('row')
  expect(mainH.children[1].children.length).toBe(2)
  expect(mainH.children[1].children[0].span).toBe(32)

  // ── applyLayoutTiled ───────────────────────────────────────────────────────
  // 4 panes → 2×2 grid
  const fourPane: any = {
    id: 'root',
    direction: 'row',
    children: [
      { span: 16, id: 'a' }, { span: 16, id: 'b' },
      { span: 16, id: 'c' }, { span: 16, id: 'd' },
    ],
  }

  const tiled4: any = produce(fourPane, (draft: any) => applyLayoutTiled(draft))

  expect(tiled4.direction).toBe('col')
  expect(tiled4.children.length).toBe(2)                        // 2 rows
  expect(tiled4.children[0].direction).toBe('row')
  expect(tiled4.children[0].children.length).toBe(2)            // 2 cols per row
  expect(tiled4.children[0].children[0].span).toBe(32)          // 64/2 = 32
  expect(tiled4.children[0].children[0].id).toBe('a')
  expect(tiled4.children[1].children[1].id).toBe('d')

  // 5 panes → 3 cols × 2 rows (last row has 2 panes but fills full width)
  // Note: pane 'c' starts with span: 0 (malformed); the tiled algorithm
  // ignores the original span entirely and assigns correct spans to all panes.
  const fivePaneData: any = {
    id: 'root',
    direction: 'col',
    children: [
      {
        span: 32, direction: 'row',
        children: [{ span: 32, id: 'a' }, { span: 32, id: 'b' }, { span: 0, id: 'c' }],
      },
      {
        span: 32, direction: 'row',
        children: [{ span: 32, id: 'd' }, { span: 32, id: 'e' }],
      },
    ],
  }

  const tiled5: any = produce(fivePaneData, (draft: any) => applyLayoutTiled(draft))

  expect(tiled5.children.length).toBe(2)                        // 2 rows
  expect(tiled5.children[0].children.length).toBe(3)            // top row: 3 panes
  expect(tiled5.children[1].children.length).toBe(2)            // bottom row: 2 panes
  // Bottom row spans should sum to gridN (64) even though it has only 2 panes
  const bottomRowSpanSum = tiled5.children[1].children.reduce((s: number, c: any) => s + c.span, 0)
  expect(bottomRowSpanSum).toBe(64)
  // Pane 'c' had span:0 originally; tiled layout assigns it a correct span (> 0)
  const paneC = tiled5.children[0].children.find((c: any) => c.id === 'c')
  expect(paneC?.span).toBeGreaterThan(0)

  // ── applyTmuxLayout dispatcher ─────────────────────────────────────────────
  const dispatchResult: any = produce(nested, (draft: any) => applyTmuxLayout('tiled', draft))
  expect(dispatchResult.direction).toBe('col')  // same as applyLayoutTiled result

  // ── no-op when only 1 pane ────────────────────────────────────────────────
  const singlePane: any = { id: 'solo', span: 64 }
  const noOp = produce(singlePane, (draft: any) => applyLayoutEvenH(draft))
  expect(noOp).toEqual(singlePane)
})