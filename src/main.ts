import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 创建Vue应用
const app = createApp(App)

// 使用Pinia状态管理
const pinia = createPinia()
app.use(pinia)

// 挂载应用
app.mount('#app')
