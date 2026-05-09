import { useSearchParams } from 'react-router';
import { Placeholder } from '../../_Placeholder';
export default function AIGenerate() {
  const [params] = useSearchParams();
  return <Placeholder name={`AI 카드 생성: ${params.get('noteId') ?? ''}`} />;
}
