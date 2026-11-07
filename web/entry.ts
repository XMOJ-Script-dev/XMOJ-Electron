import '../src/style.css';
import App from '../src/App.vue';
import { installWebApi } from '../src/services/web-api';
import { createApp } from 'vue';
import { installRichLinks } from '../src/lib/rich-links';
import { installEnterSubmit } from '../src/lib/enter-submit';

installWebApi();
createApp(App).mount('#app');
installRichLinks();
installEnterSubmit();
