import React, { useEffect } from 'react'
import { tickEffect } from './Workspace'

export function App() {
  useEffect(() => {
    console.info('Hi from workspace+ APP!')
  }, [])

  return (
    <div className={'app-inner'}>
      <pre className={'p-2'}>
        {JSON.stringify(logseq.baseInfo, null, 2)}
      </pre>

      <button onClick={() => logseq.hideMainUI()}>
        {tickEffect()}
      </button>

      {/*{devHMRWatcher.Provider()}*/}
    </div>
  )
}
