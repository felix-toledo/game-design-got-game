// Obtener referencias a los elementos del DOM
const mainMenuScreen = document.getElementById("main-menu-screen");
const menuScreen = document.getElementById("menu-screen");
const configScreen = document.getElementById("config-screen");
const gameScreen = document.getElementById("game-screen");
const houseCards = document.querySelectorAll(".house-card");
const characterSprite = document.getElementById("character-sprite");
const npcAldeano = document.getElementById("npc-aldeano");
const dialogContainer = document.getElementById("dialog-container");
const dialogText = document.getElementById("dialog-text");
const dialogButtons = document.getElementById("dialog-buttons");
const dialogSpeaker = document.getElementById("dialog-speaker");
const dialogClose = document.getElementById("dialog-close");
const goldValue = document.getElementById("gold-value");
const loyaltyValue = document.getElementById("loyalty-value");
const suppliesValue = document.getElementById("supplies-value");
const fiefLevelValue = document.getElementById("fief-level-value");
const xpValue = document.getElementById("xp-value");
const creditsScreen = document.getElementById("credits-screen");
const menuTheme = document.getElementById("menu-theme");
const castleTheme = document.getElementById("castle-theme");
const minorTheme = document.getElementById("minor-theme");
const creditsTheme = document.getElementById("credits-theme");

// Referencias a botones del menú principal
const btnStart = document.getElementById("btn-start");
const btnResume = document.getElementById("btn-resume");
const btnConfig = document.getElementById("btn-config");
const btnCredits = document.getElementById("btn-credits");
const btnExit = document.getElementById("btn-exit");
const btnBack = document.getElementById("btn-back");

// Referencias a controles de configuración
const toggleSound = document.getElementById("toggle-sound");
const zoomSlider = document.getElementById("zoom-slider");
const zoomValueDisplay = document.getElementById("zoom-value");

// Variables para el movimiento del personaje
let characterX = window.innerWidth / 2; // Posición inicial en el centro
let characterY = window.innerHeight - 170; // Posición inicial cerca del fondo
let isMoving = false;
let movementSpeed = 5;

// Variables del estado del juego
let gameState = {
  gold: 100, // Aumentado para balance mejor (necesario para alcanzar victoria)
  loyalty: 30, // Aumentado para balance mejor
  supplies: 5, // Aumentado de 0 a 5 para balance mejor
  xp: 0, // Experiencia del jugador
  fiefLevel: 1,
  missions: {
    banditsQuest: {
      offered: false,
      accepted: false,
      completed: false,
    },
    plagueQuest: {
      offered: false,
      accepted: false,
      completed: false,
    },
    borderConflictQuest: {
      offered: false,
      accepted: false,
      completed: false,
    },
    finalQuest: {
      offered: false,
      accepted: false,
      completed: false,
    },
  },
  creditsShown: false,
};

// Variables de configuración
let config = {
  soundEnabled: true,
  zoomLevel: 100,
};

// Cargar configuración del localStorage
function loadConfig() {
  const savedConfig = localStorage.getItem("gameConfig");
  if (savedConfig) {
    config = { ...config, ...JSON.parse(savedConfig) };
    updateConfigUI();
  }
}

// Guardar configuración en localStorage
function saveConfig() {
  localStorage.setItem("gameConfig", JSON.stringify(config));
}

// Actualizar UI de configuración
function updateConfigUI() {
  toggleSound.textContent = config.soundEnabled ? "Desactivar" : "Activar";
  toggleSound.classList.toggle("sound-off", !config.soundEnabled);
  zoomSlider.value = config.zoomLevel;
  zoomValueDisplay.textContent = config.zoomLevel + "%";
  
  // Aplicar zoom (compatible con diferentes navegadores)
  const zoomValue = config.zoomLevel / 100;
  if (typeof document.body.style.zoom !== "undefined") {
    document.body.style.zoom = config.zoomLevel + "%";
  } else {
    // Fallback usando transform para navegadores que no soportan zoom
    document.body.style.transform = `scale(${zoomValue})`;
    document.body.style.transformOrigin = "top left";
    document.body.style.width = `${100 / zoomValue}%`;
    document.body.style.height = `${100 / zoomValue}%`;
  }
  
  // Aplicar configuración de sonido
  const allAudio = [menuTheme, castleTheme, minorTheme, creditsTheme];
  allAudio.forEach((audio) => {
    audio.muted = !config.soundEnabled;
  });
}

// Verificar si hay partida guardada
function hasSaveGame() {
  return localStorage.getItem("gameState") !== null;
}

// Cargar estado del juego del localStorage
function loadGameState() {
  const savedState = localStorage.getItem("gameState");
  if (savedState) {
    const parsed = JSON.parse(savedState);
    gameState = { ...gameState, ...parsed };
    return true;
  }
  return false;
}

// Guardar estado del juego en localStorage
function saveGameState() {
  const stateToSave = {
    ...gameState,
    currentScene: currentScene,
    characterX: characterX,
    characterY: characterY,
    selectedHouse: selectedHouse,
  };
  localStorage.setItem("gameState", JSON.stringify(stateToSave));
  
  // Actualizar estado del botón de reanudar
  if (btnResume) {
    btnResume.style.opacity = "1";
    btnResume.style.cursor = "pointer";
    btnResume.disabled = false;
  }
}

// Variables para el cambio de escenarios
let currentScene = "castle"; // Escenario inicial
const scenes = {
  castle: "img/castle.png",
  castle_to_city: "img/castle_to_city.png",
  city: "img/city.png",
  city_to_woods: "img/city_to_woods.png",
  woods: "img/woods.png",
  woods_to_ruins: "img/woods_to_ruins.png",
  ruins: "img/ruins.png",
};

// Variables para la animación de caminar
let walkAnimationFrame = 0;
let idleImage = "img/eddard.png"; // Imagen cuando está quieto (por defecto Stark)
let walkImages = ["img/eddard_pie1.png", "img/eddard_pie2.png"]; // Imágenes para caminar (por defecto Stark)
let animationInterval = null;
let facingLeft = false; // Variable para rastrear si el personaje mira a la izquierda

// Variable para almacenar la casa seleccionada
let selectedHouse = "stark"; // Por defecto Stark

// Variables para la animación del NPC
let npcAnimationFrame = 0;
const npcImages = ["img/aldeano_pie1.png", "img/aldeano_pie2.png"];
let npcAnimationInterval = null;

