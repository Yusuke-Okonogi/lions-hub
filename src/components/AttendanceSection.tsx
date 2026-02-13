'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, HelpCircle, Loader2 } from 'lucide-react';

// 【ここがポイント】
// TypeScriptに「人数(count)も受け取りますよ」と教えてあげます
interface Props {
  eventId: string;
  userId: string;
  initialStatus?: string;
  attendanceCount: number; // 追加
  absenceCount: number;    // 追加
}

export default function AttendanceSection({ 
  eventId, 
  userId, 
  initialStatus,
  attendanceCount,
  absenceCount 
}: Props) {
  const [status, setStatus] = useState(initialStatus || 'pending');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newStatus: string) => {
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
      // 本来はここで画面全体を再読み込み(router.refresh)すると人数が最新になります
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
          className={`flex-1 py-4 rounded-2xl font-black flex flex-col items-center justify-center transition-all ${
            status === 'attendance' ? 'bg-green-600 text-white shadow-xl' : 'bg-green-50 text-green-700 border-2 border-green-200'
          }`}
        >
          <div className="text-sm opacity-80 mb-1">出席</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl">{attendanceCount}</span>
            <span className="text-sm">名</span>
          </div>
          <Check size={20} className="mt-1" />
        </button>

        {/* 欠席ボタン */}
        <button
          onClick={() => handleUpdate('absence')}
          disabled={isUpdating}
          className={`flex-1 py-4 rounded-2xl font-black flex flex-col items-center justify-center transition-all ${
            status === 'absence' ? 'bg-red-600 text-white shadow-xl' : 'bg-red-50 text-red-700 border-2 border-red-200'
          }`}
        >
          <div className="text-sm opacity-80 mb-1">欠席</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl">{absenceCount}</span>
            <span className="text-sm">名</span>
          </div>
          <X size={20} className="mt-1" />
        </button>

        {/* 保留ボタン */}
        <button
          onClick={() => handleUpdate('pending')}
          disabled={isUpdating}
          className={`w-20 py-4 rounded-2xl font-black flex flex-col items-center justify-center transition-all ${
            status === 'pending' ? 'bg-slate-600 text-white' : 'bg-slate-50 text-slate-400 border-2 border-slate-100'
          }`}
        >
          <div className="text-[10px] mb-1">保留</div>
          <HelpCircle size={24} />
        </button>
      </div>

      {isUpdating && (
        <p className="text-center text-blue-600 font-bold animate-pulse text-sm">
          回答を保存中...
        </p>
      )}
    </div>
  );
}