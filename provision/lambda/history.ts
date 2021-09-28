// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import * as lambda from 'aws-lambda';
import { TransactionExecutor } from 'amazon-qldb-driver-nodejs';
import { dom } from 'ion-js';
import qldb from './lib/qldb';
import queryParams from './lib/queryParams';
import formatDate from './lib/formatDate';
import csvStringify = require('csv-stringify/lib/sync');

const fetchDocumentId = async (id: number) => {
  const documentId = await qldb.executeLambda(async (txn: TransactionExecutor) => {
    const stmt = `SELECT metadata.id FROM _ql_committed_${process.env.TABLE_NAME} WHERE data.ID = ?`;
    const res = await txn.execute(stmt, id);
    const resList = res.getResultList();

    if (resList.length > 0) {
      return resList[0].get('id')!.as(dom.String);
    } else {
      return null;
    }
  });

  return documentId;
};

const fetchHistory = async (documentId: dom.String) => {
  const history = await qldb.executeLambda(async (txn: TransactionExecutor) => {
    const stmt = `SELECT * FROM history(${process.env.TABLE_NAME}) WHERE metadata.id = ?`;
    const res = await txn.execute(stmt, documentId);
    return res.getResultList();
  });

  return history;
};

// The query below is not optimized and it executes full scanning
const fetchHistoryFull = async (id: number) => {
  const history = await qldb.executeLambda(async (txn: TransactionExecutor) => {
    const stmt = `SELECT * FROM history(${process.env.TABLE_NAME}) WHERE data.ID = ?`;
    const res = await txn.execute(stmt, id);
    return res.getResultList();
  });

  return history;
}

const createRows = (history: dom.Value[]) => {
  history
    .sort((a: dom.Value, b: dom.Value) => {
      const dateA = new Date(a.get('metadata')!.get('txTime')!.toString());
      const dateB = new Date(b.get('metadata')!.get('txTime')!.toString());
      return dateB.getTime() - dateA.getTime();
    });

  return history.map((r: dom.Value) => {
    return {
      time: formatDate(r.get('metadata')!.get('txTime')!.toString()),
      hash: r.get('hash'),
      data: r.get('data'),
    };
  });
};

exports.handler = async (event: lambda.APIGatewayProxyEvent): Promise<lambda.APIGatewayProxyResult> => {
  const _type = queryParams('type', event) || 'json';
  const scan = queryParams('scan', event) || 'documentId';
  const id = Number(event.pathParameters.id);
  const documentId = await fetchDocumentId(id);

  let history: dom.Value[];

  switch (scan) {
    case 'documentId':
      history = await fetchHistory(documentId);
      break;
    case 'full':
      // Try to find history of deleted item by full scanning
      history = await fetchHistoryFull(id);
      break;
    default:
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: `unsupported scan ${scan}` }),
      }
  }

  const rows = createRows(history);

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
