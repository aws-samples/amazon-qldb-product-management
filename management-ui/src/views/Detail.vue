<template>
  <div>
    <section class="section">
      <h1 class="title">最新</h1>

      <template v-if="latest">
        <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
          <thead>
            <tr>
              <th>ID</th>
              <th>Process</th>
              <th>Lot</th>
              <th>Operator</th>
              <th>Applied voltage</th>
              <th>Torque</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="latest">
              <td>{{ latest.ID }}</td>
              <td><input type="number" v-model="latest.Process"></td>
              <td><input type="number" v-model="latest.Lot"></td>
              <td><input type="number" v-model="latest.Operator"></td>
              <td><input type="number" v-model="latest.AppliedVoltage"></td>
              <td><input type="number" v-model="latest.Torque"></td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-else-if="loadingLatest">
        <div class="is-flex is-flex-direction-row is-justify-content-center is-size-6">
          読込中...
        </div>
      </template>

      <template v-else>
        <div v-if="isDeleted" class="has-text-danger">
          このアイテムは削除されています
        </div>

        <div v-else>
          最新データは見つかりませんでした
        </div>
      </template>

      <div class="is-flex is-flex-direction-row is-justify-content-flex-end">
        <button :class="deleteButtonClass" @click="deleteProduct" :disabled="deleting || latest === null">
          削除
        </button>

        <button :class="updateButtonClass" @click="update" :disabled="updating || latest === null">
          変更を保存
        </button>
      </div>
    </section>

    <section class="section">
      <h1 class="title">
        更新履歴

        <button :class="reloadButtonClass" @click="reloadHistory" :disabled="loadingHistory">
          リロード
        </button>

        <button :class="downloadButtonClass" @click="download" :disabled="downloading">
          ダウンロード
        </button>
      </h1>

      <template v-if="rows.length > 0">
        <div class="is-flex is-flex-direction-column is-justify-content-center is-align-items-center">
          <table class="table is-bordered is-striped is-narrow is-hoverable is-fullwidth">
            <thead>
              <tr>
                <th>Transaction Time</th>
                <th>Hash</th>
                <th>Data</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="row in rows" :key="row.hash">
                <td class="is-size-7">{{ row.time }}</td>
                <td class="is-size-7">{{ row.hash }}</td>
                <td class="is-size-7">{{ row.data }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-else-if="loadingHistoryFull">
        <div>
          フルスキャンして削除されたデータを検索します... (時間がかかる場合があります)
        </div>
      </template>

      <template v-else-if="!loadingHistory">
        <div>
          履歴は見つかりませんでした
        </div>
      </template>
    </section>
  </div>
</template>

<script lang="ts">
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { Vue } from 'vue-class-component';
import { API } from '../lib/api';
import { RowData } from '../lib/rowData';

export default class Detail extends Vue {
  latest: RowData | null = null;

  rows: RowData[] = [];

  updating = false;
  deleting = false;

  loadingLatest = false;
  loadingHistory = false;
  loadingHistoryFull = false;

  downloading = false;

  get id(): number {
    return Number(this.$route.params.id || '0');
  }

  async mounted(): Promise<void> {
    await this.reload();
  }

  async update(): Promise<void> {
    if (!this.latest) {
      return;
    }

    this.updating = true;

    await API.patch(`/data/${this.latest.ID}`, this.latest);

    this.updating = false;

    await this.reload();
  }

  async deleteProduct(): Promise<void> {
    if (!this.latest) {
      return;
    }

    this.deleting = true;

    await API.delete(`/data/${this.latest.ID}`);

    this.deleting = false;

    await this.reload();
  }

  async reload(): Promise<void> {
    await Promise.all([this.reloadLatest(), this.reloadHistory()]);
  }

  async reloadLatest(): Promise<void> {
    this.loadingLatest = true;

    const res = await API.get(`/query?id=${this.id}`);

    if (res.data.length > 0) {
      this.latest = res.data[0];
    } else {
      this.latest = null;
    }

    this.loadingLatest = false;
  }

  async reloadHistory(): Promise<void> {
    this.loadingHistory = true;

    const res = await API.get(`/data/${this.id}`);
    this.rows = res.data;

    if (this.rows.length === 0) {
      this.loadingHistoryFull = true;
      const res = await API.get(`/data/${this.id}?scan=full`);
      this.rows = res.data;
      this.loadingHistoryFull = false;
    }

    this.loadingHistory = false;
  }

  async download(): Promise<void> {
    this.downloading = true;

    const res = await API.get(`/data/${this.id}?type=csv`, { responseType: 'blob' });

    console.log(res);

    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', `history_${this.id}.csv`);

    document.body.appendChild(link);

    link.click();

    URL.revokeObjectURL(url);

    // eslint-disable-next-line
    link.parentNode!.removeChild(link);

    this.downloading = false;
  }

  get deleteButtonClass(): string {
    if (this.deleting) {
      return 'button mr-2 is-danger is-loading';
    } else {
      return 'button mr-2 is-danger';
    }
  }

  get updateButtonClass(): string {
    if (this.updating) {
      return 'button is-primary is-loading';
    } else {
      return 'button is-primary';
    }
  }

  get reloadButtonClass(): string {
    if (this.loadingHistory) {
      return 'button is-info ml-2 is-loading';
    } else {
      return 'button is-info ml-2';
    }
  }

  get downloadButtonClass(): string {
    if (this.downloading) {
      return 'button is-info ml-2 is-loading';
    } else {
      return 'button is-info ml-2';
    }
  }

  get isDeleted(): boolean {
    return this.latest === null && this.rows.length > 0;
  }
}
</script>

<style lang="scss" scoped>
</style>
