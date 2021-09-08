// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0
const formatDate = (txTime: string): string => {
  const date = new Date(txTime);
  const dateStr = `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
  const timeStr = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;

  return `${dateStr} ${timeStr}`;
};

export default formatDate;
