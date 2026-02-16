'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  RefreshCw, CheckCircle, Users, Calendar, FileText, Upload,
  Megaphone, UserCircle, ShieldCheck, MapPin, X, Camera,
  Eye, EyeOff, Trash2, Loader2, Plus
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
  
  const [showPastEvents, setShowPastEvents] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: eventData } = await supabase
      .from('events')
      .select(`*, attendance ( status, user_id, profiles (full_name, member_no) )`)
      .gte('start_time', oneMonthAgo) 
      .order('start_time', { ascending: true }); // 古い順
    
    const { data: memberData } = await supabase
      .from('profiles')
      .select('id, full_name, position_3yaku, email, member_no')
      .order('full_name', { ascending: true });

    setEvents(eventData || []);
    setMembers(memberData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredEvents = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    if (showPastEvents) return events;
    return events.filter(e => new Date(e.start_time) >= todayStart);
  }, [events, showPastEvents]);

  const handleFileUpload = async (event: any, file: File) => {
    if (!file) return;
    setUploadingId(event.id);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${event.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `event_docs/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath);
      const currentUrls = Array.isArray(event.attachment_urls) ? event.attachment_urls : [];
      const newUrls = [...currentUrls, publicUrl];
      const { error: updateError } = await supabase.from('events').update({ attachment_urls: newUrls }).eq('id', event.id);
      if (updateError) throw updateError;
      await fetchData(true);
    } catch (error: any) {
      alert('アップロード失敗: ' + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleRemoveFile = async (event: any, urlToRemove: string) => {
    if (!confirm('この資料を削除しますか？')) return;
    try {
      const newUrls = (event.attachment_urls || []).filter((url: string) => url !== urlToRemove);
      const { error } = await supabase.from('events').update({ attachment_urls: newUrls }).eq('id', event.id);
      if (error) throw error;
      await fetchData(true);
    } catch (error: any) { alert('削除失敗: ' + error.message); }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/sync-calendar');
      const data = await res.json();
      if (res.ok) {
        setSyncStatus({ type: 'success', message: `同期成功！${data.upserted}件取得` });
        await fetchData(true);
      } else { throw new Error(data.error || '同期エラー'); }
    } catch (error: any) { setSyncStatus({ type: 'error', message: error.message }); }
    finally { setIsSyncing(false); setTimeout(() => setSyncStatus(null), 3000); }
  };

  const handleDeleteAttendance = async (eventId: string, userId: string, fullName: string) => {
    if (!confirm(`L.${fullName} の出欠を取り消しますか？`)) return;
    const { error } = await supabase.from('attendance').delete().eq('event_id', eventId).eq('user_id', userId);
    if (!error) await fetchData(true);
  };

  const handleManualAttendance = async (eventId: string, status: 'attendance' | 'absence') => {
    const userId = selectedUserIds[eventId];
    if (!userId) return alert('会員を選択してください');
    const { error } = await supabase.from('attendance').upsert({ 
      event_id: eventId, user_id: userId, status, updated_at: new Date().toISOString() 
    }, { onConflict: 'event_id,user_id' });
    if (!error) {
      setSelectedUserIds(prev => ({ ...prev, [eventId]: '' }));
      await fetchData(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-20 text-[14px]">
      <Header variant="admin" title="事務局管理" subtitle="資料管理・出欠代理入力" icon={ShieldCheck} isAdminBadge={true} rightButtonType="member" />

      <main className="px-4 md:px-6 space-y-6 max-w-4xl mx-auto">
        
        {/* 管理メニュー */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Link href="/admin/members" className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-3 hover:bg-blue-50 transition-all group shadow-sm">
            <div className="bg-blue-100 p-2.5 rounded-xl text-blue-900 group-hover:bg-blue-900 group-hover:text-white transition-colors"><UserCircle size={24} /></div>
            <p className="text-lg font-black text-black">会員管理</p>
          </Link>
          <Link href="/admin/notices" className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-3 hover:bg-red-50 transition-all group shadow-sm">
            <div className="bg-red-100 p-2.5 rounded-xl text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors"><Megaphone size={24} /></div>
            <p className="text-lg font-black text-black">お知らせ</p>
          </Link>
          <Link href="/gallery" className="bg-white p-4 rounded-3xl border border-slate-200 flex items-center gap-3 hover:bg-yellow-50 transition-all group shadow-sm col-span-2 md:col-span-1">
            <div className="bg-yellow-100 p-2.5 rounded-xl text-yellow-700 group-hover:bg-yellow-500 group-hover:text-white transition-colors"><Camera size={24} /></div>
            <p className="text-lg font-black text-black">写真館管理</p>
          </Link>
        </div>

        {/* --- 同期バー --- */}
        <div className="bg-slate-900 p-4 rounded-[30px] shadow-lg flex items-center justify-between gap-4 border-b-4 border-slate-700">
          <div className="flex items-center gap-3 ml-2 text-white font-black">
            <Calendar className="text-yellow-500" size={24} />
            Google同期
          </div>
          <button 
            onClick={handleSync} 
            disabled={isSyncing} 
            className="px-6 py-3 rounded-2xl font-black bg-yellow-500 text-slate-900 active:scale-95 shadow-md disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={18} />
              <span>{isSyncing ? '同期中...' : '同期'}</span>
            </div>
          </button>
        </div>

        {/* 🚀 追加：同期ステータス・取得件数の表示エリア */}
        {syncStatus && (
          <div className={`mt-2 p-4 rounded-2xl font-[900] text-center shadow-lg animate-in fade-in slide-in-from-top-2 duration-300 ${
            syncStatus.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {syncStatus.type === 'success' && <CheckCircle className="inline-block mr-2" size={18} />}
            {syncStatus.message}
          </div>
        )}

        {/* 出欠代理入力ヘッダー */}
        <div className="flex justify-between items-center px-2 pt-4">
          <h2 className="text-xl font-black flex items-center gap-2 text-slate-700">
            <CheckCircle size={24} className="text-blue-900" /> 出欠代理入力
          </h2>
          <button 
            onClick={() => setShowPastEvents(!showPastEvents)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs transition-all shadow-sm border ${
              showPastEvents ? 'bg-slate-800 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {showPastEvents ? <Eye size={16} /> : <EyeOff size={16} />}
            過去の予定を{showPastEvents ? '隠す' : '表示する'}
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="bg-white p-20 rounded-[40px] text-center font-black text-slate-400">読込中...</div>
          ) : filteredEvents.map(event => {
            const unanswered = members.filter(m => !(event.attendance || []).some((a: any) => a.user_id === m.id));
            const isPast = new Date(event.start_time) < new Date(new Date().setHours(0,0,0,0));

            return (
              <div key={event.id} className={`rounded-[40px] shadow-sm border-t-8 bg-white overflow-hidden transition-all ${isPast ? 'border-slate-300 opacity-80' : 'border-blue-900 shadow-blue-900/10'}`}>
                <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {isPast && <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-black">終了</span>}
                      <p className="text-slate-500 font-bold">
                        {new Date(event.start_time).toLocaleString('ja-JP', { 
                          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2 truncate">{event.title.replace(/^【.*?】\s*/, '')}</h3>
                  </div>

                  <div className="flex flex-col items-end gap-3 ml-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {(event.attachment_urls || []).map((url: string, index: number) => (
                        <div key={url} className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                          <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-xl font-black text-[10px]">
                            <FileText size={12} /> 資料{index + 1}
                          </a>
                          <button onClick={() => handleRemoveFile(event, url)} className="p-1 text-slate-400 hover:text-red-600">
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className={`cursor-pointer flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-2xl font-black text-xs border-2 border-dashed border-blue-200 hover:bg-blue-100 transition-all ${uploadingId === event.id ? 'opacity-50' : ''}`}>
                      {uploadingId === event.id ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      資料を追加
                      <input type="file" className="hidden" accept="application/pdf,image/*" onChange={(e) => e.target.files?.[0] && handleFileUpload(event, e.target.files[0])} disabled={uploadingId !== null} />
                    </label>
                  </div>
                </div>

                {/* 🛠️ 代理入力エリア：ドロップダウンの文字色をハッキリ修正 */}
                <div className="p-4 bg-yellow-50/50 border-b border-yellow-100 flex gap-2">
                  <select 
                    className="flex-1 p-3 rounded-2xl border-2 border-slate-300 font-black text-black outline-none focus:border-blue-900 bg-white shadow-sm"
                    value={selectedUserIds[event.id] || ''}
                    onChange={(e) => setSelectedUserIds({...selectedUserIds, [event.id]: e.target.value})}
                    style={{ color: 'black' }} // インラインでも強制
                  >
                    <option value="" className="text-black bg-white">未回答を選択 ({unanswered.length}名) ▼</option>
                    {unanswered.map(m => (
                      <option key={m.id} value={m.id} className="text-black bg-white py-2">
                        L.{m.full_name}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => handleManualAttendance(event.id, 'attendance')} className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black active:scale-95 transition-all">出席</button>
                  <button onClick={() => handleManualAttendance(event.id, 'absence')} className="px-6 py-3 bg-red-600 text-white rounded-2xl font-black active:scale-95 transition-all">欠席</button>
                </div>

                {/* 出欠リスト */}
                <div className="p-6 grid grid-cols-2 gap-6 bg-slate-100/30">
                  {['attendance', 'absence'].map(status => (
                    <div key={status} className="space-y-3">
                      <p className={`font-black pb-2 border-b-2 flex justify-between items-center ${status === 'attendance' ? 'text-green-800 border-green-200' : 'text-red-800 border-red-200'}`}>
                        <span className="text-sm">{status === 'attendance' ? '出席者' : '欠席者'}</span>
                        <span className="bg-white/80 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                          {(event.attendance || []).filter((a: any) => a.status === status).length}名
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(event.attendance || []).filter((a: any) => a.status === status).map((a: any) => (
                          <button key={a.user_id} onClick={() => handleDeleteAttendance(event.id, a.user_id, a.profiles.full_name)} className={`border-2 px-3 py-1.5 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all group shadow-sm ${status === 'attendance' ? 'bg-green-100 border-green-300 text-green-900' : 'bg-red-100 border-red-300 text-red-900'}`}>
                            <span className="opacity-70 text-[11px] font-black shrink-0">{a.profiles.member_no ? `No.${a.profiles.member_no}` : ''}</span>
                            <span className="whitespace-nowrap">{a.profiles.full_name}</span>
                            <X size={14} strokeWidth={3} className="opacity-0 group-hover:opacity-100" />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}