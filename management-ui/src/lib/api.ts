// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
import axios from 'axios';

export const API = axios.create({
  baseURL: process.env.VUE_APP_API_ENDPOINT,
});
