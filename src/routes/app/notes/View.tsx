import { useParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function NoteView() {
  const { id } = useParams();
  return <Placeholder name={`노트 상세: ${id}`} />;
}