// Teclas presionadas
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

// Función para hacer fade in del audio
function fadeInAudio(audioElement, duration = 2000) {
  audioElement.volume = 0;
  audioElement.play().catch((error) => {
    console.log("Error al reproducir audio:", error);
  });

  const interval = 50; // Actualizar cada 50ms
  const steps = duration / interval;
  const volumeStep = 1 / steps;
  let currentStep = 0;

  const fadeInterval = setInterval(() => {
    currentStep++;
    audioElement.volume = Math.min(volumeStep * currentStep, 1);

    if (currentStep >= steps) {
      clearInterval(fadeInterval);
      audioElement.volume = 1;
    }
  }, interval);
}

// Función para hacer fade out del audio
function fadeOutAudio(audioElement, duration = 500, callback) {
  // Si el audio no está reproduciéndose, ejecutar callback inmediatamente
  if (audioElement.paused || audioElement.volume === 0) {
    audioElement.pause();
    audioElement.currentTime = 0;
    audioElement.volume = 1; // Resetear volumen para la próxima vez
    if (callback) callback();
    return;
  }

  const interval = 50;
  const steps = duration / interval;
  const initialVolume = audioElement.volume;
  const volumeStep = initialVolume / steps;
  let currentStep = 0;

  const fadeInterval = setInterval(() => {
    currentStep++;
    audioElement.volume = Math.max(initialVolume - volumeStep * currentStep, 0);

    if (currentStep >= steps) {
      clearInterval(fadeInterval);
      audioElement.pause();
      audioElement.currentTime = 0;
      audioElement.volume = 1; // Resetear volumen para la próxima vez
      if (callback) callback();
    }
  }, interval);
}

// Función para verificar si hay una misión activa
function isMissionActive() {
  return (
    (gameState.missions.banditsQuest.accepted &&
      !gameState.missions.banditsQuest.completed) ||
    (gameState.missions.plagueQuest.accepted &&
      !gameState.missions.plagueQuest.completed) ||
    (gameState.missions.borderConflictQuest.accepted &&
      !gameState.missions.borderConflictQuest.completed) ||
    (gameState.missions.finalQuest.accepted &&
      !gameState.missions.finalQuest.completed)
  );
}

// Función para actualizar la música del juego según el estado de la misión
function updateGameMusic() {
  const missionActive = isMissionActive();
  
  if (missionActive) {
    // Si hay misión activa, reproducir minor_theme
    const minorThemePlaying = !minorTheme.paused && minorTheme.volume > 0;
    if (minorThemePlaying) {
      // Ya está sonando minor_theme, no hacer nada
      return;
    }
    // Cambiar de castle_theme a minor_theme (o iniciar minor_theme si castle no está sonando)
    const castleThemePlaying = !castleTheme.paused && castleTheme.volume > 0;
    if (castleThemePlaying) {
      fadeOutAudio(castleTheme, 500, () => {
        fadeInAudio(minorTheme, 2000);
      });
    } else {
      // Si ninguna está sonando, iniciar minor_theme directamente
      fadeInAudio(minorTheme, 2000);
    }
  } else {
    // Si no hay misión activa, reproducir castle_theme
    const castleThemePlaying = !castleTheme.paused && castleTheme.volume > 0;
    if (castleThemePlaying) {
      // Ya está sonando castle_theme, no hacer nada
      return;
    }
    // Cambiar de minor_theme a castle_theme (o iniciar castle_theme si minor no está sonando)
    const minorThemePlaying = !minorTheme.paused && minorTheme.volume > 0;
    if (minorThemePlaying) {
      fadeOutAudio(minorTheme, 500, () => {
        fadeInAudio(castleTheme, 2000);
      });
    } else {
      // Si ninguna está sonando, iniciar castle_theme directamente
      fadeInAudio(castleTheme, 2000);
    }
  }
}

// Iniciar música del menú al cargar la página
window.addEventListener("load", () => {
  loadConfig();
  updateConfigUI();
  
  // Verificar si hay partida guardada (sin cargar el estado)
  const hasSave = hasSaveGame();
  if (hasSave) {
    btnResume.style.opacity = "1";
    btnResume.style.cursor = "pointer";
    btnResume.disabled = false;
  } else {
    btnResume.style.opacity = "0.5";
    btnResume.style.cursor = "not-allowed";
    btnResume.disabled = true;
  }
  
  fadeInAudio(menuTheme, 2000);
});

// Función para configurar el personaje según la casa seleccionada
function setCharacterByHouse(house) {
  selectedHouse = house;

  if (house === "stark") {
    idleImage = "img/eddard.png";
    walkImages = ["img/eddard_pie1.png", "img/eddard_pie2.png"];
  } else if (house === "lannister") {
    idleImage = "img/twyin.png";
    walkImages = ["img/twyin_pie1.png", "img/twyin_pie2.png"];
  }

  // Actualizar la imagen del personaje inmediatamente
  characterSprite.src = idleImage;
  console.log(`Personaje configurado para Casa ${house}: ${idleImage}`);
}

// Añadir event listeners a cada tarjeta de casa
houseCards.forEach((card) => {
  card.addEventListener("click", () => {
    // Detener música del menú con fade out y luego iniciar música del juego
    fadeOutAudio(menuTheme, 500, () => {
      // Iniciar música según el estado de la misión (normalmente castle_theme al inicio)
      updateGameMusic();
    });

    // Ocultar la pantalla de menú con animación
    menuScreen.style.opacity = "0";
    menuScreen.style.transition = "opacity 0.5s ease";

    setTimeout(() => {
      menuScreen.style.display = "none";
      menuScreen.style.opacity = "1";

      // Mostrar la pantalla de juego
      gameScreen.style.display = "block";

      // Obtener la casa seleccionada y configurar el personaje
      const house = card.getAttribute("data-house");
      setCharacterByHouse(house);
      console.log(`Casa seleccionada: ${house}`);

      // Aplicar bonos/penalizaciones iniciales según la casa seleccionada
      if (house === "stark") {
        modifyLoyalty(5); // +5 Lealtad
        modifyGold(-5); // -5 Oro
      } else if (house === "lannister") {
        modifyLoyalty(-5); // -5 Lealtad
        modifyGold(5); // +5 Oro
      }

      // Actualizar estadísticas para mostrar valores iniciales
      updateStats();

      // Inicializar la posición del personaje
      updateCharacterPosition();

      // Actualizar el minimapa para mostrar la ubicación inicial
      updateMinimap();
      
      // Guardar estado inicial del juego
      saveGameState();
    }, 500);
  });
});

