'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Lock, X, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function PasswordSettingsModal({ onClose }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // バリデーション
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'パスワードは6文字以上で入力してください' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '新しいパスワードが一致しません' });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'パスワードを更新しました！' });
      
      // 成功したら2秒後に閉じる
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '更新に失敗しました' });
    } finally {
      setIsUpdating(true); // 成功時はボタンを無効化したままにする
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-[45px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-[#003366] p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"
          >
            <X size={24} strokeWidth={3} />
          </button>
          <div className="bg-yellow-400 w-12 h-12 rounded-2xl flex items-center justify-center text-[#003366] mb-4 shadow-lg">
            <Lock size={28} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl font-black tracking-tight">パスワード設定</h2>
          <p className="text-blue-200/60 text-sm font-bold mt-1 uppercase tracking-widest">Security Settings</p>
        </div>

        {/* フォーム */}
        <form onSubmit={handleUpdatePassword} className="p-8 space-y-6">
          
          {message && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="font-black text-sm">{message.text}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-black text-slate-600 mb-2 ml-1">
                <Key size={16} /> 新しいパスワード
              </label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:border-[#003366] outline-none transition-all text-base"
                placeholder="6文字以上で入力"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-black text-slate-600 mb-2 ml-1">
                <CheckCircle2 size={16} /> 確認用パスワード
              </label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:border-[#003366] outline-none transition-all text-base"
                placeholder="もう一度入力"
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isUpdating}
            className="w-full py-5 bg-[#003366] text-white rounded-[25px] font-black text-lg shadow-xl shadow-blue-900/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isUpdating ? '更新中...' : 'パスワードを確定する'}
          </button>

          {/* --- 🛠️ 忘れた場合の案内を追加 --- */}
          <div className="mt-8 p-5 bg-slate-50 rounded-[30px] border border-slate-200 border-dashed">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-500 font-bold leading-relaxed">
                <span className="text-slate-900">パスワードを忘れた場合</span><br />
                事務局側でパスワードを初期値（roppongi-lc）にリセットすることが可能です。お近くの管理者までご連絡ください。
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}