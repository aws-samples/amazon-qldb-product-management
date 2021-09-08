// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import * as lambda from 'aws-lambda';
import { TransactionExecutor } from 'amazon-qldb-driver-nodejs';
import qldb from './lib/qldb';
import queryParams from './lib/queryParams';
import formatDate from './lib/formatDate';
import csvStringify = require('csv-stringify/lib/sync');

exports.handler = async (event: lambda.APIGatewayProxyEvent): Promise<lambda.APIGatewayProxyResult> => {
  const _type = queryParams('type', event) || 'json';
  const id = Number(event.pathParameters.id);
  const res = await qldb.executeLambda(async (txn: TransactionExecutor) => {
    const stmt = `SELECT * FROM history(${process.env.TABLE_NAME}) WHERE data.ID = ?`;
    const res = await txn.execute(stmt, id);
    return res;
  });

  const rows = res.getResultList().reverse().map((r: any) => {
    return {
      time: formatDate(r.metadata.txTime),
      hash: r.hash,
      data: r.data,
    };
  });

  if (_type === 'json') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(rows),
    }
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
}