// Detectar cuando se presiona una tecla
document.addEventListener("keydown", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
    startWalkingAnimation();
  }
});

// Detectar cuando se suelta una tecla
document.addEventListener("keyup", (e) => {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;

    // Si ninguna tecla de dirección está presionada, detener la animación
    if (
      !keys.ArrowUp &&
      !keys.ArrowDown &&
      !keys.ArrowLeft &&
      !keys.ArrowRight
    ) {
      stopWalkingAnimation();
    }
  }
});

// Función para iniciar la animación de caminar
function startWalkingAnimation() {
  if (animationInterval) return; // Ya está animando

  isMoving = true;
  animationInterval = setInterval(() => {
    // Alternar entre las dos imágenes de caminata (pie1 y pie2)
    walkAnimationFrame = (walkAnimationFrame + 1) % walkImages.length;
    characterSprite.src = walkImages[walkAnimationFrame];
  }, 90); // Cambiar cada 100ms para una animación fluida
}

// Función para detener la animación de caminar
function stopWalkingAnimation() {
  isMoving = false;
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
  // Volver a la imagen de reposo (quieto)
  characterSprite.src = idleImage;
  walkAnimationFrame = 0;
}

// Función para actualizar la posición del personaje
function updateCharacterPosition() {
  characterSprite.style.left = characterX + "px";
  characterSprite.style.bottom = window.innerHeight - characterY + "px";
  // Aplicar reflejo horizontal si mira a la izquierda
  if (facingLeft) {
    characterSprite.style.transform = "translateX(-50%) scaleX(-1)";
  } else {
    characterSprite.style.transform = "translateX(-50%)";
  }
}

// Función para actualizar el minimapa
function updateMinimap() {
  const minimapLocations = document.querySelectorAll(".minimap-location");
  // Mapear escenarios de transición a escenarios principales para el minimapa
  const sceneToMainScene = {
    castle: "castle",
    castle_to_city: "city",
    city: "city",
    city_to_woods: "woods",
    woods: "woods",
    woods_to_ruins: "ruins",
    ruins: "ruins",
  };
  const mainScene = sceneToMainScene[currentScene] || currentScene;

  minimapLocations.forEach((location) => {
    if (location.getAttribute("data-location") === mainScene) {
      location.classList.add("active");
    } else {
      location.classList.remove("active");
    }
  });
}

// Función para cambiar el escenario
function changeScene(newScene) {
  currentScene = newScene;
  gameScreen.style.backgroundImage = `url('${scenes[newScene]}')`;
  updateMinimap();
  updateNPCVisibility();

  // Mostrar decisión de bandidos en woods si la misión fue aceptada y no completada
  if (
    newScene === "woods" &&
    gameState.missions.banditsQuest.accepted &&
    !gameState.missions.banditsQuest.completed
  ) {
    setTimeout(() => {
      showWoodsDecision();
    }, 500);
  }

  // Los créditos solo se muestran después de completar la misión final
  // (se maneja en showFinalEvaluation)

  console.log(`Escenario cambiado a: ${newScene}`);
}

// Función para calcular el nivel del feudo basado en XP
function calculateFiefLevel() {
  if (gameState.xp < 50) {
    return 1;
  } else if (gameState.xp < 100) {
    return 2;
  } else if (gameState.xp < 150) {
    return 3;
  } else {
    return 4;
  }
}

// Función para actualizar los valores de oro y lealtad
function updateStats() {
  goldValue.textContent = gameState.gold;
  loyaltyValue.textContent = gameState.loyalty;
  suppliesValue.textContent = gameState.supplies;
  xpValue.textContent = gameState.xp;
  // Calcular el nivel del feudo basado en XP
  gameState.fiefLevel = calculateFiefLevel();
  fiefLevelValue.textContent = gameState.fiefLevel;
}

// Función para modificar oro
function modifyGold(amount) {
  gameState.gold += amount;
  updateStats();
}

// Función para modificar lealtad
function modifyLoyalty(amount) {
  gameState.loyalty += amount;
  updateStats();
}

// Función para modificar suministros
function modifySupplies(amount) {
  gameState.supplies += amount;
  if (gameState.supplies < 0) gameState.supplies = 0; // No permitir negativos
  updateStats();
}

// Función para modificar XP
function modifyXP(amount) {
  gameState.xp += amount;
  if (gameState.xp < 0) gameState.xp = 0; // No permitir negativos
  updateStats();
}

// Función para modificar nivel de feudo (deprecated - ahora se calcula automáticamente)
function modifyFiefLevel(amount) {
  // Esta función ya no se usa, el nivel se calcula automáticamente desde XP
  // Se mantiene por compatibilidad pero no hace nada
  updateStats();
}

// Función para mostrar el diálogo
function showDialog(speaker, text, buttons) {
  dialogSpeaker.textContent = speaker;
  dialogText.textContent = text;
  dialogButtons.innerHTML = "";

  buttons.forEach((button) => {
    const btn = document.createElement("button");
    btn.className = `dialog-button ${button.class}`;
    btn.textContent = button.text;
    btn.onclick = button.action;
    dialogButtons.appendChild(btn);
  });

  dialogContainer.style.display = "flex";
}

// Función para cerrar el diálogo
function closeDialog() {
  dialogContainer.style.display = "none";
}

// Event listener para el botón de cerrar
dialogClose.addEventListener("click", closeDialog);

// Función para animar el NPC
function startNPCAnimation() {
  if (npcAnimationInterval) return;

  npcAnimationInterval = setInterval(() => {
    npcAnimationFrame = (npcAnimationFrame + 1) % npcImages.length;
    npcAldeano.src = npcImages[npcAnimationFrame];
  }, 300);
}

// Función para detener la animación del NPC
function stopNPCAnimation() {
  if (npcAnimationInterval) {
    clearInterval(npcAnimationInterval);
    npcAnimationInterval = null;
  }
}

