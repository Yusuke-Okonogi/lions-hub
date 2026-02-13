import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { User, ShieldCheck, Bell } from 'lucide-react'; 
import DashboardContent from '@/components/DashboardContent';
import Header from '@/components/Header';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_admin') 
    .eq('id', user.id)
    .single();

  const displayName = profile?.full_name || user.email?.split('@')[0];
  const isAdmin = profile?.is_admin || false;

  // 1. 全会員数を取得
  const { count: totalMemberCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // 2. イベント情報を取得 (既存)
  const { data: events } = await supabase
    .from('events')
    .select('*, attendance(status, user_id)')
    .gte('start_time', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
    .order('start_time', { ascending: true });

  const { data: latestNotice } = await supabase
    .from('notices')
    .select('*')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    /* 背景色を管理画面と同じ bg-slate-200 に統一 */
    <div className="min-h-screen bg-slate-200 pb-32">
      <Header 
        variant="user"
        title={`L.${displayName}`}
        subtitle="マイページ"
        isAdminBadge={isAdmin}
        rightButtonType="admin"
        />
        <main className="px-6 max-w-4xl mx-auto">

        {/* メインコンテンツ（管理者メニューの箱が消えてスッキリ！） */}
        <DashboardContent 
        allEvents={events || []} 
        userId={user.id} 
        latestNotice={latestNotice} 
        totalMemberCount={totalMemberCount || 0}
      />
      </main>
    </div>
  );
}