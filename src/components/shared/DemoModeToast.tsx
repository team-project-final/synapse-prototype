import { useEffect } from 'react';
import { toast } from '@/components/ds';

const KEY = 'synapse:demo-toast-shown';

export function DemoModeToast() {
  useEffect(() => {
    if (sessionStorage.getItem(KEY)) return;
    sessionStorage.setItem(KEY, '1');
    setTimeout(() => {
      toast({
        message: '데모 모드 — 자유롭게 둘러보세요. 우상단에서 초기화 가능.',
        tone: 'info',
        duration: 4000,
      });
    }, 800);
  }, []);
  return null;
}
