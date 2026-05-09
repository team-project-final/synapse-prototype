import { Button, toast } from '@/components/ds';
import { useDemoStore } from '@/stores/use-demo';

export function DemoModeToggle() {
  const reset = useDemoStore((s) => s.reset);

  const handleReset = () => {
    if (!confirm('데모를 초기화할까요? 모든 사용자 데이터가 삭제되고 시드로 복원됩니다.')) return;
    reset();
    toast({ message: '데모가 초기화되었습니다', tone: 'success' });
    setTimeout(() => window.location.reload(), 600);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-stone-500 hidden sm:inline">데모 모드</span>
      <Button size="sm" variant="ghost" onClick={handleReset}>
        초기화
      </Button>
    </div>
  );
}
