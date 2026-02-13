'use client';

import { useState } from 'react';
import Link from 'next/link';
import PasswordSettingsModal from '@/components/PasswordSettingsModal';
import { ShieldCheck, LayoutDashboard, ArrowLeft, LucideIcon, Lock } from 'lucide-react';

interface HeaderProps {
  topLabel?: string;
  club?: string;
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  isAdminBadge?: boolean;
  rightButtonType: 'admin' | 'member' | 'adminTop' | 'none';
  variant?: 'user' | 'admin'; 
}

export default function Header({ 
  topLabel = "LIONS HUB", 
  club = "330-A地区(1R - 3Z) 東京六本木ライオンズクラブ",
  title, 
  subtitle, 
  icon: Icon, 
  isAdminBadge, 
  rightButtonType, 
  variant = 'user' 
}: HeaderProps) {
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isDark = variant === 'admin';
  const headerBg = isDark ? 'bg-slate-900' : 'bg-[#003366]'; 
  const borderCol = isDark ? 'border-yellow-600 shadow-yellow-900/20' : 'border-blue-950 shadow-black/20';

  return (
    <header className={`${headerBg} text-white p-6 md:p-8 rounded-b-[40px] md:rounded-b-[50px] mb-8 shadow-2xl border-b-8 ${borderCol} transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
        
        {/* 左側：タイトルエリア */}
        <div className="flex-1 w-full">
          <div className="flex items-center gap-3 mb-2">
            <h1 className={`text-lg md:text-xl font-bold tracking-tighter uppercase ${isDark ? 'text-yellow-500' : 'text-yellow-400'}`}>
              {topLabel}
            </h1>
            {isAdminBadge && (
              <span className="bg-yellow-500 text-slate-900 px-3 py-0.5 rounded-full text-[10px] font-black shadow-md shrink-0">
                事務局（管理者）
              </span>
            )}
          </div>

          <p className={`text-[14px] font-bold mb-4 tracking-wider opacity-80 ${isDark ? 'text-slate-400' : 'text-blue-200'}`}>
            {club}
          </p>

          <div className="flex items-center gap-4 mb-2">
            {Icon && <Icon className="text-yellow-500 shrink-0 w-10 h-10 md:w-11 md:h-11" strokeWidth={3} />}
            <p className="text-3xl font-black leading-tight tracking-tight">
              {title}
            </p>
          </div>
          
          <div className="mt-1">
            <p className={`text-base md:text-lg font-bold ${isDark ? 'text-slate-400' : 'text-blue-100 opacity-80'}`}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* --- 🛠️ 右側：アクションボタンエリア（縦並び） --- */}
        <div className="w-full md:w-auto shrink-0 flex flex-col gap-3">
          
          {/* 1. 最優先：パスワード設定ボタン（大きく目立たせる） */}
          {variant === 'user' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full md:min-w-[180px] flex items-center justify-center gap-3 px-6 py-4 bg-yellow-500 text-slate-900 rounded-[25px] font-black shadow-lg hover:bg-yellow-400 active:scale-95 transition-all border-b-4 border-yellow-700"
            >
              <Lock size={20} strokeWidth={3} />
              <span className="text-sm">パスワード設定</span>
            </button>
          )}

          {/* 2. 管理画面ボタン（シンプルに横並び・ADMIN表記なし） */}
          {rightButtonType === 'admin' && isAdminBadge && (
            <Link 
              href="/admin" 
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-[20px] font-bold text-sm hover:bg-white/20 transition-all active:scale-95"
            >
              <ShieldCheck size={18} className="text-yellow-500" />
              <span>管理画面を開く</span>
            </Link>
          )}

          {/* その他の戻るボタン等 */}
          {rightButtonType === 'member' && (
            <Link 
              href="/dashboard" 
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-[20px] font-bold text-sm hover:bg-white/20 transition-all active:scale-95"
            >
              <LayoutDashboard size={18} className="text-yellow-500" />
              <span>会員画面へ戻る</span>
            </Link>
          )}

          {rightButtonType === 'adminTop' && (
            <Link 
              href="/admin" 
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 border border-white/20 text-white rounded-[20px] font-bold text-sm hover:bg-white/20 transition-all active:scale-95"
            >
              <ArrowLeft size={18} className="text-yellow-500" />
              <span>管理トップへ戻る</span>
            </Link>
          )}
        </div>
      </div>

      {/* モーダル表示 */}
      {isModalOpen && (
        <PasswordSettingsModal onClose={() => setIsModalOpen(false)} />
      )}
    </header>
  );
}