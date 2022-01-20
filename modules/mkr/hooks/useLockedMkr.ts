import useSWR from 'swr';
import { useContracts } from 'modules/web3/hooks/useContracts';
import { getChiefDeposits } from 'modules/web3/api/getChiefDeposits';
import { CurrencyObject } from 'modules/app/types/currency';

type LockedMkrData = {
  data?: CurrencyObject | null;
  loading: boolean;
  error: Error;
  mutate: () => void;
};

export const useLockedMkr = (
  address?: string,
  voteProxyAddress?: string | null,
  voteDelegateAddress?: string | null
): LockedMkrData => {
  const { chief } = useContracts();
  const addressToCache = voteProxyAddress && !voteDelegateAddress ? voteProxyAddress : address;
  const { data, error, mutate } = useSWR(
    addressToCache ? `${chief.address}/user/mkr-locked${addressToCache}` : null,
    async () => {
      return addressToCache ? await getChiefDeposits(addressToCache, chief) : null;
    },
    {
      revalidateOnFocus: false,
      revalidateOnMount: true
    }
  );

  return {
    data,
    loading: !error && !data,
    error,
    mutate
  };
};
