import { PollInputFormat } from 'modules/polling/polling.constants';

export const getVoteColor = (optionId: number, inputFormat: PollInputFormat): string => {
  if (inputFormat === PollInputFormat.rankFree) {
    return '#708390';
  }

  const colors = {
    0: '#708390',
    1: '#1AAB9B',
    2: '#F77249'
  };

  return colors[optionId];
};
