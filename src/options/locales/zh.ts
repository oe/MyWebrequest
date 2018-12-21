import { plainify } from '@/common/utils'
const fields = {
  requests: {
    title: '网络请求',
    subtitle: '自定义浏览器的网络请求'
  },
  contextmenu: {
    title: '右键菜单',
    subtitle: '增加浏览器的右键菜单'
  },
  settings: {
    title: '设置',
    subtitle: '自定义本插件'
  },
  qrcode: {
    title: '二维码',
    subtitle: '生成二维码',
    moreQr: '获取更多丰富的QrCode...',
    types: {
      text: '文字',
      vcard: '名片',
      message: '短信',
      wifi: 'Wifi'
    },
    text: {
      contentPlh: '文本 / 超链接 / 邮件地址 / 电话号码 (首尾空格会自动移除)'
    },
    message: {
      telLabel: '收件人',
      telPlh: '如 18800000000',
      contentLabel: '信息内容',
      contentPlh: '多余的空格会被移除'
    },
    vcard: {
      NLabel: '姓名',
      NPlh: '如 天行者',
      TELLabel: '电话号码',
      TELPlh: '如 18800000000',
      EMAILLabel: '邮箱',
      EMAILPlh: '如 sir@sample.com',
      URLLabel: '网址',
      URLPlh: '如 http://www.evecalm.com',
      ADRLabel: '地址',
      ADRPlh: '如 火星路10号',
      NOTELabel: '备注',
      NOTEPlh: '如 程序猿一只',
    },
    wifi: {
      SLabel: 'Wifi 名',
      SPlh: '如 Work5G',
      TLabel: '加密方式',
      TPlh: '请选择一种加密方式',
      TOptionNopassLabel: '无密码',
      TOptionWEPLabel: 'WEP',
      TOptionWPALabel: 'WPA/WPA2',
      PLabel: '密码',
      PPlh: '如 xxxxxxxxxx (无密码时留空)'
    }
  },
  help: {
    title: '帮助',
    subtitle: '一些有用的帮助信息'
  }
}

export default plainify(fields)