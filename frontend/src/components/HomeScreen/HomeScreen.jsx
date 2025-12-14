import "./HomeScreen.css";
import treeIcon from "../../assets/tree-icon.png";

function HomeScreen({ onStart }) {
  return (
    <div className="home-root">
      <main className="hero">
        <section className="hero-card">
          <div className="hero-icon">
            <img
              src={treeIcon}
              alt="Ikona stromu"
              className="hero-icon-img"
            />
          </div>
          <h1 className="hero-title">
            Výuková aplikace pro vizualizaci vyvážených stromových struktur
          </h1>
          <p className="hero-text">
            Učte se, jak fungují vyvážené stromy, sledujte animace kroků a
            porovnejte jejich efektivitu.
          </p>
          <button className="hero-button" onClick={onStart}>
            Začít
          </button>
        </section>
      </main>
    </div>
  );
}

export default HomeScreen;
