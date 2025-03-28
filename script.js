// =======================================================
// MATHJACK – BLACKJACK MATEMÁTICO (VERSIÓN EXTENDIDA)
// Con sistema de apuestas, dos jugadores (humano y bot), niveles de dificultad,
// regla del As con toggle, regla del Chipotlé, restauración del marcador,
// datos interesantes, mini-cards decorativas y animación del título.
// =======================================================

// 1. VARIABLES GLOBALES Y ESTADO DEL JUEGO
let playerCardsDiv, playerTotalSpan, dealerCardsDiv, dealerTotalSpan, resultDiv;
let hitBtn, standBtn, restartBtn, resetScoreBtn;
let welcomeDiv, menuDificultades, juegoDiv;
let playerTotal = 0,
  botTotal = 0,
  dealerTotal = 0;
let gameOver = false,
  alreadyStood = false;
let humanWins = 0,
  botWins = 0,
  dealerWins = 0;
let deck = []; // Mazo completo
let humanHand = []; // Cartas del jugador humano
let botHand = []; // Cartas del jugador bot
let dificultad; // "facil", "intermedio" o "dificil"

// Sistema de apuestas
let humanBalance = 1000;
let botBalance = 1000;
let bet = 100;

function actualizarApuesta() {
  document.getElementById("balance-human").innerText = humanBalance;
  document.getElementById("balance-bot").innerText = botBalance;
  document.getElementById("bet-amount").innerText = bet;
}

// 2. OPERACIONES POR NIVEL
const operaciones = {
  facil: [
    { expr: "3 + 4", valor: 7 },
    { expr: "8 - 5", valor: 3 },
    { expr: "6 × 2", valor: 12 },
    { expr: "9 ÷ 3", valor: 3 }
  ],
  intermedio: [
    { expr: "3²", valor: 9 },
    { expr: "½ × 8", valor: 4 },
    { expr: "7 + 5 - 3", valor: 9 },
    { expr: "10 ÷ 2 + 3", valor: 8 }
  ],
  dificil: [
    { expr: "x + 3", valor: 8, contexto: { x: 5 } },
    { expr: "x² - 4", valor: 5, contexto: { x: 3 } },
    { expr: "2x + 7", valor: 17, contexto: { x: 5 } },
    { expr: "x - 2", valor: 3, contexto: { x: 5 } }
  ]
};

// 3. FUNCIONES PARA EL MAZO
function generarMazo() {
  const suits = ["♥", "♦", "♠", "♣"];
  const ranks = [
    "A",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "J",
    "Q",
    "K"
  ];
  let mazo = [];
  for (let suit of suits) {
    for (let rank of ranks) {
      let valor;
      if (rank === "A") {
        valor = 11;
      } else if (["J", "Q", "K"].includes(rank)) {
        valor = 10;
      } else {
        valor = parseInt(rank);
      }
      mazo.push({ rank, suit, valor });
    }
  }
  return mazo;
}

function barajarMazo(mazo) {
  for (let i = mazo.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
  }
  return mazo;
}

// 4. FUNCIONES PARA CALCULAR EL TOTAL Y AJUSTAR AS
function ajustarAces(hand, total) {
  for (let carta of hand) {
    if (total > 21 && carta.rank === "A" && carta.valor === 11) {
      carta.valor = 1;
      total -= 10;
    }
  }
  return total;
}

function evaluarCarta(carta) {
  if (carta.contexto) {
    let exprEvaluar = carta.expr;
    for (let variable in carta.contexto) {
      exprEvaluar = exprEvaluar.replace(variable, carta.contexto[variable]);
    }
    try {
      return eval(exprEvaluar);
    } catch (error) {
      console.error("Error evaluando:", exprEvaluar, error);
      return carta.valor;
    }
  }
  return carta.valor;
}

// 5. FUNCIONES DE INTERFAZ: CARTAS, TOGGLE PARA AS, MINI-CARDS
function drawCard() {
  return deck.pop();
}

