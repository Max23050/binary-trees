import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import "./BSTVisualizer.css";
import AlgorithmCodePane from "../AlgorithmCodePane/AlgorithmCodePane";


const insertCodeLines = [
  "def insert(root, key):",
  "    if root is None:",
  "        return Node(key)",
  "    if key < root.key:",
  "        root.left = insert(root.left, key)",
  "    elif key > root.key:",
  "        root.right = insert(root.right, key)",
  "    return root",
];



function createNode(key) {
  const id =
    (typeof crypto !== "undefined" &&
      crypto.randomUUID &&
      crypto.randomUUID()) ||
    `node-${key}-${Math.random().toString(36).slice(2)}`;
  return { key, left: null, right: null, id };
}

function insertNode(node, key) {
  if (!node) return createNode(key);
  if (key === node.key) return node;
  if (key < node.key) return { ...node, left: insertNode(node.left, key) };
  return { ...node, right: insertNode(node.right, key) };
}

function buildRandomTree() {
  const values = new Set();
  while (values.size < 10) values.add(1 + Math.floor(Math.random() * 99));
  let r = null;
  [...values].forEach((v) => {
    r = insertNode(r, v);
  });
  return r;
}

function findPath(node, key, path = []) {
  if (!node) return { path, found: false };
  path.push(node.key);
  if (key === node.key) return { path, found: true };
  if (key < node.key) return findPath(node.left, key, path);
  return findPath(node.right, key, path);
}

function getHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

function getCount(node) {
  if (!node) return 0;
  return 1 + getCount(node.left) + getCount(node.right);
}

function deleteNode(node, key) {
  if (!node) return null;

  if (key < node.key) {
    return { ...node, left: deleteNode(node.left, key) };
  }
  if (key > node.key) {
    return { ...node, right: deleteNode(node.right, key) };
  }

  // key === node.key
  if (!node.left && !node.right) return null;
  if (!node.left) return node.right;
  if (!node.right) return node.left;

  let min = node.right;
  while (min.left) min = min.left;
  const newRight = deleteNode(node.right, min.key);
  return { ...node, key: min.key, right: newRight };
}

// --- utils ---

