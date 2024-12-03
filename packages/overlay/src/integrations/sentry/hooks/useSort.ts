import { useState } from 'react';

type useSortProps = {
  defaultSortType?: string;
  defaultAsc?: boolean;
};

export default function useSort({ defaultSortType = '', defaultAsc = false }: useSortProps) {
  const [sort, setSort] = useState({
    active: defaultSortType,
    asc: defaultAsc,
  });

  const toggleSortOrder = (type: string) =>
    setSort(prev =>
      prev.active === type
        ? {
            active: type,
            asc: !prev.asc,
          }
        : {
            active: type,
            asc: false,
          },
    );

  return {
    toggleSortOrder,
    sort,
    setSort,
  };
}
