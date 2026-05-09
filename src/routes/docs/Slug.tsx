import { useParams } from 'react-router';
import { Placeholder } from '../_Placeholder';
export default function DocsSlug() {
  const { slug } = useParams();
  return <Placeholder name={`문서: ${slug}`} />;
}