function cloneTree(node) {
  if (!node) return null;
  return {
    key: node.key,
    id: node.id,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function computeLayout(
  root,
  { pathKeys = [], highlightKeys = [], newNodeKey = null } = {}
) {
  if (!root) {
    return { nodes: [], links: [], width: 800, height: 240 };
  }

  const highlightSet = new Set([...pathKeys, ...highlightKeys]);
  const newNode = newNodeKey;

  const pathPairs = new Set();
  for (let i = 0; i < pathKeys.length - 1; i += 1) {
    const from = pathKeys[i];
    const to = pathKeys[i + 1];
    pathPairs.add(`${from}->${to}`);
  }

  const inorder = [];
  (function walk(node) {
    if (!node) return;
    walk(node.left);
    inorder.push(node);
    walk(node.right);
  })(root);

  const positions = new Map();
  inorder.forEach((n, i) => positions.set(n, { xIndex: i }));

  const nodes = [];
  const links = [];
  const levelGap = 90;
  const radius = 18;

  (function dfs(node, depth = 0) {
    if (!node) return;
    const pos = positions.get(node);
    nodes.push({
      key: node.key,
      id: node.id,
      depth,
      xIndex: pos.xIndex,
      r: radius,
      inPath: highlightSet.has(node.key),
      isNew: newNode != null && newNode === node.key,
    });
    if (node.left) {
      links.push({ sourceKey: node.key, targetKey: node.left.key });
      dfs(node.left, depth + 1);
    }
    if (node.right) {
      links.push({ sourceKey: node.key, targetKey: node.right.key });
      dfs(node.right, depth + 1);
    }
  })(root);

  const width = Math.max(640, (inorder.length + 1) * 50);
  const xGap = width / (inorder.length + 1);

  const nodeMap = new Map();
  nodes.forEach((n) => {
    n.x = Math.round((n.xIndex + 1) * xGap);
    n.y = 50 + n.depth * levelGap;
    nodeMap.set(n.key, n);
  });

  const linkCoords = links.map((l) => {
    const s = nodeMap.get(l.sourceKey);
    const t = nodeMap.get(l.targetKey);
    return {
      id: `${l.sourceKey}-${l.targetKey}`,
      x1: s.x,
      y1: s.y,
      x2: t.x,
      y2: t.y,
      inPath: pathPairs.has(`${l.sourceKey}->${l.targetKey}`),
    };
  });

  const height = (Math.max(...nodes.map((n) => n.y)) || 0) + 60;
  return { nodes, links: linkCoords, width, height };
}



function buildInsertSteps(root, key) {
  const steps = [];
  const rootCopy = cloneTree(root);
  const path = [];

  function pushStep(
    desc,
    codeLine,
    currentKey = null,
    newNodeKey = null,
    showArrow = false,
    arrowPath = null
  ) {
    steps.push({
      id: `${steps.length}-${Date.now()}`,
      tree: cloneTree(rootCopy),
      highlightNodes: currentKey != null ? [currentKey] : [],
      highlightPath: [...path],
      description: desc,
      codeLine,
      newNodeKey,
      showArrow,
      arrowPath,
    });
  }


  if (!rootCopy) {
    const newRoot = createNode(key);
    steps.push({
      id: "insert-empty",
      tree: cloneTree(newRoot),
      highlightNodes: [key],
      highlightPath: [key],
      description: `Strom je prázdný, vytváříme kořen s klíčem ${key}.`,
      codeLine: 1, // if root is None
      newNodeKey: key,
      showArrow: false,
    });
    steps.push({
      id: "insert-empty-done",
      tree: cloneTree(newRoot),
      highlightNodes: [key],
      highlightPath: [key],
      description: `Vložení ${key} dokončeno.`,
      codeLine: 7, // return root
      newNodeKey: key,
      showArrow: true,
      arrowPath: [key],
    });
    return { steps, finalRoot: newRoot };
  }

  let node = rootCopy;
  pushStep(`Začínáme vkládat klíč ${key}.`, 0, node.key);

  while (node) {
    path.push(node.key);

    if (key === node.key) {
      pushStep(
        `Klíč ${key} už ve stromu existuje, nic nevkládáme.`,
        7,
        node.key
      );
      return { steps, finalRoot: rootCopy };
    } else if (key < node.key) {
      // сравнение
      pushStep(
        `Porovnání: ${key} < ${node.key} → jdeme do levého podstromu.`,
        3,
        node.key,
        null,
        true,
        node.left ? [...path, node.left.key] : null
      );

      if (!node.left) {
        node.left = createNode(key);
        path.push(node.left.key);
        pushStep(
          `Našli jsme volné místo, vytváříme levého potomka s klíčem ${key}.`,
          2, // return Node(key)
          node.left.key,
          node.left.key,
          true,
          [...path]
        );
        break;
      } else {
        pushStep(
          `Voláme insert na levém podstromu (rekurze).`,
          4, // root.left = insert(root.left, key)
          node.left.key,
          null,
          true,
          [...path, node.left.key]
        );
        node = node.left;
      }
    } else {
      // key > node.key
      pushStep(
        `Porovnání: ${key} > ${node.key} → jdeme do pravého podstromu.`,
        5,
        node.key,
        null,
        true,
        node.right ? [...path, node.right.key] : null
      );

      if (!node.right) {
        node.right = createNode(key);
        path.push(node.right.key);
        pushStep(
          `Našli jsme volné místo, vytváříme pravého potomka s klíčem ${key}.`,
          2, // return Node(key)
          node.right.key,
          node.right.key,
          true,
          [...path]
        );
        break;
      } else {
        // а здесь строка root.right = insert(...)
        pushStep(
          `Voláme insert na pravém podstromu (rekurze).`,
          6, // root.right = insert(root.right, key)
          node.right.key,
          null,
          true,
          [...path, node.right.key]
        );
        node = node.right;
      }
    }
  }

  steps.push({
    id: "insert-done",
    tree: cloneTree(rootCopy),
    highlightNodes: [key],
    highlightPath: [...path],
    description: `Vložení ${key} dokončeno.`,
    codeLine: 7, // return root
    newNodeKey: key,
    showArrow: true,
    arrowPath: [...path],
  });

  return { steps, finalRoot: rootCopy };
}


// ===== КОМПОНЕНТ =====

function BSTVisualizer({ onBack }) {
  const svgRef = useRef(null);

  const [root, setRoot] = useState(null);
  const [highlightKeys, setHighlightKeys] = useState([]);
  const [insertValue, setInsertValue] = useState("25");
  const [searchValue, setSearchValue] = useState("25");
  const [deleteValue, setDeleteValue] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  const [mode, setMode] = useState("instant"); // "instant" | "steps"
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stats = {
    count: getCount(root),
    height: getHeight(root),
  };

  const hasSteps = mode === "steps" && steps.length > 0;
  const currentStep = hasSteps ? steps[currentStepIndex] : null;
  const activeCodeLine = currentStep ? currentStep.codeLine : null;
  const stepDescription = currentStep ? currentStep.description : "";

  useEffect(() => {
    const hasStepsLocal = mode === "steps" && steps.length > 0;
    const step = hasStepsLocal ? steps[currentStepIndex] : null;

    const treeForRender = hasStepsLocal ? step.tree : root;

    const showArrow = hasStepsLocal ? !!step.showArrow : false;
    const pathHighlight = hasStepsLocal
      ? showArrow
        ? step.arrowPath || step.highlightPath || []
        : step.highlightPath || []
      : highlightKeys;
    const nodeHighlight = hasStepsLocal
      ? Array.from(
          new Set([...(step.highlightPath || []), ...(step.highlightNodes || [])])
        )
      : highlightKeys;
    const newNodeKey = hasStepsLocal ? step.newNodeKey || null : null;

    const svg = d3.select(svgRef.current);
    let gLinks = svg.select("g.links");
    let gNodes = svg.select("g.nodes");
    let defs = svg.select("defs");

    if (gLinks.empty()) gLinks = svg.append("g").attr("class", "links");
    if (gNodes.empty()) gNodes = svg.append("g").attr("class", "nodes");
    if (defs.empty()) defs = svg.append("defs");

    let arrowMarker = defs.select("#bst-arrow-head");
    if (arrowMarker.empty()) {
      arrowMarker = defs.append("marker").attr("id", "bst-arrow-head");
      arrowMarker.append("path").attr("d", "M 0 0 L 8 5 L 0 10 z");
    }

    arrowMarker
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 15)
      .attr("refY", 5)
      .attr("markerWidth", 8)
      .attr("markerHeight", 8)
      .attr("orient", "auto-start-reverse")
      .attr("markerUnits", "strokeWidth");

    arrowMarker.select("path").attr("fill", "#16a34a");

    const { nodes, links, width, height } = computeLayout(treeForRender, {
      pathKeys: pathHighlight,
      highlightKeys: nodeHighlight,
      newNodeKey,
    });

    svg.transition().duration(400).attr("viewBox", `0 0 ${width} ${height}`);

    const linkSel = gLinks.selectAll("line.link").data(links, (d) => d.id);

    linkSel
      .exit()
      .transition()
      .duration(300)
      .style("opacity", 0)
      .remove();

    const linkEnter = linkSel
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", (d) => (d.inPath ? "#16a34a" : "#CBD5E1"))
      .attr("stroke-width", (d) => (d.inPath ? 3 : 2))
      .attr("stroke-linecap", "round")
      .attr("marker-end", (d) =>
        showArrow && d.inPath ? "url(#bst-arrow-head)" : null
      )
      .attr("x1", (d) => d.x1)
      .attr("y1", (d) => d.y1)
      .attr("x2", (d) => d.x1)
      .attr("y2", (d) => d.y1)
      .style("opacity", 0);

    linkEnter
      .merge(linkSel)
      .transition()
      .duration(400)
      .style("opacity", 1)
      .attr("stroke", (d) => (d.inPath ? "#16a34a" : "#CBD5E1"))
      .attr("stroke-width", (d) => (d.inPath ? 3 : 2))
      .attr("stroke-linecap", "round")
      .attr("marker-end", (d) =>
        showArrow && d.inPath ? "url(#bst-arrow-head)" : null
      )
      .attr("x1", (d) => d.x1)
      .attr("y1", (d) => d.y1)
      .attr("x2", (d) => d.x2)
      .attr("y2", (d) => d.y2);

    const nodeSel = gNodes.selectAll("g.node").data(nodes, (d) => d.id);

    nodeSel
      .exit()
      .transition()
      .duration(300)
      .style("opacity", 0)
      .remove();

    const nodeEnter = nodeSel
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x}, ${d.y - 20})`)
      .style("opacity", 0);

    nodeEnter.append("circle").attr("r", (d) => d.r);

    nodeEnter
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    const nodeMerge = nodeEnter.merge(nodeSel);

    nodeMerge
      .transition()
      .duration(400)
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .style("opacity", 1);

    nodeMerge
      .select("circle")
      .transition()
      .duration(250)
      .attr("r", (d) => d.r)
      .attr("fill", (d) =>
        d.isNew ? "#E0F2FE" : d.inPath ? "#DCFCE7" : "#ffffff"
      )
      .attr("stroke", (d) =>
        d.isNew ? "#0284C7" : d.inPath ? "#16A34A" : "#9CA3AF"
      )
      .attr("stroke-width", (d) => (d.isNew ? 2.5 : d.inPath ? 2.5 : 2));

    nodeMerge
      .select("text")
      .text((d) => d.key)
      .attr("fill", "#111827")
      .attr("font-size", 13)
      .attr("font-weight", 600);
  }, [root, highlightKeys, mode, steps, currentStepIndex]);

  // ===== handlers =====

  const clearSteps = () => {
    setMode("instant");
    setSteps([]);
    setCurrentStepIndex(0);
  };

  const handleInsert = () => {
    const value = Number(insertValue);
    if (!Number.isFinite(value)) return;
    setRoot((prev) => insertNode(prev, value));
    setHighlightKeys([]);
    setSearchMessage("");
    clearSteps();
  };

  const handleInsertWithSteps = () => {
    const value = Number(insertValue);
    if (!Number.isFinite(value)) return;

    const { steps: builtSteps, finalRoot } = buildInsertSteps(root, value);
    if (!builtSteps.length) return;

    setRoot(finalRoot);
    setHighlightKeys([]);
    setSearchMessage("");
    setSteps(builtSteps);
    setCurrentStepIndex(0);
    setMode("steps");
  };

  const handleGenerateRandom = () => {
    const newRoot = buildRandomTree();
    setRoot(newRoot);
    setHighlightKeys([]);
    setSearchMessage("");
    clearSteps();
  };

  const handleSearch = () => {
    if (!root) return;
    const value = Number(searchValue);
    if (!Number.isFinite(value)) return;
    const { path, found } = findPath(root, value, []);
    setHighlightKeys(path);
    setSearchMessage(
      found
        ? `Hodnota ${value} byla nalezena.`
        : `Hodnota ${value} v stromu není.`
    );
    clearSteps();
  };

  const handleDelete = () => {
    if (!root) return;
    const value = Number(deleteValue);
    if (!Number.isFinite(value)) return;
    setRoot((prev) => deleteNode(prev, value));
    setHighlightKeys([]);
    setSearchMessage("");
    clearSteps();
  };

  const handleReset = () => {
    setRoot(null);
    setHighlightKeys([]);
    setSearchMessage("");
    clearSteps();
  };

  return (
    <div className="bst-root">
      <div className="bst-app">
        <div className="bst-card bst-header">
          <h1>BST</h1>
          <div className="bst-header-buttons">
            <button className="bst-btn" onClick={handleReset}>
              Reset stromu
            </button>
            {onBack && (
              <button className="bst-btn secondary" onClick={onBack}>
                Zpět
              </button>
            )}
          </div>
        </div>

        <div className="bst-card">
          <div className="bst-controls-row">
            <span>
              <strong>Vkládání:</strong>
            </span>
            <input
              type="number"
              className="bst-input"
              value={insertValue}
              onChange={(e) => setInsertValue(e.target.value)}
            />
            <button className="bst-btn primary" onClick={handleInsert}>
              Vložit
            </button>
            <button className="bst-btn" onClick={handleInsertWithSteps}>
              Vložit s kroky
            </button>
            <button className="bst-btn" onClick={handleGenerateRandom}>
              Generovat 10 náhodných hodnot
            </button>
          </div>

          <div className="bst-controls-row" style={{ marginTop: 10 }}>
            <span>
              <strong>Vyhledávání:</strong>
            </span>
            <input
              type="number"
              className="bst-input"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button className="bst-btn" onClick={handleSearch}>
              Najít
            </button>
            <span className="bst-search-result">{searchMessage}</span>
          </div>

          <div className="bst-controls-row" style={{ marginTop: 10 }}>
            <span>
              <strong>Mazání:</strong>
            </span>
            <input
              type="number"
              className="bst-input"
              value={deleteValue}
              onChange={(e) => setDeleteValue(e.target.value)}
            />
            <button className="bst-btn" onClick={handleDelete}>
              Smazat
            </button>
          </div>
        </div>

        {hasSteps && (
          <div className="bst-steps-card">
            <div className="bst-steps-info">
              Krok {currentStepIndex + 1} / {steps.length}
            </div>
            <div className="bst-steps-controls">
              <button
                className="bst-steps-btn"
                onClick={() => setCurrentStepIndex(0)}
                disabled={currentStepIndex === 0}
              >
                ⏮ Na začátek
              </button>
              <button
                className="bst-steps-btn"
                onClick={() =>
                  setCurrentStepIndex((i) => Math.max(0, i - 1))
                }
                disabled={currentStepIndex === 0}
              >
                ◀ Předchozí
              </button>
              <button
                className="bst-steps-btn"
                onClick={() =>
                  setCurrentStepIndex((i) =>
                    Math.min(steps.length - 1, i + 1)
                  )
                }
                disabled={currentStepIndex === steps.length - 1}
              >
                Další ▶
              </button>
              <button
                className="bst-steps-btn"
                onClick={() => setCurrentStepIndex(steps.length - 1)}
                disabled={currentStepIndex === steps.length - 1}
              >
                ⏭ Na konec
              </button>
            </div>
          </div>
        )}

        {/* дерево + код рядом */}
        <div className="bst-main-row">
          <div className="bst-card bst-tree-card">
            <svg
              ref={svgRef}
              className="bst-svg"
              viewBox="0 0 800 480"
              aria-label="Vizualizace BST"
            />
          </div>

          <div className="bst-code-column">

            <div className="bst-card bst-code-card">
              <h2 className="bst-code-title">Insert v BST</h2>
              <AlgorithmCodePane
                lines={insertCodeLines}
                activeLine={activeCodeLine}
              />
              {hasSteps && (
                <p className="bst-step-description">{stepDescription}</p>
              )}
            </div>

            <div className="bst-card bst-stats-card">
              <div className="bst-stats">
                <div>
                  <strong>Počet uzlů:</strong> <span>{stats.count}</span>
                </div>
                <div>
                  <strong>Výška stromu:</strong> <span>{stats.height}</span>
                </div>
              </div>
            </div>

          </div>

          
        </div>

        
      </div>
    </div>
  );
}

export default BSTVisualizer;