// Función para actualizar la visibilidad del NPC según el escenario y el estado de la misión
function updateNPCVisibility() {
  // Si estamos en castle
  if (currentScene === "castle") {
    // Cuarta misión: finalQuest (solo si borderConflictQuest está completada y finalQuest no ha sido ofrecida)
    if (
      gameState.missions.borderConflictQuest.completed &&
      !gameState.missions.finalQuest.offered
    ) {
      npcAldeano.style.display = "block";
      startNPCAnimation();
      // Ofrecer la misión después de un pequeño delay
      setTimeout(() => {
        if (
          currentScene === "castle" &&
          gameState.missions.borderConflictQuest.completed &&
          !gameState.missions.finalQuest.offered
        ) {
          offerFinalQuest();
        }
      }, 1000);
      return;
    }
  }
  
  // Si estamos en city
  if (currentScene === "city") {
    // Primera misión: banditsQuest (si no ha sido ofrecida)
    if (!gameState.missions.banditsQuest.offered) {
    npcAldeano.style.display = "block";
    startNPCAnimation();
    // Ofrecer la misión después de un pequeño delay
    setTimeout(() => {
      if (currentScene === "city" && !gameState.missions.banditsQuest.offered) {
        offerBanditsQuest();
      }
    }, 1000);
      return;
    }
    // Segunda misión: plagueQuest (solo si banditsQuest está completada y plagueQuest no ha sido ofrecida)
    else if (
      gameState.missions.banditsQuest.completed &&
      !gameState.missions.plagueQuest.offered
    ) {
      npcAldeano.style.display = "block";
      startNPCAnimation();
      // Ofrecer la misión después de un pequeño delay
      setTimeout(() => {
        if (
          currentScene === "city" &&
          gameState.missions.banditsQuest.completed &&
          !gameState.missions.plagueQuest.offered
        ) {
          offerPlagueQuest();
        }
      }, 1000);
      return;
    }
  }
  
  // Si estamos en ruins
  if (currentScene === "ruins") {
    // Tercera misión: borderConflictQuest (solo si plagueQuest está completada y borderConflictQuest no ha sido ofrecida)
    if (
      gameState.missions.plagueQuest.completed &&
      !gameState.missions.borderConflictQuest.offered
    ) {
      npcAldeano.style.display = "block";
      startNPCAnimation();
      // Ofrecer la misión después de un pequeño delay
      setTimeout(() => {
        if (
          currentScene === "ruins" &&
          gameState.missions.plagueQuest.completed &&
          !gameState.missions.borderConflictQuest.offered
        ) {
          offerBorderConflictQuest();
        }
      }, 1000);
      return;
    }
  }
  
  // Si no hay misión que mostrar, ocultar NPC
    npcAldeano.style.display = "none";
    stopNPCAnimation();
}

// Función para ofrecer la misión de los bandidos
function offerBanditsQuest() {
  gameState.missions.banditsQuest.offered = true;

  showDialog(
    "Aldeano",
    "¡Mi señor/a! Unos bandidos bloquearon el camino del bosque y robaron un carro con suministros para el invierno. ¡Nuestra gente pasará hambre! Necesitamos su ayuda.",
    [
      {
        text: "Aceptar Misión",
        class: "primary",
        action: () => {
          gameState.missions.banditsQuest.accepted = true;
          // Cambiar a minor_theme cuando se acepta la misión
          updateGameMusic();
          closeDialog();
          showDialog(
            "Aldeano",
            "¡Gracias, mi señor/a! El pueblo no olvidará su valentía. Los bandidos están en el bosque.",
            [
              {
                text: "Continuar",
                class: "neutral",
                action: () => {
                  closeDialog();
                  npcAldeano.style.display = "none";
                  stopNPCAnimation();
                },
              },
            ]
          );
        },
      },
      {
        text: "Ignorar",
        class: "secondary",
        action: () => {
          modifyLoyalty(-2);
          gameState.missions.banditsQuest.completed = true;
          // Cambiar a castle_theme cuando se completa la misión (aunque sea ignorando)
          updateGameMusic();
          closeDialog();
          showDialog(
            "Aldeano",
            "Entiendo... *baja la cabeza con tristeza* Buscaremos otra forma...",
            [
              {
                text: "Continuar",
                class: "neutral",
                action: () => {
                  closeDialog();
                  npcAldeano.style.display = "none";
                  stopNPCAnimation();
                },
              },
            ]
          );
        },
      },
    ]
  );
}

// Función para ofrecer la misión de la plaga
function offerPlagueQuest() {
  gameState.missions.plagueQuest.offered = true;

  showDialog(
    "Aldeano",
    "¡Mi señor/a! Una plaga terrible afecta a la población de la ciudad. Las personas caen enfermas día tras día. Necesitamos oro urgente para importar curas de otras tierras antes de que sea demasiado tarde.",
    [
      {
        text: "Aceptar Misión",
        class: "primary",
        action: () => {
          gameState.missions.plagueQuest.accepted = true;
          // Cambiar a minor_theme cuando se acepta la misión
          updateGameMusic();
          closeDialog();
          // Mostrar inmediatamente las decisiones
          setTimeout(() => {
            showPlagueDecision();
          }, 500);
        },
      },
      {
        text: "Ignorar",
        class: "secondary",
        action: () => {
          modifyLoyalty(-2);
          gameState.missions.plagueQuest.completed = true;
          // Cambiar a castle_theme cuando se completa la misión (aunque sea ignorando)
          updateGameMusic();
          closeDialog();
          showDialog(
            "Aldeano",
            "Entiendo... *suspira* Espero que no sea demasiado tarde...",
            [
              {
                text: "Continuar",
                class: "neutral",
                action: () => {
                  closeDialog();
                  npcAldeano.style.display = "none";
                  stopNPCAnimation();
                },
              },
            ]
          );
        },
      },
    ]
  );
}

