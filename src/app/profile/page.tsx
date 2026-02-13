'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      if (data) setFullName(data.full_name || '');
      setLoading(false);
    };
    getProfile();
  }, [router]);

  const handleUpdate = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', user?.id);

    if (!error) {
      setMessage('保存しました！');
      setTimeout(() => setMessage(''), 3000);
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-center font-bold">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10 border border-slate-100">
        
        <Link href="/dashboard" className="text-slate-400 font-bold flex items-center gap-2 mb-8 hover:text-blue-900 transition-colors">
          <ArrowLeft size={20} /> 戻る
        </Link>

        <div className="flex justify-center mb-6">
          <div className="bg-blue-900 p-5 rounded-full text-white shadow-xl">
            <User size={48} />
          </div>
        </div>

        <h1 className="text-3xl font-black text-center text-slate-900 mb-2">名前の設定</h1>
        <p className="text-slate-500 text-center font-bold mb-10">
          出欠表に表示されるお名前です
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-black text-slate-400 mb-2 ml-2">お名前（例：六本木 太郎）</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl text-xl font-bold focus:border-blue-900 focus:outline-none transition-all"
              placeholder="お名前を入力"
            />
          </div>

          <button
            onClick={handleUpdate}
            disabled={saving}
            className="w-full py-6 bg-blue-900 text-white rounded-3xl font-black text-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            {saving ? '保存中...' : <><Save size={28} /> 保存する</>}
          </button>

          {message && (
            <div className="flex items-center justify-center gap-2 text-green-600 font-black animate-bounce">
              <CheckCircle size={20} /> {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}