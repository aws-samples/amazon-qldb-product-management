// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import * as lambda from 'aws-lambda';
import { TransactionExecutor } from 'amazon-qldb-driver-nodejs';
import qldb from './lib/qldb';
import queryParams from './lib/queryParams';
import csvStringify = require('csv-stringify/lib/sync');

exports.handler = async (event: lambda.APIGatewayProxyEvent): Promise<lambda.APIGatewayProxyResult> => {
  const id = Number(queryParams('id', event) || '-1');
  const _from = Number(queryParams('from', event) || '-1');
  const _to = Number(queryParams('to', event) || '100000000000');
  const _type = queryParams('type', event) || 'json';

  let res = null;

  if (id > 0) {
    res = await qldb.executeLambda(async (txn: TransactionExecutor) => {
      const stmt = `SELECT * FROM ${process.env.TABLE_NAME} AS q WHERE q.ID = ?`;
      const res = await txn.execute(stmt, id);
      return res;
    });
  } else {
    res = await qldb.executeLambda(async (txn: TransactionExecutor) => {
      const stmt = `SELECT * FROM ${process.env.TABLE_NAME} AS q WHERE q.ID >= ? AND q.ID <= ?`;
      const res = await txn.execute(stmt, _from, _to);
      return res;
    });
  }

  const rows = res.getResultList().map((r: any) => r._fields);
  rows.sort((r0: any, r1: any) => r0.ID - r1.ID);

  if (_type === 'json') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(rows),
    };
  } else if (_type === 'csv') {
    const csvStr = csvStringify(rows, { header: true });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Access-Control-Allow-Origin': '*',
      },
      body: csvStr,
    };
  } else {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: `unsupported type ${_type}` }),
    };
  }
};