// Función para mostrar la decisión de la plaga
function showPlagueDecision() {
  showDialog(
    "Aldeano",
    "La situación es crítica, mi señor/a. ¿Qué decidirá hacer?",
    [
      {
        text: "Invertir de Inmediato (-20 Oro)",
        class: "primary",
        action: () => {
          if (gameState.gold >= 20) {
            modifyGold(-20);
            modifyLoyalty(18); // Aumentado de 15 a 18
            modifySupplies(12); // Aumentado de 10 a 12
            modifyXP(30); // XP por buena decisión
            gameState.missions.plagueQuest.completed = true;
            // El nivel del feudo se calcula automáticamente desde XP
            updateStats();
            // Cambiar a castle_theme cuando se completa la misión
            updateGameMusic();
            closeDialog();
            showDialog(
              "Narrador",
              "El pueblo agradece su sacrificio. Las curas llegan a tiempo y la plaga es controlada. Su feudo prospera y alcanza un nuevo nivel.",
              [
                {
                  text: "Continuar",
                  class: "neutral",
                  action: () => {
                    closeDialog();
                    npcAldeano.style.display = "none";
                    stopNPCAnimation();
                  },
                },
              ]
            );
          } else {
            closeDialog();
            showDialog(
              "Narrador",
              "No tienes suficiente oro para invertir de inmediato. Necesitas al menos 20 de oro.",
              [
                {
                  text: "Volver",
                  class: "neutral",
                  action: () => {
                    closeDialog();
                    showPlagueDecision();
                  },
                },
              ]
            );
          }
        },
      },
      {
        text: "No Invertir/Esperar (+0 Oro)",
        class: "secondary",
        action: () => {
          modifyLoyalty(-12); // Reducido de -15 a -12
          modifySupplies(-3); // Reducido de -5 a -3
          // No otorgar XP por mala decisión
          gameState.missions.plagueQuest.completed = true;
          // El nivel del feudo se calcula automáticamente desde XP
          updateStats();
          // Cambiar a castle_theme cuando se completa la misión
          updateGameMusic();
          closeDialog();
          showDialog(
            "Narrador",
            "La enfermedad se expande. La lealtad cae mientras el pueblo sufre las consecuencias de la decisión. El feudo no progresa como debería.",
            [
              {
                text: "Continuar",
                class: "neutral",
                action: () => {
                  closeDialog();
                  npcAldeano.style.display = "none";
                  stopNPCAnimation();
                },
              },
            ]
          );
        },
      },
    ]
  );
}

// Función para ofrecer la misión del conflicto fronterizo
function offerBorderConflictQuest() {
  gameState.missions.borderConflictQuest.offered = true;

  showDialog(
    "Aldeano",
    "¡Mi señor/a! Un feudo vecino se ha apoderado de nuestra fortificación crítica en las ruinas. Esta posición es estratégica para nuestra defensa. Sin ella, estamos expuestos a ataques y perdemos recursos valiosos. Necesitamos tomar una decisión rápida.",
    [
      {
        text: "Aceptar Misión",
        class: "primary",
        action: () => {
          gameState.missions.borderConflictQuest.accepted = true;
          // Cambiar a minor_theme cuando se acepta la misión
          updateGameMusic();
          closeDialog();
          // Mostrar inmediatamente las decisiones
          setTimeout(() => {
            showBorderConflictDecision();
          }, 500);
        },
      },
      {
        text: "Ignorar",
        class: "secondary",
        action: () => {
          modifyLoyalty(-2);
          gameState.missions.borderConflictQuest.completed = true;
          // Cambiar a castle_theme cuando se completa la misión (aunque sea ignorando)
          updateGameMusic();
          closeDialog();
          showDialog(
            "Aldeano",
            "Entiendo... *frunce el ceño* La fortificación seguirá en manos del enemigo entonces...",
            [
              {
                text: "Continuar",
                class: "neutral",
                action: () => {
                  closeDialog();
                  npcAldeano.style.display = "none";
                  stopNPCAnimation();
                },
              },
            ]
          );
        },
      },
    ]
  );
}

// Función para mostrar la decisión del conflicto fronterizo
function showBorderConflictDecision() {
  showDialog(
    "Aldeano",
    "Tenemos dos opciones para recuperar la fortificación. ¿Qué ordena, mi señor/a?",
    [
      {
        text: "Enviar Tropas (Alto Riesgo) (-20 Lealtad)",
        class: "primary",
        action: () => {
          // El costo es -20 Lealtad siempre
          modifyLoyalty(-20);
          
          // Verificar si hay suficiente oro para el éxito
          if (gameState.gold >= 40) {
            // Éxito: Las tropas están bien equipadas
            modifySupplies(25); // Aumentado de 20 a 25
            modifyXP(35); // XP por buena decisión exitosa
            gameState.missions.borderConflictQuest.completed = true;
            // El nivel del feudo se calcula automáticamente desde XP
            updateStats();
            // Cambiar a castle_theme cuando se completa la misión
            updateGameMusic();
            closeDialog();
            showDialog(
              "Narrador",
              "Sus tropas, bien equipadas gracias a los recursos disponibles, logran recuperar la fortificación con éxito. La posición estratégica es recuperada y los suministros capturados fortalecen su feudo.",
              [
                {
                  text: "Continuar",
                  class: "neutral",
                  action: () => {
                    closeDialog();
                    npcAldeano.style.display = "none";
                    stopNPCAnimation();
                  },
                },
              ]
            );
          } else {
            // Fallo: No hay suficiente oro para equipar bien a las tropas
            modifyLoyalty(-8); // Reducido de -10 a -8
            modifySupplies(-5); // Reducido de -10 a -5
            // No otorgar XP por decisión fallida
            gameState.missions.borderConflictQuest.completed = true;
            // El nivel del feudo se calcula automáticamente desde XP
            updateStats();
            // Cambiar a castle_theme cuando se completa la misión
            updateGameMusic();
            closeDialog();
            showDialog(
              "Narrador",
              "Las tropas parten sin el equipo adecuado. La falta de oro impide armarles correctamente, aumentando el riesgo. La batalla es costosa y aunque recuperan la fortificación, las pérdidas son significativas. El feudo no progresa como debería.",
              [
                {
                  text: "Continuar",
                  class: "neutral",
                  action: () => {
                    closeDialog();
                    npcAldeano.style.display = "none";
                    stopNPCAnimation();
                  },
                },
              ]
            );
          }
        },
      },
      {
        text: "Negociar (Alto Costo) (-40 Oro)",
        class: "secondary",
        action: () => {
          if (gameState.gold >= 40) {
            modifyGold(-40);
            modifyLoyalty(12); // Aumentado de 10 a 12
            modifySupplies(18); // Aumentado de 15 a 18
            modifyXP(40); // XP por buena decisión diplomática
            gameState.missions.borderConflictQuest.completed = true;
            // El nivel del feudo se calcula automáticamente desde XP
            updateStats();
            // Cambiar a castle_theme cuando se completa la misión
            updateGameMusic();
            closeDialog();
            showDialog(
              "Narrador",
              "La negociación es exitosa. Aunque el costo en oro es alto, evita derramamiento de sangre y la fortificación es recuperada pacíficamente. El pueblo aprecia su diplomacia y la lealtad crece junto con los recursos obtenidos.",
              [
                {
                  text: "Continuar",
                  class: "neutral",
                  action: () => {
                    closeDialog();
                    npcAldeano.style.display = "none";
                    stopNPCAnimation();
                  },
                },
              ]
            );
          } else {
            closeDialog();
            showDialog(
              "Narrador",
              "No tienes suficiente oro para negociar. Necesitas al menos 40 de oro para esta opción.",
              [
                {
                  text: "Volver",
                  class: "neutral",
                  action: () => {
                    closeDialog();
                    showBorderConflictDecision();
                  },
                },
              ]
            );
          }
        },
      },
    ]
  );
}

