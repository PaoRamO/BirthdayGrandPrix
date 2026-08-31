
/* =========================================================
   BIRTHDAY GRAND PRIX
   CLEAN / STABLE VERSION
========================================================= */

"use strict";

/* =========================================================
   GET ELEMENTS
========================================================= */

const startScreen = document.getElementById("startScreen");
const lightsScreen = document.getElementById("lightsScreen");
const gameScreen = document.getElementById("gameScreen");
const finishScreen = document.getElementById("finishScreen");

const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const lights = document.querySelector(".lights");
const lightElements = document.querySelectorAll(".light");
const lightsMessage = document.getElementById("lightsMessage");

const positionDisplay = document.getElementById("positionDisplay");
const lapDisplay = document.getElementById("lapDisplay");
const timerDisplay = document.getElementById("timerDisplay");
const speedDisplay = document.getElementById("speedDisplay");

const raceMessage = document.getElementById("raceMessage");

const finalTime = document.getElementById("finalTime");
const finalPosition = document.getElementById("finalPosition");

const finishTitle = document.getElementById("finishTitle");
const finishSubtitle = document.getElementById("finishSubtitle");
const finishTrophy = document.getElementById("finishTrophy");

const prizeIntro = document.getElementById("prizeIntro");
const actualPrize = document.getElementById("actualPrize");

const openPrizeButton = document.getElementById("openPrizeButton");
const giftButton = document.getElementById("giftButton");


/* =========================================================
   GAME STATE
========================================================= */

let gameRunning = false;
let countdownRunning = false;
let animationFrame = null;

let raceStartTime = 0;
let elapsedTime = 0;

let currentLap = 1;
const totalLaps = 3;

let previousProgress = 0;
let lastPosition = 2;


/* =========================================================
   TRACK
========================================================= */

let trackPoints = [];


/* =========================================================
   PLAYER
========================================================= */

const player = {
    x: 0,
    y: 0,
    angle: 0,
    speed: 0,

    maxSpeed: 7.5,
    acceleration: 0.13,
    braking: 0.20,
    friction: 0.045,
    turnSpeed: 0.055
};


/* =========================================================
   OPPONENT
========================================================= */

const opponent = {
    progress: 0,
    speed: 0.00105,
    lap: 1,
    x: 0,
    y: 0
};


/* =========================================================
   CONTROLS
========================================================= */

const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,

    w: false,
    a: false,
    s: false,
    d: false
};


/* =========================================================
   KEYBOARD
========================================================= */

window.addEventListener("keydown", function(event) {

    if (Object.prototype.hasOwnProperty.call(keys, event.key)) {

        keys[event.key] = true;

        event.preventDefault();
    }
});


window.addEventListener("keyup", function(event) {

    if (Object.prototype.hasOwnProperty.call(keys, event.key)) {

        keys[event.key] = false;

        event.preventDefault();
    }
});


/* =========================================================
   MOBILE CONTROLS
========================================================= */

function setupMobileButton(buttonId, key) {

    const button = document.getElementById(buttonId);

    if (!button) {
        return;
    }

    button.addEventListener("pointerdown", function(event) {

        event.preventDefault();

        keys[key] = true;
    });

    button.addEventListener("pointerup", function(event) {

        event.preventDefault();

        keys[key] = false;
    });

    button.addEventListener("pointercancel", function() {

        keys[key] = false;
    });

    button.addEventListener("pointerleave", function() {

        keys[key] = false;
    });
}


setupMobileButton("gasButton", "ArrowUp");
setupMobileButton("brakeButton", "ArrowDown");
setupMobileButton("leftButton", "ArrowLeft");
setupMobileButton("rightButton", "ArrowRight");


/* =========================================================
   CANVAS
========================================================= */

function resizeCanvas() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    createTrack();

    if (!gameRunning) {
        drawGame();
    }
}


window.addEventListener("resize", resizeCanvas);


/* =========================================================
   CREATE TRACK
========================================================= */

