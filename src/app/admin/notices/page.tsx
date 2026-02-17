'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Bell, Send, Trash2, Megaphone, Edit3, X, Calendar, 
  Plus, FileText, Upload, Users, Loader2, BellRing 
} from 'lucide-react';
import Header from '@/components/Header';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- モーダル & フォーム管理ステート ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false); // 🚀 追加：プッシュ通知フラグ
  const [expiresAt, setExpiresAt] = useState('');
  const [targetUserId, setTargetUserId] = useState<string>(''); 
  const [pdfUrl, setPdfUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isSending, setIsSending] = useState(false); // 🚀 追加：送信中状態

  useEffect(() => { 
    const init = async () => {
      await fetchMembers();
      await fetchNotices();
    };
    init();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notices')
      .select('*')
      .order('created_at', { ascending: false });
    setNotices(data || []);
    setLoading(false);
  };

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, member_no')
      .order('full_name', { ascending: true });
    setMembers(data || []);
  };

  // 🚀 追加：プッシュ通知を送信する関数
  const sendPushNotification = async (noticeData: any) => {
    try {
      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: isImportant ? `【重要】${title}` : title,
          body: content.length > 50 ? content.substring(0, 50) + "..." : content,
          targetUserId: noticeData.target_user_id,
          noticeId: noticeData.id
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("Push notification failed:", err);
      return false;
    }
  };

  const handleSave = async () => {
    if (!title || !content) return alert('タイトルと内容を入力してください');
    setIsSending(true);

    const cleanTargetId = (targetUserId && targetUserId !== "") ? targetUserId : null;
    const expiryDate = expiresAt ? new Date(`${expiresAt}T23:59:59Z`).toISOString() : null;

    const data = { 
      title, content, is_important: isImportant, 
      expires_at: expiryDate, pdf_url: pdfUrl,
      target_user_id: cleanTargetId
    };

    try {
      // 1. データベースに保存
      const { data: savedNotice, error } = editingId 
          ? await supabase.from('notices').update(data).eq('id', editingId).select().single()
          : await supabase.from('notices').insert(data).select().single();
      
      if (error) throw error;

      // 2. プッシュ通知がONなら実行
      if (isPushEnabled) {
        await sendPushNotification(savedNotice);
      }

      alert(isPushEnabled ? '保存と通知送信が完了しました！' : '保存完了しました！');
      closeModal();
      fetchNotices();
    } catch (err: any) { 
      alert('保存エラーが発生しました'); 
    } finally {
      setIsSending(false);
    }
  };

  const openModal = (notice: any = null) => {
    if (notice) {
      setEditingId(notice.id);
      setTitle(notice.title);
      setContent(notice.content);
      setIsImportant(notice.is_important);
      setExpiresAt(notice.expires_at ? notice.expires_at.split('T')[0] : '');
      setPdfUrl(notice.pdf_url || '');
      setTargetUserId(notice.target_user_id || '');
      setIsPushEnabled(false); // 編集時は誤送信防止のためデフォルトOFF
    } else {
      setEditingId(null);
      setTitle(''); setContent(''); setIsImportant(false); setExpiresAt(''); setPdfUrl(''); setTargetUserId('');
      setIsPushEnabled(true); // 新規作成時はデフォルトON（事務局の利便性）
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingId(null); };

  const deleteNotice = async (id: string) => {
    if (!confirm('削除してもよろしいですか？')) return;
    await supabase.from('notices').delete().eq('id', id);
    fetchNotices();
  };

  const inputStyle = "w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-[16px] text-black focus:border-[#003366] outline-none transition-all";
  const labelStyle = "flex items-center gap-2 text-[14px] font-black text-slate-600 mb-2 ml-1";

  return (
    <div className="min-h-screen bg-slate-200 pb-32">
      <Header variant="admin" title="お知らせ管理" subtitle="事務局管理" icon={Megaphone} isAdminBadge={true} rightButtonType="adminTop" />

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <button 
          onClick={() => openModal()}
          className="w-full mb-8 bg-[#003366] text-white p-6 rounded-[30px] shadow-xl flex items-center justify-center gap-4 active:scale-95 transition-all border-b-8 border-black group"
        >
          <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          <span className="text-xl font-black">新しいお知らせを作成</span>
        </button>

        <div className="space-y-4">
          <h2 className="text-xl font-black px-2 text-slate-700 flex items-center gap-2 text-[18px]">
            <Bell size={24} className="text-[#003366]" /> 送信済み履歴
          </h2>
          
          {loading ? (
            <div className="text-center py-20 bg-white rounded-[40px] animate-pulse font-black text-slate-400 text-[14px]">読込中...</div>
          ) : notices.length === 0 ? (
            <div className="text-center py-20 bg-white/50 rounded-[40px] border-2 border-dashed border-slate-300 font-bold text-slate-400 text-[14px]">履歴はありません</div>
          ) : (
            notices.map(notice => {
              const member = members.find(m => m.id === notice.target_user_id);
              return (
                <div key={notice.id} className="bg-white p-5 rounded-[35px] shadow-md flex justify-between items-center border-l-[12px] border-slate-300 hover:border-[#003366] transition-all">
                  <div className="flex-1 pr-4 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {notice.is_important && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase shadow-sm">重要</span>}
                      {notice.target_user_id ? (
                        <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-[14px] font-black border border-purple-200">
                          {member ? `${member.member_no ? `No.${member.member_no} ` : ''}L.${member.full_name}` : "会員データなし"}
                        </span>
                      ) : (
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-[14px] font-black border border-blue-200">📢 全員公開</span>
                      )}
                      <span className="text-slate-400 font-bold text-[14px] ml-1">
                        {new Date(notice.created_at).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                      </span>
                      
                    </div>
                    <p className="text-[18px] font-black text-slate-900 truncate leading-tight">{notice.title}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* 編集ボタン */}
                    <button 
                      onClick={() => openModal(notice)} 
                      className="w-24 py-3 bg-slate-900 text-white rounded-xl shadow-md hover:bg-blue-900 active:scale-95 transition-all border-b-4 border-slate-700 flex items-center justify-center gap-1"
                    >
                      <Edit3 size={14} strokeWidth={3} />
                      <span className="font-[900] text-s">編集</span>
                    </button>

                    {/* 削除ボタン */}
                    <button 
                      onClick={() => deleteNotice(notice.id)} 
                      className="w-24 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white active:scale-95 transition-all border-b-4 border-red-200 flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} strokeWidth={3} />
                      <span className="font-[900] text-s">削除</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-xl rounded-[45px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            <div className={`p-8 text-white flex justify-between items-center ${editingId ? 'bg-yellow-600' : 'bg-[#003366]'}`}>
              <h2 className="text-2xl font-black tracking-tight">{editingId ? 'お知らせを編集' : '新しいお知らせ'}</h2>
              <button onClick={closeModal} className="active:scale-90 transition-all"><X size={28} strokeWidth={3} /></button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto flex-1 text-[14px]">
              {/* 公開範囲・タイトル・内容・PDF部分は既存のまま */}
              <div>
                <label className={labelStyle}><Users size={18} /> 公開範囲</label>
                <select value={targetUserId} onChange={e => setTargetUserId(e.target.value)} className={inputStyle}>
                  <option value="">全員に公開（掲示板）</option>
                  <optgroup label="会員リスト">
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.member_no ? `No.${m.member_no} ` : ''}L.{m.full_name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className={labelStyle}>タイトル</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputStyle} />
              </div>

              <div>
                <label className={labelStyle}>内容</label>
                <textarea value={content} onChange={e => setContent(e.target.value)} className={`${inputStyle} h-40`} />
              </div>

              {/* 🚀 改善：重要マークとプッシュ通知の並列配置 */}
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 transition-all shadow-sm ${isImportant ? 'bg-red-50 border-red-600' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} className="w-6 h-6 accent-red-600" />
                  <span className="text-[15px] font-black text-slate-700">重要マーク</span>
                </label>

                <label className={`flex items-center gap-3 cursor-pointer p-4 rounded-2xl border-2 transition-all shadow-sm ${isPushEnabled ? 'bg-blue-50 border-blue-600' : 'bg-slate-50 border-slate-200'}`}>
                  <BellRing size={24} className={isPushEnabled ? "text-blue-600 animate-pulse" : "text-slate-400"} />
                  <input type="checkbox" checked={isPushEnabled} onChange={e => setIsPushEnabled(e.target.checked)} className="w-6 h-6 accent-blue-600" />
                  <span className="text-[15px] font-black text-slate-700">通知を送る</span>
                </label>
              </div>

              <div>
                <label className={labelStyle}><Calendar size={18} /> 表示期限</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputStyle} />
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={handleSave} 
                disabled={isSending}
                className="w-full py-5 bg-[#003366] text-white rounded-[25px] font-black text-xl shadow-xl border-b-4 border-black active:translate-y-1 active:border-b-0 disabled:opacity-50 transition-all flex justify-center items-center gap-3"
              >
                {isSending ? <Loader2 className="animate-spin" /> : editingId ? '変更を保存する' : 'この内容で公開・通知'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}