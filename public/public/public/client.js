const socket = io();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const players = {};
const bullets = [];

const playerSpeed = 3;
const bulletSpeed = 7;

let myId = null;

const keys = {};

let mouseX = 0;
let mouseY = 0;

const playerSize = 20;
const bulletSize = 5;

const playerState = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  angle: 0,
};

window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', () => {
  shootBullet();
});

function shootBullet() {
  const bullet = {
    x: playerState.x + Math.cos(playerState.angle) * playerSize,
    y: playerState.y + Math.sin(playerState.angle) * playerSize,
    dx: Math.cos(playerState.angle) * bulletSpeed,
    dy: Math.sin(playerState.angle) * bulletSpeed,
  };
  bullets.push(bullet);
  socket.emit('shoot', bullet);
}

function update() {
  if (keys['w']) playerState.y -= playerSpeed;
  if (keys['a']) playerState.x -= playerSpeed;
  if (keys['s']) playerState.y += playerSpeed;
  if (keys['d']) playerState.x += playerSpeed;

  playerState.x = Math.max(0, Math.min(canvas.width, playerState.x));
  playerState.y = Math.max(0, Math.min(canvas.height, playerState.y));

  playerState.angle = Math.atan2(mouseY - playerState.y, mouseX - playerState.x);

  if (myId) {
    socket.emit('playerMovement', {
      x: playerState.x,
      y: playerState.y,
      angle: playerState.angle,
    });
  }

  // Move bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.x += b.dx;
    b.y += b.dy;
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) {
      bullets.splice(i, 1);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw other players
  for (const id in players) {
    if (id === myId) continue;
    const p = players[id];
    drawPlayer(p.x, p.y, p.angle, 'red');
  }

  // Draw current player
  drawPlayer(playerState.x, playerState.y, playerState.angle, 'lime');

  // Draw bullets
  bullets.forEach((b) => {
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(b.x, b.y, bulletSize, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPlayer(x, y, angle, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.fillRect(-playerSize / 2, -playerSize / 2, playerSize, playerSize);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, -playerSize / 8, playerSize / 2, playerSize / 4);
  ctx.restore();
}

socket.on('connect', () => {
  myId = socket.id;
});

socket.on('currentPlayers', (allPlayers) => {
  Object.assign(players, allPlayers);
});

socket.on('newPlayer', ({ id, player }) => {
  players[id] = player;
});

socket.on('playerMoved', ({ id, player }) => {
  players[id] = player;
});

socket.on('playerDisconnected', (id) => {
  delete players[id];
});

socket.on('bulletFired', ({ id, bullet }) => {
  bullets.push(bullet);
});

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
