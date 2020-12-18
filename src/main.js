import Vue from 'vue';
import $ from 'jquery';
import App from './App.vue';

window.$ = $;
Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount('#app');
