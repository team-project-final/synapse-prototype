import { useParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function NoteEdit() {
  const { id } = useParams();
  return <Placeholder name={`노트 편집: ${id}`} />;
}
