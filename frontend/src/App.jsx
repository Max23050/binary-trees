import { useState } from 'react';
import './App.css';
import HomeScreen from './components/HomeScreen/HomeScreen.jsx';
import TreeTypeScreen from './components/TreeTypeScreen/TreeTypeScreen.jsx';
import BSTVisualizer from './components/BSTVisualizer/BSTVisualizer.jsx';

function App() {

  const [screen, setScreen] = useState("home");

  const handleStart = () => {
    setScreen("tree-select");
  }

  const hadleBackToHome = () => {
    setScreen("home");
  }

  const handleSelectBST = () => {
    setScreen("bst");
  }

  const handleBackToTreeSelect = () => {
    setScreen("tree-select");
  }

  if (screen === "tree-select") {
    return (
      <TreeTypeScreen
        onBack={hadleBackToHome}
        onSelectBST={handleSelectBST}
      />
    )
  }

  if (screen === "bst") {
    return (
      <BSTVisualizer onBack={handleBackToTreeSelect} />
    )
  }

  return <HomeScreen onStart={handleStart} />;
}

export default App