function toggleAce(carta, toggleBtn, cardElement) {
  if (carta.valor === 11) {
    carta.valor = 1;
    toggleBtn.innerText = "Toggle Ace (current: 1)";
  } else {
    carta.valor = 11;
    toggleBtn.innerText = "Toggle Ace (current: 11)";
  }
  let nuevoTotal = humanHand.reduce((sum, c) => sum + c.valor, 0);
  playerTotal = nuevoTotal;
  playerTotalSpan.innerText = playerTotal;
  if (playerTotal <= 21) {
    resultDiv.innerText = "";
    gameOver = false;
    restartBtn.style.display = "none";
  } else {
    resultDiv.innerText = "💥 Te pasaste!";
    gameOver = true;
    dealerWins++;
    updateScoreboard();
    setTimeout(() => {
      restartBtn.style.display = "block";
    }, 1000);
    hitBtn.disabled = true;
  }
}

function agregarToggleSiAs(carta, cardElement) {
  if (carta.rank === "A") {
    setTimeout(() => {
      let toggleBtn = document.createElement("button");
      toggleBtn.className = "toggle-btn";
      toggleBtn.innerText = "Toggle Ace (current: " + carta.valor + ")";
      toggleBtn.addEventListener("click", () => {
        toggleAce(carta, toggleBtn, cardElement);
      });
      cardElement.appendChild(toggleBtn);
    }, 3000);
  }
}

// Para las mini-cards decorativas, se muestran aleatoriamente "Andrés", "Santiago" o "Triana"
function crearMiniCard() {
  const nombres = ["Andrés", "Santiago", "Triana"];
  let nombre = nombres[Math.floor(Math.random() * nombres.length)];
  let mini = document.createElement("div");
  mini.className = "small-card";
  mini.innerHTML = nombre;
  mini.style.top = Math.random() * 90 + "%";
  mini.style.left = Math.random() * 90 + "%";
  let bounceArea = document.getElementById("bounce-area");
  if (bounceArea && bounceArea.children.length < 20) {
    bounceArea.appendChild(mini);
  }
  setTimeout(() => {
    if (mini.parentElement) {
      mini.remove();
    }
  }, 10000);
}

function iniciarBounce() {
  setInterval(crearMiniCard, 2000);
}

// Función para agregar una carta a un jugador: "human", "bot" o "dealer"
function agregarCarta(jugador) {
  if (gameOver) return;
  let carta = drawCard();
  if (!carta) return;

  let cardElement = document.createElement("div");
  let colorClass = carta.suit === "♥" || carta.suit === "♦" ? "rojo" : "negro";
  cardElement.className = "card " + colorClass;
  cardElement.innerHTML = `${carta.rank}<br>${carta.suit}`;

  if (jugador === "human") {
    playerCardsDiv.appendChild(cardElement);
    humanHand.push(carta);
    playerTotal += evaluarCarta(carta);
    playerTotal = ajustarAces(humanHand, playerTotal);
    playerTotalSpan.innerText = playerTotal;
    let cardSound = document.getElementById("card-sound");
    if (cardSound) {
      cardSound.play();
    }

    if (carta.rank === "A") {
      agregarToggleSiAs(carta, cardElement);
    }

    if (
      humanHand.length === 2 &&
      humanHand[0].rank === "A" &&
      humanHand[1].rank === "A"
    ) {
      chipotleWin();
      return;
    }

    if (playerTotal > 21) {
      resultDiv.innerText = "💥 Te pasaste!";
      gameOver = true;
      dealerWins++;
      updateScoreboard();
      setTimeout(() => {
        restartBtn.style.display = "block";
      }, 1000);
      hitBtn.disabled = true;
      humanBalance -= bet;
      actualizarApuesta();
    }
  } else if (jugador === "bot") {
    document.getElementById("bot-cards").appendChild(cardElement);
    botHand.push(carta);
    botTotal += evaluarCarta(carta);
    document.getElementById("bot-total").innerText = botTotal;
    let cardSound = document.getElementById("card-sound");
    if (cardSound) {
      cardSound.play();
    }
  } else {
    // dealer
    dealerCardsDiv.appendChild(cardElement);
    dealerTotal += evaluarCarta(carta);
    dealerTotalSpan.innerText = dealerTotal;
    let cardSound = document.getElementById("card-sound");
    if (cardSound) {
      cardSound.play();
    }
  }
}

