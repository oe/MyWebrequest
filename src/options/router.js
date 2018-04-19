import Vue from 'vue'
import VueRouter from 'vue-router'

// import custom from './pages/custom'
import union from './pages/union'
import help from './pages/help'

Vue.use(VueRouter)

export default new VueRouter({
  routes: [
    { path: '/', redirect: '/block' },
    { path: '/custom', component: union },
    { path: '/block', component: union },
    { path: '/hsts', component: union },
    { path: '/hotlink', component: union },
    { path: '/log', component: union },
    { path: '/help', component: help }
  ]
})
