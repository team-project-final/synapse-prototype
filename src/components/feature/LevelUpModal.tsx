import { Dialog, Button } from '@/components/ds';
import { CelebrationParticles } from './CelebrationParticles';

interface Props {
  open: boolean;
  newLevel: number;
  newTitle: string;
  onClose: () => void;
}

export function LevelUpModal({ open, newLevel, newTitle, onClose }: Props) {
  return (
    <>
      {open && <CelebrationParticles count={20} duration={600} />}
      <Dialog open={open} onClose={onClose}>
        <div className="text-center space-y-3">
          <div className="display text-4xl text-stone-900">🏅 레벨 {newLevel} 달성!</div>
          <div className="text-lg text-[#D97706]">{newTitle}</div>
          <p className="text-sm text-stone-600">꾸준함이 자산입니다.</p>
          <Button onClick={onClose}>계속하기</Button>
        </div>
      </Dialog>
    </>
  );
}
