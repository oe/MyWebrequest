# My Webrequest Doc

## Data structure
### Custom rule
```js
// { [rule-url-match-pattern]: [rule-detail] }
[
  // rule url match pattern
  {
    // rule is enabled or not
    enabled: true,
    // original match url
    matchUrl: '*://www.baidu.com/s?wd={kwd}',
    // original redirect url
    redirectUrl: 'https://www.google.com.hk/search?q={kwd}',
    // match pattern for chrome
    url: '*://www.baidu.com/s*',
    // whether need to parse query string
    hasQs: true,
    // whether need to deal with wildcard params
    hasWildcard: false,
    // regex to match the rule
    reg: '^\\w+:\\/\\/www\\.baidu\\.com/s(?:\\?(.*))?',
    // path or domain params in rule which wrapped by `{` and `}`
    params: [],
    // query string params
    qsParams: {
      wd: 'kwd'
    },
    createdAt: 1509113934778,
    updatedAt: 1509113934778
  }
]
```

### Normal rule
```js
[{
    // rule is active or not
    enabled: true,
    // original match url pattern
    url: '*://www.baidu.com/s*',
    createdAt: 1509113934778,
    updatedAt: 1509113934778
}]
```