function createTrack() {

    trackPoints = [];

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const radiusX = Math.min(
        canvas.width * 0.34,
        460
    );

    const radiusY = Math.min(
        canvas.height * 0.30,
        280
    );


    for (let i = 0; i < 500; i++) {

        const angle =
            (i * Math.PI * 2) / 500;

        const variation =
            Math.sin(angle * 3) * 18;

        const x =
            centerX +
            Math.cos(angle) *
            (radiusX + variation);

        const y =
            centerY +
            Math.sin(angle) *
            radiusY;

        trackPoints.push({
            x: x,
            y: y
        });
    }
}


/* =========================================================
   TRACK POSITION
========================================================= */

function getTrackPosition(progress) {

    if (trackPoints.length === 0) {

        return {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
    }


    progress = progress % 1;

    if (progress < 0) {
        progress += 1;
    }


    const index = Math.floor(
        progress * trackPoints.length
    );


    return trackPoints[index];
}


/* =========================================================
   TRACK ANGLE
========================================================= */

function getTrackAngle(progress) {

    const current =
        getTrackPosition(progress);

    const next =
        getTrackPosition(progress + 0.003);


    return Math.atan2(
        next.y - current.y,
        next.x - current.x
    );
}


/* =========================================================
   RESET GAME
========================================================= */

function resetGame() {

    createTrack();


    const startProgress = 0;

    const startPoint =
        getTrackPosition(startProgress);

    const startAngle =
        getTrackAngle(startProgress);


    const perpendicularX =
        -Math.sin(startAngle);

    const perpendicularY =
        Math.cos(startAngle);


    const laneSpacing = 34;


    /* PLAYER */

    player.x =
        startPoint.x +
        perpendicularX * (-laneSpacing);

    player.y =
        startPoint.y +
        perpendicularY * (-laneSpacing);

    player.angle = startAngle;

    player.speed = 0;


    /* OPPONENT */

    opponent.x =
        startPoint.x +
        perpendicularX * laneSpacing;

    opponent.y =
        startPoint.y +
        perpendicularY * laneSpacing;

    opponent.progress = 0;
    opponent.lap = 1;


    /* RESET RACE */

    currentLap = 1;
    previousProgress = 0;
    lastPosition = 2;
    elapsedTime = 0;


    lapDisplay.textContent =
        "1 / " + totalLaps;

    positionDisplay.textContent =
        "P2";

    timerDisplay.textContent =
        "00:00.00";

    speedDisplay.textContent =
        "0 MPH";

    raceMessage.textContent =
        "GET READY!";


    clearKeys();
}


/* =========================================================
   CLEAR KEYS
========================================================= */

function clearKeys() {

    Object.keys(keys).forEach(function(key) {

        keys[key] = false;
    });
}


/* =========================================================
   START BUTTON
========================================================= */

startButton.addEventListener("click", function() {

    console.log("Birthday Grand Prix: START clicked");


    if (countdownRunning || gameRunning) {
        return;
    }


    /* Hide start screen */

    startScreen.classList.add("hidden");


    /* Show game */

    gameScreen.classList.remove("hidden");


    /* Prepare track and cars */

    resetGame();


    /* Draw immediately */

    drawGame();


    /* Start lights */

    startCountdown();
});


/* =========================================================
   COUNTDOWN
========================================================= */

function startCountdown() {

    if (countdownRunning) {
        return;
    }


    countdownRunning = true;


    lightsScreen.classList.remove("hidden");


    lights.classList.remove("go");


    lightElements.forEach(function(light) {

        light.classList.remove("on");
    });


    lightsMessage.textContent =
        "GET READY...";


    let lightNumber = 0;


    const interval = setInterval(function() {

        if (lightNumber < lightElements.length) {

            lightElements[lightNumber]
                .classList.add("on");

            lightNumber++;

            return;
        }


        clearInterval(interval);


        lights.classList.add("go");

        lightsMessage.textContent =
            "LIGHTS OUT! GO! 🏎️";


        setTimeout(function() {

            lightsScreen.classList.add("hidden");

            countdownRunning = false;

            startRace();

        }, 700);


    }, 500);
}


/* =========================================================
   START RACE
========================================================= */

function startRace() {

    console.log("Birthday Grand Prix: RACE STARTED");


    if (gameRunning) {
        return;
    }


    gameRunning = true;


    raceStartTime =
        performance.now();


    raceMessage.textContent =
        "GO! GO! GO! 🏎️";


    if (animationFrame !== null) {

        cancelAnimationFrame(animationFrame);
    }


    animationFrame =
        requestAnimationFrame(gameLoop);
}


/* =========================================================
   GAME LOOP
========================================================= */

function gameLoop(timestamp) {

    if (!gameRunning) {
        return;
    }


    elapsedTime =
        timestamp - raceStartTime;


    updatePlayer();

    updateOpponent();

    updateLap();

    if (!gameRunning) {
        return;
    }

    updatePosition();

    updateTimer();

    drawGame();


    animationFrame =
        requestAnimationFrame(gameLoop);
}


/* =========================================================
   PLAYER UPDATE
========================================================= */

function updatePlayer() {

    const accelerating =
        keys.ArrowUp || keys.w;

    const braking =
        keys.ArrowDown || keys.s;

    const left =
        keys.ArrowLeft || keys.a;

    const right =
        keys.ArrowRight || keys.d;


    if (accelerating) {

        player.speed +=
            player.acceleration;

    } else {

        player.speed -=
            player.friction;
    }


    if (braking) {

        player.speed -=
            player.braking;
    }


    player.speed =
        Math.max(
            0,
            Math.min(
                player.speed,
                player.maxSpeed
            )
        );


    if (player.speed > 0.15) {

        if (left) {

            player.angle -=
                player.turnSpeed *
                (player.speed / player.maxSpeed);
        }


        if (right) {

            player.angle +=
                player.turnSpeed *
                (player.speed / player.maxSpeed);
        }
    }


    player.x +=
        Math.cos(player.angle) *
        player.speed;

    player.y +=
        Math.sin(player.angle) *
        player.speed;


    keepPlayerOnTrack();
}


/* =========================================================
   KEEP PLAYER ON TRACK
========================================================= */

function keepPlayerOnTrack() {

    const centerX =
        canvas.width / 2;

    const centerY =
        canvas.height / 2;

    const radiusX =
        Math.min(
            canvas.width * 0.34,
            460
        );

    const radiusY =
        Math.min(
            canvas.height * 0.30,
            280
        );


    const dx =
        player.x - centerX;

    const dy =
        player.y - centerY;


    const normalized =
        Math.sqrt(
            (dx * dx) /
            (radiusX * radiusX) +

            (dy * dy) /
            (radiusY * radiusY)
        );


    if (normalized > 1.12) {

        player.x -=
            Math.cos(player.angle) *
            player.speed *
            2;

        player.y -=
            Math.sin(player.angle) *
            player.speed *
            2;

        player.speed *= 0.45;
    }
}


/* =========================================================
   OPPONENT
========================================================= */

function updateOpponent() {

    opponent.progress +=
        opponent.speed;


    if (opponent.progress >= 1) {

        opponent.progress = 0;

        opponent.lap++;
    }


    const position =
        getTrackPosition(
            opponent.progress
        );


    opponent.x = position.x;
    opponent.y = position.y;
}


/* =========================================================
   PLAYER PROGRESS
========================================================= */

function getPlayerProgress() {

    const centerX =
        canvas.width / 2;

    const centerY =
        canvas.height / 2;


    const angle =
        Math.atan2(
            player.y - centerY,
            player.x - centerX
        );


    let progress =
        (angle + Math.PI / 2) /
        (Math.PI * 2);


    if (progress < 0) {
        progress += 1;
    }


    return progress;
}


/* =========================================================
   LAP SYSTEM
========================================================= */

function updateLap() {

    const progress =
        getPlayerProgress();


    if (
        previousProgress > 0.8 &&
        progress < 0.2 &&
        player.speed > 1
    ) {

        currentLap++;


        if (currentLap > totalLaps) {

            finishRace();

            return;
        }


        lapDisplay.textContent =
            currentLap +
            " / " +
            totalLaps;


        raceMessage.textContent =
            "LAP " +
            currentLap +
            "! 🏎️";
    }


    previousProgress = progress;
}


/* =========================================================
   POSITION
========================================================= */

function updatePosition() {

    const playerProgress =
        getPlayerProgress();


    const playerTotal =
        (currentLap - 1) +
        playerProgress;


    const opponentTotal =
        (opponent.lap - 1) +
        opponent.progress;


    const position =
        playerTotal >= opponentTotal
            ? 1
            : 2;


    positionDisplay.textContent =
        "P" + position;


    if (position !== lastPosition) {

        if (position === 1) {

            raceMessage.textContent =
                "🔥 YOU'RE P1! 🔥";

        } else {

            raceMessage.textContent =
                "⚠️ GET P1 BACK!";
        }


        lastPosition = position;
    }
}


/* =========================================================
   TIMER
========================================================= */

function updateTimer() {

    const milliseconds =
        Math.floor(elapsedTime);


    const minutes =
        Math.floor(
            milliseconds / 60000
        );


    const seconds =
        Math.floor(
            (milliseconds % 60000) / 1000
        );


    const centiseconds =
        Math.floor(
            (milliseconds % 1000) / 10
        );


    timerDisplay.textContent =
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0") +
        "." +
        String(centiseconds).padStart(2, "0");


    speedDisplay.textContent =
        Math.floor(
            player.speed * 35
        ) +
        " MPH";
}


/* =========================================================
   DRAW GAME
========================================================= */

function drawGame() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    drawGrass();
    drawTrack();
    drawGrid();
    drawFinishLine();
    drawOpponent();
    drawPlayer();
}


