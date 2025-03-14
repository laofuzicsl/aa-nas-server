import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Main',
    component: () => import('../views/Main.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/login/Login.vue')
  },
  {
    path: '/set',
    name: 'Set',
    component: () => import('../views/set/Set.vue')
  }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes
})
