import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

// 🚀 ビルド時のエラーを回避するため、動的実行を強制する
export const dynamic = 'force-dynamic';

// 🚀 初期化関数を定義して安全に呼び出す
const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) return;

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // 🚀 ビルド時など、環境変数が未設定の場合は初期化しない
  if (!projectId || !clientEmail || !privateKey) {
    console.log('Firebase Admin environment variables are missing. Skipping initialization.');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
};

export async function POST(request: Request) {
  // 🚀 POSTリクエストが来た時に初めて初期化を試みる
  initializeFirebaseAdmin();

  if (admin.apps.length === 0) {
    return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
  }

  const { title, body, targetUserId } = await request.json();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 送信先トークンの取得
    let query = supabaseAdmin.from('profiles').select('fcm_token').not('fcm_token', 'is', null);
    
    if (targetUserId) {
      query = query.eq('id', targetUserId);
    }

    const { data: members } = await query;
    const tokens = members?.map(m => m.fcm_token).filter(t => t) || [];

    if (tokens.length === 0) {
      return NextResponse.json({ message: '宛先トークンが見つかりません' });
    }

    // Firebase経由で送信
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: { title, body },
    });

    return NextResponse.json({ success: true, count: response.successCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}