'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, HelpCircle, Loader2 } from 'lucide-react';

interface Props {
  eventId: string;
  userId: string;
  initialStatus?: string;
  attendanceCount: number;
  absenceCount: number;
  onStatusChange?: () => void; // 🛠️ 合図を受け取るためのプロパティを追加
}

export default function AttendanceSection({ 
  eventId, 
  userId, 
  initialStatus,
  attendanceCount,
  absenceCount,
  onStatusChange // 🛠️ 受け取る
}: Props) {
  const [status, setStatus] = useState(initialStatus || 'pending');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newStatus: string) => {
    // 同じステータスを連打した場合は何もしない
    if (newStatus === status && status !== 'pending') return;

    setIsUpdating(true);
    const { error } = await supabase
      .from('attendance')
      .upsert({
        event_id: eventId,
        user_id: userId,
        status: newStatus,
        updated_at: new Date().toISOString()
      }, { onConflict: 'event_id,user_id' });

    if (!error) {
      setStatus(newStatus);
      // 🛠️ 保存が成功したら、親画面に「データが変わったよ！」と伝えて再読み込みさせる
      if (onStatusChange) {
        onStatusChange();
      }
    } else {
      alert('エラーが発生しました。もう一度お試しください。');
    }
    setIsUpdating(false);
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex gap-2">
        {/* 出席ボタン */}
        <button
          onClick={() => handleUpdate('attendance')}
          disabled={isUpdating}
          className={`flex-1 py-4 rounded-2xl font-black flex flex-col items-center justify-center transition-all active:scale-95 ${
            status === 'attendance' 
              ? 'bg-green-600 text-white shadow-lg shadow-green-900/20' 
              : 'bg-green-50 text-green-700 border-2 border-green-200'
          }`}
        >
          <div className="text-xs font-bold opacity-90 mb-1">出席</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl">{attendanceCount}</span>
            <span className="text-sm">名</span>
          </div>
          <Check size={20} strokeWidth={4} className="mt-1" />
        </button>

        {/* 欠席ボタン */}
        <button
          onClick={() => handleUpdate('absence')}
          disabled={isUpdating}
          className={`flex-1 py-4 rounded-2xl font-black flex flex-col items-center justify-center transition-all active:scale-95 ${
            status === 'absence' 
              ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
              : 'bg-red-50 text-red-700 border-2 border-red-200'
          }`}
        >
          <div className="text-xs font-bold opacity-90 mb-1">欠席</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl">{absenceCount}</span>
            <span className="text-sm">名</span>
          </div>
          <X size={20} strokeWidth={4} className="mt-1" />
        </button>

        {/* 保留ボタン */}
        <button
          onClick={() => handleUpdate('pending')}
          disabled={isUpdating}
          className={`w-20 py-4 rounded-2xl font-black flex flex-col items-center justify-center transition-all active:scale-95 ${
            status === 'pending' 
              ? 'bg-slate-700 text-white shadow-lg' 
              : 'bg-slate-50 text-slate-400 border-2 border-slate-200'
          }`}
        >
          <div className="text-[10px] mb-1 font-bold">保留</div>
          <HelpCircle size={24} strokeWidth={3} />
        </button>
      </div>

      {isUpdating && (
        <div className="flex items-center justify-center gap-2 text-blue-600 font-black animate-pulse">
          <Loader2 size={16} className="animate-spin" />
          <p className="text-sm">回答を保存中...</p>
        </div>
      )}
    </div>
  );
}