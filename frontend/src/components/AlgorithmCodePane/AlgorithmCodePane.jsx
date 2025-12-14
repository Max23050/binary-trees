import './AlgorithmCodePane.css';

function AlgorithmCodePane({ lines, activeLine }) {
    return (
        <pre className="code-pane">
            {lines.map((line, index) => (
                <div
                    key={index}
                    className={
                        "code-pane-line" + (activeLine === index ? " code-pane-line--active" : "")
                    }
                >
                    <span className="code-pane-line-number">{index + 1}</span>
                    <span className="code-pane-line-text">{line}</span>
                </div>
            ))}
        </pre>
    );
}

export default AlgorithmCodePane;