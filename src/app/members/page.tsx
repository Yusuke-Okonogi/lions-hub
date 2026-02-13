'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import { Users, Phone, Mail, Search, UserCircle } from 'lucide-react';

export default function MembersDirectoryPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      setIsAdmin(profile?.is_admin || false);
    }
  };

  useEffect(() => {
    const fetchMembers = async () => {
      const { data } = await supabase.from('profiles').select('*');
      
      const sortedData = (data || []).sort((a, b) => {
        const getWeight = (m: any) => {
          if (m.position_3yaku === '会長') return 1;
          if (m.position_3yaku === '幹事') return 2;
          if (m.position_3yaku === '会計') return 3;
          if (m.position_3yaku) return 4;
          if (m.position_cabinet) return 10;
          return 99;
        };
        const weightA = getWeight(a);
        const weightB = getWeight(b);
        if (weightA !== weightB) return weightA - weightB;
        return (a.full_name || '').localeCompare(b.full_name || '', 'ja');
      });

      setMembers(sortedData);
      setLoading(false);
    };
    fetchMembers();
  }, []);

  const filteredMembers = members.filter(m => 
    (m.full_name || '').includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-200 pb-32">
      <Header 
        variant="user"
        title="会員名簿"
        subtitle="メンバー一覧（役職順）"
        icon={Users}
        isAdminBadge={isAdmin}
        rightButtonType="member"
      />

      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-4">
        {/* 検索バー：高さを抑えてコンパクトに */}
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="名前で検索..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 pl-12 bg-white border-2 border-slate-300 rounded-[20px] font-bold text-lg text-black outline-none focus:border-blue-500 shadow-md transition-all"
          />
        </div>

        <div className="grid gap-3">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-[40px] border-4 border-dashed border-slate-300">
              <p className="font-black text-xl text-slate-400 animate-pulse">名簿を開いています...</p>
            </div>
          ) : filteredMembers.map((member) => (
            /* カード：余白(p-4)と角丸を調整して情報量をアップ */
            <div key={member.id} className="bg-white p-4 rounded-[30px] shadow-sm border border-slate-200 hover:border-blue-400 transition-all">
              <div className="flex items-center gap-4 mb-3 border-b border-slate-100 pb-3">
                {/* アイコンサイズを縮小 */}
                <div className="bg-slate-50 p-1 rounded-full text-slate-300 shrink-0">
                  <UserCircle size={48} strokeWidth={1} />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {member.position_3yaku && (
                      <span className="bg-[#003366] text-yellow-400 border border-yellow-500 px-2 py-0.5 rounded-md text-[10px] font-black">
                        {member.position_3yaku}
                      </span>
                    )}
                    {member.position_cabinet && (
                      <span className="bg-slate-700 text-white px-2 py-0.5 rounded-md text-[10px] font-black">
                        {member.position_cabinet}
                      </span>
                    )}
                  </div>
                  {/* 名前サイズを text-3xl から text-xl へ */}
                  <p className="text-xl font-black text-black truncate leading-tight">
                    L.{member.full_name || '名前未設定'}
                  </p>
                </div>
              </div>

              {/* 電話・メールボタン：常時横並び (grid-cols-2) */}
              <div className="grid grid-cols-2 gap-3">
                <a 
                  href={member.phone ? `tel:${member.phone}` : '#'}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-[15px] font-black text-sm shadow-sm border-b-4 transition-all active:scale-95 ${
                    member.phone 
                      ? 'bg-green-600 text-white border-green-800' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <Phone size={16} strokeWidth={3} /> 電話
                </a>
                <a 
                  href={member.email ? `mailto:${member.email}` : '#'}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-[15px] font-black text-sm shadow-sm border-b-4 transition-all active:scale-95 ${
                    member.email 
                      ? 'bg-blue-600 text-white border-blue-800' 
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <Mail size={16} strokeWidth={3} /> メール
                </a>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}