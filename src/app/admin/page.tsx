'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw, CheckCircle, XCircle, Users, Calendar, FileText, Upload,
  AlertCircle, Megaphone, UserCircle, ShieldCheck, UserPlus,
  MapPin, X, Camera // Cameraアイコンを追加
} from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<{[key: string]: string}>({});

  const fetchData = async () => {
    setLoading(true);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: eventData } = await supabase
      .from('events')
      .select(`*, attendance ( status, user_id, profiles (full_name, member_no) )`)
      .gte('start_time', yesterday) 
      .order('start_time', { ascending: true });
    
    const { data: memberData } = await supabase
      .from('profiles')
      .select('id, full_name, position_3yaku, email, member_no')
      .order('full_name', { ascending: true });

    setEvents(eventData || []);
    setMembers(memberData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 🛠️ 同期ロジック
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/sync-calendar');
      const data = await res.json();
      if (res.ok) {
        setSyncStatus({ type: 'success', message: `同期成功！${data.upserted}件取得` });
        await fetchData();
      } else {
        throw new Error(data.error || '同期エラー');
      }
    } catch (error: any) {
      setSyncStatus({ type: 'error', message: error.message });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 3000);
    }
  };

  // 🛠️ 出欠削除ロジック
  const handleDeleteAttendance = async (eventId: string, userId: string, fullName: string) => {
    if (!confirm(`L.${fullName} の出欠を取り消しますか？`)) return;
    try {
      const { error } = await supabase.from('attendance').delete().eq('event_id', eventId).eq('user_id', userId);
      if (error) throw error;
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendance: e.attendance.filter((a: any) => a.user_id !== userId) } : e));
    } catch (error: any) { alert(error.message); }
  };

  // 🛠️ 出欠代理入力ロジック
  const handleManualAttendance = async (eventId: string, status: 'attendance' | 'absence') => {
    const userId = selectedUserIds[eventId];
    if (!userId) return alert('会員を選択してください');
    try {
      const { error } = await supabase.from('attendance').upsert({ event_id: eventId, user_id: userId, status, updated_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' });
      if (error) throw error;
      const m = members.find(m => m.id === userId);
      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, attendance: [...(e.attendance || []), { user_id: userId, status, profiles: { full_name: m.full_name, member_no: m.member_no } }] } : e));
      setSelectedUserIds(prev => ({ ...prev, [eventId]: '' }));
    } catch (error: any) { alert(error.message); }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-20 text-[14px]"> {/* 🛠️ 最小14px */}
      <Header variant="admin" title="事務局管理" subtitle="システム管理・出欠代理入力" icon={ShieldCheck} isAdminBadge={true} rightButtonType="member" />

      <main className="px-4 md:px-6 space-y-6 max-w-4xl mx-auto">
        
        {/* --- 1. 管理メニュー (3カラム) --- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/admin/members" className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-3 hover:bg-blue-50 transition-all group shadow-sm">
            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors"><UserCircle size={24} /></div>
            <div className="min-w-0"><p className="text-lg font-black text-black leading-none">会員管理</p></div>
          </Link>
          <Link href="/admin/notices" className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-3 hover:bg-red-50 transition-all group shadow-sm">
            <div className="bg-red-100 p-2.5 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors"><Megaphone size={24} /></div>
            <div className="min-w-0"><p className="text-lg font-black text-black leading-none">お知らせ</p></div>
          </Link>
          <Link href="/gallery" className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-3 hover:bg-yellow-50 transition-all group shadow-sm col-span-2 md:col-span-1">
            <div className="bg-yellow-100 p-2.5 rounded-xl text-yellow-700 group-hover:bg-yellow-500 group-hover:text-white transition-colors"><Camera size={24} /></div>
            <div className="min-w-0"><p className="text-lg font-black text-black leading-none">写真館管理</p></div>
          </Link>
        </div>

        {/* --- 2. Googleカレンダー同期バー (復活！) --- */}
        <div className="bg-slate-900 p-4 rounded-[30px] shadow-lg flex items-center justify-between gap-4 border-b-4 border-slate-700">
          <div className="flex items-center gap-3 ml-2">
            <Calendar className="text-yellow-500" size={24} />
            <p className="font-black text-white">Googleカレンダー同期</p>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95 shadow-md ${
              isSyncing ? 'bg-slate-700 text-slate-400' : 'bg-yellow-500 text-slate-900 hover:bg-yellow-400'
            }`}
          >
            <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={18} strokeWidth={3} />
            {isSyncing ? '実行中' : '今すぐ同期'}
          </button>
        </div>

        {syncStatus && (
          <div className={`p-4 rounded-2xl text-center font-black ${syncStatus.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            {syncStatus.message}
          </div>
        )}

        {/* --- 3. 出欠確認リスト --- */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-black flex items-center gap-2 px-2 text-slate-700">
            <CheckCircle size={24} className="text-blue-900" /> 出欠代理入力
          </h2>

          {loading ? (
            <div className="bg-white p-20 rounded-[40px] text-center font-black text-slate-400 animate-pulse">読込中...</div>
          ) : events.map(event => {
            const unanswered = members.filter(m => !(event.attendance || []).some((a: any) => a.user_id === m.id));
            const cleanTitle = event.title.replace(/^【.*?】\s*/, '');
            const isActivity = event.title.includes('活動');

            return (
              <div key={event.id} className={`rounded-[40px] shadow-sm border-t-8 bg-white overflow-hidden border-slate-300`}>
                <div className="p-6 border-b border-slate-100">
                  <p className="text-slate-500 font-bold mb-1">{new Date(event.start_time).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">{cleanTitle}</h3>
                  {event.location && (
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 font-bold hover:underline"
                    >
                      <MapPin size={16} className="text-red-500" /> {event.location}
                    </a>
                  )}
                </div>

                {/* 代理入力 */}
                <div className="p-4 bg-yellow-50/50 border-b border-yellow-100 flex gap-2">
                  <select 
                    className="flex-1 p-3 rounded-2xl border-2 border-slate-200 font-black text-slate-900 outline-none focus:border-blue-900"
                    value={selectedUserIds[event.id] || ''}
                    onChange={(e) => setSelectedUserIds({...selectedUserIds, [event.id]: e.target.value})}
                  >
                    <option value="">未回答者を選択 ({unanswered.length}名) ▼</option>
                    {unanswered.map(m => <option key={m.id} value={m.id}>L.{m.full_name} {m.member_no ? `[No.${m.member_no}]` : ''}</option>)}
                  </select>
                  <button onClick={() => handleManualAttendance(event.id, 'attendance')} className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">出席</button>
                  <button onClick={() => handleManualAttendance(event.id, 'absence')} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all">欠席</button>
                </div>

                {/* 名前タグ */}
                <div className="p-6 grid grid-cols-2 gap-6 bg-slate-100/50"> {/* 背景をわずかに濃くして対比を強調 */}
  {['attendance', 'absence'].map(status => {
    const isAttendance = status === 'attendance';
    
    // 🎨 出欠状況に応じた配色設定（コントラスト重視）
    const theme = isAttendance 
      ? "bg-green-100/80 border-green-300 text-green-900 shadow-green-900/5 hover:bg-red-100 hover:text-red-700 hover:border-red-300"
      : "bg-red-100/80 border-red-300 text-red-900 shadow-red-900/5 hover:bg-slate-200 hover:text-slate-800 hover:border-slate-400";

    return (
      <div key={status} className="space-y-3">
        {/* ヘッダー部分も色を強調 */}
        <p className={`font-black pb-2 border-b-2 flex justify-between items-center ${isAttendance ? 'text-green-800 border-green-200' : 'text-red-800 border-red-200'}`}>
          <span className="text-sm">{isAttendance ? '出席' : '欠席'}</span>
          <span className="bg-white/80 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm border border-current/10">
            {(event.attendance || []).filter((a: any) => a.status === status).length}名
          </span>
        </p>

        <div className="flex flex-wrap gap-2">
          {(event.attendance || []).filter((a: any) => a.status === status).map((a: any) => (
            <button 
              key={a.user_id} 
              onClick={() => handleDeleteAttendance(event.id, a.user_id, a.profiles.full_name)}
              className={`
                ${theme} 
                border-2 px-3 py-1.5 rounded-2xl font-bold text-sm 
                flex items-center gap-2 transition-all group active:scale-90 shadow-sm
              `}
              title="クリックで削除"
            >
              {/* 会員No：薄すぎて見えなかったのを、読みやすい濃さに修正（opacity-70） */}
              <span className="opacity-70 text-[11px] font-black shrink-0">
                {a.profiles.member_no ? `No.${a.profiles.member_no}` : ''}
              </span>
              
              <span className="whitespace-nowrap">{a.profiles.full_name}</span>
              
              {/* 削除アイコン：ホバーした時だけクッキリ出す */}
              <X size={14} strokeWidth={3} className="opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      </div>
    );
  })}
</div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}