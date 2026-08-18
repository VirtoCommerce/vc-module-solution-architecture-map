import { createApp } from "vue";
import App from "./App.vue";
import "./styles/map.css";
import { applyDemoTheme } from "./api/demo";

applyDemoTheme(); // ?demo=<preset> brand theming (no-op outside demo mode)
createApp(App).mount("#app");
