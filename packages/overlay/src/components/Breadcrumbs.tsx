import { Link } from 'react-router-dom';
import { ReactComponent as ChevronIcon } from '~/assets/chevronDown.svg';
import { BreadcrumbProps } from '~/types';

const Breadcrumbs = ({ crumbs }: BreadcrumbProps) => {
  return (
    <div className="flex items-center gap-1 px-6 py-4">
      {crumbs.map((crumb, index) => (
        <div key={crumb.id} className="flex items-center gap-1">
          {crumb.link && crumb.to ? (
            <Link className="text-primary-300 hover:text-primary-100 truncate text-base hover:underline" to={crumb.to}>
              {crumb.label}
            </Link>
          ) : (
            <span className="text-primary-300 truncate text-base">{crumb.label}</span>
          )}
          {index < crumbs.length - 1 && (
            <ChevronIcon width={12} height={12} className="stroke-primary-300 -rotate-90" />
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumbs;
