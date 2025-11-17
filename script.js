// Obtener referencias a los elementos del DOM
const menuScreen = document.getElementById("menu-screen");
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
const creditsScreen = document.getElementById("credits-screen");
const menuTheme = document.getElementById("menu-theme");
const gameTheme = document.getElementById("game-theme");
const creditsTheme = document.getElementById("credits-theme");

// Variables para el movimiento del personaje
let characterX = window.innerWidth / 2; // Posición inicial en el centro
let characterY = window.innerHeight - 170; // Posición inicial cerca del fondo
let isMoving = false;
let movementSpeed = 5;

// Variables del estado del juego
let gameState = {
  gold: 50,
  loyalty: 20,
  missions: {
    banditsQuest: {
      offered: false,
      accepted: false,
      completed: false,
      shouldShowCredits: false,
    },
  },
  creditsShown: false,
};

// Variables para el cambio de escenarios
let currentScene = "castle"; // Escenario inicial
const scenes = {
  castle: "img/castle.png",
  city: "img/city.png",
  woods: "img/woods.png",
};

// Variables para la animación de caminar
let walkAnimationFrame = 0;
let idleImage = "img/eddard.png"; // Imagen cuando está quieto (por defecto Stark)
let walkImages = ["img/eddard_pie1.png", "img/eddard_pie2.png"]; // Imágenes para caminar (por defecto Stark)
let animationInterval = null;

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

// Iniciar música del menú al cargar la página
window.addEventListener("load", () => {
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
      fadeInAudio(gameTheme, 2000);
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

      // Inicializar la posición del personaje
      updateCharacterPosition();

      // Actualizar el minimapa para mostrar la ubicación inicial
      updateMinimap();
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
  characterSprite.style.transform = "translateX(-50%)";
}

// Función para actualizar el minimapa
function updateMinimap() {
  const minimapLocations = document.querySelectorAll(".minimap-location");
  minimapLocations.forEach((location) => {
    if (location.getAttribute("data-location") === currentScene) {
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

  // Mostrar créditos cuando volvemos a Castle después de completar la misión
  if (
    newScene === "castle" &&
    gameState.missions.banditsQuest.shouldShowCredits &&
    !gameState.creditsShown
  ) {
    setTimeout(() => {
      showCredits();
    }, 1000);
  }

  console.log(`Escenario cambiado a: ${newScene}`);
}

// Función para actualizar los valores de oro y lealtad
function updateStats() {
  goldValue.textContent = gameState.gold;
  loyaltyValue.textContent = gameState.loyalty;
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
  // Mostrar aldeano en city solo si la misión no ha sido ofrecida
  if (currentScene === "city" && !gameState.missions.banditsQuest.offered) {
    npcAldeano.style.display = "block";
    startNPCAnimation();
    // Ofrecer la misión después de un pequeño delay
    setTimeout(() => {
      if (currentScene === "city" && !gameState.missions.banditsQuest.offered) {
        offerBanditsQuest();
      }
    }, 1000);
  } else {
    npcAldeano.style.display = "none";
    stopNPCAnimation();
  }
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
          gameState.missions.banditsQuest.shouldShowCredits = true;
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

// Función para mostrar los créditos
function showCredits() {
  gameState.creditsShown = true;
  creditsScreen.style.display = "flex";

  // Detener música del juego y iniciar música de créditos
  fadeOutAudio(gameTheme, 500, () => {
    // Saltar los primeros 5 segundos de silencio
    creditsTheme.currentTime = 6;
    fadeInAudio(creditsTheme, 2000);
  });

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

  // Detener música del juego si está sonando
  fadeOutAudio(gameTheme, 500);

  // Mostrar menú con animación
  menuScreen.style.display = "flex";
  menuScreen.style.opacity = "0";
  menuScreen.style.transition = "opacity 0.5s ease";

  setTimeout(() => {
    menuScreen.style.opacity = "1";
  }, 100);

  // Reiniciar el estado del juego
  gameState = {
    gold: 50,
    loyalty: 20,
    missions: {
      banditsQuest: {
        offered: false,
        accepted: false,
        completed: false,
        shouldShowCredits: false,
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

  console.log("Volviendo al menú principal");
}

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
            modifyLoyalty(10);
            gameState.missions.banditsQuest.completed = true;
            gameState.missions.banditsQuest.shouldShowCredits = true;
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
          gameState.missions.banditsQuest.completed = true;
          gameState.missions.banditsQuest.shouldShowCredits = true;
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
    moved = true;
  }
  if (keys.ArrowRight) {
    characterX += movementSpeed;
    moved = true;
  }

  // Detectar cambios de escenario y límites de la pantalla
  const spriteWidth = characterSprite.offsetWidth;
  const spriteHeight = characterSprite.offsetHeight;
  const statsBarHeight = 50; // Altura aproximada de la barra de stats

  // Detectar si sale por abajo → avanzar de escenario y aparecer arriba
  if (characterY > window.innerHeight - 20) {
    if (currentScene === "castle") {
      changeScene("city");
      characterY = statsBarHeight + spriteHeight + 10;
    } else if (currentScene === "city") {
      changeScene("woods");
      characterY = statsBarHeight + spriteHeight + 10;
    } else {
      // Si está en woods, limitar normalmente
      characterY = window.innerHeight - 20;
    }
  }

  // Detectar si sale por arriba → retroceder de escenario y aparecer abajo
  if (characterY - spriteHeight < statsBarHeight) {
    if (currentScene === "woods") {
      changeScene("city");
      characterY = window.innerHeight - 40;
    } else if (currentScene === "city") {
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
  }

  // Continuar el loop
  requestAnimationFrame(moveCharacter);
}

// Iniciar el loop de movimiento
moveCharacter();
