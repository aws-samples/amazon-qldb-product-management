<template>
  <div>
    <nav class="navbar">
      <div class="navbar-menu">
        <div class="navbar-start">
          <router-link :to="{ name: 'Home' }" class="navbar-item">
            Home
          </router-link>
        </div>

        <div class="navbar-end">
          <div class="navbar-item">
            <div class="buttons">

              <template v-if="!uploading">
                <div class="file is-primary">
                  <label class="file-label">
                    <input class="file-input" type="file" name="resume" @change="uploadFile">
                    <span class="file-cta">
                      <span class="file-label">
                        <strong class="has-text-white">アップロード</strong>
                      </span>
                    </span>
                  </label>
                </div>
              </template>

              <template v-else>
                <button class="button is-primary is-loading" disabled>
                  アップロード
                </button>
              </template>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <div class="container">
      <router-view/>
    </div>
  </div>
</template>

<script lang="ts">
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { Vue } from 'vue-class-component';
import axios from 'axios';
import { API } from './lib/api';
import { v4 as uuidv4 } from 'uuid';

export default class App extends Vue {
  uploading = false;

  // eslint-disable-next-line
  async uploadFile(event: any): Promise<void> {
    if (event.target.files.length === 0) {
      return;
    }

    this.uploading = true;

    const key = uuidv4();
    const file = event.target.files[0];
    const res = await API.get(`/s3url?key=${key}`);
    const presignedUrl = res.data.url;

    await axios.put(presignedUrl, file, { headers: { 'Content-Type': 'application/json' } });

    this.uploading = false;
  }
}
</script>

<style lang="scss" scoped>
 .buttons {
   .button {
     margin-bottom: 0;
   }
 }
</style>
