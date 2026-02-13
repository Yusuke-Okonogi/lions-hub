'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; 
import { supabase } from '@/lib/supabase';
import { Save, UserCircle, User, Mail, Phone, MapPin, Calendar, Users, Hash } from 'lucide-react';
import Header from '@/components/Header';

export default function MemberEditPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allMembers, setAllMembers] = useState<any[]>([]);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', birth_date: '',
    gender: '男性', address: '', joining_date: '', sponsor_id: '',
    position_3yaku: '',
    position_cabinet: '',
    member_no: ''
  });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', id).single();
      const { data: members } = await supabase.from('profiles').select('id, full_name').neq('id', id);
      
      if (profile) {
        setForm({
          full_name: profile.full_name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          birth_date: profile.birth_date || '',
          gender: profile.gender || '男性',
          address: profile.address || '',
          joining_date: profile.joining_date || '',
          sponsor_id: profile.sponsor_id || '',
          position_3yaku: profile.position_3yaku || '',
          position_cabinet: profile.position_cabinet || '',
          member_no: profile.member_no || ''
        });
      }
      setAllMembers(members || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);



  const handleSave = async () => {
    setSaving(true);
    const sanitizedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value === '' ? null : value])
    );

    const { error } = await supabase
      .from('profiles')
      .update({ ...sanitizedForm, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      alert(`保存エラー：${error.message}`);
    } else {
      alert('保存しました！');
      router.push('/admin/members');
      router.refresh();
    }
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-200 flex items-center justify-center font-black text-slate-400 animate-pulse text-2xl">読み込み中...</div>;

  // --- 🦁 サイズ感を落とした新しいスタイル ---
  const inputStyle = "w-full p-3 bg-white border-2 border-slate-300 rounded-xl font-bold text-lg text-black focus:border-blue-900 focus:ring-2 focus:ring-blue-100 outline-none transition-all";
  const labelStyle = "flex items-center gap-2 text-sm font-black text-slate-600 mb-1 ml-1";

/* --- 🛠️ パスワードリセット関数 --- */
const handleResetPassword = async () => {
  if (!confirm('この会員のパスワードを「roppongi-lc」に初期化しますか？')) return;

  setSaving(true);
  try {
    const res = await fetch('/api/admin/create-user', { // 既存のAPIを再利用
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: form.email, 
        password: 'roppongi-lc', 
        fullName: form.full_name,
        memberNo: form.member_no 
      }),
    });

    if (res.ok) {
      alert('パスワードを「roppongi-lc」にリセットしました。会員に伝えてください。');
    } else {
      throw new Error('リセットに失敗しました');
    }
  } catch (error: any) {
    alert(error.message);
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-slate-200 pb-20">
      {/* 共通ヘッダー（管理モード） */}
      <Header 
        variant="admin"
        title="会員情報の編集"
        subtitle={`L.${form.full_name} 様の情報を更新します`}
        icon={UserCircle}
        isAdminBadge={true}
        rightButtonType="adminTop"
      />

      <main className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-[35px] shadow-xl p-6 md:p-10 border border-slate-200">
          <div className="grid gap-6">
            
            {/* 名前・基本情報セクション */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className={labelStyle}><User size={16}/> 氏名</label>
                <input type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className={inputStyle} />
              </div>
              <div className="md:col-span-1">
                    <label className={labelStyle}><Hash size={16}/> 会員No</label>
                    <input 
                    type="text" 
                    value={form.member_no} 
                    onChange={e => setForm({...form, member_no: e.target.value})} 
                    className={inputStyle} 
                    placeholder="例：12345" 
                    />
                </div>
              <div>
                <label className={labelStyle}><Mail size={16}/> メール</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}><Phone size={16}/> 電話番号</label>
                <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputStyle} />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* 役職・属性セクション */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className={labelStyle}>性別</label>
                <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className={inputStyle}>
                  <option value="男性">男性</option>
                  <option value="女性">女性</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <label className={labelStyle}><Calendar size={16}/> 生年月日</label>
                <input type="date" value={form.birth_date} onChange={e => setForm({...form, birth_date: e.target.value})} className={inputStyle} />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className={labelStyle}>クラブ役職（3役）</label>
                <select value={form.position_3yaku} onChange={e => setForm({...form, position_3yaku: e.target.value})} className={inputStyle}>
                  <option value="">なし</option>
                  <option value="会長">会長</option>
                  <option value="幹事">幹事</option>
                  <option value="会計">会計</option>
                  <option value="副会長">副会長</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-2">
                <label className={labelStyle}>他役職（記入）</label>
                <input type="text" value={form.position_cabinet} onChange={e => setForm({...form, position_cabinet: e.target.value})} className={inputStyle} placeholder="ゾーンチェアパーソン等" />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* クラブ情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={labelStyle}><MapPin size={16}/> 住所</label>
                <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>入会日</label>
                <input type="date" value={form.joining_date} onChange={e => setForm({...form, joining_date: e.target.value})} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}><Users size={16}/> スポンサー</label>
                <select value={form.sponsor_id} onChange={e => setForm({...form, sponsor_id: e.target.value})} className={inputStyle}>
                  <option value="">選択なし</option>
                  {allMembers.map(m => <option key={m.id} value={m.id}>L.{m.full_name}</option>)}
                </select>
              </div>
            </div>

            {/* 保存ボタン：SPでも押しやすく、かつ高さは抑える */}
            <button 
              onClick={handleSave} 
              disabled={saving}
              className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg transition-all mt-4 border-b-4 ${
                saving ? 'bg-slate-400 border-slate-500' : 'bg-[#003366] text-white hover:bg-slate-800 border-slate-900 active:scale-95'
              }`}
            >
              <Save size={24} />
              {saving ? '保存中...' : '変更を保存する'}
            </button>
<button 
  onClick={handleResetPassword}
  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm mt-2 border-2 border-slate-200 hover:bg-red-50 hover:text-red-600 transition-all"
>
  パスワードを初期値にリセットする
</button>
          </div>
        </div>
      </main>
    </div>
  );
}