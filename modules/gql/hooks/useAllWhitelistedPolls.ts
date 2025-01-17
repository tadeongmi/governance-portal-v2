/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { allWhitelistedPolls } from 'modules/gql/queries/allWhitelistedPolls';
import { ActivePollsRecord } from 'modules/gql/generated/graphql';
import { useGqlQuery } from 'modules/gql/hooks/useGqlQuery';

type AllEsmJoinsResponse = {
  data: ActivePollsRecord[];
  loading: boolean;
  error?: any;
};

export const useAllWhitelistedPolls = (): AllEsmJoinsResponse => {
  const { data, error } = useGqlQuery({ cacheKey: 'allWhitelistedPolls', query: allWhitelistedPolls });

  return {
    data: data && data.allEsmJoins.nodes,
    loading: !data && !error,
    error
  };
};
