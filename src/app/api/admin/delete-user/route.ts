import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
    }

    // 🚀 1. まず Authユーザーの削除を試みる
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    // Auth側で見つからなくても(User not found)、Profilesを消すために続行する
    if (authError && authError.message !== 'User not found') {
      console.error('Auth削除エラー:', authError.message);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // 🚀 2. profilesテーブルからも念のため直接削除を実行
    // (通常は外部キー制約で自動で消えますが、Authにユーザーがいない場合は手動で消す必要があります)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Profile削除エラー:', profileError.message);
    }

    return NextResponse.json({ success: true, note: authError?.message });
  } catch (err: any) {
    return NextResponse.json({ error: 'システムエラーが発生しました' }, { status: 500 });
  }
}