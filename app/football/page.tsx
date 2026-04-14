import DashboardView from '@/components/DashboardView/DashboardView';

export const dynamic = 'force-dynamic';

export default async function FootballPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const day = (params?.day === 'tomorrow' ? 'tomorrow' : 'today') as 'today' | 'tomorrow';
  const sort = (params?.sort === 'time' ? 'time' : 'relevance') as 'relevance' | 'time';

  return <DashboardView sport="football" day={day} sortBy={sort} />;
}

