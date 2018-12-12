import { EMenuAction } from '@/types/contextmenu'
const testRules = [
  {
    // menu id
    id: 'aaaa2222',
    enabled: true,
    valid: true,
    title: 'Get QrCode of Text',
    contexts: ['selection'],
    documentUrlPatterns: 'all_urls',
    // targetUrlPatterns?: string[]
    action: EMenuAction.GEN_QRCODE,
    // content assembled pattern
    //     `${selectedText}`
    content: '{selectedText}',
    createdAt: 123,
    updatedAt: 123
  },
  {
    // menu id
    id: 'aaaa2223',
    enabled: true,
    valid: true,
    title: 'Get QrCode of Link',
    contexts: ['link', 'image', 'video', 'audio'],
    documentUrlPatterns: 'all_urls',
    targetUrlPatterns: ['*://*/*'],
    action: EMenuAction.GEN_QRCODE,
    // content assembled pattern
    //     `${selectedText}`
    content: '{selectedLink}',
    createdAt: 123,
    updatedAt: 123
  },
  {
    // menu id
    id: 'aaaa2224',
    enabled: true,
    valid: true,
    title: 'Convert Page Content to Markdown',
    contexts: ['page'],
    documentUrlPatterns: 'all_urls',
    // targetUrlPatterns: ['*://*/*'],
    action: EMenuAction.CONVERT2MD,
    // content assembled pattern
    //     `${selectedText}`
    content: '{articleHtml}',
    createdAt: 123,
    updatedAt: 123
  },
  {
    // menu id
    id: 'aaaa2225',
    enabled: true,
    valid: true,
    title: 'Convert Selected Content to Markdown',
    contexts: ['selection'],
    documentUrlPatterns: 'all_urls',
    // targetUrlPatterns: ['*://*/*'],
    action: EMenuAction.CONVERT2MD,
    // content assembled pattern
    //     `${selectedText}`
    content: '{selectedHtml}',
    createdAt: 123,
    updatedAt: 123
  },
  {
    // menu id
    id: 'aaaa2226',
    enabled: true,
    valid: true,
    title: 'Send Selected Text as Mail Content',
    contexts: ['selection'],
    documentUrlPatterns: 'all_urls',
    // targetUrlPatterns: ['*://*/*'],
    action: EMenuAction.OPEN_SCHEME,
    // content assembled pattern
    //     `${selectedText}`
    content: 'mailto:abc@qq.com?body={selectedText}',
    createdAt: 123,
    updatedAt: 123
  },
  {
    // menu id
    id: 'aaaa2227',
    enabled: true,
    valid: true,
    title: 'Copy Selected',
    contexts: ['selection'],
    documentUrlPatterns: 'all_urls',
    // targetUrlPatterns: ['*://*/*'],
    action: EMenuAction.COPY,
    // content assembled pattern
    //     `${selectedText}`
    content: '{selectedText} \nfrom [{pageTitle}]({pageUrl})',
    createdAt: 123,
    updatedAt: 123
  }
]

export default testRules