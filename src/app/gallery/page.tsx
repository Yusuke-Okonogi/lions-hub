'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Folder, ChevronRight, Trash2, Camera, Plus, Calendar, Clock } from 'lucide-react'; // アイコン追加
import Header from '@/components/Header';
import Link from 'next/link';

export default function GalleryAlbumsPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🚀 日付フォーマット用の関数
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  useEffect(() => {
    fetchAlbums();
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      setIsAdmin(profile?.is_admin || false);
    }
  };

  const fetchAlbums = async () => {
    // 🚀 created_at と updated_at を含めて取得（通常は * で含まれます）
    const { data } = await supabase.from('gallery_albums').select('*').order('created_at', { ascending: false });
    setAlbums(data || []);
    setLoading(false);
  };

  const createAlbum = async () => {
    const name = prompt("新しいアルバムの名前を入力してください");
    if (!name) return;
    const { error } = await supabase.from('gallery_albums').insert({ name });
    if (!error) fetchAlbums();
  };

  const handleDeleteAlbum = async (e: React.MouseEvent, albumId: string, albumName: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`アルバム「${albumName}」を削除しますか？\n※中に入っている写真が表示されなくなります。`)) return;

    try {
      const { error } = await supabase.from('gallery_albums').delete().eq('id', albumId);
      if (error) throw error;
      fetchAlbums();
    } catch (error: any) {
      alert('削除に失敗しました: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-32">
      {/* 🚀 ヘッダーを管理者用スタイルに統一 */}
      <Header 
        variant="admin" // 'user' から 'admin' に変更
        title="活動写真館"
        subtitle="思い出のアルバム一覧（事務局管理）"
        icon={Camera}
        isAdminBadge={true} // 管理者ページなので true 固定
        rightButtonType="adminTop" // 他の管理画面と同様に「管理トップ」へ戻るボタンに
      />

      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-4">
        
        {/* --- アルバム作成ボタン --- */}
        {isAdmin && (
          <button 
            onClick={createAlbum}
            className="w-full py-4 bg-white rounded-2xl border-2 border-dashed border-blue-900 flex items-center justify-center gap-3 text-blue-900 hover:bg-blue-50 transition-all active:scale-95 shadow-sm group"
          >
            <div className="bg-blue-900 p-1.5 rounded-full text-white group-hover:scale-110 transition-transform">
              <Plus size={20} strokeWidth={4} />
            </div>
            <span className="text-lg font-black tracking-tighter">新しいアルバムを作る</span>
          </button>
        )}

        {/* --- アルバムリスト --- */}
        <div className="grid gap-3">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-[30px] border-2 border-dashed border-slate-300">
              <p className="font-black text-slate-400 animate-pulse">写真を整理中...</p>
            </div>
          ) : albums.map((album) => (
            <div key={album.id} className="relative">
              <Link 
                href={`/gallery/${album.id}`}
                className="bg-white p-5 rounded-[35px] shadow-sm flex items-center justify-between hover:border-blue-400 border border-slate-200 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center gap-5 min-w-0">
                  <div className="bg-yellow-50 p-3 rounded-[20px] shrink-0 shadow-inner group-hover:bg-yellow-100 transition-colors">
                    <Folder size={36} className="text-yellow-500" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-[900] text-slate-900 truncate leading-tight mb-2">
                      {album.name}
                    </h2>
                    
                    {/* 🚀 修正：日付表示エリアを追加 */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar size={12} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          作成: {formatDate(album.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-400/70">
                        <Clock size={12} strokeWidth={3} />
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          更新: {formatDate(album.updated_at || album.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <button 
                      onClick={(e) => handleDeleteAlbum(e, album.id, album.name)}
                      className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={22} strokeWidth={2.5} />
                    </button>
                  )}
                  <ChevronRight size={28} className="text-slate-300" strokeWidth={4} />
                </div>
              </Link>
            </div>
          ))}

          {!loading && albums.length === 0 && (
            <div className="text-center py-20 bg-white rounded-[30px] border-2 border-dashed border-slate-300">
              <p className="text-lg font-black text-slate-300">アルバムがまだありません</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}