'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, Edit2, UserCircle, ShieldCheck, Plus, UserPlus, X, 
  ShieldAlert, Hash, Trash2, Loader2 
} from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /* --- 🛠️ 新規登録モーダル用のステート --- */
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newMemberNo, setNewMemberNo] = useState('');
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

  /* --- 🚀 会員削除の実行関数 --- */
  const handleDeleteMember = async (memberId: string, fullName: string) => {
    const confirmMessage = `L.${fullName} 様のアカウントを完全に削除しますか？\n\n【注意】この操作は取り消せません。出欠回答や通知用トークンもすべて消去されます。`;
    if (!confirm(confirmMessage)) return;

    setDeletingId(memberId);
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: memberId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert('アカウントを完全に削除しました。');
        fetchMembers();
      } else {
        throw new Error(data.error || '削除に失敗しました');
      }
    } catch (error: any) {
      alert('エラー: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  /* --- 管理者権限の切り替え関数 --- */
  const handleToggleAdmin = async (memberId: string, currentStatus: boolean) => {
    const targetMember = members.find(m => m.id === memberId);
    if (!confirm(`L.${targetMember.full_name} 様の管理者権限を変更しますか？`)) return;

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

  /* --- 新規登録の実行関数 --- */
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
          memberNo: newMemberNo 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('アカウントを作成しました！');
        setIsModalOpen(false);
        setNewEmail(''); setNewFullName(''); setNewMemberNo('');
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
        subtitle="会員情報の編集・退会処理・権限の管理"
        icon={ShieldCheck}
        isAdminBadge={true}
        rightButtonType="adminTop"
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        
        {/* 新規登録ボタン */}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mb-6 w-full py-5 bg-white border-2 border-dashed border-slate-400 rounded-[30px] flex items-center justify-center gap-3 text-slate-600 hover:bg-blue-50 hover:border-blue-900 hover:text-blue-900 transition-all group shadow-sm"
        >
          <UserPlus size={24} className="group-hover:scale-110 transition-transform" />
          <span className="text-xl font-[900] tracking-tighter">新規会員を登録する</span>
        </button>

        {/* 会員リスト */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-300">
              <Loader2 className="mx-auto mb-4 animate-spin text-slate-300" size={48} />
              <p className="font-black text-xl text-slate-400">名簿を読み込み中...</p>
            </div>
          ) : members.map((member) => (
            <div 
              key={member.id} 
              className={`p-5 rounded-[35px] shadow-lg border-t-8 transition-all flex flex-col sm:flex-row justify-between items-center gap-4 ${
                member.is_admin ? 'bg-blue-50/50 border-blue-900' : 'bg-white border-slate-300'
              }`}
            >
              <div className="flex items-center gap-5 min-w-0 w-full">
                <div className={`${member.is_admin ? 'text-blue-900 bg-blue-100' : 'text-slate-300 bg-slate-50'} shrink-0 p-2 rounded-2xl`}>
                  <UserCircle size={56} strokeWidth={1.5} />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {member.member_no && (
                      <span className="bg-slate-800 text-white px-2.5 py-1 rounded-lg text-[12px] font-black tracking-wider">
                        No.{member.member_no}
                      </span>
                    )}
                    {member.is_admin && (
                      <span className="bg-blue-900 text-white px-2.5 py-1 rounded-lg text-[12px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <ShieldCheck size={12} /> 管理者
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-[900] text-slate-900 leading-tight truncate">
                    L.{member.full_name || '名前未設定'}
                  </p>
                  <p className="text-sm font-bold text-slate-400 mt-1 truncate">
                    {member.email}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-4 sm:pt-0">
  
              {/* 1. 管理者権限ボタン（左） */}
              <button 
                onClick={() => handleToggleAdmin(member.id, member.is_admin)}
                className={`w-24 py-3 rounded-xl text-s font-[900] transition-all border-b-4 active:border-b-0 active:translate-y-1 shrink-0 ${
                  member.is_admin 
                    ? 'bg-orange-50 text-orange-700 border-orange-200' 
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}
              >
                {member.is_admin ? '権限解除' : '管理者へ'}
              </button>

              {/* 2. 編集ボタン（中央） */}
              <Link 
                href={`/admin/members/${member.id}`}
                className="w-24 py-3 bg-slate-900 text-white rounded-xl shadow-md hover:bg-blue-900 active:scale-95 transition-all border-b-4 border-slate-700 flex items-center justify-center gap-1"
              >
                <Edit2 size={14} strokeWidth={3} />
                <span className="font-[600] text-s">編集</span>
              </Link>

              {/* 3. 削除ボタン（右） */}
              <button 
                onClick={() => handleDeleteMember(member.id, member.full_name)}
                disabled={deletingId === member.id}
                className="w-24 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white active:scale-95 transition-all border-b-4 border-red-200 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {deletingId === member.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <>
                    <Trash2 size={14} strokeWidth={3} />
                    <span className="font-[900] text-s">削除</span>
                  </>
                )}
              </button>

            </div>
            </div>
          ))}
        </div>
      </div>

      {/* 新規登録モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[50px] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors"><X size={32} strokeWidth={4} /></button>
            
            <div className="flex flex-col items-center mb-10 text-center">
              <div className="bg-blue-900 p-4 rounded-[25px] text-white mb-4 shadow-xl">
                <UserPlus size={40} />
              </div>
              <h2 className="text-3xl font-[900] text-slate-900 tracking-tighter">NEW MEMBER</h2>
              <p className="text-slate-400 font-bold text-sm">会員アカウントの新規発行</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest">Full Name</label>
                <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-900 border-2 border-slate-100 focus:border-blue-900 outline-none transition-all" placeholder="ライオン 太郎" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest">Member No</label>
                <div className="relative">
                  <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input type="text" value={newMemberNo} onChange={(e) => setNewMemberNo(e.target.value)} className="w-full p-5 pl-14 bg-slate-50 rounded-2xl font-bold text-slate-900 border-2 border-slate-100 focus:border-blue-900 outline-none transition-all" placeholder="会員No" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-500 ml-2 uppercase tracking-widest">Email Address</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-slate-900 border-2 border-slate-100 focus:border-blue-900 outline-none transition-all" placeholder="example@lions.com" />
              </div>

              <div className="p-6 bg-yellow-50 rounded-3xl border-2 border-yellow-200">
                <label className="block text-[14px] font-black text-yellow-700 mb-1 uppercase tracking-widest opacity-60">パスワード初期値</label>
                <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-transparent font-black text-yellow-700 text-2xl outline-none" />
              </div>

              <button onClick={handleCreateUser} disabled={isCreating} className="w-full py-6 bg-blue-900 text-white rounded-[30px] font-[900] text-2xl shadow-2xl shadow-blue-900/30 active:scale-95 transition-all border-b-8 border-blue-950 mt-4">
                {isCreating ? <Loader2 className="animate-spin mx-auto" /> : 'アカウント有効化'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}