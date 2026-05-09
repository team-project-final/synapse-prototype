import { useState } from 'react';
import { Button } from '@/components/ds';

interface Props {
  front: string;
  back: string;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
}

export function FlashCard({ front, back, onRate }: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-6">
      <div
        className="relative min-h-[280px] w-full max-w-2xl mx-auto rounded-lg bg-stone-50 shadow-md p-8 flex items-center justify-center text-center cursor-pointer transition-transform duration-300"
        onClick={() => !revealed && setRevealed(true)}
        role="button"
        tabIndex={0}
        aria-label="카드 답 보기"
      >
        {!revealed ? (
          <div>
            <p className="display text-2xl text-stone-900 mb-6">{front}</p>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(true);
              }}
            >
              👁 답 보기
            </Button>
          </div>
        ) : (
          <div className="space-y-4 w-full">
            <p className="display text-xl text-stone-700">Q: {front}</p>
            <hr className="border-stone-200" />
            <p className="text-lg text-stone-900 whitespace-pre-line">A: {back}</p>
          </div>
        )}
      </div>

      {revealed && (
        <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
          <RateButton
            label="Again"
            hint="<1분"
            onClick={() => {
              onRate(1);
              setRevealed(false);
            }}
            accent="error"
            hotkey="1"
          />
          <RateButton
            label="Hard"
            hint="3일"
            onClick={() => {
              onRate(2);
              setRevealed(false);
            }}
            accent="warning"
            hotkey="2"
          />
          <RateButton
            label="Good"
            hint="7일"
            onClick={() => {
              onRate(3);
              setRevealed(false);
            }}
            accent="info"
            hotkey="3"
          />
          <RateButton
            label="Easy"
            hint="14일"
            onClick={() => {
              onRate(4);
              setRevealed(false);
            }}
            accent="success"
            hotkey="4"
          />
        </div>
      )}
    </div>
  );
}

function RateButton({
  label,
  hint,
  onClick,
  accent,
  hotkey,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  accent: string;
  hotkey: string;
}) {
  const colorMap: Record<string, string> = {
    error: 'border-[#DC2626] text-[#DC2626] hover:bg-red-50',
    warning: 'border-[#F59E0B] text-[#F59E0B] hover:bg-amber-50',
    info: 'border-[#0EA5E9] text-[#0EA5E9] hover:bg-sky-50',
    success: 'border-[#16A34A] text-[#16A34A] hover:bg-green-50',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-md border-2 bg-white py-3 flex flex-col items-center transition-colors ${colorMap[accent]}`}
    >
      <span className="font-medium">{label}</span>
      <span className="text-xs text-stone-500">{hint}</span>
      <span className="text-[10px] text-stone-400 mt-1">[{hotkey}]</span>
    </button>
  );
}
