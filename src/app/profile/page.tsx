'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, BellRing, BellOff, Loader2 } from 'lucide-react'; 
import Link from 'next/link';
import { requestAndSaveToken } from '@/lib/fcm'; 

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null); 
  const [hasToken, setHasToken] = useState(false); 
  const [pushLoading, setPushLoading] = useState(false); 

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUserId(user.id);

      // 通知用トークンの有無を確認
      const { data } = await supabase
        .from('profiles')
        .select('fcm_token')
        .eq('id', user.id)
        .single();

      if (data) {
        setHasToken(!!data.fcm_token);
      }
      setLoading(false);
    };
    getProfile();
  }, [router]);

  // 通知設定を有効にする
  const handleEnablePush = async () => {
    if (!userId) return;
    setPushLoading(true);
    const success = await requestAndSaveToken(userId);
    if (success) {
      setHasToken(true);
      localStorage.setItem('pwa_notification_asked', 'true');
      alert('設定が完了しました！大事なお知らせがスマホに届くようになります。');
    } else {
      alert('設定に失敗しました。スマホ本体の設定でブラウザの通知が許可されているか確認してください。');
    }
    setPushLoading(false);
  };

  // 通知設定を無効にする
  const handleDisablePush = async () => {
    if (!userId || !confirm('通知を停止しますか？\n（重要なお知らせが届かなくなります）')) return;
    
    setPushLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: null }) 
        .eq('id', userId);

      if (error) throw error;
      
      setHasToken(false);
      alert('通知設定を解除しました。');
    } catch (error: any) {
      alert('解除に失敗しました。');
    } finally {
      setPushLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-black text-slate-400 animate-pulse">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-[45px] shadow-2xl p-10 border border-slate-100">
        
        <Link href="/dashboard" className="text-slate-400 font-black flex items-center gap-2 mb-10 hover:text-[#003366] transition-colors">
          <ArrowLeft size={24} strokeWidth={3} /> 戻る
        </Link>

        <div className="text-center mb-10">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl transition-colors ${hasToken ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-900'}`}>
            {hasToken ? <BellRing size={48} strokeWidth={2.5} /> : <BellOff size={48} strokeWidth={2.5} />}
          </div>
          <h1 className="text-3xl font-[900] text-slate-900 mb-2">通知の設定</h1>
          <p className="text-slate-500 font-bold">
            重要なお知らせの受け取り設定
          </p>
        </div>

        <div className="space-y-6">
          {hasToken ? (
            <button
              onClick={handleDisablePush}
              disabled={pushLoading}
              className="w-full py-6 bg-red-50 text-red-600 border-4 border-red-100 rounded-[30px] font-[900] text-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            >
              {pushLoading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <><BellOff size={28} strokeWidth={3} /> 通知を無効にする</>
              )}
            </button>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="w-full py-6 bg-[#003366] text-white rounded-[30px] font-[900] text-xl flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 shadow-xl border-b-8 border-blue-950"
            >
              {pushLoading ? (
                <Loader2 className="animate-spin" size={28} />
              ) : (
                <><BellRing size={28} strokeWidth={3} /> 通知を有効にする</>
              )}
            </button>
          )}
          
          <div className="p-6 bg-slate-50 rounded-[30px] border border-slate-100">
            <p className="text-sm text-slate-600 font-bold leading-relaxed text-center">
              {hasToken 
                ? "✅ 現在、この端末への通知は「有効」です。例会の変更などが届きます。" 
                : "📢 通知をオンにすると、事務局からの大切な連絡がスマホに直接届くようになります。"}
            </p>
          </div>
        </div>

        <p className="mt-10 text-[11px] text-slate-300 font-bold text-center uppercase tracking-widest">
          Lions Hub Notification Settings
        </p>
      </div>
    </div>
  );
}