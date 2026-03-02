export default defineNuxtConfig({
  modules: ['@barzhsieh/nuxt-content-mermaid'],

  // Required: transpile workspace dependency for Nuxt bundling
  build: {
    transpile: ['vue-yjs'],
  },

  contentMermaid: {
    theme: {
      light: 'default',
      dark: 'dark',
    },
  },
})
