<template>
  <div>
    <div class="is-flex is-flex-direction-row">
      <section class="section">
        <h1 class="title">検索</h1>
        <h2 class="subtitle is-size-6">
          ID を範囲指定して検索します<br>
          未指定の場合は全てのデータを取得します
        </h2>

        <div class="field">
          <label class="label">ID 範囲指定</label>
          <div class="control is-flex is-flex-direction-row is-align-items-center">
            <input class="input query-input" type="text" placeholder="From" v-model="queryFrom">
            <span class="mx-2">~</span>
            <input class="input query-input" type="text" placeholder="To" v-model="queryTo">
          </div>
        </div>

        <button :class="searchButtonClass" @click="query">検索</button>
      </section>

      <section class="section">
        <h1 class="title">詳細ページ</h1>
        <h2 class="subtitle is-size-6">
          ID 指定して詳細ページに遷移します<br>
          削除されたアイテムの履歴はこちらから
        </h2>

        <div class="field">
          <label class="label">ID 指定</label>
          <div class="control is-flex is-flex-direction-row is-align-items-center">
            <input class="input query-input" type="text" placeholder="ID" v-model="queryId">
          </div>
        </div>

        <button class="button is-primary search-button" @click="showDetail(queryId)">検索</button>
      </section>
    </div>

    <section class="section">
      <template v-if="loading">
        <div class="is-flex is-flex-direction-row is-justify-content-center is-size-6">
          読込中...
        </div>
      </template>

      <template v-else-if="rows.length > 0">
        <h1 class="title">
          検索結果

          <button :class="downloadButtonClass" @click="download" :disabled="downloading">
            ダウンロード
          </button>
        </h1>

        <h2 class="subtitle is-size-6">
          行をクリックすると、詳細ページに移動します
        </h2>

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
            <tr v-for="row in rows" :key="row.id" @click="showDetail(row.ID)" class="row">
              <td>{{ row.ID }}</td>
              <td>{{ row.Process }}</td>
              <td>{{ row.Lot }}</td>
              <td>{{ row.Operator }}</td>
              <td>{{ row.AppliedVoltage }}</td>
              <td>{{ row.Torque }}</td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-else>
        <div class="is-flex is-flex-direction-row is-justify-content-center is-size-5">
          検索結果はここに表示されます
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

export default class Home extends Vue {
  queryFrom: number | null = null;
  queryTo: number | null = null;
  queryId: number | null = null;

  rows: RowData[] = [];

  loading = false;

  downloading = false;

  get queryParamsRange(): string {
    const queryParams = [];

    if (this.queryFrom) {
      queryParams.push(`from=${this.queryFrom}`);
    }

    if (this.queryTo) {
      queryParams.push(`to=${this.queryTo}`);
    }

    return queryParams.join('&');
  }

  async query(): Promise<void> {
    this.loading = true;

    const res = await API.get(`/query?${this.queryParamsRange}`);

    this.rows = res.data;
    this.loading = false;
  }

  showDetail(id: number): void {
    this.$router.push({ name: 'Detail', params: { id } });
  }

  async download(): Promise<void> {
    this.downloading = true;

    const res = await API.get(`query?${this.queryParamsRange}&type=csv`, { responseType: 'blob' });

    console.log(res);

    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');

    link.href = url;
    link.setAttribute('download', `latests_${this.queryFrom || 'na'}_${this.queryTo || 'na'}.csv`);

    document.body.appendChild(link);

    link.click();

    URL.revokeObjectURL(url);

    // eslint-disable-next-line
    link.parentNode!.removeChild(link);

    this.downloading = false;
  }

  get searchButtonClass(): string {
    if (this.loading) {
      return 'button is-primary search-button is-loading';
    } else {
      return 'button is-primary search-button';
    }
  }

  get downloadButtonClass(): string {
    if (this.downloading) {
      return 'button is-info ml-2 is-loading';
    } else {
      return 'button is-info ml-2';
    }
  }
}
</script>

<style lang="scss" scoped>
 .row {
   cursor: pointer;
 }

 .query-input {
   width: 100px;
   max-width: 100px;
 }

 .search-button {
   width: 224px;
 }

 .td-input {
   border-width: 0;
 }
</style>
