// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import queryParams from './lib/queryParams';
import * as AWS from 'aws-sdk';

const s3 = new AWS.S3({ signatureVersion: 'v4' });
const bucket = process.env.BUCKET_NAME;

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const key = queryParams('key', event);

  if (!key) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'key needs to be specified' }),
    }
  }

  const params = { Bucket: bucket, Key: key };
  const url = await s3.getSignedUrlPromise('putObject', params);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ url }),
  };
}
