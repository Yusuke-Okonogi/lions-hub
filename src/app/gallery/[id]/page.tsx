'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Download, Trash2, User, Plus, Image as ImageIcon, X, ZoomIn } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AlbumDetailPage() {
  const { id } = useParams();
  const [photos, setPhotos] = useState<any[]>([]);
  const [album, setAlbum] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 🚀 プレビュー用のステート
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const init = async () => {
        setLoading(true);
        await Promise.all([fetchAlbumData(), fetchPhotos(), checkUserStatus()]);
        setLoading(false);
      };
      init();
    }
  }, [id]);

  // --- (中略: checkUserStatus, fetchAlbumData, fetchPhotos, handleDelete, downloadImage, handleUpload は既存のまま) ---
  const checkUserStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      setIsAdmin(profile?.is_admin || false);
    }
  };

  const fetchAlbumData = async () => {
    const { data } = await supabase.from('gallery_albums').select('*').eq('id', id).single();
    setAlbum(data);
  };

  const fetchPhotos = async () => {
    const { data } = await supabase.from('gallery_photos').select('*').eq('album_id', id).order('created_at', { ascending: false });
    setPhotos(data || []);
  };

  const handleDelete = async (photoId: string, imageUrl: string) => {
    if (!confirm('この写真を削除してもよろしいですか？')) return;
    try {
      await supabase.from('gallery_photos').delete().eq('id', photoId);
      const filePath = imageUrl.split('gallery/')[1];
      await supabase.storage.from('gallery').remove([filePath]);
      fetchPhotos();
    } catch (error: any) {
      alert('削除に失敗しました');
    }
  };

  const downloadImage = async (imageUrl: string, fileName: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Lions_${fileName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert('保存に失敗しました。');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `uploads/${fileName}`;
      await supabase.storage.from('gallery').upload(filePath, file);
      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(filePath);
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
      await supabase.from('gallery_photos').insert({
        title: album?.name || '活動写真',
        image_url: publicUrl,
        user_id: userId,
        full_name: profile?.full_name || 'ライオン',
        album_id: id
      });
      fetchPhotos();
    } catch (error: any) {
      alert('エラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-32">
      <Header 
        variant="admin"
        title={album?.name || '読み込み中...'}
        subtitle="奉仕活動の思い出アルバム"
        icon={ImageIcon}
        isAdminBadge={isAdmin}
        rightButtonType="adminTop"
      />

      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-4">
        
        {/* 操作エリア */}
        <div className="flex flex-col md:flex-row gap-3">
          <Link href="/gallery" className="flex-1 py-4 bg-white border-b-4 border-slate-300 rounded-2xl flex items-center justify-center gap-2 text-slate-600 font-[900] text-sm shadow-sm hover:bg-slate-50 transition-all">
            <ArrowLeft size={18} strokeWidth={3} /> アルバム一覧へ
          </Link>

          <label className="flex-[2] py-4 bg-[#003366] border-b-4 border-slate-900 text-white rounded-2xl font-[900] text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer hover:bg-blue-800 transition-all">
            <Plus size={20} strokeWidth={4} />
            {uploading ? '送信中...' : '新しい写真を投稿する'}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        {/* 写真一覧グリッド */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {photos.map((photo) => {
            const canDelete = userId === photo.user_id || isAdmin === true;

            return (
              <div key={photo.id} className="bg-white p-4 rounded-[35px] shadow-md border border-slate-200">
                {/* 🚀 タップでプレビューを開く画像エリア */}
                <div 
                  onClick={() => setSelectedImage(photo.image_url)}
                  className="aspect-video w-full rounded-2xl overflow-hidden relative mb-4 shadow-inner bg-slate-100 cursor-zoom-in group"
                >
                  <img src={photo.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="activity" />
                  
                  {/* 拡大アイコン（ホバー時） */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="text-white" size={40} strokeWidth={3} />
                  </div>

                  {canDelete && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(photo.id, photo.image_url); }}
                      className="absolute top-3 right-3 bg-red-600 text-white p-2.5 rounded-xl shadow-xl hover:bg-red-700 active:scale-90 transition-all z-10"
                    >
                      <Trash2 size={18} strokeWidth={3} />
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="bg-blue-50 p-1.5 rounded-full shrink-0">
                      <User size={14} className="text-[#003366]" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-[900] text-slate-700 truncate">L.{photo.full_name}</span>
                  </div>
                  <button onClick={() => downloadImage(photo.image_url, photo.id)} className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-[900] text-[12px] shadow-sm border-b-4 border-slate-300 hover:bg-white transition-all">
                    <Download size={16} strokeWidth={3} /> 保存
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 🚀 プレビューモーダル本体 */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-all z-[210]"
            onClick={() => setSelectedImage(null)}
          >
            <X size={32} strokeWidth={3} />
          </button>
          
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            <img 
              src={selectedImage} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
              alt="preview" 
            />
          </div>
        </div>
      )}
    </div>
  );
}