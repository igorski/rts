import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import { createPinia } from "pinia";
import App from "./App.vue";
import messages from "./messages.json";

const app = createApp( App );

const i18n = createI18n({
    locale: "en",
    allowComposition: false,
    messages,
});
app.use( i18n );
app.use( createPinia()) ;
app.mount( "#app" );
