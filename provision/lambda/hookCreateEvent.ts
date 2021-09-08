// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import * as lambda from 'aws-lambda';
import * as AWS from 'aws-sdk';
import { TransactionExecutor } from 'amazon-qldb-driver-nodejs';
import qldb from './lib/qldb';
import csvParse = require('csv-parse/lib/sync');

const s3 = new AWS.S3({ signatureVersion: 'v4' });

const checkExistance = async (txn: TransactionExecutor, id: number): Promise<boolean> => {
  const stmt = `SELECT * FROM ${process.env.TABLE_NAME} AS q WHERE q.ID = ?`;
  const res = await txn.execute(stmt, id);

  return res['_resultList'].length > 0;
};

const registerProduct = async (txn: TransactionExecutor, row: any): Promise<void> => {
  const stmt = `INSERT INTO ${process.env.TABLE_NAME} ?`;
  await txn.execute(stmt, row);
};

const updateProduct = async (txn: TransactionExecutor, row: any): Promise<void> => {
  const stmt = `UPDATE ${process.env.TABLE_NAME} AS q SET q = ? WHERE q.ID = ?`;
  await txn.execute(stmt, row, row.ID);
};

exports.handler = async (event: lambda.S3Event): Promise<void> => {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;
    const params = { Bucket: bucket, Key: key };
    const data = await s3.getObject(params).promise();
    const csvParsed = csvParse(data.Body.toString(), { columns: true, cast: true, bom: true });

    for (const row of csvParsed) {
      await qldb.executeLambda(async (txn: TransactionExecutor) => {
        const exists = await checkExistance(txn, row.ID);

        if (exists) {
          await updateProduct(txn, row);
        } else {
          await registerProduct(txn, row);
        }
      });
    }
  }
}
