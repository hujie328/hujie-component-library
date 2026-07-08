import installer from './defaults'
import { version } from './version'

export * from '@hujie/components'
export * from './make-installer'

export const install = installer.install
export { version }
export default installer
