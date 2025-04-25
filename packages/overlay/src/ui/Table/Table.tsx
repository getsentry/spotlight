import { type ReactNode, createContext, useContext } from 'react';
import classNames from '~/lib/classNames';

type TableVariant = 'default' | 'detail';

const TableContext = createContext<{ variant: TableVariant }>({ variant: 'default' });

function useTableContext() {
  return useContext(TableContext);
}

export type TableProps = {
  children?: ReactNode;
  className?: string;
  variant?: TableVariant;
};

export default function Table({ children, className, variant = 'default', ...props }: TableProps) {
  return (
    <TableContext.Provider value={{ variant }}>
      <table
        className={classNames(variant === 'detail' ? 'divide-primary-700 w-full table-fixed divide-y' : '', className)}
        {...props}
      >
        {children}
      </table>
    </TableContext.Provider>
  );
}

export type TableHeaderProps = {
  children?: ReactNode;
  className?: string;
  variant?: TableVariant;
};

function TableHeader({ children, className, variant: headerVariant = 'default', ...props }: TableHeaderProps) {
  const { variant: tableVariant } = useTableContext();
  const variant = headerVariant ?? tableVariant;

  return (
    <thead className={classNames(variant === 'detail' ? 'bg-primary-950 sticky top-0 z-20' : '', className)} {...props}>
      {children}
    </thead>
  );
}

export type TableBodyProps = {
  children?: ReactNode;
  className?: string;
};

function TableBody({ children, className, ...props }: TableBodyProps) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

Table.Header = TableHeader;
Table.Body = TableBody;