/* =========================================================
   GRASS
========================================================= */

function drawGrass() {

    ctx.fillStyle =
        "#315b30";


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.strokeStyle =
        "rgba(255,255,255,0.035)";

    ctx.lineWidth = 2;


    for (
        let x = 0;
        x < canvas.width;
        x += 35
    ) {

        ctx.beginPath();

        ctx.moveTo(x, 0);

        ctx.lineTo(
            x + 100,
            canvas.height
        );

        ctx.stroke();
    }
}


/* =========================================================
   TRACK
========================================================= */

function drawTrack() {

    if (trackPoints.length === 0) {
        return;
    }


    drawTrackLayer(
        140,
        "#151515"
    );


    drawTrackLayer(
        120,
        "#555"
    );


    drawTrackLayer(
        112,
        "#666"
    );


    ctx.beginPath();


    trackPoints.forEach(function(point, index) {

        if (index === 0) {

            ctx.moveTo(
                point.x,
                point.y
            );

        } else {

            ctx.lineTo(
                point.x,
                point.y
            );
        }
    });


    ctx.closePath();


    ctx.lineWidth = 3;

    ctx.setLineDash([15, 20]);

    ctx.strokeStyle =
        "rgba(255,255,255,0.25)";

    ctx.stroke();

    ctx.setLineDash([]);
}


