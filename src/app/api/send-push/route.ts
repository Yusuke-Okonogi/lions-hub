import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request: Request) {
  const { title, body, targetUserId } = await request.json();

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 👈 これがVercelにあるか確認！
  );

  try {
    // 🚀 実際にSupabaseからトークンを拾う処理を追加
    let query = supabaseAdmin.from('profiles').select('fcm_token').not('fcm_token', 'is', null);
    if (targetUserId) {
      query = query.eq('id', targetUserId);
    }
    const { data: members } = await query;
    const tokens = members?.map(m => m.fcm_token).filter(t => t) || [];

    if (tokens.length === 0) return NextResponse.json({ message: '宛先トークンが見つかりません' });

    // 🚀 Firebaseに送信を依頼
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      notification: { title, body },
    });

    return NextResponse.json({ success: true, count: response.successCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}