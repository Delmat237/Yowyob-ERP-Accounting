import { redirect } from 'next/navigation';

export default function LegacyInvoicesRedirect() {
  redirect('/accounting/clients/invoices');
}
