import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Card, Button, Badge, toast } from '@/components/ds';
import { useGroupsStore } from '@/stores/use-groups';
import { useDecksCardsStore } from '@/stores/use-decks-cards';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

const MOCK_MEMBERS = [
  { name: '김시냅스', role: '방장', joinedDaysAgo: 90 },
  { name: '이지식', role: '관리자', joinedDaysAgo: 60 },
  { name: '박학습', role: '멤버', joinedDaysAgo: 30 },
  { name: '최탐험', role: '멤버', joinedDaysAgo: 14 },
  { name: '정복습', role: '멤버', joinedDaysAgo: 7 },
  { name: '한기록', role: '멤버', joinedDaysAgo: 3 },
  { name: '강노트', role: '멤버', joinedDaysAgo: 1 },
];

interface ActivityEntry {
  who: string;
  what: string;
  hoursAgo: number;
}

const MOCK_ACTIVITY: ActivityEntry[] = [
  { who: '김시냅스', what: '새 카드 5장 추가', hoursAgo: 2 },
  { who: '이지식', what: '복습 세션 완료 (12장)', hoursAgo: 8 },
  { who: '박학습', what: '덱 "AWS SAA"에 카드 공유', hoursAgo: 24 },
  { who: '최탐험', what: '그룹에 가입', hoursAgo: 48 },
  { who: '김시냅스', what: '주간 리포트 작성', hoursAgo: 72 },
];

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const group = useGroupsStore((s) => (id ? s.groups[id] : undefined));
  const upsert = useGroupsStore((s) => s.upsert);
  const decksMap = useDecksCardsStore((s) => s.decks);
  const cardsMap = useDecksCardsStore((s) => s.cards);

  const sharedDecks = useMemo(() => {
    if (!group) return [];
    const all = Object.values(decksMap);
    return all.slice(0, group.sharedDeckCount).map((d) => ({
      ...d,
      cardCount: Object.values(cardsMap).filter((c) => c.deckId === d.id).length,
    }));
  }, [decksMap, cardsMap, group]);

  if (!group) {
    return (
      <div className="p-6 max-w-3xl space-y-3">
        <h1 className="display text-3xl">그룹을 찾을 수 없습니다</h1>
        <Link to="/app/groups" className="text-[#D97706] underline">← 그룹 목록으로</Link>
      </div>
    );
  }

  const visibleMembers = MOCK_MEMBERS.slice(0, Math.min(MOCK_MEMBERS.length, group.memberCount));
  const visibleActivity = group.joined ? MOCK_ACTIVITY : MOCK_ACTIVITY.slice(0, 2);

  const handleJoinOpen = () => {
    upsert({ ...group, joined: true, memberCount: group.memberCount + 1, lastActivityAt: Date.now() });
    toast({ message: `"${group.name}" 그룹에 가입했습니다`, tone: 'success' });
  };

  const handleJoinApproval = () => {
    toast({
      message: '가입 신청이 전송되었습니다. 방장의 승인을 기다려 주세요 (데모: 자동 승인 안 됨)',
      tone: 'info',
      duration: 4000,
    });
  };

  const handleLeave = () => {
    upsert({ ...group, joined: false, memberCount: Math.max(1, group.memberCount - 1) });
    toast({ message: `"${group.name}" 그룹을 탈퇴했습니다`, tone: 'info' });
    navigate('/app/groups');
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <Button variant="ghost" onClick={() => navigate('/app/groups')}>← 그룹 목록</Button>
      </div>

      <header className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="display text-3xl text-stone-900">{group.name}</h1>
            <p className="text-stone-600 mt-1">{group.description}</p>
          </div>
          <Badge
            tone={group.joinType === 'open' ? 'success' : group.joinType === 'approval' ? 'warning' : 'neutral'}
          >
            {group.joinType === 'open' ? '공개' : group.joinType === 'approval' ? '승인 필요' : '초대제'}
          </Badge>
        </div>
        <div className="text-sm text-stone-600 flex flex-wrap gap-x-4 gap-y-1">
          <span>👥 {group.memberCount} / {group.maxMembers}명</span>
          <span>📚 공유 덱 {group.sharedDeckCount}개</span>
          <span>마지막 활동: {formatDistanceToNow(group.lastActivityAt, { locale: ko, addSuffix: true })}</span>
        </div>
      </header>

      {!group.joined && <JoinPanel group={group} onOpen={handleJoinOpen} onApproval={handleJoinApproval} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card elevated className="space-y-3">
          <h2 className="display text-xl">멤버 ({visibleMembers.length}{visibleMembers.length < group.memberCount ? ` / ${group.memberCount}` : ''})</h2>
          <ul className="space-y-2">
            {visibleMembers.map((m, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-200 text-xs">
                  {m.name.slice(0, 1)}
                </span>
                <span className="text-stone-800">{m.name}</span>
                <Badge tone={m.role === '방장' ? 'amber' : m.role === '관리자' ? 'info' : 'neutral'}>{m.role}</Badge>
              </li>
            ))}
          </ul>
          {visibleMembers.length < group.memberCount && (
            <p className="text-xs text-stone-500">+ {group.memberCount - visibleMembers.length}명 더</p>
          )}
        </Card>

        <Card elevated className="space-y-3">
          <h2 className="display text-xl">공유 덱 ({sharedDecks.length})</h2>
          {sharedDecks.length === 0 ? (
            <p className="text-sm text-stone-500">아직 공유된 덱이 없습니다.</p>
          ) : (
            <ul className="space-y-2">
              {sharedDecks.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link to={`/app/decks`} className="text-stone-800 hover:text-[#D97706]">📚 {d.name}</Link>
                    <p className="text-xs text-stone-500">{d.description} · {d.cardCount}장</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card elevated className="space-y-3">
        <h2 className="display text-xl">최근 활동</h2>
        <ul className="space-y-2">
          {visibleActivity.map((a, i) => (
            <li key={i} className="text-sm text-stone-700">
              <span className="text-stone-500">
                {a.hoursAgo < 24 ? `${a.hoursAgo}시간 전` : `${Math.floor(a.hoursAgo / 24)}일 전`}
              </span>
              {' · '}
              <strong>{a.who}</strong>가(이) {a.what}
            </li>
          ))}
          {!group.joined && visibleActivity.length === 2 && (
            <li className="text-xs text-stone-500">…가입 후 전체 활동을 볼 수 있습니다.</li>
          )}
        </ul>
      </Card>

      {group.joined && (
        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleLeave}>그룹 탈퇴</Button>
        </div>
      )}
    </div>
  );
}

function JoinPanel({
  group,
  onOpen,
  onApproval,
}: {
  group: { joinType: 'open' | 'approval' | 'invite' };
  onOpen: () => void;
  onApproval: () => void;
}) {
  if (group.joinType === 'open') {
    return (
      <Card elevated className="space-y-2 border border-amber-200 bg-amber-50/50">
        <h3 className="display text-lg">바로 가입할 수 있는 그룹입니다</h3>
        <p className="text-sm text-stone-600">공개 그룹이므로 클릭 즉시 멤버가 됩니다.</p>
        <div className="pt-1">
          <Button onClick={onOpen}>지금 가입하기</Button>
        </div>
      </Card>
    );
  }
  if (group.joinType === 'approval') {
    return (
      <Card elevated className="space-y-2 border border-amber-200 bg-amber-50/50">
        <h3 className="display text-lg">방장의 승인이 필요한 그룹입니다</h3>
        <p className="text-sm text-stone-600">가입 신청을 보내면 방장이 검토 후 수락/거절합니다.</p>
        <div className="pt-1">
          <Button onClick={onApproval}>가입 신청 보내기</Button>
        </div>
      </Card>
    );
  }
  return (
    <Card elevated className="space-y-2 border border-stone-200 bg-stone-50">
      <h3 className="display text-lg">초대받은 사람만 가입할 수 있는 그룹입니다</h3>
      <p className="text-sm text-stone-600">초대 링크 또는 코드가 있어야 가입 가능합니다.</p>
      <div className="pt-1">
        <Button variant="secondary" disabled>초대코드 입력 (데모 미구현)</Button>
      </div>
    </Card>
  );
}
