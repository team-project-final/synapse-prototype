import { useState } from 'react';
import { Button, Card } from '@/components/ds';
import { MermaidDiagram } from './MermaidDiagram';

interface Step {
  title: string;
  description: string;
  mermaid: string;
}

export function StepThroughDiagram({ steps }: { steps: Step[] }) {
  const [i, setI] = useState(0);
  const step = steps[i]!;
  return (
    <Card elevated>
      <div className="flex items-center justify-between mb-3">
        <h3 className="display text-lg">{step.title}</h3>
        <span className="text-sm text-stone-500 tabular-nums">
          {i + 1} / {steps.length}
        </span>
      </div>
      <p className="text-sm text-stone-600 mb-2">{step.description}</p>
      <MermaidDiagram source={step.mermaid} />
      <div className="flex gap-2 mt-3">
        <Button variant="secondary" size="sm" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← 이전
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={i === steps.length - 1}
          onClick={() => setI(i + 1)}
        >
          다음 →
        </Button>
        <Button size="sm" onClick={() => setI(0)}>
          처음부터
        </Button>
      </div>
    </Card>
  );
}
