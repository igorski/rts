import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { createPinia } from "pinia";
import App from "./App.vue";

const app = createApp( App );

const i18n = createI18n({
    locale: "en",
    allowComposition: false,
});
app.use( i18n );
app.use( createPinia()) ;
app.mount( "#app" );
