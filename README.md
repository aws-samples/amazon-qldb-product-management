# Amazon QLDB Product Management

## デプロイ

### Requirements
- Node.js
- [`aws` コマンド](https://docs.aws.amazon.com/ja_jp/cli/latest/userguide/cli-chap-install.html) (Amazon API Gateway や AWS IAM など多数のサービスを作成するので、Administrator 相当の広い権限が必要です。また、デプロイする環境は本番環境とは分けることをおすすめいたします。)
- [`cdk` コマンド](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html)

### 前準備

`provision` と `management-ui` ディレクトリに移動し、それぞれ必要なパッケージをインストールします。

```bash
## provision ディレクトリで npm install を実行
pushd provision
npm install

## lambda ディレクトリでも npm install を実行
pushd lambda
npm install

popd
popd

## management-ui ディレクトリで npm install を実行
pushd management-ui
npm install
popd
```

### バックエンドのデプロイ

`cdk` を利用して、バックエンドをデプロイします。`provision` ディレクトリに移動し、以下を実行します。

```bash
pushd provision

# デプロイ実行
cdk deploy ProductManagementBackendStack

popd
```

デプロイ完了時に、API のエンドポイントが表示されるので、どこかに転載しておいてください。(フロントエンドのデプロイ時に利用します。)

[Amazon QLDB](https://console.aws.amazon.com/qldb/home#query-editor) を開き、テーブルとインデックスを作成します。`productmanagement` という台帳を選択し、以下のクエリを実行してください。

**テーブル作成**
```
CREATE TABLE qualitydata
```

**インデックス作成**
```
CREATE INDEX on qualitydata (ID)
```

### フロントエンドのデプロイ

フロントエンドから接続先の API を認識させるために、**`.env.local` というファイルを `management-ui` ディレクトリに作成し、内容を以下にします。** `[]`で囲まれた部分は適切な値に変更してください。(**末尾に`/`がないことに注意してください。**)
以下の API のエンドポイントは ProductManagementBackendStack をデプロイした際に作成した Amazon API Gateway のエンドポイントです。転載しておいた内容をコピーするか、[Amazon API Gateway](https://console.aws.amazon.com/apigateway/main/apis) のページで確認できます。

```
VUE_APP_API_ENDPOINT=https://[API ID].execute-api.[Region].amazonaws.com/prod
```

続いて、フロントエンドをビルドします。`management-ui` ディレクトリに移動し、以下を実行します。

```bash
npm run build
```

最後に、`cdk` を利用して、フロントエンドをデプロイします。`provision` ディレクトリに移動し、以下を実行します。

```bash
cdk deploy ProductManagementFrontendStack
```

デプロイが完了したら [CloudFront](https://console.aws.amazon.com/cloudfront/v3/home#/distributions) にアクセスし、ブラウザでドメインにアクセスしてください。(`https://xxxxxxxxxxxxxx.cloudfront.net` のような形式です。)

## 使い方

### アップロード機能
- ヘッダーの右ボタンから csv ファイルをアップロードし、QLDB にデータを挿入します。 **サンプルの csv が csv/sample.csv にあるので、そちらをご利用下さい。**

### Home 画面
- ID を範囲指定して検索することができます。範囲をしていない場合、全てのアイテムを取得します。( **今回は便宜上実装されていますが、QLDB では一般的に範囲指定クエリは使うべきではありません。ベストプラクティスについては[こちら](https://docs.aws.amazon.com/qldb/latest/developerguide/working.optimize.html)をご参照ください。** )
- ID を指定して詳細ページに遷移することができます。削除されたアイテムは検索結果に出現しないので、こちらから遷移する必要があります。
- 検索結果の行をクリックすることで詳細ページに遷移します。
- 検索結果を csv 形式でダウンロードできます。

### 詳細ページ
- 最新のデータと更新履歴を確認できます。
- 項目のアップデートができます。値を変更し「変更を保存」ボタンを押下してください。複数の値を同時に更新することもできます。
- アイテムの削除ができます。削除完了後は検索結果に出現しなくなるので注意してください。
- 更新履歴を csv 形式でダウンロードできます。

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