/* =========================================================
   TRACK LAYER
========================================================= */

function drawTrackLayer(width, color) {

    ctx.beginPath();


    trackPoints.forEach(function(point, index) {

        if (index === 0) {

            ctx.moveTo(
                point.x,
                point.y
            );

        } else {

            ctx.lineTo(
                point.x,
                point.y
            );
        }
    });


    ctx.closePath();

    ctx.lineWidth = width;

    ctx.strokeStyle = color;

    ctx.stroke();
}


/* =========================================================
   GRID
========================================================= */

function drawGrid() {

    const startPoint =
        getTrackPosition(0);

    const angle =
        getTrackAngle(0);


    ctx.save();


    ctx.translate(
        startPoint.x,
        startPoint.y
    );


    ctx.rotate(angle);


    for (let i = -2; i <= 2; i++) {

        const y = i * 34;


        ctx.fillStyle =
            "rgba(255,255,255,0.8)";


        ctx.fillRect(
            -45,
            y - 10,
            28,
            20
        );
    }


    ctx.restore();
}


/* =========================================================
   FINISH LINE
========================================================= */

function drawFinishLine() {

    const p =
        getTrackPosition(0);

    const angle =
        getTrackAngle(0);


    ctx.save();


    ctx.translate(
        p.x,
        p.y
    );


    ctx.rotate(angle);


    const square = 10;


    for (let row = 0; row < 6; row++) {

        for (let col = 0; col < 12; col++) {

            ctx.fillStyle =
                (row + col) % 2 === 0
                    ? "white"
                    : "black";


            ctx.fillRect(
                -60 + col * square,
                -30 + row * square,
                square,
                square
            );
        }
    }


    ctx.restore();
}


