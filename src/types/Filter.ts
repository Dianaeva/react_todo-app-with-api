export type Filter = 'all' | 'active' | 'completed';

export const isFilter = (value: string): value is Filter => {
  return ['all', 'active', 'completed'].includes(value);
};
