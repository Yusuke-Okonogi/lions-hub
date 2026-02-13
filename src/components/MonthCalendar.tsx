'use client';

import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths 
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// 🛠️ Props に currentMonth と、月を変更するための関数を追加
interface Props {
  baseDate: Date;
  events: any[];
  onDateSelect: (date: Date) => void;
  onMonthChange: (date: Date) => void;
}

export default function MonthCalendar({ baseDate, events, onDateSelect, onMonthChange }: Props) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(baseDate), { locale: ja }),
    end: endOfWeek(endOfMonth(baseDate), { locale: ja }),
  });

return (
    <div className="bg-white rounded-[40px] shadow-xl p-4 border border-slate-100">
      {/* 月移動ヘッダー：親の baseDate を更新するように修正 */}
      <div className="flex justify-between items-center mb-6 px-2 py-2 bg-blue-50 rounded-3xl">
        <button 
          onClick={() => onMonthChange(subMonths(baseDate, 1))} 
          className="p-3 bg-white rounded-full shadow-sm text-blue-900 hover:bg-blue-100 transition-colors"
        >
          <ChevronLeft size={28} strokeWidth={3} />
        </button>
        <h3 className="text-2xl font-black text-blue-900">
          {format(baseDate, 'yyyy年 M月', { locale: ja })}
        </h3>
        <button 
          onClick={() => onMonthChange(addMonths(baseDate, 1))} 
          className="p-3 bg-white rounded-full shadow-sm text-blue-900 hover:bg-blue-100 transition-colors"
        >
          <ChevronRight size={28} strokeWidth={3} />
        </button>
      </div>

      {/* 曜日ラベル */}
      <div className="grid grid-cols-7 mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
          <div key={d} className={`text-center font-bold text-sm ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-slate-400'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), day));
          const isCurrentMonth = isSameMonth(day, baseDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toString()}
              onClick={() => onDateSelect(day)}
              className={`min-h-[80px] p-1 flex flex-col items-start justify-start rounded-2xl transition-all active:scale-95 border ${
                !isCurrentMonth ? 'opacity-30 border-transparent' : 
                isToday ? 'border-blue-500 bg-blue-50 shadow-inner' : 
                dayEvents.length > 0 ? 'border-blue-200 bg-blue-50/50' : 'border-transparent'
              }`}
            >
              <span className={`text-sm font-bold ml-1 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
                {format(day, 'd')}
              </span>

              <div className="w-full mt-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map(event => (
                  <div key={event.id} className="bg-blue-100 rounded-md px-1 py-0.5 text-[8px] text-blue-900 text-left truncate font-bold">
                    {format(new Date(event.start_time), 'HH:mm')} {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[8px] text-blue-500 pl-1">他{dayEvents.length - 2}件</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}