// Función para ofrecer la misión final (evaluación del Consejero)
function offerFinalQuest() {
  gameState.missions.finalQuest.offered = true;

  showDialog(
    "Aldeano",
    "Mi señor/a, ha llegado el momento crucial. Como su Consejero, debo evaluar el estado actual de nuestro feudo antes del invierno. ¿Desea que proceda con la evaluación final?",
    [
      {
        text: "Aceptar Evaluación",
        class: "primary",
        action: () => {
          gameState.missions.finalQuest.accepted = true;
          // Cambiar a minor_theme cuando se acepta la misión
          updateGameMusic();
          closeDialog();
          // Mostrar inmediatamente la evaluación
          setTimeout(() => {
            showFinalEvaluation();
          }, 500);
        },
      },
      {
        text: "Todavía no",
        class: "secondary",
        action: () => {
          closeDialog();
          // No marcar como completada, permite volver más tarde
        },
      },
    ]
  );
}

// Función para mostrar la evaluación final y determinar victoria/derrota
function showFinalEvaluation() {
  // Evaluar condiciones de victoria (ajustadas para ser más alcanzables)
  const hasVictory = 
    gameState.loyalty >= 35 && // Reducido para ser más alcanzable
    gameState.gold >= 50 && // Reducido para ser más alcanzable
    gameState.supplies >= 20; // Reducido para ser más alcanzable

  gameState.missions.finalQuest.completed = true;
  // Cambiar a castle_theme cuando se completa la misión
  updateGameMusic();

  if (hasVictory) {
    // VICTORIA
    showDialog(
      "Aldeano",
      "Permítame evaluar los recursos del feudo, mi señor/a...",
      [
        {
          text: "Continuar",
          class: "neutral",
          action: () => {
            closeDialog();
            setTimeout(() => {
              showDialog(
                "Narrador",
                "Su Casa ha asegurado la paz y la supervivencia. El Invierno llegó, pero el feudo está listo. La gente lo recordará como un gran líder.",
                [
                  {
                    text: "Continuar",
                    class: "primary",
                    action: () => {
                      closeDialog();
                      // Después de mostrar la victoria, mostrar créditos
                      setTimeout(() => {
                        showCredits();
                      }, 1000);
                    },
                  },
                ]
              );
            }, 500);
          },
        },
      ]
    );
  } else {
    // DERROTA
    showDialog(
      "Aldeano",
      "Permítame evaluar los recursos del feudo, mi señor/a...",
      [
        {
          text: "Continuar",
          class: "neutral",
          action: () => {
            closeDialog();
            setTimeout(() => {
              showDialog(
                "Narrador",
                "El frío es implacable. La falta de recursos, el descontento popular, o la bancarrota condenan a su feudo. Un invierno largo espera. Su reinado termina en la tragedia.",
                [
                  {
                    text: "Continuar",
                    class: "secondary",
                    action: () => {
                      closeDialog();
                      // Después de mostrar la derrota, mostrar créditos
                      setTimeout(() => {
                        showCredits();
                      }, 1000);
                    },
                  },
                ]
              );
            }, 500);
          },
        },
      ]
    );
  }
}

// Función para mostrar los créditos (desde el juego)
function showCredits() {
  gameState.creditsShown = true;
  creditsScreen.style.display = "flex";

  // Detener música del juego (puede ser castle_theme o minor_theme) y iniciar música de créditos
  // Verificar cuál está sonando
  const castlePlaying = !castleTheme.paused && castleTheme.volume > 0;
  const minorPlaying = !minorTheme.paused && minorTheme.volume > 0;
  
  const fadeOutCurrentTheme = () => {
    // Saltar los primeros 5 segundos de silencio
    creditsTheme.currentTime = 6;
    fadeInAudio(creditsTheme, 2000);
  };
  
  if (castlePlaying) {
    fadeOutAudio(castleTheme, 500, fadeOutCurrentTheme);
  } else if (minorPlaying) {
    fadeOutAudio(minorTheme, 500, fadeOutCurrentTheme);
  } else {
    // Si ninguna está sonando, iniciar créditos directamente
    fadeOutCurrentTheme();
  }

  // Event listener para volver al menú al presionar cualquier tecla
  const handleKeyPress = (e) => {
    returnToMenu();
    document.removeEventListener("keydown", handleKeyPress);
  };

  document.addEventListener("keydown", handleKeyPress);
}

// Función para volver al menú principal
function returnToMenu() {
  // Detener música de créditos y reiniciar música del menú
  fadeOutAudio(creditsTheme, 500, () => {
    fadeInAudio(menuTheme, 2000);
  });

  // Ocultar créditos
  creditsScreen.style.display = "none";

  // Ocultar pantalla de juego
  gameScreen.style.display = "none";

  // Detener música del juego si está sonando (ambas posibles)
  fadeOutAudio(castleTheme, 500);
  fadeOutAudio(minorTheme, 500);

  // Mostrar menú principal con animación
  mainMenuScreen.style.display = "flex";
  mainMenuScreen.style.opacity = "0";
  mainMenuScreen.style.transition = "opacity 0.5s ease";

  setTimeout(() => {
    mainMenuScreen.style.opacity = "1";
  }, 100);

  // Reiniciar el estado del juego
  gameState = {
    gold: 100, // Aumentado para balance mejor (necesario para alcanzar victoria)
    loyalty: 30, // Aumentado para balance mejor
    supplies: 5, // Aumentado de 0 a 5 para balance mejor
    xp: 0, // Experiencia del jugador
    fiefLevel: 1,
    missions: {
      banditsQuest: {
        offered: false,
        accepted: false,
        completed: false,
        shouldShowCredits: false,
      },
      plagueQuest: {
        offered: false,
        accepted: false,
        completed: false,
      },
      borderConflictQuest: {
        offered: false,
        accepted: false,
        completed: false,
      },
      finalQuest: {
        offered: false,
        accepted: false,
        completed: false,
      },
    },
    creditsShown: false,
  };

  // Reiniciar escenario
  currentScene = "castle";

  // Reiniciar posición del personaje
  characterX = window.innerWidth / 2;
  characterY = window.innerHeight - 170;

  // Reiniciar personaje a Stark por defecto
  setCharacterByHouse("stark");

  // Actualizar stats
  updateStats();

  // Guardar estado (reiniciado)
  saveGameState();

  console.log("Volviendo al menú principal");
}

