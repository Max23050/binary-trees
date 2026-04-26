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

const searchCodeLines = [
  "def search(root, key):",
  "    if root is None:",
  "        return False",
  "    if key == root.key:",
  "        return True",
  "    if key < root.key:",
  "        return search(root.left, key)",
  "    else:",
  "        return search(root.right, key)",
];

const deleteCodeLines = [
  "def find_min(node):",
  "    while node.left is not None:",
  "        node = node.left",
  "    return node",
  "",
  "def delete(root, key):",
  "    if root is None:",
  "        return None",
  "    if key < root.key:",
  "        root.left = delete(root.left, key)",
  "    elif key > root.key:",
  "        root.right = delete(root.right, key)",
  "    else:",
  "        if root.left is None and root.right is None:",
  "            return None",
  "        if root.left is None:",
  "            return root.right",
  "        if root.right is None:",
  "            return root.left",
  "        min_node = find_min(root.right)",
  "        root.key = min_node.key",
  "        root.right = delete(root.right, min_node.key)",
  "    return root",
];

const inorderCodeLines = [
  "def inorder(node):",
  "    if node is None:",
  "        return",
  "    inorder(node.left)",
  "    print(node.value)",
  "    inorder(node.right)",
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

function formatIntervalBound(value, fallback) {
  return value == null ? fallback : value;
}

function formatInterval(interval) {
  if (!interval) return "-";
  return `(${formatIntervalBound(interval.min, "-∞")}, ${formatIntervalBound(
    interval.max,
    "∞"
  )})`;
}

function findSearchTrace(root, key) {
  const path = [];
  let node = root;
  let min = null;
  let max = null;

  if (!node) {
    return {
      path,
      found: false,
      missingLeaf: null,
      interval: { min, max },
    };
  }

  while (node) {
    path.push(node.key);

    if (key === node.key) {
      return {
        path,
        found: true,
        missingLeaf: null,
        interval: { min, max },
      };
    }

    if (key < node.key) {
      if (!node.left) {
        return {
          path,
          found: false,
          missingLeaf: { parentKey: node.key, direction: "left" },
          interval: { min, max: node.key },
        };
      }
      max = node.key;
      node = node.left;
      continue;
    }

    if (!node.right) {
      return {
        path,
        found: false,
        missingLeaf: { parentKey: node.key, direction: "right" },
        interval: { min: node.key, max },
      };
    }
    min = node.key;
    node = node.right;
  }

  return {
    path,
    found: false,
    missingLeaf: null,
    interval: { min, max },
  };
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

function inorderTraversal(node, result = []) {
  if (!node) return result;
  inorderTraversal(node.left, result);
  result.push(node.key);
  inorderTraversal(node.right, result);
  return result;
}

function buildInorderSteps(root) {
  const steps = [];
  const rootCopy = cloneTree(root);
  const stack = [];
  const traversal = [];
  const algorithm = "inorder";

  const pushStep = (desc, codeLine, currentKey = null) => {
    steps.push({
      id: `${steps.length}-${Date.now()}`,
      tree: cloneTree(rootCopy),
      highlightNodes: currentKey != null ? [currentKey] : [],
      highlightPath: [...stack],
      currentKey,
      comparisons: 0,
      recursionDepth: stack.length,
      description: desc,
      algorithm,
      codeLine,
      newNodeKey: null,
      moveKey: null,
      showArrow: false,
      arrowPath: null,
      traversal: [...traversal],
    });
  };

  if (!rootCopy) {
    pushStep("Strom je prázdný, průchod je prázdný.", 1, null);
    return { steps };
  }

  const walk = (node) => {
    if (!node) {
      pushStep("Dosažen NIL, vracíme se.", 1, null);
      return;
    }
    stack.push(node.key);
    pushStep(`Jdeme doleva z uzlu ${node.key}.`, 3, node.key);
    walk(node.left);
    traversal.push(node.key);
    pushStep(`Vypisujeme uzel ${node.key}.`, 4, node.key);
    pushStep(`Jdeme doprava z uzlu ${node.key}.`, 5, node.key);
    walk(node.right);
    stack.pop();
  };

  walk(rootCopy);
  pushStep("Inorder průchod dokončen.", 5, null);
  return { steps };
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

function getCurrentDepth(path, currentKey) {
  if (currentKey == null) return 0;
  const idx = path.indexOf(currentKey);
  return idx >= 0 ? idx + 1 : path.length + 1;
}

function computeLayout(
  root,
  { pathKeys = [], highlightKeys = [], newNodeKey = null } = {}
) {
  if (!root) {
    return { nodes: [], links: [], width: 800, height: 240, xGap: 50, levelGap: 90 };
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
  return { nodes, links: linkCoords, width, height, xGap, levelGap };
}



function buildInsertSteps(root, key) {
  const steps = [];
  const rootCopy = cloneTree(root);
  const path = [];
  const algorithm = "insert";
  let comparisons = 0;

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
      currentKey,
      comparisons,
      recursionDepth: getCurrentDepth(path, currentKey),
      description: desc,
      algorithm,
      codeLine,
      newNodeKey,
      moveKey: null,
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
      currentKey: key,
      comparisons,
      recursionDepth: getCurrentDepth(path, key),
      description: `Strom je prázdný, vytváříme kořen s klíčem ${key}.`,
      algorithm,
      codeLine: 1, // if root is None
      newNodeKey: key,
      showArrow: false,
    });
    steps.push({
      id: "insert-empty-done",
      tree: cloneTree(newRoot),
      highlightNodes: [key],
      highlightPath: [key],
      currentKey: key,
      comparisons,
      recursionDepth: getCurrentDepth(path, key),
      description: `Vložení ${key} dokončeno.`,
      algorithm,
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
      comparisons += 1;
      pushStep(
        `Klíč ${key} už ve stromu existuje, nic nevkládáme.`,
        7,
        node.key
      );
      return { steps, finalRoot: rootCopy };
    } else if (key < node.key) {
      // сравнение
      comparisons += 1;
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
      comparisons += 1;
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
    currentKey: key,
    comparisons,
    recursionDepth: getCurrentDepth(path, key),
    description: `Vložení ${key} dokončeno.`,
    algorithm,
    codeLine: 7, // return root
    newNodeKey: key,
    showArrow: true,
    arrowPath: [...path],
  });

  return { steps, finalRoot: rootCopy };
}

function buildSearchSteps(root, key) {
  const steps = [];
  const rootCopy = cloneTree(root);
  const path = [];
  const algorithm = "search";
  let comparisons = 0;
  let min = null;
  let max = null;

  const pushStep = (
    desc,
    codeLine,
    currentKey = null,
    showArrow = false,
    arrowPath = null,
    newNodeKey = null,
    missingLeaf = null
  ) => {
    steps.push({
      id: `${steps.length}-${Date.now()}`,
      tree: cloneTree(rootCopy),
      highlightNodes: currentKey != null ? [currentKey] : [],
      highlightPath: [...path],
      currentKey,
      comparisons,
      recursionDepth: getCurrentDepth(path, currentKey),
      description: desc,
      algorithm,
      codeLine,
      newNodeKey,
      missingLeaf,
      interval: { min, max },
      showArrow,
      arrowPath,
    });
  };

  if (!rootCopy) {
    pushStep(
      "Strom je prázdný, takže vracíme False.",
      1,
      null,
      false,
      null
    );
    pushStep(
      `Hodnota ${key} nebyla nalezena.`,
      2,
      null,
      false,
      null
    );
    return { steps, found: false };
  }

  let node = rootCopy;
  pushStep(`Začínáme hledat klíč ${key}.`, 0, node.key, true, [node.key]);

  while (node) {
    path.push(node.key);

    comparisons += 1;
    pushStep(
      `Kontrolujeme, zda ${key} == ${node.key}.`,
      3,
      node.key,
      true,
      [...path]
    );

    if (key === node.key) {
      pushStep(
        `Klíč ${key} nalezen v uzlu ${node.key}.`,
        4,
        node.key,
        true,
        [...path],
        node.key
      );
      return { steps, found: true };
    }

    if (key < node.key) {
      comparisons += 1;
      pushStep(
        `Porovnání: ${key} < ${node.key} → pokračujeme doleva.`,
        5,
        node.key,
        true,
        node.left ? [...path, node.left.key] : [...path]
      );

      if (!node.left) {
        const nextInterval = { min, max: node.key };
        pushStep(
          `Levý potomek neexistuje, ${key} ve stromu není.`,
          2,
          null,
          true,
          [...path],
          null,
          { parentKey: node.key, direction: "left" }
        );
        steps[steps.length - 1].interval = nextInterval;
        return { steps, found: false };
      }

      max = node.key;
      node = node.left;
      pushStep(
        `Voláme search na levém potomku ${node.key}.`,
        6,
        node.key,
        true,
        [...path, node.key]
      );
    } else {
      comparisons += 1;
      pushStep(
        `Porovnání: ${key} > ${node.key} → pokračujeme doprava.`,
        7,
        node.key,
        true,
        node.right ? [...path, node.right.key] : [...path]
      );

      if (!node.right) {
        const nextInterval = { min: node.key, max };
        pushStep(
          `Pravý potomek neexistuje, ${key} ve stromu není.`,
          2,
          null,
          true,
          [...path],
          null,
          { parentKey: node.key, direction: "right" }
        );
        steps[steps.length - 1].interval = nextInterval;
        return { steps, found: false };
      }

      min = node.key;
      node = node.right;
      pushStep(
        `Voláme search na pravém potomku ${node.key}.`,
        8,
        node.key,
        true,
        [...path, node.key]
      );
    }
  }

  return { steps, found: false };
}

function buildDeleteSteps(root, key) {
  const steps = [];
  let rootCopy = cloneTree(root);
  const path = [];
  const algorithm = "delete";
  let comparisons = 0;

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
      currentKey,
      comparisons,
      recursionDepth: getCurrentDepth(path, currentKey),
      description: desc,
      algorithm,
      codeLine,
      newNodeKey,
      showArrow,
      arrowPath,
    });
  }

  if (!rootCopy) {
    pushStep("Strom je prázdný, není co mazat.", 6);
    return { steps, finalRoot: null, found: false };
  }

  const replaceChild = (parent, childKey, newChild) => {
    if (!parent) {
      rootCopy = newChild;
      return;
    }
    if (parent.left && parent.left.key === childKey) {
      parent.left = newChild;
    } else if (parent.right && parent.right.key === childKey) {
      parent.right = newChild;
    }
  };

  let node = rootCopy;
  let parent = null;

  pushStep(`Začínáme mazat klíč ${key}.`, 5, node.key, null, true, [node.key]);

  while (node) {
    path.push(node.key);

    if (key < node.key) {
      comparisons += 1;
      pushStep(
        `Porovnání: ${key} < ${node.key} → jdeme doleva.`,
        8,
        node.key,
        null,
        true,
        node.left ? [...path, node.left.key] : [...path]
      );
      if (!node.left) {
        pushStep(
          `Levý potomek neexistuje, ${key} ve stromu není.`,
          7,
          null,
          null,
          true,
          [...path]
        );
        return { steps, finalRoot: rootCopy, found: false };
      }
      parent = node;
      node = node.left;
      pushStep(
        `Rekurzivně voláme delete na levém potomku ${node.key}.`,
        9,
        node.key,
        null,
        true,
        [...path, node.key]
      );
      continue;
    }

    if (key > node.key) {
      comparisons += 1;
      pushStep(
        `Porovnání: ${key} > ${node.key} → jdeme doprava.`,
        10,
        node.key,
        null,
        true,
        node.right ? [...path, node.right.key] : [...path]
      );
      if (!node.right) {
        pushStep(
          `Pravý potomek neexistuje, ${key} ve stromu není.`,
          7,
          null,
          null,
          true,
          [...path]
        );
        return { steps, finalRoot: rootCopy, found: false };
      }
      parent = node;
      node = node.right;
      pushStep(
        `Rekurzivně voláme delete na pravém potomku ${node.key}.`,
        11,
        node.key,
        null,
        true,
        [...path, node.key]
      );
      continue;
    }

    // node.key === key
    comparisons += 1;
    pushStep(
      `Našli jsme uzel s klíčem ${key}, provádíme mazání.`,
      12,
      node.key,
      null,
      true,
      [...path]
    );

    const hasLeft = !!node.left;
    const hasRight = !!node.right;

    if (!hasLeft && !hasRight) {
      pushStep(
        `Uzel ${key} je list, odstraňujeme ho (vracíme None).`,
        13,
        node.key,
        null,
        true,
        [...path]
      );
      replaceChild(parent, node.key, null);
      node = null;
      break;
    }

    if (!hasLeft) {
      pushStep(
        `Uzel má pouze pravého potomka, posouváme ho nahoru.`,
        15,
        node.key,
        node.right.key,
        true,
        [...path, node.right.key]
      );
      replaceChild(parent, node.key, node.right);
      if (!parent) {
        rootCopy = node.right;
      }
      node = null;
      break;
    }

    if (!hasRight) {
      pushStep(
        `Uzel má pouze levého potomka, posouváme ho nahoru.`,
        17,
        node.key,
        node.left.key,
        true,
        [...path, node.left.key]
      );
      replaceChild(parent, node.key, node.left);
      if (!parent) {
        rootCopy = node.left;
      }
      node = null;
      break;
    }

    // two children
    pushStep(
      `Uzel má dva potomky, hledáme inorder následníka (min v pravém podstromu).`,
      19,
      node.key,
      null,
      true,
      node.right ? [...path, node.right.key] : [...path]
    );

    let succParent = node;
    let succ = node.right;
    const succPath = [...path, succ.key];

    pushStep(
      `Voláme find_min na pravém podstromu.`,
      0,
      succ.key,
      null,
      true,
      [...succPath]
    );

    while (succ.left) {
      succParent = succ;
      succ = succ.left;
      succPath.push(succ.key);
      pushStep(
        `Posouváme se doleva v find_min (hledáme nejmenší).`,
        1,
        succ.key,
        null,
        true,
        [...succPath]
      );
    }

    pushStep(
      `Nalezen inorder následník s klíčem ${succ.key}.`,
      3,
      succ.key,
      succ.key,
      true,
      [...succPath]
    );

    const targetId = node.id;
    const succId = succ.id;
    const succValue = succ.key;

    node.key = succ.key;
    pushStep(
      `Nahrazujeme klíč uzlu hodnotou ${succ.key}.`,
      20,
      node.key,
      succ.key,
      true,
      [...path]
    );
    steps[steps.length - 1].moveKey = {
      fromId: succId,
      toId: targetId,
      value: succValue,
    };

    // delete successor node
    if (succParent === node) {
      succParent.right = succ.right;
    } else {
      succParent.left = succ.right;
    }

    pushStep(
      `Odstraňujeme inorder následníka z pravého podstromu.`,
      21,
      succParent.key,
      null,
      true,
      [...succPath]
    );

    break;
  }

  pushStep(
    `Mazání ${key} dokončeno.`,
    22,
    null,
    null,
    true,
    [...path]
  );

  return { steps, finalRoot: rootCopy, found: true };
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
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("insert");
  const [showMissingLeaves, setShowMissingLeaves] = useState(true);
  const [showSearchInterval, setShowSearchInterval] = useState(false);
  const [inorderResult, setInorderResult] = useState([]);
  const [searchMissingLeaf, setSearchMissingLeaf] = useState(null);
  const [searchInterval, setSearchInterval] = useState(null);

  const [mode, setMode] = useState("instant"); // "instant" | "steps"
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const stats = {
    count: getCount(root),
    height: getHeight(root),
  };

  const hasSteps = mode === "steps" && steps.length > 0;
  const currentStep = hasSteps ? steps[currentStepIndex] : null;
  const activeAlgorithm = currentStep ? currentStep.algorithm : null;
  const activeCodeLine = currentStep ? currentStep.codeLine : null;
  const stepDescription = currentStep ? currentStep.description : "";
  const paneAlgorithm = hasSteps
    ? activeAlgorithm || selectedAlgorithm
    : selectedAlgorithm;
  const paneLinesMap = {
    insert: insertCodeLines,
    search: searchCodeLines,
    delete: deleteCodeLines,
    inorder: inorderCodeLines,
  };
  const paneTitles = {
    insert: "Insert v BST",
    search: "Vyhledávání v BST",
    delete: "Mazání v BST",
    inorder: "Inorder průchod",
  };
  const paneActiveLine =
    activeAlgorithm === paneAlgorithm ? activeCodeLine : null;
  const paneDescription =
    hasSteps && activeAlgorithm === paneAlgorithm ? stepDescription : "";
  const comparisonsStat =
    hasSteps && currentStep ? currentStep.comparisons ?? 0 : null;
  const recursionDepthStat =
    hasSteps && currentStep ? currentStep.recursionDepth ?? 0 : null;
  const inorderDisplay =
    hasSteps && currentStep && currentStep.algorithm === "inorder"
      ? currentStep.traversal || []
      : inorderResult;
  const intervalStat =
    paneAlgorithm === "search"
      ? hasSteps && currentStep && currentStep.algorithm === "search"
        ? currentStep.interval || null
        : searchInterval
      : null;

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
    const missingLeaf = hasStepsLocal
      ? showMissingLeaves
        ? step.missingLeaf || null
        : null
      : showMissingLeaves
      ? searchMissingLeaf
      : null;
    const moveKey = hasStepsLocal ? step.moveKey || null : null;
    const currentNodeKey = hasStepsLocal
      ? step.currentKey != null
        ? step.currentKey
        : step.highlightNodes && step.highlightNodes.length
        ? step.highlightNodes[0]
        : null
      : null;

    const svg = d3.select(svgRef.current);
    let gLinks = svg.select("g.links");
    let gNodes = svg.select("g.nodes");
    let gCurrent = svg.select("g.current-marker");
    let gMissing = svg.select("g.missing-leaf");
    let gKeyMove = svg.select("g.key-move");
    let defs = svg.select("defs");

    if (gLinks.empty()) gLinks = svg.append("g").attr("class", "links");
    if (gNodes.empty()) gNodes = svg.append("g").attr("class", "nodes");
    if (gCurrent.empty()) gCurrent = svg.append("g").attr("class", "current-marker");
    if (gMissing.empty()) gMissing = svg.append("g").attr("class", "missing-leaf");
    if (gKeyMove.empty()) gKeyMove = svg.append("g").attr("class", "key-move");
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

    let currentArrowMarker = defs.select("#bst-current-arrow-head");
    if (currentArrowMarker.empty()) {
      currentArrowMarker = defs
        .append("marker")
        .attr("id", "bst-current-arrow-head");
      currentArrowMarker.append("path").attr("d", "M 0 0 L 10 4 L 0 8 z");
    }

    currentArrowMarker
      .attr("viewBox", "0 0 10 8")
      .attr("refX", 9)
      .attr("refY", 4)
      .attr("markerWidth", 10)
      .attr("markerHeight", 10)
      .attr("orient", "auto");

    currentArrowMarker.select("path").attr("fill", "#f59e0b");

    let keyMoveArrowMarker = defs.select("#bst-keymove-arrow-head");
    if (keyMoveArrowMarker.empty()) {
      keyMoveArrowMarker = defs
        .append("marker")
        .attr("id", "bst-keymove-arrow-head");
      keyMoveArrowMarker.append("path").attr("d", "M 0 0 L 10 5 L 0 10 z");
    }

    keyMoveArrowMarker
      .attr("viewBox", "0 0 10 10")
      .attr("refX", 9)
      .attr("refY", 5)
      .attr("markerWidth", 9)
      .attr("markerHeight", 9)
      .attr("orient", "auto");

    keyMoveArrowMarker.select("path").attr("fill", "#0284c7");

    const { nodes, links, width, height, xGap, levelGap } = computeLayout(
      treeForRender,
      {
        pathKeys: pathHighlight,
        highlightKeys: nodeHighlight,
        newNodeKey,
      }
    );

    const missingParent =
      missingLeaf && nodes.find((n) => n.key === missingLeaf.parentKey);
    const missingNode =
      missingLeaf && missingParent
        ? {
            id: `missing-${missingParent.id}-${missingLeaf.direction}`,
            x:
              missingLeaf.direction === "left"
                ? missingParent.x - xGap / 2
                : missingParent.x + xGap / 2,
            y: missingParent.y + levelGap,
            parentX: missingParent.x,
            parentY: missingParent.y,
            parentR: missingParent.r,
          }
        : null;
    if (missingNode) {
      const dx = missingNode.x - missingNode.parentX;
      const dy = missingNode.y - missingNode.parentY;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const startOffset = missingNode.parentR + 6;
      const endOffset = 12 + 4;
      missingNode.lineX1 = missingNode.parentX + ux * startOffset;
      missingNode.lineY1 = missingNode.parentY + uy * startOffset;
      missingNode.lineX2 = missingNode.x - ux * endOffset;
      missingNode.lineY2 = missingNode.y - uy * endOffset;
    }
    const viewHeight = missingNode
      ? Math.max(height, missingNode.y + 40)
      : height;

    svg
      .transition()
      .duration(400)
      .attr("viewBox", `0 0 ${width} ${viewHeight}`);

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

    const moveFrom =
      moveKey && nodes.find((n) => n.id === moveKey.fromId);
    const moveTo = moveKey && nodes.find((n) => n.id === moveKey.toId);
    const moveData =
      moveKey && moveFrom && moveTo
        ? [
            {
              id: step.id,
              value: moveKey.value,
              fromX: moveFrom.x,
              fromY: moveFrom.y,
              toX: moveTo.x,
              toY: moveTo.y,
              fromR: moveFrom.r,
              toR: moveTo.r,
            },
          ]
        : [];

    const moveLineSel = gKeyMove
      .selectAll("line.bst-key-move-line")
      .data(moveData, (d) => d.id);

    moveLineSel
      .exit()
      .transition()
      .duration(150)
      .style("opacity", 0)
      .remove();

    const moveLineEnter = moveLineSel
      .enter()
      .append("line")
      .attr("class", "bst-key-move-line")
      .style("opacity", 0);

    moveLineEnter
      .merge(moveLineSel)
      .style("opacity", 1)
      .attr("x1", (d) => {
        const dx = d.toX - d.fromX;
        const dy = d.toY - d.fromY;
        const len = Math.hypot(dx, dy) || 1;
        return d.fromX + (dx / len) * (d.fromR + 4);
      })
      .attr("y1", (d) => {
        const dx = d.toX - d.fromX;
        const dy = d.toY - d.fromY;
        const len = Math.hypot(dx, dy) || 1;
        return d.fromY + (dy / len) * (d.fromR + 4);
      })
      .attr("x2", (d) => {
        const dx = d.toX - d.fromX;
        const dy = d.toY - d.fromY;
        const len = Math.hypot(dx, dy) || 1;
        return d.toX - (dx / len) * (d.toR + 10);
      })
      .attr("y2", (d) => {
        const dx = d.toX - d.fromX;
        const dy = d.toY - d.fromY;
        const len = Math.hypot(dx, dy) || 1;
        return d.toY - (dy / len) * (d.toR + 10);
      })
      .attr("marker-end", "url(#bst-keymove-arrow-head)");

    const moveSel = gKeyMove
      .selectAll("g.bst-key-move")
      .data(moveData, (d) => d.id);

    moveSel.exit().transition().duration(150).style("opacity", 0).remove();

    const moveEnter = moveSel
      .enter()
      .append("g")
      .attr("class", "bst-key-move")
      .style("opacity", 1);

    moveEnter.append("circle").attr("class", "bst-key-move-circle").attr("r", 16);
    moveEnter
      .append("text")
      .attr("class", "bst-key-move-text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle");

    const moveMerge = moveEnter.merge(moveSel);

    moveMerge.select("text").text((d) => d.value);

    moveMerge
      .interrupt()
      .attr("transform", (d) => `translate(${d.fromX}, ${d.fromY})`)
      .transition()
      .duration(600)
      .attr("transform", (d) => `translate(${d.toX}, ${d.toY})`);

    const missingData = missingNode ? [missingNode] : [];
    const missingSel = gMissing
      .selectAll("g.bst-missing")
      .data(missingData, (d) => d.id);

    missingSel.exit().transition().duration(200).style("opacity", 0).remove();

    const missingEnter = missingSel
      .enter()
      .append("g")
      .attr("class", "bst-missing")
      .style("opacity", 0);

    missingEnter.append("line").attr("class", "bst-missing-line");
    missingEnter.append("circle").attr("class", "bst-missing-circle");
    missingEnter
      .append("text")
      .attr("class", "bst-missing-text")
      .text("NIL");

    const missingMerge = missingEnter.merge(missingSel);

    missingMerge
      .transition()
      .duration(200)
      .style("opacity", 1);

    missingMerge
      .select("line")
      .attr("x1", (d) => d.lineX1)
      .attr("y1", (d) => d.lineY1)
      .attr("x2", (d) => d.lineX2)
      .attr("y2", (d) => d.lineY2);

    missingMerge
      .select("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 12);

    missingMerge
      .select("text")
      .attr("x", (d) => d.x)
      .attr("y", (d) => d.y + 4)
      .attr("text-anchor", "middle");

    const currentNode =
      currentNodeKey != null
        ? nodes.find((n) => n.key === currentNodeKey)
        : null;
    const currentData = currentNode ? [currentNode] : [];

    const currentSel = gCurrent
      .selectAll("g.bst-current")
      .data(currentData, (d) => d.id);

    currentSel.exit().transition().duration(200).style("opacity", 0).remove();

    const currentEnter = currentSel
      .enter()
      .append("g")
      .attr("class", "bst-current")
      .style("opacity", 0);

    currentEnter.append("line").attr("class", "bst-current-line");
    currentEnter.append("text").attr("class", "bst-current-label").text("root");

    const currentMerge = currentEnter.merge(currentSel);

    currentMerge
      .transition()
      .duration(200)
      .style("opacity", 1);

    currentMerge
      .select("line")
      .attr("x1", (d) => d.x)
      .attr("y1", (d) => d.y - d.r - 6)
      .attr("x2", (d) => d.x)
      .attr("y2", (d) => d.y - d.r - 16)
      .attr("marker-end", "url(#bst-current-arrow-head)");

    currentMerge
      .select("text")
      .attr("x", (d) => d.x + 8)
      .attr("y", (d) => d.y - d.r - 18);
  }, [
    root,
    highlightKeys,
    mode,
    steps,
    currentStepIndex,
    showMissingLeaves,
    searchMissingLeaf,
  ]);

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
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    setSelectedAlgorithm("insert");
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
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    setSteps(builtSteps);
    setCurrentStepIndex(0);
    setMode("steps");
    setSelectedAlgorithm("insert");
  };

  const handleGenerateRandom = () => {
    const newRoot = buildRandomTree();
    setRoot(newRoot);
    setHighlightKeys([]);
    setSearchMessage("");
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    clearSteps();
  };

  const handleSearch = () => {
    const value = Number(searchValue);
    if (!Number.isFinite(value)) return;
    const { path, found, missingLeaf, interval } = findSearchTrace(root, value);
    setHighlightKeys(path);
    setSearchMissingLeaf(found ? null : missingLeaf);
    setSearchInterval(interval);
    setSearchMessage(
      found
        ? `Hodnota ${value} byla nalezena.`
        : `Hodnota ${value} v stromu není.`
    );
    setSelectedAlgorithm("search");
    clearSteps();
  };

  const handleSearchWithSteps = () => {
    const value = Number(searchValue);
    if (!Number.isFinite(value)) return;

    const { steps: builtSteps, found } = buildSearchSteps(root, value);
    if (!builtSteps.length) return;

    setHighlightKeys([]);
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    setSteps(builtSteps);
    setCurrentStepIndex(0);
    setMode("steps");
    setSelectedAlgorithm("search");
    setSearchMessage(
      found
        ? `Hodnota ${value} byla nalezena.`
        : `Hodnota ${value} v stromu není.`
    );
  };

  const handleDelete = () => {
    if (!root) return;
    const value = Number(deleteValue);
    if (!Number.isFinite(value)) return;
    setRoot((prev) => deleteNode(prev, value));
    setHighlightKeys([]);
    setSearchMessage("");
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    setSelectedAlgorithm("delete");
    clearSteps();
  };

  const handleDeleteWithSteps = () => {
    const value = Number(deleteValue);
    if (!Number.isFinite(value)) return;

    const { steps: builtSteps, finalRoot } = buildDeleteSteps(root, value);
    if (!builtSteps.length) return;

    setRoot(finalRoot);
    setHighlightKeys([]);
    setSearchMessage("");
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    setSteps(builtSteps);
    setCurrentStepIndex(0);
    setMode("steps");
    setSelectedAlgorithm("delete");
  };

  const handleReset = () => {
    setRoot(null);
    setHighlightKeys([]);
    setSearchMessage("");
    setInorderResult([]);
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    clearSteps();
  };

  const handleInorder = () => {
    setInorderResult(inorderTraversal(root, []));
    setSelectedAlgorithm("inorder");
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    clearSteps();
  };

  const handleInorderWithSteps = () => {
    const { steps: builtSteps } = buildInorderSteps(root);
    if (!builtSteps.length) return;
    setHighlightKeys([]);
    setSearchMissingLeaf(null);
    setSearchInterval(null);
    setSteps(builtSteps);
    setCurrentStepIndex(0);
    setMode("steps");
    setSelectedAlgorithm("inorder");
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

        <div className="bst-card bst-controls-card">
          <div className="bst-controls-layout">
            <div className="bst-controls-main">
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
                <button className="bst-btn" onClick={handleSearchWithSteps}>
                  Najít s kroky
                </button>
                <label className="bst-toggle">
                  <input
                    type="checkbox"
                    checked={showMissingLeaves}
                    onChange={(e) => setShowMissingLeaves(e.target.checked)}
                  />
                  <span>Listy při nenalezení</span>
                </label>
                <label className="bst-toggle">
                  <input
                    type="checkbox"
                    checked={showSearchInterval}
                    onChange={(e) => setShowSearchInterval(e.target.checked)}
                  />
                  <span>Zobrazit interval</span>
                </label>
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
                <button className="bst-btn" onClick={handleDeleteWithSteps}>
                  Smazat s kroky
                </button>
                <button className="bst-btn" onClick={handleInorder}>
                  Inorder průchod
                </button>
                <button className="bst-btn" onClick={handleInorderWithSteps}>
                  Inorder s kroky
                </button>
              </div>
            </div>

            {hasSteps && (
              <aside className="bst-steps-panel">
                <div className="bst-steps-info">
                  <span className="bst-steps-label">Průchod</span>
                  <strong>
                    Krok {currentStepIndex + 1} / {steps.length}
                  </strong>
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
              </aside>
            )}
          </div>
        </div>

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

            <div
              className={
                "bst-card bst-code-card" +
                (paneAlgorithm === "delete" ? " bst-code-card--delete" : "")
              }
            >
              <AlgorithmCodePane
                lines={paneLinesMap[paneAlgorithm]}
                activeLine={paneActiveLine}
                algorithm={paneAlgorithm}
                title={paneTitles[paneAlgorithm]}
              />
              {paneDescription && (
                <p className="bst-step-description">{paneDescription}</p>
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
              <div>
                <strong>Počet porovnání:</strong>{" "}
                <span>{comparisonsStat != null ? comparisonsStat : "-"}</span>
              </div>
              <div>
                <strong>Aktuální hloubka rekurze:</strong>{" "}
                <span>
                  {recursionDepthStat != null ? recursionDepthStat : "-"}
                </span>
              </div>
              <div>
                <strong>Inorder:</strong>{" "}
                <span>
                  {inorderDisplay.length ? inorderDisplay.join(", ") : "-"}
                </span>
              </div>
              {showSearchInterval && paneAlgorithm === "search" && (
                <div>
                  <strong>Interval:</strong>{" "}
                  <span>{formatInterval(intervalStat)}</span>
                </div>
              )}
            </div>
          </div>

          </div>

          
        </div>

        
      </div>
    </div>
  );
}

export default BSTVisualizer;
