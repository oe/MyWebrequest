export const enum EMenuContext {
  all = "all",
  page = "page",
  frame = "frame",
  selection = "selection",
  link = "link",
  editable = "editable",
  image = "image",
  video = "video",
  audio = "audio",
  launcher = "launcher",
  browser_action = "browser_action",
  page_action = "page_action"
}

export const enum EMenuAction {
  GEN_QRCODE = 'GEN_QRCODE',
  OPEN_SCHEME = 'OPEN_SCHEME',
  CONVERT2MD = 'CONVERT2MD',
  COPY = 'COPY'
}

export interface IMenuConfig {
  /** menu ID */
  id: string
  /** menu title */
  title: string
  /** menu context to display */
  contexts: EMenuContext[]
  /** Restricts the doc url  */
  documentUrlPatterns?: string | string[]
  /** restricts for context has src */
  targetUrlPatterns?: string | string[]
  /** action to do */
  action: EMenuAction
  /** the action deal content */
  content: string
  updatedAt: number
  enabled: boolean
}

export type IMenuConfigs = IMenuConfig[]