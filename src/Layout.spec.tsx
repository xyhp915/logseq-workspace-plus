import { test, expect } from 'vitest'
import { parseTileDataWithTid, resizeTileLeft, resizeTileRight } from './Layout'
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

  expect(parseTileDataWithTid('0-0-1', draftData)).toEqual([{ span: 22 }, draftData.children[0].children, draftData.children[0], 1, '0-0-1'])
  expect(parseTileDataWithTid('0-1', draftData)).toEqual([10, draftData.children, draftData, 1, '0-1'])
  expect(parseTileDataWithTid('0-2-1', draftData)).toEqual([12, draftData.children[2].children, draftData.children[2], 1, '0-2-1'])

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
})