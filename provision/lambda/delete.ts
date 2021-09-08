// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import * as lambda from 'aws-lambda';
import { TransactionExecutor } from 'amazon-qldb-driver-nodejs';
import qldb from './lib/qldb';

const deleteProduct = async (txn: TransactionExecutor, id: number): Promise<void> => {
  const stmt = `DELETE FROM ${process.env.TABLE_NAME} AS q WHERE q.ID = ?`;
  await txn.execute(stmt, id);
}

exports.handler = async (event: lambda.APIGatewayProxyEvent): Promise<lambda.APIGatewayProxyResult> => {
  const id = Number(event.pathParameters.id);

  await qldb.executeLambda(async (txn: TransactionExecutor) => {
    await deleteProduct(txn, id);
  });

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: '',
  }
}
