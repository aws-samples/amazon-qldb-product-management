// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import 'bulma/css/bulma.css';

createApp(App)
  .use(store)
  .use(router)
  .mount('#app');
