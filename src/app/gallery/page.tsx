'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FolderPlus, Folder, ChevronRight, Trash2, Camera, Plus } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function GalleryAlbumsPage() {
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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
      <Header 
        variant="user" 
        title="活動写真館"
        subtitle="思い出のアルバム一覧"
        icon={Camera}
        isAdminBadge={isAdmin}
        rightButtonType="member"
      />

      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-4">
        
        {/* --- 1. 管理者用：アルバム作成ボタン（スリム化） --- */}
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

        {/* --- 2. アルバムリスト（高密度デザイン） --- */}
        <div className="grid gap-3">
          {loading ? (
            <div className="text-center py-20 bg-white rounded-[30px] border-2 border-dashed border-slate-300">
              <p className="font-black text-slate-400 animate-pulse">写真を整理中...</p>
            </div>
          ) : albums.map((album) => (
            <div key={album.id} className="relative">
              <Link 
                href={`/gallery/${album.id}`}
                className="bg-white p-4 rounded-3xl shadow-sm flex items-center justify-between hover:border-blue-400 border border-slate-200 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="bg-yellow-50 p-2 rounded-2xl shrink-0">
                    <Folder size={32} className="text-yellow-500" fill="currentColor" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-black text-slate-900 truncate leading-tight">
                      {album.name}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                      View Photos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* 削除ボタンをカード内に統合 */}
                  {isAdmin && (
                    <button 
                      onClick={(e) => handleDeleteAlbum(e, album.id, album.name)}
                      className="p-2.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={20} strokeWidth={2.5} />
                    </button>
                  )}
                  <ChevronRight size={24} className="text-slate-300" strokeWidth={3} />
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