interface Candidate {
  id: string;
  title: string;
}

interface Props {
  query: string;
  candidates: Candidate[];
  onSelect: (title: string) => void;
}

export function WikilinkAutocomplete({ query, candidates, onSelect }: Props) {
  const filtered = candidates
    .filter((c) => c.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5);
  const hasExact = filtered.some((c) => c.title === query);

  return (
    <ul
      role="listbox"
      className="absolute z-10 bg-stone-50 border border-stone-300 rounded-md shadow-md min-w-[200px]"
    >
      {filtered.map((c) => (
        <li key={c.id}>
          <button
            type="button"
            onClick={() => onSelect(c.title)}
            className="w-full text-left px-3 py-2 hover:bg-stone-100 flex items-center gap-2"
          >
            📄 {c.title}
          </button>
        </li>
      ))}
      {!hasExact && query.trim() && (
        <li>
          <button
            type="button"
            onClick={() => onSelect(query)}
            className="w-full text-left px-3 py-2 hover:bg-[#FEF3C7] text-[#B45309] border-t border-stone-200"
          >
            + &quot;{query}&quot; 새 노트로 만들기
          </button>
        </li>
      )}
    </ul>
  );
}
