import './layout.css'
import { useImmer } from 'use-immer'

type Span = number
type TileLayoutAttrs = {
  group: string,
  depth: number,
  index: number,
  tid?: string,
  direction?: 'row' | 'col',
  span?: Span,
  children?: Array<Span | Partial<TileLayoutAttrs>>,
  parent?: TileLayoutAttrs
  card?: any
}

export const gridN = 64

export function TileLayout(attrs: TileLayoutAttrs) {
  const span = attrs?.span
  const group = attrs?.group
  const direction = attrs?.direction ?? 'col'
  const tid = attrs?.tid ?? 0
  const parent = attrs?.parent
  const childrenLen = attrs?.children?.length
  const spanClass = parent?.direction ? `${parent?.direction}-span-${span}` : ''
  const gridClass = !childrenLen ? 'flex justify-center items-center' : `grid-${direction}s-${gridN}`
  let childrenSpanAcc = 0

  return (
    <div className={`wp-tile-layout ${gridClass} ${spanClass} as-${direction}`}
         data-group={group}
         data-key={tid}
         tabIndex={0}
    >
      <b className={'absolute bg-amber-500 text-white p-2 top-2 left-2'}>
        {tid} ({span})
      </b>

      {!childrenLen && (
        <div className={'flex-1'}>
          <button data-action={'whoami'} className={'bg-blue-500 px-2 text-white'}>Find Me</button>
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

          childrenSpanAcc += props.span

          return (
            <TileLayout {...props} />
          )
        }
      )}
    </div>
  )
}

export function getTileDataWithTid(tid: string, draftData: any) {
  const indexes = tid.split('-').map(Number)?.slice(1)
  let ret = indexes.reduce(([value, refChildren, refParent], idx) => {
    return value.children ? [value.children[idx], value.children, value, idx] : [value, refChildren, refParent, idx]
  }, [draftData])
  return ret
}

export function resizeTileLeft(tid: string, draftData: any, step: number = 1) {
  const [value, refChildren, _refParent, idx] = getTileDataWithTid(tid, draftData)

  if (value?.span) {
    value.span -= step
  } else {
    refChildren[idx] = value - step
  }
}

export function resizeTileRight(tid: string, draftData: any) {}

export function resizeTileTop(tid: string, draftData: any) {}

export function resizeTileBottom(tid: string, draftData: any) {}

export function TileLayoutRoot() {
  const group = 'charlie-1'
  const [layoutData, setLayoutData] = useImmer<Partial<TileLayoutAttrs>>({
    direction: 'row',
    children: [
      { span: 14, children: [16, { span: 22 }, 7, -1] },
      { span: 17, children: [{ span: 20, direction: 'row', children: [21, -1] }, 10, 24, -1] },
      // { span: 23, children: [12, 12, -1] },
      { children: [23, 12, -1] }
    ]
  })

  return (
    <div className={'wp-tile-layout-root'}
         id={`lsp-wp-${group}`}
         onClick={(e) => {
           const target = e.target as HTMLElement
           const action = target.getAttribute('data-action')
           const tid = target.closest('.wp-tile-layout')?.getAttribute('data-key')

           if (action === 'whoami') {
             setLayoutData(draft => {
               const [value, refChildren, refParent, idx] = getTileDataWithTid(tid, draft)
               // alert(`${JSON.stringify(value, null, 2)}`)
               console.log('refChildren', value, refParent, refChildren, idx)

               if (value?.span) {
                 ++value.span
               } else {
                 refChildren[idx] = value + 1
               }

               return draft
             })
           }
         }}
    >
      <TileLayout group={group} depth={0} index={0} {...layoutData}/>
    </div>
  )
}