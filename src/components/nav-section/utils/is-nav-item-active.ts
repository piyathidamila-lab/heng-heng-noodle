import type { NavItemDataProps } from '../types';

import { isActiveLink } from 'minimal-shared/utils';

// ----------------------------------------------------------------------

/** Marks a parent item active whenever its own path or any nested child path is active. */
export function isNavItemActive(pathname: string, item: NavItemDataProps): boolean {
  if (isActiveLink(pathname, item.path, item.deepMatch ?? !!item.children)) return true;

  return item.children?.some((child) => isNavItemActive(pathname, child)) ?? false;
}
