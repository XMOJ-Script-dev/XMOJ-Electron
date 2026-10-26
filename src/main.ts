import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import { installRichLinks } from '@/lib/rich-links';
import { installEnterSubmit } from '@/lib/enter-submit';
createApp(App).mount('#app');
installRichLinks();
installEnterSubmit();
