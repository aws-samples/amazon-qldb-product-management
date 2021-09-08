// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import { QldbDriver, RetryConfig } from 'amazon-qldb-driver-nodejs';
import * as https from 'https';

const serviceConfigurationOptions = {
  region: process.env.AWS_REGION,
  httpOptions: {
    agent: new https.Agent({
      keepAlive: true
    }),
  },
};

const driver = new QldbDriver(process.env.LEDGER_NAME, serviceConfigurationOptions, 0, new RetryConfig(4));

export default driver;