// Función para mostrar menú de selección de casas
function showHouseSelection() {
  mainMenuScreen.style.opacity = "0";
  mainMenuScreen.style.transition = "opacity 0.5s ease";
  
  setTimeout(() => {
    mainMenuScreen.style.display = "none";
    menuScreen.style.display = "flex";
    menuScreen.style.opacity = "0";
    menuScreen.style.transition = "opacity 0.5s ease";
    
    setTimeout(() => {
      menuScreen.style.opacity = "1";
    }, 100);
  }, 500);
}

// Función para reanudar juego guardado
function resumeGame() {
  if (!loadGameState()) {
    alert("No hay partida guardada");
    return;
  }
  
  // Ocultar menú principal
  mainMenuScreen.style.opacity = "0";
  mainMenuScreen.style.transition = "opacity 0.5s ease";
  
  setTimeout(() => {
    mainMenuScreen.style.display = "none";
    
    // Restaurar estado del juego
    const savedState = JSON.parse(localStorage.getItem("gameState"));
    currentScene = savedState.currentScene || "castle";
    characterX = savedState.characterX || window.innerWidth / 2;
    characterY = savedState.characterY || window.innerHeight - 170;
    selectedHouse = savedState.selectedHouse || "stark";
    
    // Configurar personaje según la casa guardada
    setCharacterByHouse(selectedHouse);
    
    // Cambiar escenario
    changeScene(currentScene);
    
    // Actualizar posición del personaje
    updateCharacterPosition();
    
    // Actualizar stats
    updateStats();
    
    // Mostrar pantalla de juego
    gameScreen.style.display = "block";
    
    // Detener música del menú y reproducir música del juego según el estado de la misión
    fadeOutAudio(menuTheme, 500, () => {
      // Verificar si hay misión activa y reproducir la música correspondiente
      updateGameMusic();
    });
  }, 500);
}

// Función para mostrar configuración
function showConfig() {
  mainMenuScreen.style.opacity = "0";
  mainMenuScreen.style.transition = "opacity 0.5s ease";
  
  setTimeout(() => {
    mainMenuScreen.style.display = "none";
    configScreen.style.display = "flex";
    configScreen.style.opacity = "0";
    configScreen.style.transition = "opacity 0.5s ease";
    
    setTimeout(() => {
      configScreen.style.opacity = "1";
    }, 100);
  }, 500);
}

// Función para volver al menú principal desde configuración
function backToMainMenu() {
  configScreen.style.opacity = "0";
  configScreen.style.transition = "opacity 0.5s ease";
  
  setTimeout(() => {
    configScreen.style.display = "none";
    mainMenuScreen.style.display = "flex";
    mainMenuScreen.style.opacity = "0";
    mainMenuScreen.style.transition = "opacity 0.5s ease";
    
    setTimeout(() => {
      mainMenuScreen.style.opacity = "1";
    }, 100);
  }, 500);
}

// Función para mostrar créditos
function showCreditsFromMenu() {
  mainMenuScreen.style.opacity = "0";
  mainMenuScreen.style.transition = "opacity 0.5s ease";
  
  setTimeout(() => {
    mainMenuScreen.style.display = "none";
    creditsScreen.style.display = "flex";
    
    // Detener música del menú y reproducir música de créditos
    fadeOutAudio(menuTheme, 500, () => {
      creditsTheme.currentTime = 6;
      fadeInAudio(creditsTheme, 2000);
    });
    
    // Event listener para volver al menú al presionar cualquier tecla
    const handleKeyPress = (e) => {
      backFromCredits();
      document.removeEventListener("keydown", handleKeyPress);
    };
    
    document.addEventListener("keydown", handleKeyPress);
  }, 500);
}

// Función para volver del menú de créditos
function backFromCredits() {
  fadeOutAudio(creditsTheme, 500, () => {
    fadeInAudio(menuTheme, 2000);
  });
  
  creditsScreen.style.display = "none";
  mainMenuScreen.style.display = "flex";
  mainMenuScreen.style.opacity = "0";
  mainMenuScreen.style.transition = "opacity 0.5s ease";
  
  setTimeout(() => {
    mainMenuScreen.style.opacity = "1";
  }, 100);
}

// Event listeners para botones del menú principal
btnStart.addEventListener("click", showHouseSelection);
btnResume.addEventListener("click", resumeGame);
btnConfig.addEventListener("click", showConfig);
btnCredits.addEventListener("click", showCreditsFromMenu);
btnExit.addEventListener("click", () => {
  if (confirm("¿Estás seguro de que quieres salir?")) {
    window.close();
  }
});

btnBack.addEventListener("click", backToMainMenu);

// Event listener para teclado en menú principal (1-5)
document.addEventListener("keydown", (e) => {
  // Solo procesar si el menú principal está visible
  const mainMenuVisible = window.getComputedStyle(mainMenuScreen).display !== "none" && 
                          mainMenuScreen.offsetParent !== null;
  
  if (mainMenuVisible) {
    if (e.key === "1") {
      showHouseSelection();
    } else if (e.key === "2" && hasSaveGame()) {
      resumeGame();
    } else if (e.key === "3") {
      showConfig();
    } else if (e.key === "4") {
      showCreditsFromMenu();
    } else if (e.key === "5") {
      if (confirm("¿Estás seguro de que quieres salir?")) {
        // Intentar cerrar ventana, si no funciona (pestaña), mostrar mensaje
        window.close();
        // Si es una pestaña, no se puede cerrar, pero al menos se intentó
      }
    }
  }
});

// Event listener para toggle de sonido
toggleSound.addEventListener("click", () => {
  config.soundEnabled = !config.soundEnabled;
  updateConfigUI();
  saveConfig();
});

