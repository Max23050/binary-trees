import "./AlgorithmCodePane.css";

function AlgorithmCodePane({ lines, activeLine, algorithm, title }) {
  const shellClassName =
    "code-pane-shell" +
    (algorithm === "delete" ? " code-pane-shell--delete" : "");

  return (
    <div className={shellClassName}>
      <div className="code-pane-shell__header">
        <div className="code-pane-shell__traffic-lights">
          <span className="code-pane-shell__traffic-light code-pane-shell__traffic-light--red" />
          <span className="code-pane-shell__traffic-light code-pane-shell__traffic-light--yellow" />
          <span className="code-pane-shell__traffic-light code-pane-shell__traffic-light--green" />
        </div>
        <div className="code-pane-shell__meta">
          <span className="code-pane-shell__title">{title}</span>
          <span className="code-pane-shell__path">~/algorithms/bst.py</span>
        </div>
      </div>

      <pre className="code-pane">
        {lines.map((line, index) => (
          <div
            key={index}
            className={
              "code-pane-line" +
              (activeLine === index ? " code-pane-line--active" : "")
            }
          >
            <span className="code-pane-line-number">{index + 1}</span>
            <span className="code-pane-line-text">{line || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  );
}

export default AlgorithmCodePane;
