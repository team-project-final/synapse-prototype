import { useParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function DeckReview() {
  const { id } = useParams();
  return <Placeholder name={`복습 세션: ${id}`} />;
}
