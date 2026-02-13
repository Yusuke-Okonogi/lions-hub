import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
    const API_KEY = process.env.GOOGLE_API_KEY;

    if (!CALENDAR_ID || !API_KEY) {
      return NextResponse.json({ error: ".env.localの設定が足りません" }, { status: 400 });
    }

    const now = new Date();
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?` + 
                `key=${API_KEY}&` +
                `timeMin=${timeMin}&` +
                `timeMax=${timeMax}&` +
                `singleEvents=true&` +
                `orderBy=startTime`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return NextResponse.json({ error: "Google APIエラー", details: data.error.message }, { status: 500 });
    }

    // --- 準備：Google側の有効なIDリストを作成 ---
    const googleItems = data.items || [];
    const validGoogleIds = googleItems.map((item: any) => item.id);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );

    // 3. データの整理
    const eventsToUpsert = googleItems.map((item: any) => ({
      google_event_id: item.id,
      title: item.summary || 'タイトルなし',
      description: item.description || '',
      start_time: item.start?.dateTime || item.start?.date,
      location: item.location || '',
    }));

    // 4. Supabaseへ保存 (新規追加・更新)
    if (eventsToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('events')
        .upsert(eventsToUpsert, { onConflict: 'google_event_id' });

      if (upsertError) throw new Error(`保存エラー: ${upsertError.message}`);
    }

    // --- 🛠️ 5. 不要なデータを削除 (お掃除ロジック) ---
    // 「今回の同期範囲内」かつ「Googleの最新IDリストに存在しない」予定を消す
    let deleteQuery = supabase
      .from('events')
      .delete()
      .gte('start_time', timeMin)
      .lte('start_time', timeMax);

    // Googleに予定が1つ以上ある場合は、それ以外のIDを消す
    // 予定が0個の場合は、範囲内の全データを消す（Googleで全削除されたケース）
    if (validGoogleIds.length > 0) {
      deleteQuery = deleteQuery.not('google_event_id', 'in', `(${validGoogleIds.join(',')})`);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error('お掃除エラー:', deleteError.message);
      // お掃除失敗は同期自体の失敗にはせず、ログに留めるのが実戦的です
    }

    return NextResponse.json({ 
      message: '同期成功！', 
      upserted: eventsToUpsert.length,
      deleted_range: `${timeMin} ～ ${timeMax}`
    });

  } catch (err: any) {
    return NextResponse.json({ error: "システムエラー", message: err.message }, { status: 500 });
  }
}