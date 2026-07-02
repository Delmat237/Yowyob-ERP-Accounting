import { redirect } from 'next/navigation';
import { ANALYTIQUE_DASHBOARD_PATH } from '@/lib/accounting-dashboard-routes';

export default function AnalytiqueIndexPage() {
  redirect(ANALYTIQUE_DASHBOARD_PATH);
}
