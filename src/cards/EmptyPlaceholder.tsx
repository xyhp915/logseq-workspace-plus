import React from 'react'

export function EmptyPlaceholder() {
  return (
    <div className={'border border-dashed border-gray-300 m-6 flex flex-1 items-center justify-center'}
         onDragOver={(e) => {
           e.preventDefault()
         }}
         onDrop={(e) => {
           e.preventDefault()
           console.log('===>>> drop:', e)
         }}
    >
      <h1 className={'text-lg text-gray-500 opacity-40'}>Empty Card</h1>
    </div>
  )
}