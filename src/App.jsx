import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import './App.css';

function App() {
  // Comprobamos si la ventana se abrió en modo proyección
  const esProyeccion = window.location.search.includes('proyeccion=true');

  const [pantalla, setPantalla] = useState(esProyeccion ? 'proyeccion' : 'inicio');
  const [bancoPreguntas, setBancoPreguntas] = useState(() => {
    const guardadas = localStorage.getItem('lbb_preguntas');
    return guardadas ? JSON.parse(guardadas) : [];
  });

  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [nuevasOpciones, setNuevasOpciones] = useState(['', '', '', '']);
  const [tipoRespuesta, setTipoRespuesta] = useState('multiple');
  const [dificultad, setDificultad] = useState('hit');

  const [preguntaActual, setPreguntaActual] = useState(null);
  const [batazoActual, setBatazoActual] = useState(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [outs, setOuts] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [inning, setInning] = useState(1);
  const [equipoBate, setEquipoBate] = useState('Azul');
  const [bases, setBases] = useState({ primera: false, segunda: false, tercera: false });

  const [tiempo, setTiempo] = useState(30);
  const [timerActivo, setTimerActivo] = useState(false);

  // --- SINCRONIZACIÓN ENTRE VENTANAS ---
  // Escuchar cambios en localStorage para actualizar la proyección
  useEffect(() => {
    const sincronizar = () => {
      const estadoGuardado = JSON.parse(localStorage.getItem('lbb_estado'));
      if (estadoGuardado) {
        setPreguntaActual(estadoGuardado.preguntaActual);
        setBatazoActual(estadoGuardado.batazoActual);
        setScoreA(estadoGuardado.scoreA);
        setScoreB(estadoGuardado.scoreB);
        setOuts(estadoGuardado.outs);
        setStrikes(estadoGuardado.strikes);
        setInning(estadoGuardado.inning);
        setEquipoBate(estadoGuardado.equipoBate);
        setBases(estadoGuardado.bases);
        setTiempo(estadoGuardado.tiempo);
      }
    };

    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, []);

  // Guardar el estado cada vez que cambie algo
  useEffect(() => {
    if (!esProyeccion) {
      const estado = { preguntaActual, batazoActual, scoreA, scoreB, outs, strikes, inning, equipoBate, bases, tiempo };
      localStorage.setItem('lbb_estado', JSON.stringify(estado));
    }
  }, [preguntaActual, batazoActual, scoreA, scoreB, outs, strikes, inning, equipoBate, bases, tiempo, esProyeccion]);

  // Guardar preguntas
  useEffect(() => {
    localStorage.setItem('lbb_preguntas', JSON.stringify(bancoPreguntas));
  }, [bancoPreguntas]);

  useEffect(() => {
    let interval = null;
    if (timerActivo && tiempo > 0) {
      interval = setInterval(() => setTiempo(t => t - 1), 1000);
    } else if (tiempo === 0) {
      setTimerActivo(false);
    }
    return () => clearInterval(interval);
  }, [timerActivo, tiempo]);

  const agregarPregunta = () => {
    if (nuevaPregunta.trim() === '') return alert("Escribe la pregunta");
    const nueva = {
      id: Date.now(), texto: nuevaPregunta, tipo: tipoRespuesta,
      opciones: tipoRespuesta === 'multiple' ? nuevasOpciones : [], dificultad
    };
    setBancoPreguntas([...bancoPreguntas, nueva]);
    setNuevaPregunta(''); setNuevasOpciones(['', '', '', '']);
  };

  const empezarJuego = () => {
    if (bancoPreguntas.length === 0) return alert("Agrega preguntas primero");
    setPantalla('host');
  };

  const lanzarPregunta = (dificultadElegida) => {
    // NUEVO: Si no hay preguntas en absoluto, terminar el juego
    if (bancoPreguntas.length === 0) {
      alert("¡No quedan más preguntas en el banco! El juego ha terminado.");
      setPantalla('fin');
      return;
    }

    const disponibles = bancoPreguntas.filter(p => p.dificultad === dificultadElegida);
    if (disponibles.length === 0) {
      return alert(`No quedan preguntas de tipo ${dificultadElegida.toUpperCase()}. Intenta con otra dificultad.`);
    }

    const indiceAzar = Math.floor(Math.random() * disponibles.length);
    const preguntaSeleccionada = disponibles[indiceAzar];
    setBancoPreguntas(bancoPreguntas.filter(p => p.id !== preguntaSeleccionada.id));

    setPreguntaActual(preguntaSeleccionada);
    setBatazoActual(dificultadElegida);
    setTiempo(30); setTimerActivo(false);
  };
  const resolverJugada = (esCorrecto) => {
    if (!preguntaActual) return;

    if (esCorrecto) {
      let nBases = { ...bases };
      let carrerasAnotadas = 0;

      if (batazoActual === 'hit') {
        if (nBases.tercera) carrerasAnotadas++;
        nBases.tercera = nBases.segunda; nBases.segunda = nBases.primera; nBases.primera = true;
      } else if (batazoActual === 'doble') {
        if (nBases.tercera) carrerasAnotadas++;
        if (nBases.segunda) carrerasAnotadas++;
        nBases.tercera = nBases.primera; nBases.segunda = true; nBases.primera = false;
      } else if (batazoActual === 'jonron') {
        if (nBases.tercera) carrerasAnotadas++;
        if (nBases.segunda) carrerasAnotadas++;
        if (nBases.primera) carrerasAnotadas++;
        carrerasAnotadas++;
        nBases = { primera: false, segunda: false, tercera: false };
        confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 } });
      }

      if (equipoBate === 'Azul') setScoreA(scoreA + carrerasAnotadas);
      else setScoreB(scoreB + carrerasAnotadas);

      setBases(nBases); setStrikes(0);
    } else {
      const nuevosStrikes = strikes + 1;
      if (nuevosStrikes >= 3) {
        setStrikes(0);
        const nuevosOuts = outs + 1;
        if (nuevosOuts >= 3) {
          setOuts(0); setBases({ primera: false, segunda: false, tercera: false });
          if (equipoBate === 'Azul') setEquipoBate('Rojo');
          else {
            setEquipoBate('Azul');
            const nuevoInning = inning + 1;
            setInning(nuevoInning);
            if (nuevoInning > 3) setPantalla('fin');
          }
        } else setOuts(nuevosOuts);
      } else setStrikes(nuevosStrikes);
    }

    setPreguntaActual(null); setBatazoActual(null); setTimerActivo(false);
  };

  // --- VISTAS ---
  if (pantalla === 'fin') {
    return (
        <div className="fin-juego-container">
          <h1> ¡FIN DEL JUEGO! </h1>
          <div className="resultado-final">
            <div className={scoreA >= scoreB ? 'ganador' : ''}>
              <h2>Equipo Azul</h2><p className="score-final">{scoreA}</p>
            </div>
            <div className={scoreB > scoreA ? 'ganador' : ''}>
              <h2>Equipo Rojo</h2><p className="score-final">{scoreB}</p>
            </div>
          </div>
          <h2 className="anuncio-ganador">{scoreA > scoreB ? '¡Ganó el Equipo Azul!' : scoreB > scoreA ? '¡Ganó el Equipo Rojo!' : '¡Empate!'}</h2>
          <button
              onClick={() => {
                // Reiniciar todos los estados
                setScoreA(0); setScoreB(0); setOuts(0); setStrikes(0);
                setInning(1); setEquipoBate('Azul');
                setBases({ primera: false, segunda: false, tercera: false });
                setPantalla('inicio');
                localStorage.removeItem('lbb_estado'); // Limpiar estado guardado
              }}
              className="btn-primario" style={{padding: '20px 40px', fontSize: '1.5rem'}}>
            Jugar de Nuevo
          </button>
        </div>
    );
  }

  if (pantalla === 'inicio') {
    return (
        <div className="app-container dark-mode">
          <h1 style={{color: '#F4F4F9', textAlign: 'center', marginBottom: '30px'}}> Configuración LBB</h1>
          <div className="card">
            <h2>Cargar Nueva Pregunta ({bancoPreguntas.length} en banco)</h2>
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
            <button onClick={agregarPregunta} className="btn-primario" style={{marginTop: '20px', width: '100%'}}>+ Añadir Pregunta</button>
          </div>
          <button onClick={empezarJuego} className="btn-exito" style={{width: '100%', fontSize: '1.5rem', padding: '25px', marginTop: '20px'}}>
            INICIAR PARTIDO
          </button>
        </div>
    );
  }

  if (pantalla === 'proyeccion') {
    return (
        <div className="proyeccion-container">
          <div className="proy-header">
            <span className="proy-inning">INNING {inning}</span>
            <span className="proy-score">AZUL <span className="score-num">{scoreA}</span> - <span className="score-num">{scoreB}</span> ROJO</span>
            <span className="proy-status">OUTS: {outs} | STRIKES: {strikes}</span>
          </div>
          <div className="proy-main">
            <div className="proy-pregunta-area">
              {preguntaActual ? (
                  <>
                    <div className={`badge-dificultad ${batazoActual}`}>{batazoActual.toUpperCase()}</div>
                    <h2>{preguntaActual.texto}</h2>
                    <div className="timer-circle">⏱ {tiempo}</div>
                    {preguntaActual.tipo === 'multiple' && (
                        <div className="proy-opciones-grid">
                          {preguntaActual.opciones.map((op, i) => op && <div key={i} className="proy-opcion">{op}</div>)}
                        </div>
                    )}
                  </>
              ) : (
                  <h2 style={{opacity: 0.2, letterSpacing: '5px'}}>ESPERANDO LANZAMIENTO...</h2>
              )}
            </div>
            <div className="diamond-container">
              <h3 style={{textAlign:'center', color: 'var(--accent-white)'}}>BATEANDO: {equipoBate.toUpperCase()}</h3>
              <div className="baseball-diamond">
                <div className="infield"></div>
                <div className="base home"></div>
                <div className={`base primera ${bases.primera ? 'active' : ''}`}></div>
                <div className={`base segunda ${bases.segunda ? 'active' : ''}`}></div>
                <div className={`base tercera ${bases.tercera ? 'active' : ''}`}></div>
              </div>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="app-container dark-mode">
        <header className="host-header">
          <h1> PANEL DEL HOST</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
                onClick={() => { if(window.confirm('¿Seguro que quieres terminar el partido?')) setPantalla('fin'); }}
                className="btn-proyectar"
                style={{ background: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>
               Finalizar Partido
            </button>

            <button onClick={() => window.open(window.location.origin + '?proyeccion=true', '_blank')} className="btn-proyectar">
               Abrir Proyección
            </button>
          </div>
        </header>

        <div className="host-grid">
          <div className="scoreboard-pro">
            <div className={`team-score ${equipoBate === 'Azul' ? 'bateando' : ''}`}>
              <span className="team-name">EQUIPO AZUL</span>
              <span className="team-runs">{scoreA}</span>
            </div>

            <div className="game-info-center">
              <div className="inning-box">INNING <span>{inning}</span></div>
              <div className="counts-box">
                <div className="count-group">
                  <span className="label">OUTS</span>
                  <div className="dots">
                    <div className={`dot out ${outs > 0 ? 'active' : ''}`}></div>
                    <div className={`dot out ${outs > 1 ? 'active' : ''}`}></div>
                    <div className={`dot out ${outs > 2 ? 'active' : ''}`}></div>
                  </div>
                </div>
                <div className="count-group">
                  <span className="label">STRIKES</span>
                  <div className="dots">
                    <div className={`dot strike ${strikes > 0 ? 'active' : ''}`}></div>
                    <div className={`dot strike ${strikes > 1 ? 'active' : ''}`}></div>
                    <div className={`dot strike ${strikes > 2 ? 'active' : ''}`}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`team-score ${equipoBate === 'Rojo' ? 'bateando' : ''}`}>
              <span className="team-name">EQUIPO ROJO</span>
              <span className="team-runs">{scoreB}</span>
            </div>
          </div>

          <div className="controls-panel">
            {!preguntaActual ? (
                <div className="action-area">
                  <h2>Selecciona el Batazo:</h2>
                  <div className="batting-buttons">
                    <button onClick={() => lanzarPregunta('hit')} className="btn-bat hit">🏏 HIT<br/><small>Sencillo</small></button>
                    <button onClick={() => lanzarPregunta('doble')} className="btn-bat doble">⚡ DOBLE<br/><small>Extra base</small></button>
                    <button onClick={() => lanzarPregunta('jonron')} className="btn-bat jonron">💥 JONRÓN<br/><small>Home Run</small></button>
                  </div>

                  <div className="manual-bases">
                    <h3>Control Manual de Bases:</h3>
                    <div className="bases-buttons">
                      <button className={`btn-base ${bases.primera ? 'activa' : ''}`} onClick={() => setBases({...bases, primera: !bases.primera})}>1ª Base</button>
                      <button className={`btn-base ${bases.segunda ? 'activa' : ''}`} onClick={() => setBases({...bases, segunda: !bases.segunda})}>2ª Base</button>
                      <button className={`btn-base ${bases.tercera ? 'activa' : ''}`} onClick={() => setBases({...bases, tercera: !bases.tercera})}>3ª Base</button>
                    </div>
                  </div>
                </div>
            ) : (
                <div className="action-area active-question">
                  <div className="question-header">
                    <span className={`badge ${batazoActual}`}>{batazoActual.toUpperCase()}</span>
                    <span className={`timer-display ${tiempo === 0 ? 'tiempo-agotado' : ''}`}>
                  {tiempo === 0 ? ' ¡TIEMPO!' : `⏱ ${tiempo}s`}
                </span>
                    <button onClick={() => setTimerActivo(!timerActivo)} className="btn-timer">
                      {timerActivo ? 'PAUSAR' : 'INICIAR'}
                    </button>
                  </div>

                  <div className="question-display">
                    <h3>{preguntaActual.texto}</h3>
                  </div>

                  <div className="resolution-buttons">
                    <button onClick={() => resolverJugada(true)} className="btn-resolver correcto">
                       CORRECTO
                    </button>
                    <button onClick={() => resolverJugada(false)} className="btn-resolver fallo">
                       FALLÓ (STRIKE)
                    </button>
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
}

export default App;