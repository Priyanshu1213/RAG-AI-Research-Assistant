// Use a library like 'react-force-graph' for visualization
const KnowledgeGraph = () => {
  // Fetch insights from backend and render graph
  return (
    <div>
      <h4 className="text-sm font-semibold">Knowledge Graph</h4>
      <div className="kicker mt-2">
        Visualize relationships and entity connections extracted from uploaded
        papers.
      </div>
      <div
        className="mt-4"
        style={{
          minHeight: 120,
          borderRadius: 8,
          background: "rgba(15,23,42,0.02)",
          padding: 12,
        }}
      >
        <div className="kicker">
          Placeholder — integrate react-force-graph here
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
