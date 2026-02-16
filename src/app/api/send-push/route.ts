import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        // 🚀 2. 環境変数名を NEXT_PUBLIC_... に合わせる
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, 
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // 改行コードの処理をより確実に
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export async function POST(request: Request) {
  const { title, body, targetUserId } = await request.json();

  // Supabase Adminで全会員のトークンを取得
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    let query = supabaseAdmin.from('profiles').select('fcm_token').not('fcm_token', 'is', null);
    
    // 特定のユーザー宛なら絞り込み
    if (targetUserId) {
      query = query.eq('id', targetUserId);
    }

    const { data: members } = await query;
    const tokens = members?.map(m => m.fcm_token).filter(t => t) || [];

    if (tokens.length === 0) return NextResponse.json({ message: 'No tokens found' });

    // Firebase経由で一斉送信
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: { title, body },
    });

    return NextResponse.json({ success: true, count: response.successCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}