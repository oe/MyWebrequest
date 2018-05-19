import Vue from 'vue'
import VueRouter from 'vue-router'

import union from './pages/union'
import help from './pages/help'
import qrcode from './pages/qrcode'
import settings from './pages/settings'

Vue.use(VueRouter)
const UNION_PAGES = ['block', 'custom', 'hsts', 'hotlink', 'log', 'cors']

export default new VueRouter({
  routes: [
    ...UNION_PAGES.map(name => {
      return {
        path: `/${name}`,
        component: union,
        children: [{ path: '*', component: union }]
      }
    }),
    { path: '/', redirect: '/custom' },
    { path: '/qrcode', component: qrcode },
    { path: '/settings', component: settings },
    { path: '/help', component: help }
  ]
})