// Jugada automática del bot (estrategia simple)
function jugarBot() {
  if (botTotal < 16 && !gameOver) {
    agregarCarta("bot");
    setTimeout(jugarBot, 1500);
  }
}

// Turno del crupier, evaluando resultados para jugador y bot
function turnoCrupier() {
  if (gameOver || alreadyStood) return;
  alreadyStood = true;
  resultDiv.innerText = "El crupier está analizando su mano...";

  let interval = setInterval(() => {
    if (dealerTotal < 17) {
      agregarCarta("dealer");
    } else {
      clearInterval(interval);
      let mensaje = "";
      // Evaluación para el jugador humano
      if (playerTotal > 21) {
        mensaje += "💥 Jugador se pasó. ";
      } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
        mensaje += "🎉 Jugador ganó. ";
        humanWins++;
        if (dificultad === "dificil") {
          humanBalance += bet * 2;
        } else {
          humanBalance += bet * 1.2;
        }
      } else {
        mensaje += "😢 Jugador perdió. ";
        humanBalance -= bet;
      }
      // Evaluación para el bot
      if (botTotal > 21) {
        mensaje += "💥 Bot se pasó. ";
      } else if (dealerTotal > 21 || botTotal > dealerTotal) {
        mensaje += "🎉 Bot ganó. ";
        botWins++;
        if (dificultad === "dificil") {
          botBalance += bet * 2;
        } else {
          botBalance += bet * 1.2;
        }
      } else {
        mensaje += "😢 Bot perdió. ";
        botBalance -= bet;
      }
      resultDiv.innerText = mensaje;
      gameOver = true;
      updateScoreboard();
      actualizarApuesta();
      setTimeout(() => {
        restartBtn.style.display = "block";
      }, 1000);
      let winSound = document.getElementById("win-sound");
      if (winSound) {
        winSound.play();
      }
    }
  }, 1500);
}

function updateScoreboard() {
  document.getElementById("player-score").innerText = `Jugador: ${humanWins}`;
  document.getElementById("dealer-score").innerText = `Crupier: ${dealerWins}`;
}

function chipotleWin() {
  gameOver = true;
  resultDiv.innerText =
    "🎉 ¡Chipotlé! Ganaste automáticamente por tener dos As.";
  humanWins++;
  updateScoreboard();
  document.getElementById("chipotle-modal").style.display = "block";
  let winSound = document.getElementById("win-sound");
  if (winSound) {
    winSound.play();
  }
  setTimeout(() => {
    restartBtn.style.display = "block";
    if (dificultad === "dificil") {
      humanBalance += bet * 2;
    } else {
      humanBalance += bet * 1.2;
    }
    actualizarApuesta();
  }, 1000);
}

function cerrarChipotle() {
  document.getElementById("chipotle-modal").style.display = "none";
}

function reiniciarJuego() {
  deck = barajarMazo(generarMazo());
  playerCardsDiv.innerHTML = "";
  document.getElementById("bot-cards").innerHTML = "";
  dealerCardsDiv.innerHTML = "";
  humanHand = [];
  botHand = [];
  playerTotal = 0;
  botTotal = 0;
  dealerTotal = 0;
  playerTotalSpan.innerText = "0";
  document.getElementById("bot-total").innerText = "0";
  dealerTotalSpan.innerText = "0";
  resultDiv.innerText = "";
  gameOver = false;
  alreadyStood = false;
  restartBtn.style.display = "none";
  hitBtn.disabled = false;
}

