export function initHMREffects(...callbacks: Function[]) {
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
}
