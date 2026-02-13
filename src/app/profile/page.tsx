'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Save, ArrowLeft, CheckCircle, BellRing, Loader2 } from 'lucide-react'; // アイコン追加
import Link from 'next/link';
import { requestAndSaveToken } from '@/lib/fcm'; // 🚀 追加：通知許可関数

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userId, setUserId] = useState<string | null>(null); // 🚀 userIdを保持
  const [message, setMessage] = useState('');
  const [pushLoading, setPushLoading] = useState(false); // 🚀 追加：通知設定中

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUserId(user.id);

      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (data) setFullName(data.full_name || '');
      setLoading(false);
    };
    getProfile();
  }, [router]);

  // 🚀 追加：通知設定を実行する関数
  const handleEnablePush = async () => {
    if (!userId) return;
    setPushLoading(true);
    const success = await requestAndSaveToken(userId);
    if (success) {
      localStorage.setItem('pwa_notification_asked', 'true');
      alert('設定が完了しました！大事なお知らせがスマホに届くようになります。');
    } else {
      alert('設定に失敗しました。スマホ本体の設定でブラウザの通知が許可されているか確認してください。');
    }
    setPushLoading(false);
  };

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', userId);
    if (!error) {
      setMessage('保存しました！');
      setTimeout(() => setMessage(''), 3000);
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center font-bold">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 pb-20 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100">
        
        <Link href="/dashboard" className="text-slate-400 font-bold flex items-center gap-2 mb-8 hover:text-blue-900 transition-colors">
          <ArrowLeft size={20} /> 戻る
        </Link>

        {/* ... (中略：名前の設定フォーム) ... */}

        <hr className="my-10 border-slate-100" />

        {/* 🚀 2. プッシュ通知設定セクションを新設 */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-400 ml-2 flex items-center gap-2">
            <BellRing size={16} /> 通知の設定
          </h2>
          
          <button
            onClick={handleEnablePush}
            disabled={pushLoading}
            className="w-full py-5 bg-slate-100 text-blue-900 border-2 border-blue-100 rounded-3xl font-black text-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {pushLoading ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>通知を有効にする</>
            )}
          </button>
          
          <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-2 text-center">
            ※「あとで設定する」を選んだ場合も、<br />ここからいつでも設定をオンにできます。
          </p>
        </div>

      </div>
    </div>
  );
}