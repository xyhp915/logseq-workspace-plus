import { test, expect } from 'vitest'
import { getTileDataWithTid, resizeTileLeft } from './Layout'
import { produce } from 'immer'

const draftData: any = {
  direction: 'row',
  children: [
    { span: 24, children: [16, { span: 22 }, 7, -1] },
    10,
    { span: 23, children: [12, 12, -1] },
    { children: [23, 12, -1] }
  ]
}

test('tile layout apis', async () => {
  expect(getTileDataWithTid('0-0-1', draftData)).toEqual([{ span: 22 }, draftData.children[0].children, draftData.children[0], 1])
  expect(getTileDataWithTid('0-1', draftData)).toEqual([10, draftData.children, draftData, 1])
  expect(getTileDataWithTid('0-2-1', draftData)).toEqual([12, draftData.children[2].children, draftData.children[2], 1])

  // resizeTileLeft
  const resizedLeftState: any = produce(draftData, draft => {
    resizeTileLeft('0-0-1', draft)
  })

  expect(resizedLeftState.children[0].children[1].span).toEqual(21)
})