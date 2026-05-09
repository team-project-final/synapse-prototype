import { useParams } from 'react-router';
import { NoteEditor } from '@/components/feature/NoteEditor';
export default function NoteEdit() {
  const { id } = useParams();
  return <NoteEditor noteId={id} />;
}
