
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        name: 'login',
        path: '/login',
        component: () => import('pages/Login.vue'),
        meta: {
          title: "Login", // invisible
          requiresAuth: false,
          requiresPassphrase: false,
          backButton: {
            show: false,
            fallback: '/'
          },
          showLogo: false,
          showSaveButton: false
        }
      },
      {
        name: 'explore',
        path: '',
        component: () => import('pages/Explore.vue'),
        meta: {
          title: "Your encrypted container",
          requiresAuth: true,
          requiresPassphrase: true,
          backButton: {
            show: false,
            fallback: '/'
          },
          showLogo: true,
          showSaveButton: false
        }
      },
      {
        name: 'collect-passphrase',
        path: '/collect-passphrase',
        component: () => import('pages/CollectPassphrase.vue'),
        meta: {
          title: "Encryption passphrase",
          requiresAuth: true,
          requiresPassphrase: false,
          backButton: {
            show: false,
            fallback: '/'
          },
          showLogo: false,
          showSaveButton: false
        }
      },
    ]
  },
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    name: 'error-404',
    component: () => import('pages/Error404.vue'),
    meta: {
      title: "Error 404",
      requiresAuth: false,
      backButton: {
        show: true,
        fallback: '/'
      }
    }
  })
}

export default routes
