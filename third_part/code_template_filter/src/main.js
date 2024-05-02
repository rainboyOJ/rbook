import { createApp ,provide} from 'vue'
import Toast from "vue-toastification";
import './style.scss'
import "vue-toastification/dist/index.css";
import * as bootstrap from 'bootstrap'
import App from './App.vue'

const app = createApp(App)

console.log(template_array)

const toast_options = {
    // You can set your default options here
};
app.use(Toast, toast_options);

app.provide('template_array',template_array)
app.mount('#app')
