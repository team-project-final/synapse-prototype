import { useParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function DeckResult() {
  const { id } = useParams();
  return <Placeholder name={`세션 결과: ${id}`} />;
}
