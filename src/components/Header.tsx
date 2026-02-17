'use client';

import { useState } from 'react';
import Link from 'next/link';
import PasswordSettingsModal from '@/components/PasswordSettingsModal';
import { ShieldCheck, LayoutDashboard, ArrowLeft, LucideIcon, Lock, User, Sun } from 'lucide-react';

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

  // 🚀 ボタンの共通スタイル定義
  const commonBtnClass = "w-full md:min-w-[170px] flex items-center justify-center gap-2 px-4 py-4 rounded-[25px] font-[900] shadow-xl active:scale-95 transition-all border-b-4";

  return (
    <header className={`${headerBg} text-white p-6 md:p-8 rounded-b-[40px] md:rounded-b-[50px] mb-8 shadow-2xl border-b-8 ${borderCol} transition-colors duration-500`}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 md:gap-4">
        
        {/* 左側：タイトルエリア */}
        <div className="flex-1 w-full text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
            <div className="flex flex-col leading-none">
              <h1 className="text-2xl font-[900] tracking-tighter uppercase flex items-baseline">
                <span className={isDark ? 'text-yellow-500' : 'text-white'}>LIONS</span>
                <span className="text-yellow-400 ml-1">HUB</span>
              </h1>
              <div className="h-[3px] w-full bg-yellow-400 mt-0.5 rounded-full" />
            </div>

            {isAdminBadge && (
              <span className="bg-yellow-500 text-slate-900 px-3 py-1 rounded-full text-[12px] font-[900] shadow-md shrink-0 uppercase tracking-wider">
                管理者
              </span>
            )}
          </div>

          <p className={`text-[14px] font-bold mb-2 tracking-widest border-l-2 pl-3 ${isDark ? 'text-slate-400 border-yellow-600' : 'text-blue-200 border-blue-400'}`}>
            {club}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
            {Icon && <Icon className="text-yellow-400 shrink-0 w-10 h-10 md:w-12 md:h-12 drop-shadow-lg" strokeWidth={3} />}
            <p className="text-3xl font-[900] leading-tight tracking-tighter">
              {title}
            </p>
          </div>
          
          <div className="mt-1">
            <p className={`text-base text-s font-bold ${isDark ? 'text-slate-400' : 'text-blue-100 opacity-80'}`}>
              {subtitle}
            </p>
          </div>
        </div>

        {/* --- 右側：アクションボタンエリア --- */}
        <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
          {/* 1. 通知設定ボタン */}
          {variant === 'user' && (
            <Link 
              href="/profile"
              className={`${commonBtnClass} bg-white text-[#003366] border-slate-300 hover:bg-blue-50`}
            >
              <User size={18} strokeWidth={3} />
              <span className="text-xs">通知設定</span>
            </Link>
          )}

          {/* 2. パスワード設定ボタン */}
          {variant === 'user' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`${commonBtnClass} bg-yellow-500 text-slate-900 border-yellow-700 hover:bg-yellow-400`}
            >
              <Lock size={18} strokeWidth={3} />
              <span className="text-xs">パスワード設定</span>
            </button>
          )}

          {/* 3. 管理画面/会員画面切り替えボタン */}
          {rightButtonType === 'admin' && isAdminBadge && (
            <Link 
              href="/admin" 
              className={`${commonBtnClass} bg-slate-800/50 text-white border-slate-900 hover:bg-slate-700 backdrop-blur-sm`}
            >
              <ShieldCheck size={20} className="text-yellow-500" />
              <span className="text-xs tracking-widest">管理画面</span>
            </Link>
          )}

          {rightButtonType === 'member' && (
            <Link 
              href="/dashboard" 
              className={`${commonBtnClass} bg-slate-800/50 text-white border-slate-900 hover:bg-slate-700 backdrop-blur-sm`}
            >
              <LayoutDashboard size={20} className="text-yellow-500" />
              <span className="text-sm tracking-widest">会員画面</span>
            </Link>
          )}

          {rightButtonType === 'adminTop' && (
            <Link 
              href="/admin" 
              className={`${commonBtnClass} bg-slate-800/50 text-white border-slate-900 hover:bg-slate-700 backdrop-blur-sm`}
            >
              <ArrowLeft size={20} className="text-yellow-500" />
              <span className="text-sm tracking-widest">管理トップ</span>
            </Link>
          )}
        </div>
      </div>

      {isModalOpen && (
        <PasswordSettingsModal onClose={() => setIsModalOpen(false)} />
      )}
    </header>
  );
}