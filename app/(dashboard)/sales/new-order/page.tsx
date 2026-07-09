import { redirect } from 'next/navigation';

export default function LegacyCreditNotesRedirect() {
  redirect('/accounting/clients/credit-notes');
}