function resetScoreboard() {
  humanWins = 0;
  botWins = 0;
  dealerWins = 0;
  updateScoreboard();
}

window.iniciarJuego = function (nivel) {
  if (bet > humanBalance) {
    alert("La apuesta no puede ser mayor que el saldo.");
    return;
  }
  dificultad = nivel;
  menuDificultades.style.display = "none";
  juegoDiv.style.display = "block";
  reiniciarJuego();
  iniciarBounce();
  // Inicia la jugada del bot de forma automática
  setTimeout(jugarBot, 1500);
};

document.addEventListener("DOMContentLoaded", () => {
  welcomeDiv = document.getElementById("welcome");
  menuDificultades = document.getElementById("menu-dificultades");
  juegoDiv = document.getElementById("juego");

  let playBtn = document.getElementById("play-btn");
  if (playBtn) {
    playBtn.addEventListener("click", () => {
      welcomeDiv.style.display = "none";
      menuDificultades.style.display = "block";
      mostrarDatoInteresante();
      actualizarApuesta();
    });
  }

  // Configuración de apuestas
  resetScoreBtn = document.getElementById("reset-score-btn");
  document.getElementById("bet-plus").addEventListener("click", () => {
    ajustarApuesta(10);
  });
  document.getElementById("bet-minus").addEventListener("click", () => {
    ajustarApuesta(-10);
  });

  playerCardsDiv = document.getElementById("player-cards");
  playerTotalSpan = document.getElementById("player-total");
  dealerCardsDiv = document.getElementById("dealer-cards");
  dealerTotalSpan = document.getElementById("dealer-total");
  resultDiv = document.getElementById("result");

  hitBtn = document.getElementById("hit-btn");
  standBtn = document.getElementById("stand-btn");
  restartBtn = document.getElementById("restart-btn");

  if (resetScoreBtn) {
    resetScoreBtn.addEventListener("click", resetScoreboard);
  }

  if (hitBtn) {
    hitBtn.addEventListener("click", () => {
      if (!gameOver) {
        agregarCarta("human");
      }
    });
  }

  if (standBtn) {
    standBtn.addEventListener("click", turnoCrupier);
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      reiniciarJuego();
      menuDificultades.style.display = "block";
      juegoDiv.style.display = "none";
    });
  }
});

// Datos interesantes
const datosBlackjack = [
  "El blackjack, también conocido como 21, tiene orígenes en juegos europeos del siglo XVII.",
  "Se cree que el blackjack evolucionó a partir del juego francés 'Vingt-et-un'.",
  "En EE.UU., el blackjack se popularizó en los casinos de los años 20.",
  "El término 'blackjack' proviene de una apuesta especial que pagaba 3 a 2 con un J negro y un As.",
  "El blackjack es uno de los juegos de casino más estudiados y tiene una estrategia óptima conocida.",
  "Las variantes modernas del blackjack incluyen bonificaciones y reglas especiales para hacerlo más emocionante.",
  "El blackjack fue uno de los juegos preferidos en los casinos de Las Vegas durante el siglo XX.",
  "Algunos casinos ofrecen bonificaciones adicionales si el jugador obtiene un blackjack natural."
];

function mostrarDatoInteresante() {
  const contenedor = document.getElementById("datos-interesantes");
  if (contenedor) {
    const dato =
      datosBlackjack[Math.floor(Math.random() * datosBlackjack.length)];
    contenedor.innerHTML = `<h3>Dato Interesante:</h3><p>${dato}</p>`;
  }
}

function ajustarApuesta(valor) {
  bet += valor;
  if (bet < 0) bet = 0;
  if (bet > humanBalance) bet = humanBalance;
  actualizarApuesta();
}

// =======================================================
// FIN DEL CÓDIGO
// =======================================================