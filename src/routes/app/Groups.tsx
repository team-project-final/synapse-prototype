import { useState } from 'react';
import { Card, Button, Badge, toast } from '@/components/ds';
import { useGroupsStore } from '@/stores/use-groups';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Groups() {
  const groupsMap = useGroupsStore((s) => s.groups);
  const myGroups = Object.values(groupsMap).filter((g) => g.joined);
  const exploreGroups = Object.values(groupsMap).filter((g) => !g.joined);
  const [tab, setTab] = useState<'mine' | 'explore'>('mine');

  const groups = tab === 'mine' ? myGroups : exploreGroups;

  const enter = () => {
    toast({
      message: '이 화면은 데모에서 미구현 — 06_화면_기능_정의서 참조',
      tone: 'info',
      duration: 3500,
    });
  };

  return (
    <div className="p-6 max-w-5xl space-y-4">
      <h1 className="display text-3xl">스터디 그룹</h1>

      <div className="flex gap-2 border-b border-stone-200">
        <button
          onClick={() => setTab('mine')}
          className={`px-4 py-2 ${tab === 'mine' ? 'border-b-2 border-[#D97706] text-[#D97706]' : 'text-stone-600'}`}
        >
          내 그룹 ({myGroups.length})
        </button>
        <button
          onClick={() => setTab('explore')}
          className={`px-4 py-2 ${tab === 'explore' ? 'border-b-2 border-[#D97706] text-[#D97706]' : 'text-stone-600'}`}
        >
          그룹 탐색 ({exploreGroups.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((g) => (
          <Card key={g.id} elevated className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="display text-xl">{g.name}</h3>
                <p className="text-sm text-stone-600">{g.description}</p>
              </div>
              <Badge
                tone={g.joinType === 'open' ? 'success' : g.joinType === 'approval' ? 'warning' : 'neutral'}
              >
                {g.joinType === 'open' ? '공개' : g.joinType === 'approval' ? '승인 필요' : '초대제'}
              </Badge>
            </div>
            <div className="text-sm text-stone-600">
              <div>
                👥 {g.memberCount} / {g.maxMembers}명 · 📚 덱 {g.sharedDeckCount}개
              </div>
              <div className="text-xs text-stone-500 mt-1">
                마지막 활동: {formatDistanceToNow(g.lastActivityAt, { locale: ko, addSuffix: true })}
              </div>
            </div>
            <Button variant={g.joined ? 'primary' : 'secondary'} className="w-full" onClick={enter}>
              {g.joined ? '입장하기' : '가입하기'}
            </Button>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button variant="secondary" onClick={enter}>
          + 새 그룹 만들기
        </Button>
      </div>
    </div>
  );
}
