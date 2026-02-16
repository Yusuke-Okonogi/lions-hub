'use client';

import { useState, useEffect } from 'react';
import { BellRing, CheckCircle2 } from 'lucide-react';
import { requestAndSaveToken } from '@/lib/fcm';

export default function NotificationPrompt({ userId }: { userId: string }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const isAsked = localStorage.getItem('pwa_notification_asked');
    if (!isAsked) setShowPrompt(true);
  }, []);

  const handleEnable = async () => {
    const success = await requestAndSaveToken(userId);
    if (success) {
      setIsComplete(true);
      localStorage.setItem('pwa_notification_asked', 'true');
      setTimeout(() => setShowPrompt(false), 3000);
    } else {
      alert("通知の設定に失敗しました。スマホの設定を確認してください。");
    }
  };

  if (!showPrompt) return null;

  return (
    /* 🚀 PC表示対応：コンテンツ幅に合わせるためのレイアウト修正 */
    <div className="fixed inset-x-0 bottom-24 z-[150] px-4 flex justify-center pointer-events-none animate-bounce-in">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-[#003366] p-8 pointer-events-auto">
        {!isComplete ? (
          <div className="text-center">
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellRing size={40} className="text-[#003366]" />
            </div>
            <h3 className="text-xl font-black mb-2 text-black leading-tight">
              大事なお知らせを<br className="sm:hidden" />スマホに届けますか？
            </h3>
            <p className="text-slate-600 font-bold text-sm mb-6 leading-relaxed">
              例会の急な変更や、事務局からの<br className="sm:hidden" />大切な連絡が届くようになります。
            </p>
            {/* ボタンをPCでは横並びに、スマホでは縦並びに最適化 */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
              <button 
                onClick={handleEnable}
                className="w-full sm:w-auto sm:px-12 py-4 bg-[#003366] text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all"
              >
                はい、受け取ります
              </button>
              <button 
                onClick={() => setShowPrompt(false)}
                className="w-full sm:w-auto py-2 px-6 text-slate-400 font-bold text-sm hover:text-slate-600"
              >
                あとで設定する
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <CheckCircle2 size={60} className="text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-black text-black">設定が完了しました！</h3>
          </div>
        )}
      </div>
    </div>
  );
}