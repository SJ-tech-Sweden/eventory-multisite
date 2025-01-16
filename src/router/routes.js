const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: '/calendar', component: () => import('pages/CalendarPage.vue') },
      { path: '/inventory', component: () => import('pages/inventoryManager.vue') },
      { path: '/login-manager', component: () => import('pages/LoginManager.vue') },
      {
        path: '/packlist/:packlistid/:userid',
        component: () => import('pages/packlistDetail.vue'),
      },
      {
        path: '/inventory-detail/:packlistid/:userid',
        component: () => import('pages/inventoryDetail.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
