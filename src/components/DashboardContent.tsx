'use client';

import { useState, useMemo } from 'react';
import { 
  isSameDay, isSameWeek, isSameMonth, addDays, subDays, 
  addWeeks, subWeeks, addMonths, subMonths,
  format, startOfWeek, endOfWeek, isValid
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  ChevronLeft, ChevronRight, Users, FileText, Camera, MapPin, 
  Bell, X, Calendar as CalendarIcon, Settings, Lock, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import MonthCalendar from './MonthCalendar';
import AttendanceSection from './AttendanceSection';

export default function DashboardContent({ allEvents, userId, allNotices = [], totalMemberCount }: any) {
  const router = useRouter();
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [baseDate, setBaseDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // モーダル管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<any>(null); // 🛠️ 選択された通知

  // パスワード変更ステート
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 🛠️ 安全な日付フォーマット（エラー防止の要）
  const safeFormat = (dateInput: any, formatStr: string) => {
    if (!dateInput) return '日付未定';
    const date = new Date(dateInput);
    if (!isValid(date)) return '日付不正';
    return format(date, formatStr, { locale: ja });
  };
  
  /* --- フィルタリングロジック --- */
  const displayEvents = useMemo(() => {
    return (allEvents || []).filter((event: any) => {
      const eventDate = new Date(event.start_time);
      if (!isValid(eventDate)) return false;
      if (selectedDate) return isSameDay(eventDate, selectedDate);
      if (view === 'day') return isSameDay(eventDate, baseDate);
      if (view === 'week') return isSameWeek(eventDate, baseDate, { locale: ja });
      if (view === 'month') return isSameMonth(eventDate, baseDate);
      return false;
    });
  }, [allEvents, selectedDate, baseDate, view]);

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
      {/* 🛠️ 1. お知らせセクション（ループ処理に修正） */}
      <div className="space-y-3">
        {allNotices && allNotices.map((notice: any) => (
          <button 
            key={notice.id}
            onClick={() => {
              setSelectedNotice(notice);
              setIsModalOpen(true);
            }}
            className={`w-full flex items-center gap-4 p-5 rounded-[30px] shadow-xl border-l-[12px] transition-all active:scale-95 border-b-4 ${
              notice.is_important ? 'bg-red-50 border-red-600 border-b-red-800/20' : 'bg-blue-50 border-[#003366] border-b-blue-800/20'
            }`}
          >
            <div className={`p-3 rounded-2xl shadow-sm ${notice.is_important ? 'bg-white text-red-600' : 'bg-white text-[#003366]'}`}>
              <Bell size={24} strokeWidth={3} className={notice.is_important ? "animate-bounce" : ""} />
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <div className="flex items-center gap-2 mb-1 text-[11px] font-black uppercase tracking-tighter">
                <span className={notice.is_important ? 'text-red-700' : 'text-[#003366]'}>
                  {safeFormat(notice.created_at, 'yyyy.MM.dd')}
                </span>
                {notice.target_user_id && <span className="bg-[#003366] text-white px-1.5 py-0.5 rounded text-[9px]">あなた宛</span>}
                {notice.is_important && <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[9px]">重要</span>}
              </div>
              <p className="text-lg font-black truncate text-slate-900 leading-tight">{notice.title}</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 shrink-0" />
          </button>
        ))}
      </div>

      {/* 2. メニューボタン */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/members" className="bg-white px-5 py-4 rounded-[25px] shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-all font-black text-lg text-slate-800">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-900"><Users size={24} strokeWidth={3} /></div> 会員名簿
        </Link>
        <Link href="/gallery" className="bg-white px-5 py-4 rounded-[25px] shadow-sm border border-slate-100 flex items-center gap-3 active:scale-95 transition-all font-black text-lg text-slate-800">
          <div className="bg-yellow-100 p-2 rounded-xl text-yellow-600"><Camera size={24} strokeWidth={3} /></div> 写真館
        </Link>
      </div>
      
      {/* 3. ビュー切り替えタブ */}
      <div className="flex bg-white/60 p-1.5 rounded-[25px] shadow-inner border border-slate-200">
        {['day', 'week', 'month'].map((id) => (
          <button key={id} onClick={() => { setView(id as any); setSelectedDate(null); }} className={`flex-1 py-2.5 rounded-[20px] font-black text-sm transition-all ${view === id ? 'bg-[#003366] text-white shadow-md' : 'text-slate-400'}`}>
            {id === 'day' ? '日' : id === 'week' ? '週' : '月'}
          </button>
        ))}
      </div>

      {/* 4. カレンダーヘッダー */}
      <div className="pt-2">
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
          <button onClick={() => setBaseDate(view === 'day' ? subDays(baseDate, 1) : view === 'week' ? subWeeks(baseDate, 1) : subMonths(baseDate, 1))} className="p-2 text-blue-900 active:scale-90"><ChevronLeft size={32} strokeWidth={4} /></button>
          
          <div className="flex flex-col items-center gap-1 flex-1 px-2">
            <div className="text-2xl font-black text-slate-900 tracking-tighter">
              {view === 'day' ? safeFormat(baseDate, 'M/d (eee)') : 
               view === 'week' ? `${safeFormat(startOfWeek(baseDate), 'M/d')} - ${safeFormat(endOfWeek(baseDate), 'M/d')}` :
               safeFormat(baseDate, 'yyyy年 M月')}
            </div>
            <div className="h-8">
              {!isTodayInRange && (
                <button onClick={resetToday} className="bg-[#003366] text-white px-4 py-1 rounded-full text-[12px] font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all">
                  <RefreshCw size={14} strokeWidth={3} /> 今日へ戻る
                </button>
              )}
            </div>
          </div>
          <button onClick={() => setBaseDate(view === 'day' ? addDays(baseDate, 1) : view === 'week' ? addWeeks(baseDate, 1) : addMonths(baseDate, 1))} className="p-2 text-blue-900 active:scale-90"><ChevronRight size={32} strokeWidth={4} /></button>
        </div>

        {view === 'month' && (
          <div className="mb-6">
            <MonthCalendar baseDate={baseDate} events={allEvents} onDateSelect={(date: Date) => setSelectedDate(date)} onMonthChange={(date: Date) => setBaseDate(date)} />
          </div>
        )}

        {/* 5. 予定リスト */}
        <div className="space-y-4">
          {displayEvents.length > 0 ? displayEvents.map((event: any) => {
            const isActivity = event.title.startsWith('【活動】');
            const isEvent = event.title.startsWith('【イベント】');
            const cleanTitle = event.title.replace(/^【.*?】\s*/, '');
            const attendanceCount = event.attendance?.filter((a: any) => a.status === 'attendance').length || 0;
            const absenceCount = event.attendance?.filter((a: any) => a.status === 'absence').length || 0;

            return (
              <div key={event.id} className={`rounded-[35px] p-6 shadow-lg border-t-8 transition-all active:scale-[0.98] ${isActivity ? 'bg-blue-50/60 border-[#003366]' : isEvent ? 'bg-emerald-50/70 border-emerald-500' : 'bg-white border-slate-300'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-xl font-black ${isActivity ? 'text-blue-900' : isEvent ? 'text-emerald-900' : 'text-slate-600'}`}>
                    {safeFormat(event.start_time, 'MM.dd(eee) HH:mm')}
                  </div>
                  <div className="bg-slate-800 text-white px-3 py-1.5 rounded-xl shadow-md text-sm font-black flex items-center gap-1.5">
                    <Users size={14} strokeWidth={3} />回答: {attendanceCount + absenceCount}/{totalMemberCount}
                  </div>
                </div>

                <h3 className="text-2xl font-black text-slate-900 mb-5 leading-tight">{cleanTitle}</h3>
                
                {/* 🛠️ 資料表示：ネイビーのボタンに統一 */}
                {event.attachment_urls && event.attachment_urls.length > 0 && (
                  <div className="space-y-3 mb-5">
                    {event.attachment_urls.map((url: string, index: number) => (
                      <a 
                        key={url}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center gap-3 w-full py-4 bg-[#003366] text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all border-b-4 border-slate-900"
                      >
                        <FileText size={24} />
                        資料 {index + 1} を確認
                      </a>
                    ))}
                  </div>
                )}

                {event.location && (
                  <a href={`http://googleusercontent.com/maps.google.com/?q=${encodeURIComponent(event.location)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 rounded-2xl mb-5 font-bold text-base bg-white shadow-sm border border-slate-100 text-slate-700 w-full md:w-fit">
                    <MapPin size={18} className="text-red-500" strokeWidth={3} /> <span className="underline underline-offset-4 decoration-2">{event.location}</span>
                  </a>
                )}
                
                <AttendanceSection eventId={event.id} userId={userId} initialStatus={event.attendance?.find((a: any) => a.user_id === userId)?.status} attendanceCount={attendanceCount} absenceCount={absenceCount} onStatusChange={() => router.refresh()} />
              </div>
            );
          }) : (
            <div className="text-center py-16 bg-white/40 rounded-[35px] border-2 border-dashed border-slate-300">
              <p className="text-slate-500 font-black text-lg">表示範囲に予定はありません 🦁</p>
            </div>
          )}
        </div>
      </div>

      {/* 🛠️ 6. お知らせモーダル本体（selectedNotice を使用） */}
      {isModalOpen && selectedNotice && (
        <div onClick={() => { setIsModalOpen(false); setSelectedNotice(null); }} className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-lg rounded-[50px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className={`${selectedNotice.is_important ? 'bg-red-600' : 'bg-[#003366]'} p-8 text-white relative`}>
              <button 
                onClick={() => { setIsModalOpen(false); setSelectedNotice(null); }} 
                className="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-white/20 rounded-full hover:bg-white/40 transition-all active:scale-90 z-50"
              >
                <X size={28} strokeWidth={4} className="pointer-events-none" />
              </button>
              <p className="text-sm font-bold opacity-80 mb-2">{safeFormat(selectedNotice.created_at, 'yyyy年MM月dd日')}</p>
              <h2 className="text-3xl font-black leading-tight pr-10">{selectedNotice.title}</h2>
            </div>
            <div className="p-8 max-h-[50vh] overflow-y-auto font-medium text-lg text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNotice.content}</div>
            <div className="p-6">
              {selectedNotice.pdf_url && (
                <a href={selectedNotice.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-4 bg-[#003366] text-white rounded-2xl font-black text-lg shadow-lg active:scale-95 transition-all mb-4 border-b-4 border-slate-900">
                  <FileText size={24} /> 添付資料を確認する
                </a>
              )}
              <button onClick={() => { setIsModalOpen(false); setSelectedNotice(null); }} className="w-full py-5 bg-slate-900 text-white rounded-[30px] font-black text-xl shadow-lg active:scale-95 transition-all">閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* 7. パスワード変更モーダル */}
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
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all" placeholder="新しいパスワード" />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-600 mb-2 ml-1 uppercase tracking-wider">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-900 outline-none border-2 border-transparent focus:border-slate-900 transition-all" placeholder="再入力" />
              </div>
              <button onClick={handleUpdatePassword} disabled={isUpdating} className="w-full py-5 bg-slate-900 text-white rounded-[30px] font-black text-xl shadow-xl active:scale-95 transition-all disabled:opacity-50">
                {isUpdating ? '更新中...' : 'パスワードを確定する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}