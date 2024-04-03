import './main.css'
import '@logseq/libs'
import { App } from './App'
import React from 'react'
import ReactDOM from 'react-dom'
import { initWorkspace } from './Workspace'

function main() {
  console.info('Hello from workspace+ plugin!')

  logseq.App.registerCommandShortcut(
    'mod+1'
    , () => {
      logseq.App.pushState('x-route')
    })

  const cssLink = document.head.getElementsByTagName('link')?.[0]
  const cssHref = cssLink?.getAttribute('href')

  logseq.provideStyle(`
   @import url('${logseq.resolveResourceFullUrl(`dist/${cssHref}`)}');
  `)

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
const callbacks = [initWorkspace]
// @ts-ignore
if (module.hot) {
  // @ts-ignore
  module.hot.accept(function (_a, _b) {
    console.info('== plugin: hot accept')
    // reinstall changes
    callbacks.forEach(cb => cb())

    // module or one of its dependencies was just updated
    const pid = logseq.baseInfo?.id
    if (!pid) return
    const host = logseq.Experiments.ensureHostScope()
    host.LSPluginCore.ensurePlugin(pid).reload()
    host.frontend.core.delay_remount(200)
  })
}
