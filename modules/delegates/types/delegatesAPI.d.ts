/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { Delegate, DelegatePaginated } from './delegate';
import { SupportedNetworks } from 'modules/web3/constants/networks';
import { DelegateTypeEnum } from '../delegates.constants';
import { CvcStats } from './cvc';

export type DelegatesAPIStats = {
  total: number;
  shadow: number;
  constitutional: number;
  totalMKRDelegated: string;
  totalDelegators: number;
};

export type DelegatesAPIResponse = {
  delegates: Delegate[];
  stats: DelegatesAPIStats;
  pagination?: {
    page: number;
    pageSize: number;
  };
};

export type DelegatesValidatedQueryParams = {
  network: SupportedNetworks;
  pageSize: number;
  page: number;
  includeExpired: boolean;
  orderBy: string;
  orderDirection: string;
  seed: number | null;
  delegateType: DelegateTypeEnum;
  name: string | null;
  cvcs: string[] | null;
};

export type DelegatesPaginatedAPIResponse = {
  paginationInfo: {
    totalCount: number;
    page: number;
    numPages: number;
    hasNextPage: boolean;
  };
  stats: DelegatesAPIStats;
  delegates: DelegatePaginated[];
  cvcs: CvcStats[];
};
