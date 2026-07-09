import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Anciennes URLs du module Clients → nouvelles routes CG. */
const LEGACY_CLIENT_REDIRECTS: Record<string, string> = {
  '/invoices': '/accounting/clients/invoices',
  '/sales/new-order': '/accounting/clients/credit-notes',
  '/sales/order-journal': '/accounting/clients/payments',
};

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const target = LEGACY_CLIENT_REDIRECTS[pathname];
  if (!target) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = target;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/invoices', '/sales/new-order', '/sales/order-journal'],
};
