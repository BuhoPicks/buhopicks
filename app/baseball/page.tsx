import DashboardView from '@/components/DashboardView/DashboardView';

export const revalidate = 0;

export default async function BaseballPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const day = (params?.day === 'tomorrow' ? 'tomorrow' : 'today') as 'today' | 'tomorrow';
  const sort = (params?.sort === 'time' ? 'time' : 'relevance') as 'relevance' | 'time';

  return <DashboardView sport="baseball" day={day} sortBy={sort} />;
}
