export function TechOverviewDiagram({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div className="overflow-x-auto" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
