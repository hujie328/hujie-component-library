import type { App, Component, Plugin } from 'vue'

export type SFCWithInstall<T> = T & Plugin

export const withInstall = <T extends Component>(component: T) => {
  ;(component as SFCWithInstall<T>).install = (app: App) => {
    const name = component.name
    if (name) {
      app.component(name, component)
    }
  }

  return component as SFCWithInstall<T>
}

export const makeInstaller = (components: Plugin[] = []) => {
  const install = (app: App) => {
    components.forEach((component) => app.use(component))
  }

  return { install }
}
