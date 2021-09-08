// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import * as lambda from 'aws-lambda';
import { TransactionExecutor } from 'amazon-qldb-driver-nodejs';
import qldb from './lib/qldb';

const updateProduct = async (txn: TransactionExecutor, id: number, row: any): Promise<void> => {
  const stmt = `UPDATE ${process.env.TABLE_NAME} AS q SET q = ? WHERE q.ID = ?`;
  await txn.execute(stmt, row, id);
};

exports.handler = async (event: lambda.APIGatewayProxyEvent): Promise<lambda.APIGatewayProxyResult> => {
  const id = Number(event.pathParameters.id);

  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: 'Empty body',
    }
  }

  const row = JSON.parse(event.body);

  await qldb.executeLambda(async (txn: TransactionExecutor) => {
    await updateProduct(txn, id, row);
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: '',
  };
};
