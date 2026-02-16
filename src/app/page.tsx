'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn } from 'lucide-react'; // ShieldCheckは独自デザインに変更するため削除

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('ログインに失敗しました: ' + error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#003366] flex flex-col items-center justify-center p-6">
      {/* 🚀 ロゴエリア：添付のデザインを再現 */}
      <div className="mb-12 text-center group">
        <div className="flex flex-col leading-none inline-block">
          <h1 className="text-5xl md:text-6xl font-[900] tracking-tighter uppercase flex items-baseline drop-shadow-lg">
            <span className="text-white">LIONS</span>
            <span className="text-yellow-400 ml-2">HUB</span>
          </h1>
          {/* 黄色のアンダーライン */}
          <div className="h-[5px] w-full bg-yellow-400 mt-2 rounded-full shadow-lg" />
        </div>
        <p className="text-blue-200/60 font-black text-xs mt-4 uppercase tracking-[0.2em] opacity-80">
          デジタルクラブシステム
        </p>
      </div>

      {/* ログインフォーム */}
      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <div className="relative">
          <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-5 pl-14 bg-white/10 border-2 border-white/10 rounded-[25px] text-white font-bold placeholder:text-white/30 outline-none focus:border-yellow-400/50 transition-all shadow-inner"
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-5 pl-14 bg-white/10 border-2 border-white/10 rounded-[25px] text-white font-bold placeholder:text-white/30 outline-none focus:border-yellow-400/50 transition-all shadow-inner"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-white text-[#003366] rounded-[25px] font-[900] text-xl shadow-2xl hover:bg-yellow-400 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 border-b-4 border-slate-300"
        >
          {loading ? (
            <div className="w-7 h-7 border-4 border-[#003366]/30 border-t-[#003366] rounded-full animate-spin" />
          ) : (
            <>
              <LogIn size={24} strokeWidth={3} />
              ログイン
            </>
          )}
        </button>
      </form>

      {/* 案内メッセージ */}
      <p className="mt-10 text-white/40 text-[11px] font-black text-center leading-relaxed max-w-[280px]">
        パスワードを忘れた方は事務局まで。<br />
        <span className="opacity-60 font-bold italic">Roppongi Lions Club Portal</span>
      </p>
    </div>
  );
}