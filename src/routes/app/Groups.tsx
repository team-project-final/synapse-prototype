import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ulid } from 'ulid';
import { Card, Button, Badge, Dialog, Input, toast } from '@/components/ds';
import { useGroupsStore, type Group } from '@/stores/use-groups';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Groups() {
  const navigate = useNavigate();
  const groupsMap = useGroupsStore((s) => s.groups);
  const upsert = useGroupsStore((s) => s.upsert);
  const myGroups = Object.values(groupsMap).filter((g) => g.joined);
  const exploreGroups = Object.values(groupsMap).filter((g) => !g.joined);
  const [tab, setTab] = useState<'mine' | 'explore'>('mine');
  const [createOpen, setCreateOpen] = useState(false);

  const groups = tab === 'mine' ? myGroups : exploreGroups;

  const enter = (groupId: string) => {
    navigate(`/app/groups/${groupId}`);
  };

  const handleCreate = (input: CreateGroupInput) => {
    const group: Group = {
      id: ulid(),
      name: input.name.trim(),
      description: input.description.trim(),
      joinType: input.joinType,
      memberCount: 1,
      maxMembers: input.maxMembers,
      sharedDeckCount: 0,
      lastActivityAt: Date.now(),
      joined: true,
    };
    upsert(group);
    setCreateOpen(false);
    setTab('mine');
    toast({ message: `"${group.name}" 그룹이 생성되었습니다`, tone: 'success' });
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
            <Button
              variant={g.joined ? 'primary' : 'secondary'}
              className="w-full"
              onClick={() => enter(g.id)}
            >
              {g.joined ? '입장하기' : '가입하기'}
            </Button>
          </Card>
        ))}
      </div>

      <div className="text-center pt-4">
        <Button variant="secondary" onClick={() => setCreateOpen(true)}>
          + 새 그룹 만들기
        </Button>
      </div>

      <CreateGroupDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}

interface CreateGroupInput {
  name: string;
  description: string;
  joinType: 'open' | 'approval' | 'invite';
  maxMembers: number;
}

function CreateGroupDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateGroupInput) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinType, setJoinType] = useState<'open' | 'approval' | 'invite'>('open');
  const [maxMembers, setMaxMembers] = useState(20);
  const [touched, setTouched] = useState(false);

  const reset = () => {
    setName('');
    setDescription('');
    setJoinType('open');
    setMaxMembers(20);
    setTouched(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (name.trim().length === 0) return;
    if (maxMembers < 2 || maxMembers > 1000) return;
    onCreate({ name, description, joinType, maxMembers });
    reset();
  };

  const nameError = touched && name.trim().length === 0;

  return (
    <Dialog open={open} onClose={handleClose} title="새 그룹 만들기">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="group-name" className="text-sm text-stone-700">
            그룹 이름 <span className="text-[#DC2626]">*</span>
          </label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: TypeScript 스터디"
            aria-invalid={nameError}
            autoFocus
          />
          {nameError && <p className="text-xs text-[#DC2626]">이름을 입력하세요</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="group-desc" className="text-sm text-stone-700">설명</label>
          <Input
            id="group-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 그룹은 무엇을 하나요?"
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm text-stone-700">가입 방식</legend>
          <div className="space-y-1 text-sm">
            {(['open', 'approval', 'invite'] as const).map((v) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="joinType"
                  value={v}
                  checked={joinType === v}
                  onChange={() => setJoinType(v)}
                />
                <span>
                  {v === 'open' ? '공개 — 누구나 가입' : v === 'approval' ? '승인 필요' : '초대제'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="group-max" className="text-sm text-stone-700">최대 인원 (2–1000)</label>
          <Input
            id="group-max"
            type="number"
            min={2}
            max={1000}
            value={maxMembers}
            onChange={(e) => setMaxMembers(Number(e.target.value))}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose}>취소</Button>
          <Button type="submit">만들기</Button>
        </div>
      </form>
    </Dialog>
  );
}
