// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { APIGatewayProxyEvent } from 'aws-lambda';

const queryParams = (key: string, event: APIGatewayProxyEvent): string | null => {
  if (!event.queryStringParameters) {
    return null;
  }

  if (!event.queryStringParameters[key]) {
    return null;
  }

  return event.queryStringParameters[key];
};

export default queryParams;