/* =========================================================
   CAR
========================================================= */

function drawCar(
    x,
    y,
    angle,
    bodyColor,
    number
) {

    ctx.save();


    ctx.translate(x, y);

    ctx.rotate(angle);


    /* Shadow */

    ctx.fillStyle =
        "rgba(0,0,0,0.45)";


    ctx.beginPath();

    ctx.ellipse(
        0,
        3,
        22,
        30,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Tires */

    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        -17,
        -18,
        7,
        15
    );

    ctx.fillRect(
        10,
        -18,
        7,
        15
    );

    ctx.fillRect(
        -17,
        8,
        7,
        15
    );

    ctx.fillRect(
        10,
        8,
        7,
        15
    );


    /* Body */

    ctx.fillStyle =
        bodyColor;


    ctx.beginPath();

    ctx.moveTo(0, -31);

    ctx.lineTo(-9, -17);

    ctx.lineTo(-12, 17);

    ctx.lineTo(0, 27);

    ctx.lineTo(12, 17);

    ctx.lineTo(9, -17);

    ctx.closePath();

    ctx.fill();


    /* Cockpit */

    ctx.fillStyle =
        "#111";


    ctx.beginPath();

    ctx.ellipse(
        0,
        -2,
        7,
        10,
        0,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Helmet */

    ctx.fillStyle =
        "#ddd";


    ctx.beginPath();

    ctx.arc(
        0,
        -3,
        4,
        0,
        Math.PI * 2
    );

    ctx.fill();


    /* Wings */

    ctx.fillStyle =
        "#111";


    ctx.fillRect(
        -17,
        -31,
        34,
        5
    );


    ctx.fillRect(
        -17,
        22,
        34,
        5
    );


    /* Number */

    ctx.fillStyle =
        "white";

    ctx.font =
        "bold 8px Arial";

    ctx.textAlign =
        "center";


    ctx.fillText(
        number,
        0,
        13
    );


    ctx.restore();
}


/* =========================================================
   PLAYER
========================================================= */

function drawPlayer() {

    drawCar(
        player.x,
        player.y,
        player.angle,
        "#e10600",
        "1"
    );
}


/* =========================================================
   OPPONENT
========================================================= */

function drawOpponent() {

    const position =
        getTrackPosition(
            opponent.progress
        );


    const angle =
        getTrackAngle(
            opponent.progress
        );


    drawCar(
        position.x,
        position.y,
        angle,
        "#eeeeee",
        "2"
    );
}


/* =========================================================
   FINISH RACE
========================================================= */

function finishRace() {

    gameRunning = false;


    if (animationFrame !== null) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame = null;
    }


    const playerProgress =
        getPlayerProgress();


    const playerTotal =
        (currentLap - 1) +
        playerProgress;


    const opponentTotal =
        (opponent.lap - 1) +
        opponent.progress;


    const finishingPosition =
        playerTotal >= opponentTotal
            ? "P1"
            : "P2";


    finalTime.textContent =
        timerDisplay.textContent;


    finalPosition.textContent =
        finishingPosition;


    if (finishingPosition === "P1") {

        finishTrophy.textContent =
            "🏆";

        finishTitle.textContent =
            "YOU WON!";

        finishSubtitle.textContent =
            "BIRTHDAY GRAND PRIX CHAMPION!";

    } else {

        finishTrophy.textContent =
            "🏎️";

        finishTitle.textContent =
            "RACE COMPLETE!";

        finishSubtitle.textContent =
            "YOU FINISHED THE BIRTHDAY GRAND PRIX!";
    }


    gameScreen.classList.add("hidden");

    finishScreen.classList.remove("hidden");


    prizeIntro.classList.remove("hidden");

    actualPrize.classList.add("hidden");


    createConfetti();
}


