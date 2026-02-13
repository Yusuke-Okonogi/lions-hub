import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardContent from '@/components/DashboardContent';
import Header from '@/components/Header';
// 🛠️ 修正1: インポートを追加
import NotificationPrompt from '@/components/NotificationPrompt'; 

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

  // 2. イベント情報を取得
  const { data: events } = await supabase
    .from('events')
    .select('*, attendance(status, user_id)')
    .gte('start_time', new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString())
    .order('start_time', { ascending: true });

  // 3. お知らせを取得（全員宛 or 自分宛）かつ（期限内）
  const { data: notices } = await supabase
    .from('notices')
    .select('*')
    .or(`target_user_id.is.null,target_user_id.eq.${user.id}`)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-200 pb-32">
      <Header 
        variant="user"
        title={`L.${displayName}`}
        subtitle="マイページ"
        isAdminBadge={isAdmin}
        rightButtonType="admin"
      />
      <main className="px-6 max-w-4xl mx-auto">
        {/* 🛠️ 修正2: DashboardContent が期待する 'latestNotice' として配列の先頭を渡す */}
        <DashboardContent 
          allEvents={events || []} 
          userId={user.id} 
          latestNotice={notices?.[0] || null} 
          totalMemberCount={totalMemberCount || 0}
        />
        
        {/* 通知許可プロンプトを表示 */}
        <NotificationPrompt userId={user.id} />
      </main>
    </div>
  );
}