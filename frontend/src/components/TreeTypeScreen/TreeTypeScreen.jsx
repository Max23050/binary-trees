import "./TreeTypeScreen.css";

function TreeTypeScreen({ onBack, onSelectBST }) {
  return (
    <div className="tree-screen-root">
      <header className="tree-screen-header">
        <button className="back-button" onClick={onBack}>
          ← Zpět
        </button>
      </header>

      <main className="tree-select">
        <h1 className="tree-select-title">Vyberte typ stromu</h1>

        <div className="tree-grid">
          {/*  */}
          <button className="tree-card active" onClick={onSelectBST}>
            <div className="tree-card-icon">🔍</div>
            <h2 className="tree-card-title">BST strom</h2>
            <ul className="tree-card-list">
              <li>Binární vyhledávací strom</li>
              <li>Bez vyvažování</li>
              <li>Vhodný pro základní pochopení</li>
            </ul>
          </button>

          {/*  */}
          <div className="tree-card disabled">
            <div className="tree-card-icon">🎯</div>
            <h2 className="tree-card-title">AVL strom</h2>
            <ul className="tree-card-list">
              <li>Výškově vyvážený</li>
              <li>Rotace LL / LR / RL / RR</li>
            </ul>
          </div>

          <div className="tree-card disabled">
            <div className="tree-card-icon">⚫⚪</div>
            <h2 className="tree-card-title">Dokonale vyváženy strom</h2>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TreeTypeScreen;