// Event listener para slider de zoom
zoomSlider.addEventListener("input", (e) => {
  config.zoomLevel = parseInt(e.target.value);
  zoomValueDisplay.textContent = config.zoomLevel + "%";
  
  // Aplicar zoom (compatible con diferentes navegadores)
  const zoomValue = config.zoomLevel / 100;
  if (typeof document.body.style.zoom !== "undefined") {
    document.body.style.zoom = config.zoomLevel + "%";
  } else {
    // Fallback usando transform para navegadores que no soportan zoom
    document.body.style.transform = `scale(${zoomValue})`;
    document.body.style.transformOrigin = "top left";
    document.body.style.width = `${100 / zoomValue}%`;
    document.body.style.height = `${100 / zoomValue}%`;
  }
  
  saveConfig();
});

// Función para mostrar la decisión en el bosque
function showWoodsDecision() {
  showDialog(
    "Narrador",
    "Los bandidos están bloqueando el camino. Puedes ver el carro robado detrás de ellos. ¿Qué harás?",
    [
      {
        text: "Pagar a mercenarios (-15 Oro)",
        class: "primary",
        action: () => {
          if (gameState.gold >= 15) {
            modifyGold(-15);
            modifyLoyalty(12); // Aumentado de 10 a 12
            modifyXP(25); // XP por buena decisión
            gameState.missions.banditsQuest.completed = true;
            // Cambiar a castle_theme cuando se completa la misión
            updateGameMusic();
            closeDialog();
            showDialog(
              "Narrador",
              "Gastas parte de tu tesoro, pero los suministros son recuperados. Tu pueblo confía en vos.",
              [
                {
                  text: "Continuar",
                  class: "neutral",
                  action: closeDialog,
                },
              ]
            );
          } else {
            closeDialog();
            showDialog(
              "Narrador",
              "No tienes suficiente oro para contratar mercenarios. Necesitas al menos 15 de oro.",
              [
                {
                  text: "Volver",
                  class: "neutral",
                  action: () => {
                    closeDialog();
                    showWoodsDecision();
                  },
                },
              ]
            );
          }
        },
      },
      {
        text: "Es un riesgo que no podemos tomar",
        class: "secondary",
        action: () => {
          modifyLoyalty(-10);
          // No otorgar XP por mala decisión
          gameState.missions.banditsQuest.completed = true;
          // Cambiar a castle_theme cuando se completa la misión
          updateGameMusic();
          closeDialog();
          showDialog(
            "Narrador",
            "Decidís conservar tus recursos. El pueblo murmura descontento, sienten que los abandonaste.",
            [
              {
                text: "Continuar",
                class: "neutral",
                action: closeDialog,
              },
            ]
          );
        },
      },
    ]
  );
}

// Loop de movimiento
function moveCharacter() {
  let moved = false;

  // Mover según las teclas presionadas
  if (keys.ArrowUp) {
    characterY -= movementSpeed;
    moved = true;
  }
  if (keys.ArrowDown) {
    characterY += movementSpeed;
    moved = true;
  }
  if (keys.ArrowLeft) {
    characterX -= movementSpeed;
    facingLeft = true; // Mirar a la izquierda
    moved = true;
  }
  if (keys.ArrowRight) {
    characterX += movementSpeed;
    facingLeft = false; // Mirar a la derecha
    moved = true;
  }

  // Detectar cambios de escenario y límites de la pantalla
  const spriteWidth = characterSprite.offsetWidth;
  const spriteHeight = characterSprite.offsetHeight;
  const statsBarHeight = 50; // Altura aproximada de la barra de stats

  // Detectar si sale por abajo → avanzar de escenario y aparecer arriba
  if (characterY > window.innerHeight - 20) {
    if (currentScene === "castle") {
      changeScene("castle_to_city");
      characterY = statsBarHeight + spriteHeight + 10;
    } else if (currentScene === "castle_to_city") {
      changeScene("city");
      characterY = statsBarHeight + spriteHeight + 10;
    } else if (currentScene === "city") {
      changeScene("city_to_woods");
      characterY = statsBarHeight + spriteHeight + 10;
    } else if (currentScene === "city_to_woods") {
      changeScene("woods");
      characterY = statsBarHeight + spriteHeight + 10;
    } else if (currentScene === "woods") {
      changeScene("woods_to_ruins");
      characterY = statsBarHeight + spriteHeight + 10;
    } else if (currentScene === "woods_to_ruins") {
      changeScene("ruins");
      characterY = statsBarHeight + spriteHeight + 10;
    } else {
      // Si está en ruins, limitar normalmente
      characterY = window.innerHeight - 20;
    }
  }

  // Detectar si sale por arriba → retroceder de escenario y aparecer abajo
  if (characterY - spriteHeight < statsBarHeight) {
    if (currentScene === "ruins") {
      changeScene("woods_to_ruins");
      characterY = window.innerHeight - 40;
    } else if (currentScene === "woods_to_ruins") {
      changeScene("woods");
      characterY = window.innerHeight - 40;
    } else if (currentScene === "woods") {
      changeScene("city_to_woods");
      characterY = window.innerHeight - 40;
    } else if (currentScene === "city_to_woods") {
      changeScene("city");
      characterY = window.innerHeight - 40;
    } else if (currentScene === "city") {
      changeScene("castle_to_city");
      characterY = window.innerHeight - 40;
    } else if (currentScene === "castle_to_city") {
      changeScene("castle");
      characterY = window.innerHeight - 40;
    } else {
      // Si está en castle, limitar normalmente
      characterY = statsBarHeight + spriteHeight;
    }
  }

  // Límites horizontales normales

  // Límite izquierdo
  if (characterX - spriteWidth / 2 < 0) {
    characterX = spriteWidth / 2;
  }

  // Límite derecho
  if (characterX + spriteWidth / 2 > window.innerWidth) {
    characterX = window.innerWidth - spriteWidth / 2;
  }

  // Actualizar posición si hubo movimiento
  if (moved) {
    updateCharacterPosition();
    // Guardar estado periódicamente durante el juego
    if (Math.random() < 0.01) { // Guardar aproximadamente cada 100 frames
      saveGameState();
    }
  }

  // Continuar el loop
  requestAnimationFrame(moveCharacter);
}

// Iniciar el loop de movimiento
moveCharacter();
