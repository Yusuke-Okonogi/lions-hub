'use client';

import { useState, useMemo } from 'react';
import { 
  isSameDay, isSameWeek, isSameMonth, addDays, subDays, 
  addWeeks, subWeeks, addMonths, subMonths,
  format, startOfWeek, endOfWeek 
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Users, FileText, Camera, MapPin, 
  Bell, X, Calendar as CalendarIcon, Settings, Lock, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import MonthCalendar from './MonthCalendar';
import AttendanceSection from './AttendanceSection';

export default function DashboardContent({ allEvents, userId, latestNotice, totalMemberCount }: any) {
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // モーダル管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // パスワード変更用のステート
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  /* --- 🛠️ 1. フィルタリングロジックの修正（ここが重要！） --- */
  const displayEvents = useMemo(() => {
    return allEvents.filter((event: any) => {
      const eventDate = new Date(event.start_time);
      
      // カレンダーで特定の日付をタップしている時（最優先）
      if (selectedDate) return isSameDay(eventDate, selectedDate);
      
      // ビューごとのフィルタ
      if (view === 'day') return isSameDay(eventDate, baseDate);
      if (view === 'week') return isSameWeek(eventDate, baseDate, { locale: ja });
      if (view === 'month') return isSameMonth(eventDate, baseDate); // 🛠️ 月表示ならその月のみ！
      
      return false; // それ以外は表示しない
    });
  }, [allEvents, selectedDate, baseDate, view]);

  /* --- 🛠️ 2. 「今日」が表示範囲に含まれているか判定 --- */
  const isTodayInRange = useMemo(() => {
    const today = new Date();
    if (view === 'day') return isSameDay(today, baseDate);
    if (view === 'week') return isSameWeek(today, baseDate, { locale: ja });
    if (view === 'month') return isSameMonth(today, baseDate);
    return false;
  }, [baseDate, view]);

  const resetToday = () => { 
    setBaseDate(new Date()); 
    setSelectedDate(null); 
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) return alert('パスワードは6文字以上で入力してください');
    if (newPassword !== confirmPassword) return alert('パスワードが一致しません');
    setIsUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      alert('エラー: ' + error.message);
    } else {
      alert('パスワードを更新しました！');
      setIsSettingsOpen(false);
      setNewPassword(''); setConfirmPassword('');
    }
    setIsUpdating(false);
  };

  return (
    <main className="space-y-4">
      {/* お知らせセクション */}
      {latestNotice && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`w-full flex items-center gap-4 p-5 rounded-[30px] shadow-xl border-l-[12px] transition-all active:scale-95 border-b-4 ${
            latestNotice.is_important ? 'bg-red-50 border-red-600 border-b-red-800/20' : 'bg-blue-50 border-blue-500 border-b-blue-800/20'
          }`}
        >
          <div className={`p-3 rounded-2xl shadow-sm ${latestNotice.is_important ? 'bg-white text-red-600' : 'bg-white text-blue-600'}`}>
            <Bell size={28} strokeWidth={3} className={latestNotice.is_important ? "animate-bounce" : ""} />
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <div className="flex items-center gap-2 mb-1 text-sm font-black">
              <span className={latestNotice.is_important ? 'text-red-700' : 'text-blue-700'}>{format(new Date(latestNotice.created_at), 'yyyy.MM.dd')}</span>
              {latestNotice.is_important && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-md">重要</span>}
            </div>
            <p className="text-xl font-black truncate text-slate-900">{latestNotice.title}</p>
          </div>
          <ChevronRight size={24} className="text-slate-300" />
        </button>
      )}

      {/* メニューボタン */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/members" className="bg-white px-5 py-4 rounded-[25px] shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-all font-black text-lg text-slate-800">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-900"><Users size={24} strokeWidth={3} /></div> 会員名簿
        </Link>
        <Link href="/gallery" className="bg-white px-5 py-4 rounded-[25px] shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-all font-black text-lg text-slate-800">
          <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><Camera size={24} strokeWidth={3} /></div> 写真館
        </Link>
      </div>

      {/* ビュー切り替えタブ */}
      <div className="flex bg-white/60 p-1.5 rounded-[25px] shadow-inner border border-slate-200">
        {['day', 'week', 'month'].map((id) => (
          <button key={id} onClick={() => { setView(id as any); setSelectedDate(null); }} className={`flex-1 py-2.5 rounded-[20px] font-black text-sm transition-all ${view === id ? 'bg-[#003366] text-white shadow-md' : 'text-slate-400'}`}>
            {id === 'day' ? '日' : id === 'week' ? '週' : '月'}
          </button>
        ))}
      </div>

      {/* カレンダーヘッダー */}
      <div className="pt-2">
        <div className="flex justify-between items-center mb-6 bg-white p-3 rounded-3xl shadow-sm border border-slate-100">
          <button onClick={() => setBaseDate(view === 'day' ? subDays(baseDate, 1) : view === 'week' ? subWeeks(baseDate, 1) : subMonths(baseDate, 1))} className="p-2 text-blue-900 active:scale-90"><ChevronLeft size={28} strokeWidth={3} /></button>
          
          <div className="flex flex-col items-center gap-1 flex-1 px-2">
            <div className="text-lg font-black text-slate-900">
              {view === 'day' ? format(baseDate, 'M/d (eee)', { locale: ja }) : 
               view === 'week' ? `${format(startOfWeek(baseDate), 'M/d')} - ${format(endOfWeek(baseDate), 'M/d')}` :
               format(baseDate, 'yyyy年 M月', { locale: ja })}
            </div>

            {/* 🛠️ 日本語化 ＆ わかりやすいボタン化 */}
            <div className="h-8">
              {isTodayInRange ? (
                <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-[11px] font-black tracking-widest flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                  本日を表示中
                </div>
              ) : (
                <button 
                  onClick={resetToday} 
                  className="bg-[#003366] text-white px-4 py-1 rounded-full text-[11px] font-black shadow-md shadow-blue-900/20 flex items-center gap-1.5 hover:bg-blue-800 active:scale-95 transition-all"
                >
                  <RefreshCw size={12} strokeWidth={3} />
                  今日へ戻る
                </button>
              )}
            </div>
          </div>

          <button onClick={() => setBaseDate(view === 'day' ? addDays(baseDate, 1) : view === 'week' ? addWeeks(baseDate, 1) : addMonths(baseDate, 1))} className="p-2 text-blue-900 active:scale-90"><ChevronRight size={28} strokeWidth={3} /></button>
        </div>

        {view === 'month' && (
          <div className="mb-6">
            <MonthCalendar baseDate={baseDate} events={allEvents} onDateSelect={(date: Date) => setSelectedDate(date)} onMonthChange={(date: Date) => setBaseDate(date)} />
          </div>
        )}

        {/* 予定リスト */}
        <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <p className="text-sm font-black text-slate-500 flex items-center gap-2">
              <CalendarIcon size={16} /> 
              {selectedDate ? `${format(selectedDate, 'M/d')} の予定` : 
               view === 'month' ? `${format(baseDate, 'M月')} の予定一覧` : '表示範囲の予定'}
            </p>
            {selectedDate && (
              <button onClick={() => setSelectedDate(null)} className="text-[10px] font-black text-blue-600 underline">月間一覧に戻る</button>
            )}
          </div>

          {displayEvents.length > 0 ? displayEvents.map((event: any) => {
            const isActivity = event.title.startsWith('【活動】');
            const isEvent = event.title.startsWith('【イベント】');
            const cleanTitle = event.title.replace(/^【.*?】\s*/, '');
            const attendanceCount = event.attendance?.filter((a: any) => a.status === 'attendance').length || 0;
            const absenceCount = event.attendance?.filter((a: any) => a.status === 'absence').length || 0;

            return (
              <div key={event.id} className={`rounded-[35px] p-5 shadow-lg border-t-8 transition-all active:scale-[0.98] ${isActivity ? 'bg-blue-50/60 border-[#003366]' : isEvent ? 'bg-emerald-50/70 border-emerald-500' : 'bg-white border-slate-300'}`}>
                <div className="flex items-center justify-between mb-3 text-sm font-black">
                  <div className={isActivity ? 'text-blue-900' : isEvent ? 'text-emerald-900' : 'text-slate-500'}>
                    {format(new Date(event.start_time), 'MM.dd(eee) HH:mm', { locale: ja })}
                  </div>
                  <div className="bg-white/50 px-3 py-1 rounded-full border border-slate-200 shadow-sm text-xs">
                    回答: <span className="text-blue-700">{attendanceCount + absenceCount}</span>/{totalMemberCount}
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-4">{cleanTitle}</h3>
                {event.location && (
                  <a href={`http://googleusercontent.com/maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2.5 rounded-xl mb-4 font-bold text-sm bg-slate-50 text-slate-600 w-fit border border-slate-100">
                    <MapPin size={14} className="text-red-500" /> <span className="underline">{event.location}</span>
                  </a>
                )}
                <AttendanceSection eventId={event.id} userId={userId} initialStatus={event.attendance?.find((a: any) => a.user_id === userId)?.status} attendanceCount={attendanceCount} absenceCount={absenceCount} />
              </div>
            );
          }) : (
            <div className="text-center py-12 bg-white/40 rounded-[35px] border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold text-sm">表示範囲に予定はありません 🦁</p>
            </div>
          )}
        </div>
      </div>

      {/* パスワード変更モーダル (省略なし) */}
      {isSettingsOpen && (
        <div onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-md rounded-[45px] p-8 shadow-2xl relative">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900"><X size={28} strokeWidth={3} /></button>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
              <div className="bg-slate-900 p-2 rounded-xl text-white"><Lock size={24} /></div> パスワード変更
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 ml-1 uppercase tracking-wider">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:border-slate-900 outline-none" placeholder="新しいパスワード" />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 ml-1 uppercase tracking-wider">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:border-slate-900 outline-none" placeholder="確認のため再入力" />
              </div>
              <button onClick={handleUpdatePassword} disabled={isUpdating} className="w-full py-5 bg-slate-900 text-white rounded-[30px] font-black text-xl shadow-xl active:scale-95 disabled:opacity-50">
                {isUpdating ? '更新中...' : 'パスワードを確定する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}