/* =========================================================
   PRIZE BUTTON
========================================================= */

openPrizeButton.addEventListener("click", function() {

    prizeIntro.classList.add("hidden");

    actualPrize.classList.remove("hidden");
});

/* =========================================================
   RESTART
========================================================= */

restartButton.addEventListener("click", function() {

    gameRunning = false;

    countdownRunning = false;


    if (animationFrame !== null) {

        cancelAnimationFrame(
            animationFrame
        );

        animationFrame = null;
    }


    lightsScreen.classList.add("hidden");

    finishScreen.classList.add("hidden");

    gameScreen.classList.add("hidden");

    startScreen.classList.remove("hidden");


    clearKeys();


    lightElements.forEach(function(light) {

        light.classList.remove("on");
    });


    lights.classList.remove("go");


    resetGame();
});


/* =========================================================
   CONFETTI
========================================================= */

function createConfetti() {

    const pieces = [];


    for (let i = 0; i < 180; i++) {

        pieces.push({

            x:
                Math.random() *
                window.innerWidth,

            y:
                Math.random() *
                window.innerHeight,

            size:
                Math.random() * 8 + 4,

            speed:
                Math.random() * 4 + 2,

            rotation:
                Math.random() * 360
        });
    }


    const confettiCanvas =
        document.createElement("canvas");


    confettiCanvas.style.position = "fixed";
    confettiCanvas.style.left = "0";
    confettiCanvas.style.top = "0";
    confettiCanvas.style.width = "100%";
    confettiCanvas.style.height = "100%";
    confettiCanvas.style.pointerEvents = "none";
    confettiCanvas.style.zIndex = "999";


    confettiCanvas.width =
        window.innerWidth;

    confettiCanvas.height =
        window.innerHeight;


    document.body.appendChild(
        confettiCanvas
    );


    const confettiContext =
        confettiCanvas.getContext("2d");


    let frames = 0;


    function animateConfetti() {

        confettiContext.clearRect(
            0,
            0,
            confettiCanvas.width,
            confettiCanvas.height
        );


        pieces.forEach(function(piece) {

            piece.y += piece.speed;

            piece.rotation += 5;


            if (
                piece.y >
                window.innerHeight
            ) {

                piece.y = -20;
            }


            confettiContext.save();


            confettiContext.translate(
                piece.x,
                piece.y
            );


            confettiContext.rotate(
                piece.rotation *
                Math.PI /
                180
            );


            confettiContext.fillStyle =
                "white";


            confettiContext.fillRect(
                -piece.size / 2,
                -piece.size / 2,
                piece.size,
                piece.size
            );


            confettiContext.restore();
        });


        frames++;


        if (frames < 600) {

            requestAnimationFrame(
                animateConfetti
            );

        } else {

            confettiCanvas.remove();
        }
    }


    animateConfetti();
}


/* =========================================================
   INITIALIZE
========================================================= */

/*
   IMPORTANT:
   Initialize ONLY after all functions have been created.
*/

resizeCanvas();

resetGame();

drawGame();

console.log(
    "Birthday Grand Prix loaded successfully."
);

