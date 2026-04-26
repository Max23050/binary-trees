# Tree Structure Visualization

An interactive educational application for demonstrating tree-based data structures. This project was developed as my **bachelor's thesis** and is focused on helping users understand core tree operations visually, follow algorithm execution step by step, and compare how these structures behave when working with data.

The current version includes a visualizer for **BST (Binary Search Tree)**. The interface for additional tree types is already prepared, but their logic has not been implemented yet.

## Main Features

- graphical visualization of a binary search tree
- insertion of values into a BST
- node search
- node deletion
- inorder traversal
- step-by-step algorithm playback with explanations of individual states
- pseudocode display with highlighting of the currently executed line
- basic tree statistics such as height, node count, and number of comparisons
- random tree generation for quick testing

## Technologies Used

- React
- Vite
- D3.js
- CSS

## Project Structure

```text
app/
├── backend/              # currently empty folder for the future server-side part
└── frontend/             # main frontend application
    ├── src/
    │   ├── components/
    │   │   ├── HomeScreen/
    │   │   ├── TreeTypeScreen/
    │   │   ├── BSTVisualizer/
    │   │   └── AlgorithmCodePane/
    │   ├── assets/
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

## Running the Project

### Requirements

- Node.js 18+
- npm

### Installation and Development Server

```bash
cd frontend
npm install
npm run dev
```

After starting Vite, open the local address, usually:

```text
http://localhost:5173
```

## Production Build

```bash
cd frontend
npm run build
npm run preview
```

## Current Status

- only the BST visualizer is currently implemented
- AVL and other balanced tree options are present in the UI, but not yet functional
- the backend part is not used yet


## Possible Future Improvements

- implementation of AVL trees including rotations
- implementation of Red-Black trees
- comparison of time complexity across different tree structures
- operation history and replayable animations
- export of test scenarios or value sets

## Author

This project was created as my bachelor's thesis and serves as an educational application for visualizing tree structures.
