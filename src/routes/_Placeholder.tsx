export function Placeholder({ name }: { name: string }) {
  return (
    <div className="p-8">
      <h1 className="display text-3xl text-stone-900 mb-2">{name}</h1>
      <p className="text-stone-600">이 화면은 후속 마일스톤에서 구현됩니다.</p>
    </div>
  );
}
