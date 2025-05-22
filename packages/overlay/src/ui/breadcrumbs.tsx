import { Link } from 'react-router-dom';
import { ReactComponent as ChevronIcon } from '~/assets/chevronDown.svg';
import classNames from '~/lib/classNames';

export type CrumbProps = {
  id: string;
  label: string;
  link?: boolean;
  to?: string;
};

export type BreadcrumbProps = {
  crumbs: CrumbProps[];
};

export default function Breadcrumbs({ crumbs }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 px-6 py-4">
      {crumbs.map((crumb, index) => {
        const isActiveTab = index === crumbs.length - 1;
        return (
          <div key={crumb.id} className="flex items-center gap-1">
            {index > 0 && <ChevronIcon width={12} height={12} className="stroke-primary-300 -rotate-90" />}
            {crumb.link && crumb.to ? (
              <Link
                className={classNames(
                  isActiveTab ? 'text-primary-200' : 'text-primary-300',
                  'hover:text-primary-100 truncate text-sm hover:underline',
                )}
                to={crumb.to}
              >
                {crumb.label}
              </Link>
            ) : (
              <span className={classNames(isActiveTab ? 'text-primary-200' : 'text-primary-300', 'truncate text-sm')}>
                {crumb.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
