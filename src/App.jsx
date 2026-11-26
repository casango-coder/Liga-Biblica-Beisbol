import { useState, useEffect } from 'react';
import './App.css';

function App() {
  // --- ESTADOS ---
  const [pantalla, setPantalla] = useState('inicio'); // 'inicio', 'host', 'proyeccion', 'fin'
  const [bancoPreguntas, setBancoPreguntas] = useState([]);

  // Creador de preguntas
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [nuevasOpciones, setNuevasOpciones] = useState(['', '', '', '']);
  const [tipoRespuesta, setTipoRespuesta] = useState('multiple');
  const [dificultad, setDificultad] = useState('hit');

  // Juego
  const [preguntaActual, setPreguntaActual] = useState(null);
  const [batazoActual, setBatazoActual] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [outs, setOuts] = useState(0);
  const [strikes, setStrikes] = useState(0); // NUEVO: Bolitas/Strikes
  const [inning, setInning] = useState(1);
  const [equipoBate, setEquipoBate] = useState('Azul');
  const [bases, setBases] = useState({ primera: false, segunda: false, tercera: false });
  const [juegoTerminado, setJuegoTerminado] = useState(false); // NUEVO

  // Temporizador
  const [tiempo, setTiempo] = useState(30);
  const [timerActivo, setTimerActivo] = useState(false);

  // Lógica del temporizador
  useEffect(() => {
    let interval = null;
    if (timerActivo && tiempo > 0) {
      interval = setInterval(() => setTiempo(t => t - 1), 1000);
    } else if (tiempo === 0) {
      setTimerActivo(false);
    }
    return () => clearInterval(interval);
  }, [timerActivo, tiempo]);

  // --- EDITOR DE PREGUNTAS ---
  const agregarPregunta = () => {
    if (nuevaPregunta.trim() === '') return alert("Escribe la pregunta");

    const nueva = {
      id: Date.now(),
      texto: nuevaPregunta,
      tipo: tipoRespuesta,
      opciones: tipoRespuesta === 'multiple' ? nuevasOpciones : [],
      dificultad: dificultad
    };

    setBancoPreguntas([...bancoPreguntas, nueva]);
    setNuevaPregunta('');
    setNuevasOpciones(['', '', '', '']);
  };

  const empezarJuego = () => {
    if (bancoPreguntas.length === 0) return alert("Agrega preguntas primero");
    setPantalla('host');
  };

  // --- MECÁNICA DE LANZAR PREGUNTA ---
  const lanzarPregunta = (dificultadElegida) => {
    const disponibles = bancoPreguntas.filter(p => p.dificultad === dificultadElegida);

    if (disponibles.length === 0) {
      return alert(`No quedan preguntas de tipo ${dificultadElegida.toUpperCase()}`);
    }

    const indiceAzar = Math.floor(Math.random() * disponibles.length);
    const preguntaSeleccionada = disponibles[indiceAzar];
    const nuevoBanco = bancoPreguntas.filter(p => p.id !== preguntaSeleccionada.id);

    setBancoPreguntas(nuevoBanco);
    setPreguntaActual(preguntaSeleccionada);
    setBatazoActual(dificultadElegida);
    setTiempo(30);
    setTimerActivo(false);
  };

  // --- RESOLUCIÓN DE LA JUGADA (3 STRIKES Y FIN DE JUEGO) ---
  const resolverJugada = (esCorrecto) => {
    if (!preguntaActual) return;

    if (esCorrecto) {
      // Avance de bases
      let nBases = { ...bases };
      let carrerasAnotadas = 0;

      if (batazoActual === 'hit') {
        if (nBases.tercera) carrerasAnotadas++;
        nBases.tercera = nBases.segunda;
        nBases.segunda = nBases.primera;
        nBases.primera = true;
      } else if (batazoActual === 'doble') {
        if (nBases.tercera) carrerasAnotadas++;
        if (nBases.segunda) carrerasAnotadas++;
        nBases.tercera = nBases.primera;
        nBases.segunda = true;
        nBases.primera = false;
      } else if (batazoActual === 'jonron') {
        if (nBases.tercera) carrerasAnotadas++;
        if (nBases.segunda) carrerasAnotadas++;
        if (nBases.primera) carrerasAnotadas++;
        carrerasAnotadas++;
        nBases = { primera: false, segunda: false, tercera: false };
      }

      if (equipoBate === 'Azul') setScoreA(scoreA + carrerasAnotadas);
      else setScoreB(scoreB + carrerasAnotadas);

      setBases(nBases);
      setStrikes(0); // Al conectar, se limpian los strikes
      alert(`¡Buen bateo! ${carrerasAnotadas} carreras anotadas.`);
    } else {
      // ES FALLO: Suma Strike
      const nuevosStrikes = strikes + 1;

      if (nuevosStrikes >= 3) {
        // 3 Strikes = 1 Out
        setStrikes(0);
        const nuevosOuts = outs + 1;

        if (nuevosOuts >= 3) {
          // 3 Outs = Cambio de equipo/Inning
          setOuts(0);
          setBases({ primera: false, segunda: false, tercera: false });

          if (equipoBate === 'Azul') {
            setEquipoBate('Rojo');
          } else {
            setEquipoBate('Azul');
            const nuevoInning = inning + 1;
            setInning(nuevoInning);

            // Comprobar si el juego terminó (ej. a 3 innings)
            if (nuevoInning > 3) {
              setJuegoTerminado(true);
              setPantalla('fin');
            }
          }
          alert("¡3 Outs! Cambio de equipo.");
        } else {
          setOuts(nuevosOuts);
          alert("¡STRIKE 3! Es un Out.");
        }
      } else {
        setStrikes(nuevosStrikes);
        alert(`Strike ${nuevosStrikes}.`);
      }
    }

    setPreguntaActual(null);
    setBatazoActual(null);
    setTimerActivo(false);
  };

  // --- VISTA 0: FIN DEL JUEGO ---
  if (pantalla === 'fin') {
    return (
        <div className="fin-juego-container">
          <h1>🏆 ¡FIN DEL JUEGO! 🏆</h1>
          <div className="resultado-final">
            <div className={scoreA >= scoreB ? 'ganador' : ''}>
              <h2>Equipo Azul</h2>
              <p className="score-final">{scoreA}</p>
            </div>
            <div className={scoreB > scoreA ? 'ganador' : ''}>
              <h2>Equipo Rojo</h2>
              <p className="score-final">{scoreB}</p>
            </div>
          </div>
          <h2 className="anuncio-ganador">
            {scoreA > scoreB ? '¡Ganó el Equipo Azul!' : scoreB > scoreA ? '¡Ganó el Equipo Rojo!' : '¡Empate!'}
          </h2>
          <button onClick={() => window.location.reload()} className="btn btn-blue" style={{padding: '20px 40px', fontSize: '1.2rem'}}>
            Jugar de Nuevo
          </button>
        </div>
    );
  }

  // --- VISTA 1: INICIO ---
  if (pantalla === 'inicio') {
    return (
        <div className="app-container">
          <h1>⚾ Configuración del Juego</h1>
          <div className="card">
            <h2>Cargar Nueva Pregunta</h2>
            <input type="text" placeholder="Escribe la pregunta aquí..." value={nuevaPregunta} onChange={(e) => setNuevaPregunta(e.target.value)} className="input-text"/>
            <div className="row">
              <select value={dificultad} onChange={(e) => setDificultad(e.target.value)} className="input-select">
                <option value="hit">Hit (Sencillo)</option>
                <option value="doble">Doble</option>
                <option value="jonron">Jonrón (Home Run)</option>
              </select>
              <select value={tipoRespuesta} onChange={(e) => setTipoRespuesta(e.target.value)} className="input-select">
                <option value="multiple">Opción Múltiple</option>
                <option value="libre">Respuesta Libre (Voz)</option>
              </select>
            </div>
            {tipoRespuesta === 'multiple' && (
                <div className="opciones-inputs">
                  {nuevasOpciones.map((op, i) => (
                      <input key={i} type="text" placeholder={`Opción ${i+1}`} value={op} onChange={(e) => { const copy = [...nuevasOpciones]; copy[i] = e.target.value; setNuevasOpciones(copy); }} className="input-text"/>
                  ))}
                </div>
            )}
            <button onClick={agregarPregunta} className="btn btn-blue" style={{marginTop: '15px'}}>+ Añadir al Banco</button>
          </div>
          <div className="card">
            <h3>Preguntas en el Banco: {bancoPreguntas.length}</h3>
          </div>
          <button onClick={empezarJuego} className="btn btn-green" style={{width: '100%', fontSize: '1.2rem', padding: '20px'}}>
            🎮 COMENZAR PARTIDO
          </button>
        </div>
    );
  }

  // --- VISTA 2: MODO PROYECCIÓN ---
  if (pantalla === 'proyeccion') {
    return (
        <div className="proyeccion-container" onClick={() => setPantalla('host')}>
          <div className="proy-header">
            <span>Inning {inning}</span>
            <span>Azul {scoreA} - {scoreB} Rojo</span>
            <span>Outs: {outs} | Strikes: {strikes}</span>
          </div>
          <div className="proy-main">
            <div className="proy-pregunta-area">
              {preguntaActual ? (
                  <>
                    <div className="badge-dificultad">{batazoActual.toUpperCase()}</div>
                    <h2>{preguntaActual.texto}</h2>
                    <div className="timer-circle">⏱ {tiempo}s</div>
                    {preguntaActual.tipo === 'multiple' && (
                        <div className="proy-opciones-grid">
                          {preguntaActual.opciones.map((op, i) => (
                              op && <div key={i} className="proy-opcion">{op}</div>
                          ))}
                        </div>
                    )}
                  </>
              ) : (
                  <h2 style={{opacity: 0.3}}>Esperando lanzamiento del Host...</h2>
              )}
            </div>
            <div className="diamond-container">
              <h3 style={{textAlign:'center', color: 'white'}}>Bateando: {equipoBate}</h3>
              <div className="baseball-diamond">
                <div className="infield"></div>
                <div className="base home"></div>
                <div className={`base primera ${bases.primera ? 'active' : ''}`}></div>
                <div className={`base segunda ${bases.segunda ? 'active' : ''}`}></div>
                <div className={`base tercera ${bases.tercera ? 'active' : ''}`}></div>
              </div>
            </div>
          </div>
          <p className="click-to-exit">Clic para volver al Panel del Host</p>
        </div>
    );
  }

  // --- VISTA 3: PANEL DEL HOST ---
  return (
      <div className="app-container">
        <header className="header">
          <h1>Panel del Host</h1>
          <button onClick={() => setPantalla('proyeccion')} className="btn btn-proyeccion">📺 Proyectar a la Sala</button>
        </header>
        <div className="host-grid">
          {!preguntaActual ? (
              <div className="game-status-panel">
                <h2>Turno al Bate: {equipoBate}</h2>
                <p>Outs: {outs} | Strikes: {strikes}</p>
                <div className="lanzar-botones">
                  <button onClick={() => lanzarPregunta('hit')} className="btn btn-green btn-lanzar">🏏 Lanzar HIT</button>
                  <button onClick={() => lanzarPregunta('doble')} className="btn btn-blue btn-lanzar">⚡ Lanzar DOBLE</button>
                  <button onClick={() => lanzarPregunta('jonron')} className="btn btn-gold btn-lanzar">💥 Lanzar JONRÓN</button>
                </div>
              </div>
          ) : (
              <div className="game-status-panel">
                <h2>Resolviendo: {batazoActual.toUpperCase()}</h2>
                <div className="timer-controls">
                  <span className="timer-display">⏱ {tiempo}s</span>
                  <button onClick={() => setTimerActivo(!timerActivo)} className="btn btn-ghost">{timerActivo ? 'Pausar' : 'Iniciar'}</button>
                </div>
                <div className="question-box" style={{margin: '20px 0', background: '#f8fafc', padding: '15px', borderRadius: '8px'}}>
                  <h3>{preguntaActual.texto}</h3>
                </div>
                <div className="controls">
                  <button onClick={() => resolverJugada(true)} className="btn btn-green" style={{flex: 1, padding: '20px'}}>✅ CORRECTO (Avanza)</button>
                  <button onClick={() => resolverJugada(false)} className="btn btn-red" style={{flex: 1, padding: '20px'}}>❌ FALLÓ (Strike)</button>
                </div>
              </div>
          )}
        </div>
      </div>
  );
}

export default App;