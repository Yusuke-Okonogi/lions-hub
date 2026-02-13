'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Camera, ArrowLeft, Download, Trash2, User, Plus, Image as ImageIcon } from 'lucide-react';
import Header from '@/components/Header';
import Link from 'next/link';

export default function AlbumDetailPage() {
  const { id } = useParams();
  const [photos, setPhotos] = useState<any[]>([]);
  const [album, setAlbum] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  /* --- 🛠️ 修正：loadingステートを追加 --- */
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const init = async () => {
        setLoading(true);
        await Promise.all([
          fetchAlbumData(),
          fetchPhotos(),
          checkUserStatus()
        ]);
        setLoading(false);
      };
      init();
    }
  }, [id]);

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
      const { error: dbError } = await supabase.from('gallery_photos').delete().eq('id', photoId);
      if (dbError) throw dbError;

      const filePath = imageUrl.split('gallery/')[1];
      await supabase.storage.from('gallery').remove([filePath]);

      fetchPhotos();
    } catch (error: any) {
      alert('削除に失敗しました: ' + error.message);
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
      window.URL.revokeObjectURL(url);
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

      const { error: uploadError } = await supabase.storage.from('gallery').upload(filePath, file);
      if (uploadError) throw uploadError;

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
      alert('エラー: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-200 pb-32">
      <Header 
        variant="user"
        title={album?.name || '読み込み中...'}
        subtitle="奉仕活動の思い出アルバム"
        icon={ImageIcon}
        isAdminBadge={isAdmin}
        rightButtonType="member"
      />

      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3">
          <Link 
            href="/gallery" 
            className="flex-1 py-3 bg-white border border-slate-300 rounded-xl flex items-center justify-center gap-2 text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={16} /> アルバム一覧へ戻る
          </Link>

          <label className="flex-[2] py-3 bg-blue-900 border border-blue-950 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all hover:bg-blue-800">
            <Plus size={18} strokeWidth={3} />
            {uploading ? '送信中...' : '写真を投稿する'}
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {photos.map((photo) => {
            const canDelete = userId === photo.user_id || isAdmin === true;

            return (
              <div key={photo.id} className="bg-white p-3 rounded-[30px] shadow-sm border border-slate-200">
                <div className="aspect-video w-full rounded-2xl overflow-hidden relative mb-3">
                  <img src={photo.image_url} className="w-full h-full object-cover" alt="activity" />
                  
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(photo.id, photo.image_url)}
                      className="absolute top-2 right-2 bg-red-600/90 text-white p-2 rounded-xl shadow-lg hover:bg-red-700 active:scale-90 transition-all backdrop-blur-sm"
                    >
                      <Trash2 size={18} strokeWidth={2.5} />
                    </button>
                  )}
                </div>

                <div className="flex justify-between items-center px-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="bg-slate-100 p-1 rounded-full shrink-0">
                      <User size={12} className="text-slate-400" />
                    </div>
                    <span className="text-xs font-black text-slate-700 truncate">
                      L.{photo.full_name}
                    </span>
                  </div>

                  <button 
                    onClick={() => downloadImage(photo.image_url, photo.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-black text-[11px] shadow-sm active:scale-95 transition-all border border-blue-100 hover:bg-blue-100"
                  >
                    <Download size={14} strokeWidth={3} /> 保存
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* --- 🛠️ 修正：loading 変数がここで正しく使われるようになりました --- */}
        {photos.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-[30px] border-2 border-dashed border-slate-300">
            <p className="text-lg font-black text-slate-300 italic uppercase">No Photos Yet</p>
          </div>
        )}
      </main>
    </div>
  );
}