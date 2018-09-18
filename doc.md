# My Webrequest Doc

## Data structure

### Custom rule

```ts
interface ICustomRule {
  id: string
  // rule is enabled or not
  enabled: boolean
  // if this rule is valid from migration
  valid: boolean
  // is match url is a regexp
  useReg: boolean
  // original match url
  // '*://www.baidu.com/s?wd={kwd}'
  matchUrl: string
  // original redirect url
  // 'https://www.google.com.hk/search?q={kwd}'
  redirectUrl: string
  // match pattern for chrome
  // '*://www.baidu.com/s*',
  url: string
  // whether need to parse query string
  hasQs: boolean
  // whether need to deal with wildcard param
  hasWdCd: boolean
  // regexp to get wildcard param's value
  // '^http:\\/\\/www\\.baidu\\.com'
  wdCdReg: string
  // regex to match the rule
  // '^\\w+:\\/\\/www\\.baidu\\.com\\/s(?:\\?(.*))?'
  reg: string
  // path or domain params in rule which wrapped by `{` and `}`
  params: string[]
  // query string params
  // key: orginal querystring key
  // value: param name
  qsParams: {
    [k: string]: string
  }
  createdAt: number
  updatedAt: number
}
```

### Normal rule

```ts
interface INormalRule {
  id: string
  // rule is active or not
  enabled: boolean
  // if this rule is valid from migration
  valid: boolean
  // original match url pattern
  // '*://www.baidu.com/s*',
  url: string
  createdAt: number
  updatedAt: number
}
```

### Ua rule

```ts
interface IUaRule {
  id: string
  // rule is active or not
  enabled: boolean
  // if this rule is valid from migration
  valid: boolean
  // original match url pattern
  // '*://www.baidu.com/s*',
  url: string
  // change ua to string
  ua: string
  createdAt: number
  updatedAt: number
}
```

### Contextmenu Rule

```ts
enum EContextType {
  'page',
  'selection',
  'link',
  'image',
  'video',
  'audio'
}

enum EMenuAction {
  // convert content to markdown
  'convert2md',
  // get qrcode of the content
  'genQrcode',
  // open the an assembled schema
  'openScheme'
}

interface IMenuRule {
  // menu id
  id: string
  enabled: boolean
  valid: boolean
  // menu title
  title: string
  // menu context
  contexts: EContextType[]
  // only show menu when document url match following patterns
  documentUrlPatterns?: string[]
  // only show menu when media(audio/video/img) src or
  //     anchor href match the following patterns
  targetUrlPatterns?: string[]
  // action of when click the menu item
  action: EMenuAction
  // content assembled pattern
  //     `${selectedText}`
  content: string
  createdAt: number
  updatedAt: number
}
```
