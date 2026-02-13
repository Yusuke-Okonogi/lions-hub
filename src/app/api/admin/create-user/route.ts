import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, fullName, memberNo } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // --- 🛠️ 1. 全ユーザーから該当のメールアドレスを探す ---
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = users.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      // --- 🛠️ 2. すでに存在する場合：パスワードを上書き更新 ---
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { 
          password: password, 
          email_confirm: true,
          user_metadata: { full_name: fullName }
        }
      );
      if (updateError) throw updateError;
      userId = updateData.user.id;
    } else {
      // --- 🛠️ 3. 新規の場合：新しく作成 ---
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });
      if (authError) throw authError;
      userId = authData.user.id;
    }

    // --- 🛠️ 4. profilesテーブルを更新 (upsertを使うことで重複エラーを回避) ---
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        email: email,
        member_no: memberNo, 
        is_admin: false
      }, { onConflict: 'id' }); // IDが重なったら上書きする設定

    if (profileError) throw profileError;

    return NextResponse.json({ 
      message: existingUser ? '既存ユーザーのパスワードを更新しました' : '新規会員登録に成功しました' 
    });

  } catch (error: any) {
    console.error('API Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}