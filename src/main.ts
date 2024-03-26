import '@logseq/libs'
import { App } from './App'
import React from 'react'
import ReactDOM from 'react-dom'
import { initWorkspace } from './Workspace'
import { initHMREffects } from './hmr'

function main() {
  console.info('Hello from workspace+ plugin!')

  logseq.App.registerCommandShortcut(
    'mod+1'
    , () => {
      logseq.App.pushState('x-route')
    })

  logseq.provideModel({
    toggleMainUI() {
      logseq.App.pushState('x-route')
    }
  })

  logseq.setMainUIInlineStyle({
    width: '600px',
    height: '400px',
    position: 'fixed',
    top: '100px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    border: '2px solid red',
  })

  logseq.App.registerUIItem('toolbar', {
    key: 'open-workspace-x',
    template: `
      <a class="button"
         data-on-click="toggleMainUI">
        <i class="ti ti-table"></i>
      </a>
    `,
  })

  // mount the App component
  ReactDOM.render(
    React.createElement(App),
    document.getElementById('app'))

  // init custom routes
  initWorkspace()
}

// bootstrap
logseq.ready(main).catch(console.error)

// hmr for development in logseq
initHMREffects(initWorkspace)