import { createApp } from "vue";
import { createPinia } from "pinia";
import i18nInstance from "./i18n";
import App from "./App.vue";

const app = createApp( App );

app.use( i18nInstance );
app.use( createPinia()) ;
app.mount( "#app" );
