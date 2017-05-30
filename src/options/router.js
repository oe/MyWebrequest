import Vue from 'vue'
import VueRouter from 'vue-router'

import custom from './pages/custom'
import block from './pages/block'
import help from './pages/block'


Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    { path: '/', component: custom},
    { path: '/custom', component: custom},
    { path: '/block', component: block},
    { path: '/hsts', component: block},
    { path: '/hotlink', component: block},
    { path: '/log', component: block},
    { path: '/help', component: help}
  ]
})
