/*

SPDX-FileCopyrightText: © 2023 Dai Foundation <www.daifoundation.org>

SPDX-License-Identifier: AGPL-3.0-or-later

*/

import { useMemo, useState, useRef, useEffect } from 'react';
import { Heading, Box, Flex, Card, Text, Button } from 'theme-ui';
import { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import ErrorPage from 'modules/app/components/ErrorPage';
import { useBreakpointIndex } from '@theme-ui/match-media';
import shallow from 'zustand/shallow';
import { Icon } from '@makerdao/dai-ui-icons';
import useSWR, { useSWRConfig } from 'swr';
import useDelegatesFiltersStore from 'modules/delegates/stores/delegatesFiltersStore';
import { isDefaultNetwork } from 'modules/web3/helpers/networks';
import { DelegateStatusEnum, DelegateTypeEnum } from 'modules/delegates/delegates.constants';
import PrimaryLayout from 'modules/app/components/layout/layouts/Primary';
import SidebarLayout from 'modules/app/components/layout/layouts/Sidebar';
import Stack from 'modules/app/components/layout/layouts/Stack';
import ResourceBox from 'modules/app/components/ResourceBox';
import { DelegateOverviewCard } from 'modules/delegates/components';
import PageLoadingPlaceholder from 'modules/app/components/PageLoadingPlaceholder';
import { HeadComponent } from 'modules/app/components/layout/Head';
import { DelegatesSystemInfo } from 'modules/delegates/components/DelegatesSystemInfo';
import { DelegatesStatusFilter } from 'modules/delegates/components/filters/DelegatesStatusFilter';
import { DelegatesSortFilter } from 'modules/delegates/components/filters/DelegatesSortFilter';
import { DelegatesCvcFilter } from 'modules/delegates/components/filters/DelegatesCvcFilter';
import { DelegatesShowExpiredFilter } from 'modules/delegates/components/filters/DelegatesShowExpiredFilter';
import { useAccount } from 'modules/app/hooks/useAccount';
import { useWeb3 } from 'modules/web3/hooks/useWeb3';
import { ErrorBoundary } from 'modules/app/components/ErrorBoundary';
import { InternalLink } from 'modules/app/components/InternalLink';
import { fetchDelegatesPageData } from 'modules/delegates/api/fetchDelegatesPageData';
import { SupportedNetworks } from 'modules/web3/constants/networks';
import { SearchBar } from 'modules/app/components/filters/SearchBar';
import { getTestBreakout } from 'modules/app/helpers/getTestBreakout';
import { useIntersectionObserver } from 'modules/app/hooks/useIntersectionObserver';
import { DelegatesPaginatedAPIResponse } from 'modules/delegates/types';
import SkeletonThemed from 'modules/app/components/SkeletonThemed';

type DelegatesPageProps = DelegatesPaginatedAPIResponse & {
  seed: number;
};

const Delegates = ({
  delegates: propDelegates,
  stats,
  cvcs,
  paginationInfo: propPaginationInfo,
  seed: propSeed
}: DelegatesPageProps) => {
  const { network } = useWeb3();
  const { voteDelegateContractAddress } = useAccount();
  const [
    showConstitutional,
    showShadow,
    showExpired,
    sort,
    sortDirection,
    name,
    delegateCvcs,
    fetchOnLoad,
    setCvcFilter,
    setName,
    setFetchOnLoad,
    resetFilters,
    resetSort,
    resetSortDirection
  ] = useDelegatesFiltersStore(
    state => [
      state.filters.showConstitutional,
      state.filters.showShadow,
      state.filters.showExpired,
      state.sort,
      state.sortDirection,
      state.filters.name,
      state.filters.cvcs,
      state.fetchOnLoad,
      state.setCvcFilter,
      state.setName,
      state.setFetchOnLoad,
      state.resetFilters,
      state.resetSort,
      state.resetSortDirection
    ],
    shallow
  );

  const onVisitDelegate = () => {
    setFetchOnLoad(true);
  };

  const onResetClick = () => {
    resetFilters();
    resetSort();
    resetSortDirection();
    setFetchOnLoad(false);
  };

  const [loading, setLoading] = useState(fetchOnLoad);
  const [isRendering, setIsRendering] = useState(true);
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const [delegates, setDelegates] = useState(fetchOnLoad ? [] : propDelegates);
  const [paginationInfo, setPaginationInfo] = useState(propPaginationInfo);
  const [seed, setSeed] = useState(propSeed);
  const [delegateCvcsLength, setDelegateCvcsLength] = useState(delegateCvcs.length);
  const [filters, setFilters] = useState({
    page: 1,
    sort,
    sortDirection,
    name,
    delegateCvcs,
    showExpired,
    delegateType:
      showConstitutional && showShadow
        ? DelegateTypeEnum.CONSTITUTIONAL
        : showShadow
        ? DelegateTypeEnum.SHADOW
        : DelegateTypeEnum.CONSTITUTIONAL
  });

  useEffect(() => {
    setIsRendering(false);
  }, []);

  const router = useRouter();

  useEffect(() => {
    if (router.query.cvc) {
      const cvc = router.query.cvc as string;
      setCvcFilter([cvc]);
    }
  }, [router]);

  useEffect(() => {
    if (shouldLoadMore) {
      if (paginationInfo.hasNextPage) {
        setLoading(true);
        setFilters(({ page: prevPage, ...prevFilters }) => ({
          ...prevFilters,
          page: prevPage + 1
        }));
      } else if (showShadow && !shadowDelegates.length && !name && delegateCvcsLength === 0) {
        setLoading(true);
        setFilters(({ ...prevFilters }) => ({
          ...prevFilters,
          page: 1,
          delegateType: DelegateTypeEnum.SHADOW
        }));
      } else {
        setShouldLoadMore(false);
      }
    }
  }, [shouldLoadMore]);

  useEffect(() => {
    if (!isRendering || fetchOnLoad) {
      let mounted = true;
      const fetchDelegates = async () => {
        const queryParams = {
          page: filters.page,
          delegateType: filters.delegateType,
          orderBy: filters.sort,
          orderDirection: filters.sortDirection,
          seed,
          name: filters.name,
          queryCvcs: delegateCvcs,
          includeExpired: filters.showExpired
        };

        const res = await fetchDelegatesPageData(network, true, queryParams);
        setLoading(false);
        setDelegates(prevDelegates => [...prevDelegates, ...res.delegates]);
        setPaginationInfo(res.paginationInfo);
        setShouldLoadMore(false);
      };
      if (mounted) {
        fetchDelegates();
      }
      return () => {
        mounted = false;
      };
    }
  }, [filters]);

  useEffect(() => {
    setDelegates(fetchOnLoad ? delegates : propDelegates);
    setPaginationInfo(propPaginationInfo);
    setSeed(propSeed);
  }, [propDelegates, propPaginationInfo, propSeed, fetchOnLoad]);

  useEffect(() => {
    setDelegateCvcsLength(delegateCvcs.length);
  }, [delegateCvcs]);

  useEffect(() => {
    if (!isRendering) {
      setLoading(true);
      setDelegates([]);
      setFilters({
        page: 1,
        sort,
        sortDirection,
        name: name,
        delegateCvcs,
        showExpired,
        delegateType:
          showConstitutional && showShadow
            ? DelegateTypeEnum.CONSTITUTIONAL
            : showShadow
            ? DelegateTypeEnum.SHADOW
            : DelegateTypeEnum.CONSTITUTIONAL
      });
    }
  }, [sort, sortDirection, name, delegateCvcsLength, showConstitutional, showShadow, showExpired]);

  // only for mobile
  const [showFilters, setShowFilters] = useState(false);
  const bpi = useBreakpointIndex();

  // Load more on scroll
  const delegatesLoaderRef = useRef<HTMLDivElement>(null);
  useIntersectionObserver(delegatesLoaderRef, () => setShouldLoadMore(true), '0px');

  const [constitutionalDelegates, shadowDelegates, expiredDelegates] = useMemo(() => {
    const constitutional = delegates.filter(
      delegate => delegate.status === DelegateStatusEnum.constitutional && !delegate.expired
    );

    const shadow = delegates.filter(
      delegate => delegate.status === DelegateStatusEnum.shadow && !delegate.expired
    );

    const expired = delegates.filter(delegate => delegate.expired === true);
    return [constitutional, shadow, expired];
  }, [delegates, propDelegates]);

  return (
    <PrimaryLayout sx={{ maxWidth: [null, null, null, 'page', 'dashboard'] }}>
      <HeadComponent
        title="Delegates"
        description="Vote delegation allows for MKR holders to delegate their voting power to delegates, which increases the effectiveness and efficiency of the governance process."
        image={'https://vote.makerdao.com/seo/delegates.png'}
      />
      <Stack>
        <Flex sx={{ alignItems: 'center', flexDirection: ['column', 'row'] }}>
          <Flex sx={{ alignItems: 'center' }}>
            <Button
              variant="textual"
              sx={{ display: ['block', 'none'], color: 'onSecondary' }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Text sx={{ mr: 1 }}>{showFilters ? 'Hide delegate filters' : 'Show delegate filters'}</Text>
              <Icon name={showFilters ? 'chevron_down' : 'chevron_right'} size={2} />
            </Button>
          </Flex>
          {(showFilters || bpi > 0) && (
            <Flex sx={{ flexDirection: ['column', 'column', 'column', 'row'] }}>
              <Flex
                sx={{
                  justifyContent: ['center', 'center', 'center', 'flex-start'],
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}
              >
                <SearchBar
                  sx={{ m: 2 }}
                  onChange={setName}
                  value={name}
                  placeholder="Search by name"
                  withSearchButton={true}
                  performSearchOnClear={true}
                />
                <DelegatesSortFilter />
                <DelegatesCvcFilter delegates={delegates} cvcs={cvcs} sx={{ m: 2 }} />
                <DelegatesStatusFilter stats={stats} />
                <DelegatesShowExpiredFilter sx={{ ml: 2 }} />
              </Flex>
              <Button
                variant={'outline'}
                data-testid="delegate-reset-filters"
                sx={{
                  m: 2,
                  color: 'textSecondary',
                  border: 'none'
                }}
                onClick={onResetClick}
              >
                Reset filters
              </Button>
            </Flex>
          )}
        </Flex>

        <SidebarLayout>
          <Box>
            <Stack gap={3}>
              {[...constitutionalDelegates, ...shadowDelegates, ...expiredDelegates].length === 0 &&
                !loading && (
                  <Flex sx={{ flexDirection: 'column', alignItems: 'center', pt: [5, 5, 5, 6] }}>
                    <Flex
                      sx={{
                        borderRadius: '50%',
                        backgroundColor: 'secondary',
                        p: 2,
                        width: '111px',
                        height: '111px',
                        alignItems: 'center'
                      }}
                    >
                      <Box m={'auto'}>
                        <Icon name="magnifying_glass" sx={{ color: 'background', size: 4 }} />
                      </Box>
                    </Flex>
                    <Text variant={'microHeading'} sx={{ color: 'onSecondary', mt: 3 }}>
                      No delegates found
                    </Text>
                    <Button
                      variant={'textual'}
                      sx={{ color: 'primary', textDecoration: 'underline', mt: 2, fontSize: 3 }}
                      onClick={onResetClick}
                    >
                      Reset filters
                    </Button>
                  </Flex>
                )}

              {constitutionalDelegates.length > 0 && (
                <Stack gap={3}>
                  <Heading as="h1">Constitutional Delegates</Heading>

                  {constitutionalDelegates.map(delegate => (
                    <Box key={delegate.voteDelegateAddress} sx={{ mb: 3 }}>
                      <ErrorBoundary componentName="Delegate Card">
                        <DelegateOverviewCard
                          delegate={delegate}
                          setStateDelegates={setDelegates}
                          onVisitDelegate={onVisitDelegate}
                        />
                      </ErrorBoundary>
                    </Box>
                  ))}
                </Stack>
              )}

              {shadowDelegates.length > 0 && (
                <Stack gap={3}>
                  <Heading as="h1">Shadow Delegates</Heading>

                  {shadowDelegates.map(delegate => (
                    <Box key={delegate.voteDelegateAddress} sx={{ mb: 3 }}>
                      <ErrorBoundary componentName="Delegate Card">
                        <DelegateOverviewCard
                          delegate={delegate}
                          setStateDelegates={setDelegates}
                          onVisitDelegate={onVisitDelegate}
                        />
                      </ErrorBoundary>
                    </Box>
                  ))}
                </Stack>
              )}

              {expiredDelegates.length > 0 && (
                <Stack gap={3}>
                  <Heading as="h1">Expired Delegates</Heading>

                  {expiredDelegates.map(delegate => (
                    <Box key={delegate.voteDelegateAddress} sx={{ mb: 3 }}>
                      <ErrorBoundary componentName="Delegate Card">
                        <DelegateOverviewCard
                          delegate={delegate}
                          setStateDelegates={setDelegates}
                          onVisitDelegate={onVisitDelegate}
                        />
                      </ErrorBoundary>
                    </Box>
                  ))}
                </Stack>
              )}
              {loading && (
                <Flex sx={{ justifyContent: 'center' }}>
                  <SkeletonThemed circle={true} width={50} height={50} />
                </Flex>
              )}
            </Stack>
          </Box>

          <Stack gap={3}>
            <Box>
              <Heading mt={3} mb={2} as="h3" variant="microHeading">
                Delegate Contracts
              </Heading>
              <Card variant="compact">
                <Text as="p" sx={{ mb: 3, color: 'textSecondary' }}>
                  {voteDelegateContractAddress
                    ? 'Looking for delegate contract information?'
                    : 'Interested in creating a delegate contract?'}
                </Text>
                <Box>
                  <InternalLink
                    href={'/account'}
                    title="My account"
                    // TODO: onClick={() => trackButtonClick('viewAccount')}
                  >
                    <Text color="accentBlue">View Account Page</Text>
                  </InternalLink>
                </Box>
              </Card>
            </Box>
            {stats && (
              <ErrorBoundary componentName="Delegates System Info">
                <DelegatesSystemInfo stats={stats} />
              </ErrorBoundary>
            )}
            <ResourceBox type={'delegates'} />
            <ResourceBox type={'general'} />
          </Stack>
        </SidebarLayout>
      </Stack>
      <div ref={delegatesLoaderRef} />
    </PrimaryLayout>
  );
};

export default function DelegatesPage({
  delegates: prefetchedDelegates,
  stats: prefetchedStats,
  cvcs: prefetchedCvcs,
  paginationInfo: prefetchedPaginationInfo,
  seed
}: DelegatesPageProps): JSX.Element {
  const { network } = useWeb3();

  const fallbackData = isDefaultNetwork(network)
    ? {
        delegates: prefetchedDelegates,
        cvcs: prefetchedCvcs,
        stats: prefetchedStats,
        paginationInfo: prefetchedPaginationInfo
      }
    : null;

  const { cache } = useSWRConfig();
  const cacheKey = `page/delegates/${network}`;
  const { data, error } = useSWR<DelegatesPaginatedAPIResponse>(
    !network || isDefaultNetwork(network) ? null : cacheKey,
    () => fetchDelegatesPageData(network, true, { seed }),
    {
      revalidateOnMount: !cache.get(cacheKey),
      ...(fallbackData && { fallbackData })
    }
  );

  if (!isDefaultNetwork(network) && !data && !error) {
    return <PageLoadingPlaceholder />;
  }

  if (error) {
    return (
      <PrimaryLayout sx={{ maxWidth: 'dashboard' }}>
        <ErrorPage statusCode={500} title="Error fetching data. Please, try again later." />
      </PrimaryLayout>
    );
  }

  const props = {
    delegates: isDefaultNetwork(network) ? prefetchedDelegates : data?.delegates || [],
    stats: isDefaultNetwork(network)
      ? prefetchedStats
      : data?.stats || {
          total: 0,
          shadow: 0,
          constitutional: 0,
          totalMKRDelegated: '0',
          totalDelegators: 0
        },
    cvcs: isDefaultNetwork(network) ? prefetchedCvcs : data?.cvcs || [],
    paginationInfo: isDefaultNetwork(network)
      ? prefetchedPaginationInfo
      : data?.paginationInfo || {
          totalCount: 0,
          page: 0,
          numPages: 0,
          hasNextPage: false
        },
    seed
  };

  return (
    <ErrorBoundary componentName="Delegates List">
      <Delegates {...props} />
    </ErrorBoundary>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Don't fetch mainnet data while running tests since it will be refetched client-side anyway
  if (getTestBreakout()) {
    return {
      props: {
        delegates: [],
        cvcs: [],
        stats: {},
        paginationInfo: {},
        seed: null
      }
    };
  }

  const seed = Math.random() * 2 - 1;
  const { delegates, stats, cvcs, paginationInfo } = await fetchDelegatesPageData(
    SupportedNetworks.MAINNET,
    false,
    { seed }
  );

  return {
    revalidate: 60 * 30, // allow revalidation every 30 minutes
    props: {
      // Shuffle in the backend, this will be changed depending on the sorting order.
      delegates,
      cvcs,
      stats,
      paginationInfo,
      seed
    }
  };
};
