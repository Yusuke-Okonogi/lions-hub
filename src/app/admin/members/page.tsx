'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Edit2, UserCircle, ShieldCheck, Plus, UserPlus, X, ShieldAlert, Hash 
} from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* --- 🛠️ 新規登録モーダル用のステート --- */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newMemberNo, setNewMemberNo] = useState(''); // 会員No追加
  const [newPassword, setNewPassword] = useState('roppongi-lc');
  const [isCreating, setIsCreating] = useState(false);

  // リスト取得
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    setMembers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  /* --- 管理者権限の切り替え関数 --- */
  const handleToggleAdmin = async (memberId: string, currentStatus: boolean) => {
    const targetMember = members.find(m => m.id === memberId);
    if (!confirm(`L.${targetMember.full_name} の管理者権限を変更しますか？`)) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;
      alert('権限を更新しました！');
      fetchMembers();
    } catch (error: any) {
      alert('エラー: ' + error.message);
    }
  };

  /* --- 新規登録の実行関数 (会員Noも送信) --- */
  const handleCreateUser = async () => {
    if (!newEmail || !newFullName) return alert('氏名とメールアドレスは必須です');
    setIsCreating(true);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: newEmail, 
          password: newPassword, 
          fullName: newFullName,
          memberNo: newMemberNo // 会員Noを送信
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('アカウントを作成/更新しました！');
        setIsModalOpen(false);
        setNewEmail('');
        setNewFullName('');
        setNewMemberNo('');
        fetchMembers();
      } else {
        throw new Error(data.error || '登録に失敗しました');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-32">
      <Header 
        variant="admin"
        title="会員名簿管理"
        subtitle="会員情報の編集・役職設定・権限の管理"
        icon={ShieldCheck}
        isAdminBadge={true}
        rightButtonType="adminTop"
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        
        {/* 新規登録ボタン（モーダル起動） */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mb-6 w-full py-4 bg-white border-2 border-dashed border-slate-400 rounded-2xl flex items-center justify-center gap-3 text-slate-600 hover:bg-blue-50 hover:border-blue-900 hover:text-blue-900 transition-all group shadow-sm"
        >
          <div className="bg-slate-100 p-1.5 rounded-full group-hover:bg-blue-900 group-hover:text-white transition-colors">
            <UserPlus size={20} strokeWidth={4} />
          </div>
          <span className="text-lg font-black tracking-tighter">新規会員のアカウントを作成</span>
        </button>

        {/* 会員リスト */}
        <div className="grid gap-3">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-[30px] border-4 border-dashed border-slate-300">
              <p className="font-black text-xl text-slate-400 animate-pulse">名簿を読み込み中...</p>
            </div>
          ) : members.map((member) => (
            <div 
              key={member.id} 
              className={`p-4 rounded-3xl shadow-sm border transition-all flex flex-col sm:flex-row justify-between items-center gap-4 ${
                member.is_admin ? 'bg-blue-50 border-blue-900 ring-2 ring-blue-900/10' : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0 w-full">
                <div className={`${member.is_admin ? 'text-blue-900' : 'text-slate-200'} shrink-0 bg-slate-50 p-1 rounded-full`}>
                  <UserCircle size={48} strokeWidth={1} />
                </div>
                
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-1 mb-1">
                    {member.is_admin && (
                      <span className="bg-blue-900 text-white px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1 shadow-sm">
                        <ShieldCheck size={10} /> 管理者
                      </span>
                    )}
                    {/* 会員Noを表示 */}
                    {member.member_no && (
                      <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black">
                        No.{member.member_no}
                      </span>
                    )}
                    {member.position_3yaku && (
                      <span className="bg-[#003366] text-yellow-400 border border-yellow-500/50 px-2 py-0.5 rounded-md text-[10px] font-black">
                        {member.position_3yaku}
                      </span>
                    )}
                  </div>
                  <p className="text-xl font-black text-black leading-none truncate">
                    L.{member.full_name || '名前未設定'}
                  </p>
                  <p className="text-xs font-bold text-slate-400 mt-1 truncate">
                    {member.email || 'メール未登録'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button 
                  onClick={() => handleToggleAdmin(member.id, member.is_admin)}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black transition-all border-b-4 active:border-b-0 active:translate-y-1 shrink-0 whitespace-nowrap min-w-[110px] ${
                    member.is_admin 
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-sm' 
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100 shadow-sm'
                  }`}
                >
                  {member.is_admin ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                  <span>{member.is_admin ? '権限解除' : '管理者にする'}</span>
                </button>

                <Link 
                  href={`/admin/members/${member.id}`}
                  className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-blue-900 active:scale-90 transition-all border-b-4 border-slate-700 shrink-0"
                >
                  <Edit2 size={16} strokeWidth={3} />
                  <span className="font-black text-sm">編集</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🛠️ 新規登録モーダル (会員Noフィールド追加) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-slate-500 hover:text-slate-900 transition-colors"><X size={28} strokeWidth={3} /></button>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-slate-900">
              <div className="bg-blue-900 p-2 rounded-xl text-white"><UserPlus size={24} /></div>
              会員アカウント作成
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-600 mb-2 ml-1 uppercase">Full Name</label>
                <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-900 outline-none" placeholder="氏名（例：ライオン 太郎）" />
              </div>
              
              {/* --- 🛠️ 会員No入力欄を追加 --- */}
              <div>
                <label className="block text-xs font-black text-slate-600 mb-2 ml-1 uppercase">Member No (会員No)</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" value={newMemberNo} onChange={(e) => setNewMemberNo(e.target.value)} className="w-full p-4 pl-12 bg-slate-100 rounded-2xl font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-900 outline-none" placeholder="例：12345" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-600 mb-2 ml-1 uppercase">Email / Login ID</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-bold text-slate-900 border-2 border-slate-200 focus:border-blue-900 outline-none" placeholder="example@mail.com" />
              </div>

              <div className="p-5 bg-blue-50 rounded-2xl border-2 border-blue-100">
                <label className="block text-xs font-black text-blue-900 mb-2 uppercase">Default Password</label>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-transparent font-black text-blue-900 text-xl outline-none" />
                <p className="text-[10px] text-blue-700/60 mt-2 font-bold italic">※会員がログイン後に変更可能です</p>
              </div>

              <button onClick={handleCreateUser} disabled={isCreating} className="w-full py-5 bg-blue-900 text-white rounded-[25px] font-black text-xl shadow-xl shadow-blue-900/30 mt-4 active:scale-95 transition-all">
                {isCreating ? '登録しています...' : 'アカウントを有効化'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}