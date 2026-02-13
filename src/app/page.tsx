'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
/* --- 🛠️ アイコン追加：鍵とメール --- */
import { Mail, Lock, LogIn, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // パスワード用のステートを追加
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    /* --- 🛠️ 修正：パスワードでサインインする --- */
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('ログインに失敗しました: ' + error.message);
      setLoading(false);
    } else {
      // ログイン成功！ダッシュボードへ
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center justify-center p-6">
      {/* ロゴエリア */}
      <div className="mb-12 text-center">
        <div className="bg-white p-4 rounded-[30px] shadow-2xl mb-4 inline-block animate-bounce-slow">
          <ShieldCheck size={64} className="text-[#003366]" strokeWidth={2.5} />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tighter italic">LIONS HUB</h1>
        <p className="text-blue-200/60 font-bold text-xs mt-2 uppercase tracking-widest">Digital Management System</p>
      </div>

      {/* ログインフォーム */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-5 pl-12 bg-white/10 border-2 border-white/10 rounded-[25px] text-white font-bold placeholder:text-white/30 outline-none focus:border-white/50 transition-all"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-5 pl-12 bg-white/10 border-2 border-white/10 rounded-[25px] text-white font-bold placeholder:text-white/30 outline-none focus:border-white/50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-white text-[#003366] rounded-[25px] font-black text-xl shadow-xl hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-[#003366]/30 border-t-[#003366] rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={24} strokeWidth={3} />
              ログイン
            </>
          )}
        </button>
      </form>

      {/* 案内メッセージ */}
      <p className="mt-8 text-white/40 text-[10px] font-bold text-center leading-relaxed">
        ※パスワードを忘れた方は事務局までお問い合わせください。<br />
        一度ログインすると一定期間保持されます。
      </p>
    </div>
  );
}