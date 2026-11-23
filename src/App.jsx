import { useState } from 'react';
import './App.css';

function App() {
  // Aquí creamos los "estados" del juego
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [outs, setOuts] = useState(0);
  const [inning, setInning] = useState(1);

  // Funciones para los botones
  const sumarCarreraA = () => setScoreA(scoreA + 1);
  const sumarCarreraB = () => setScoreB(scoreB + 1);

  const sumarOut = () => {
    if (outs < 2) {
      setOuts(outs + 1);
    } else {
      // Si llega a 3 outs, cambia el inning y resetea los outs
      setOuts(0);
      setInning(inning + 1);
    }
  };

  const reiniciarPartido = () => {
    setScoreA(0);
    setScoreB(0);
    setOuts(0);
    setInning(1);
  };

  return (
      <div className="app-container">
        <header className="header">
          <h1>⚾ LBB - Panel del Host</h1>
        </header>

        {/* Marcador */}
        <div className="scoreboard">
          <div className="team-card blue">
            <h2>Equipo Azul</h2>
            <p className="score">{scoreA}</p>
            <button onClick={sumarCarreraA} className="btn btn-blue">+ Sumar Carrera</button>
          </div>

          <div className="game-status">
            <h3>Inning: {inning}</h3>
            <h3>Outs: {outs} / 3</h3>
            <button onClick={sumarOut} className="btn btn-red">+ Registrar Out</button>
          </div>

          <div className="team-card red">
            <h2>Equipo Rojo</h2>
            <p className="score">{scoreB}</p>
            <button onClick={sumarCarreraB} className="btn btn-red">+ Sumar Carrera</button>
          </div>
        </div>

        {/* Controles Generales */}
        <div className="controls">
          <button onClick={reiniciarPartido} className="btn btn-reset">↺ Reiniciar Partido</button>
        </div>
      </div>
  );
}

export default App;