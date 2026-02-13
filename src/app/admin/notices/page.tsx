'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Send, Trash2, Megaphone, Edit3, X, Calendar, Plus, FileText, Upload } from 'lucide-react';
import Header from '@/components/Header';

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfUrl, setPdfUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data } = await supabase.from('notices').select('*').order('created_at', { ascending: false });
    setNotices(data || []);
    setLoading(false);
  };

  const handlePdfUpload = async (file: File) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `notices/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setPdfUrl(publicUrl);
      alert('PDFを準備しました。投稿（保存）すると反映されます！');
    } catch (error: any) {
      alert('アップロード失敗: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!title || !content) return alert('タイトルと内容を入力してください');
    
    const expiryDate = expiresAt ? new Date(`${expiresAt}T23:59:59Z`).toISOString() : null;
    const data = { title, content, is_important: isImportant, expires_at: expiryDate,pdf_url: pdfUrl };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase.from('notices').update(data).eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('notices').insert(data);
      error = insertError;
    }

    if (error) alert(error.message);
    else {
      alert(editingId ? '修正しました！' : '公開しました！');
      resetForm();
      fetchNotices();
    }
  };

  const startEdit = (notice: any) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setIsImportant(notice.is_important);
    setExpiresAt(notice.expires_at ? notice.expires_at.split('T')[0] : '');
    setPdfUrl(notice.pdf_url || ''); // PDFを読み込む
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle(''); setContent(''); setIsImportant(false); setExpiresAt('');
    setPdfUrl(''); // リセット
  };

  const deleteNotice = async (id: string) => {
    if (!confirm('このお知らせを削除してもよろしいですか？')) return;
    await supabase.from('notices').delete().eq('id', id);
    fetchNotices();
  };

  // --- 🦁 高密度スタイルの定義 ---
  const inputStyle = "w-full p-3 bg-white border-2 border-slate-300 rounded-xl font-bold text-lg text-black focus:border-blue-900 outline-none transition-all placeholder:text-slate-300";
  const labelStyle = "flex items-center gap-2 text-sm font-black text-slate-600 mb-1 ml-1";

  return (
    <div className="min-h-screen bg-slate-200 pb-32">
      <Header 
        variant="admin"
        title="お知らせ管理"
        subtitle="掲示板の投稿・編集・削除"
        icon={Megaphone}
        isAdminBadge={true}
        rightButtonType="adminTop"
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        
        {/* --- 1. 投稿・編集フォーム（ギュッと圧縮版） --- */}
        <div className={`p-6 rounded-[35px] shadow-xl border-2 mb-8 transition-all ${editingId ? 'bg-yellow-50 border-yellow-500' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black flex items-center gap-3 text-slate-800">
              {editingId ? <Edit3 size={28} className="text-yellow-600" /> : <Plus size={28} className="text-blue-900" />}
              {editingId ? 'お知らせを修正中' : '新規投稿'}
            </h2>
            {editingId && (
              <button onClick={resetForm} className="bg-slate-200 p-2 rounded-full hover:bg-slate-300 transition-all">
                <X size={20} strokeWidth={3} />
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <label className={labelStyle}>タイトル</label>
              <input type="text" placeholder="例：2月例会時間の変更" value={title} onChange={e => setTitle(e.target.value)} className={inputStyle} />
            </div>

            <div>
              <label className={labelStyle}>内容（詳細）</label>
              <textarea placeholder="詳しい情報を入力してください..." value={content} onChange={e => setContent(e.target.value)} className={`${inputStyle} h-32 md:h-40 text-base font-medium`} />
            </div>
            <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-black text-slate-600 ml-1">
                <FileText size={16} /> 添付資料 (PDF)
            </label>
            <div className="flex items-center gap-4">
                <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                pdfUrl ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50 border-slate-300 text-slate-400 hover:bg-slate-100'
                }`}>
                <Upload size={20} />
                <span className="text-sm font-black">{pdfUrl ? 'PDFを変更する' : 'PDFをアップロード'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])} />
                </label>
                {pdfUrl && (
                <button onClick={() => setPdfUrl('')} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <X size={20} strokeWidth={3} />
                </button>
                )}
            </div>
            {pdfUrl && <p className="text-[10px] text-slate-400 truncate px-2">添付済み: {pdfUrl}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}><Calendar size={16} /> 表示期限（自動削除）</label>
                <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className={inputStyle} />
              </div>

              <div className="flex items-end">
                <label className={`flex items-center gap-3 cursor-pointer p-3 w-full rounded-xl border-2 transition-all shadow-sm ${isImportant ? 'bg-red-50 border-red-600' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" checked={isImportant} onChange={e => setIsImportant(e.target.checked)} className="w-6 h-6 accent-red-600" />
                  <span className={`text-base font-black ${isImportant ? 'text-red-600' : 'text-slate-600'}`}>【重要】としてマーク</span>
                </label>
              </div>
            </div>

            <button onClick={handleSave} className={`w-full py-4 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg border-b-4 transition-all active:translate-y-1 active:border-b-0 ${editingId ? 'bg-yellow-600 border-yellow-800' : 'bg-blue-900 border-blue-950 hover:bg-blue-800'}`}>
              <Send size={24} /> {editingId ? '修正を保存する' : 'この内容で公開する'}
            </button>
          </div>
        </div>
        {/* --- 2. 公開履歴リスト（スリム版） --- */}
        <div className="space-y-3">
          <h2 className="text-xl font-black px-2 text-slate-700 flex items-center gap-2">
            <Bell size={24} className="text-blue-900" /> 投稿履歴
          </h2>
          
          {loading ? (
            <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-slate-300">
              <p className="font-black text-slate-400 animate-pulse">読み込み中...</p>
            </div>
          ) : notices.map(notice => (
            <div key={notice.id} className="bg-white p-4 rounded-3xl shadow-sm flex justify-between items-center border-l-[12px] border-slate-200 hover:border-blue-400 transition-all group">
              <div className="flex-1 pr-4 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {notice.is_important && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px] font-black">重要</span>}
                  <span className="text-slate-400 font-bold text-xs">{new Date(notice.created_at).toLocaleDateString('ja-JP')}</span>
                  {notice.expires_at && (
                    <span className="text-blue-600 text-[10px] font-black">
                      ⏱ {new Date(notice.expires_at).toLocaleDateString()}まで
                    </span>
                  )}
                </div>
                <p className="text-lg font-black text-slate-900 truncate leading-tight">{notice.title}</p>
              </div>
              
              <div className="flex gap-2 shrink-0">
                <button onClick={() => startEdit(notice)} className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all">
                  <Edit3 size={20} strokeWidth={2.5} />
                </button>
                <button onClick={() => deleteNotice(notice.id)} className="p-3 bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                  <Trash2 size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}