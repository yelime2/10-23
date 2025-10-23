const video = document.getElementById('webcam');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const octx = overlay.getContext('2d');

let level = 1;
let gridSize = 5;
let cellSize = 40;
let gridOffsetX = 0;
let gridOffsetY = 0;
let targets = [];
let pieces = [];
let isShowingPattern = false;
let pinchPoint = { x:0, y:0, active:false };
let draggingIndex = -1;

function randColor(){ return 'rgba(217, 0, 255, 0.67)'; }

function resizeCanvas(){
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  overlay.width = canvas.width;
  overlay.height = canvas.height;
  computeCellSize();
  drawScene();
}

function computeCellSize(){
  const cellWidth = canvas.width / gridSize;
  const cellHeight = canvas.height / gridSize;
  cellSize = Math.min(cellWidth, cellHeight);
  gridOffsetX = (canvas.width - cellSize * gridSize)/2;
  gridOffsetY = (canvas.height - cellSize * gridSize)/2;
}

function drawGrid(){
  ctx.lineWidth= 1;
  ctx.strokeStyle='rgb(0, 0, 0)';
  const dotSize = Math.max(2, cellSize*0.06);

  for(let r=0;r<gridSize;r++){
    for(let c=0;c<gridSize;c++){
      const x = gridOffsetX + c*cellSize;
      const y = gridOffsetY + r*cellSize;
      ctx.strokeRect(x, y, cellSize, cellSize);

      const points = [
        [x, y],
        [x + cellSize, y],
        [x, y + cellSize],
        [x + cellSize, y + cellSize]
      ];
      for(const [px,py] of points){
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgb(0, 0, 0)';
        ctx.lineWidth = 1;
        ctx.fillRect(px - dotSize/2, py - dotSize/2, dotSize, dotSize);
        ctx.strokeRect(px - dotSize/2, py - dotSize/2, dotSize, dotSize);
      }
    }
  }
}

function generateTargets(){
  targets = [];
  const r = Math.floor(Math.random()*gridSize);
  const c = Math.floor(Math.random()*gridSize);
  targets.push({row:r, col:c, color:randColor()});
}

function drawTargets(alpha=1){
  ctx.save();
  ctx.globalAlpha=alpha;
  for(const t of targets){
    const x = gridOffsetX + t.col*cellSize;
    const y = gridOffsetY + t.row*cellSize;
    ctx.fillStyle=t.color;
    ctx.fillRect(x,y,cellSize,cellSize);
    ctx.strokeStyle='rgba(0,0,0,0.85)';
    ctx.strokeRect(x,y,cellSize,cellSize);
  }
  ctx.restore();
}

function scatterPieces(){
  pieces = [];
  const t = targets[0];
  let r, c, tries=0;
  while(true){
    r = Math.floor(Math.random()*gridSize);
    c = Math.floor(Math.random()*gridSize);
    if(!(r===t.row && c===t.col)) break;
    if(++tries>200) { 
      if(t.row+1 < gridSize) r = t.row+1;
      else r = Math.max(0, t.row-1);
      if(t.col+1 < gridSize) c = t.col+1;
      else c = Math.max(0, t.col-1);
      break;
    }
  }
  pieces.push({row:r, col:c, color:t.color, correctRow:t.row, correctCol:t.col});
}

function drawPieces(){
  for(const p of pieces){
    const x = gridOffsetX + p.col*cellSize;
    const y = gridOffsetY + p.row*cellSize;
    ctx.fillStyle=p.color;
    ctx.fillRect(x,y,cellSize,cellSize);
    ctx.strokeStyle='#222';
    ctx.strokeRect(x,y,cellSize,cellSize);
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.beginPath();
    ctx.arc(x + cellSize/2, y + cellSize/2, Math.max(3,cellSize*0.06), 0, Math.PI*2);
    ctx.fill();
  }
}

function drawScene(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGrid();
  if(isShowingPattern) drawTargets(0.9);
  else drawPieces();
}

// --- 카운트다운 표시 ---
function showCountdown(callback){
  const countdown = document.createElement('div');
  countdown.id = 'countdown';
  countdown.style.position = 'absolute';
  countdown.style.bottom = '10%';
  countdown.style.left = '50%';
  countdown.style.transform = 'translateX(-50%)';
  countdown.style.fontSize = '80px';
  countdown.style.fontWeight = '500';
  countdown.style.color = 'rgb(255, 255, 255)';
  countdown.style.textShadow = '0 0 20px rgba(217, 0, 255, 0.6)';
  countdown.style.fontFamily = 'pretendard';
  countdown.style.pointerEvents = 'none';
  countdown.style.zIndex = '999';
  countdown.style.transition = 'opacity 0.4s ease';
  document.body.appendChild(countdown);

  let count = 3;
  countdown.innerText = count;

  const interval = setInterval(()=>{
    countdown.style.opacity = '0';
    setTimeout(()=>{
      count--;
      if(count > 0){
        countdown.innerText = count;
        countdown.style.opacity = '1';
      } else {
        clearInterval(interval);
        countdown.remove();
        callback && callback();
      }
    }, 100);
  }, 400);
}

// --- startGame 수정 ---
function startGame(){
  draggingIndex = -1;
  computeCellSize();
  generateTargets();
  isShowingPattern = true;
  drawScene();
  
  document.getElementById('timer').innerText = "위치를 기억하세요...";

  // 카운트다운 실행 후 패턴 3초 유지
  showCountdown(()=>{
    setTimeout(()=>{
      scatterPieces();
      isShowingPattern=false;
      drawScene();
      document.getElementById('timer').innerText = "사각형을 원래 위치로 옮기세요";
    }, 400);
  });
}

function checkWin(){
  if(pieces.length===0) return;

  const p = pieces[0];
  const ok = (p.row === p.correctRow && p.col === p.correctCol);
  if(ok){
    document.getElementById('timer').innerText = "완료! 다음 단계로 이동합니다!";
    level++;
    gridSize = 5 + (level - 1);
    setTimeout(()=>{
      computeCellSize();
      startGame();
    }, 700);
  } else {
    document.getElementById('timer').innerText = "틀렸습니다ㅠ 다시 해보세요!";
  }
}

function showHint(){
  if(isShowingPattern) return;
  isShowingPattern=true;
  drawScene();
  setTimeout(()=>{
    isShowingPattern=false;
    drawScene();
  },100);
}

function normalizedToCanvas(lm){
  return { x: overlay.width*(1-lm.x), y: overlay.height*lm.y };
}

function drawOverlay(results){
  octx.clearRect(0,0,overlay.width,overlay.height);
  if(!results.multiHandLandmarks) return;
  for(const landmarks of results.multiHandLandmarks){
    window.drawConnectors(octx,landmarks,window.HAND_CONNECTIONS,{color:'#22c55e',lineWidth:2});
    window.drawLandmarks(octx,landmarks,{color:'#ec4899',lineWidth:1});
  }
}

function updatePinch(results){
  pinchPoint.active=false;
  if(!results.multiHandLandmarks || results.multiHandLandmarks.length===0) return;
  const lm = results.multiHandLandmarks[0];
  const t = normalizedToCanvas(lm[4]);
  const i = normalizedToCanvas(lm[8]);
  const dx=t.x-i.x, dy=t.y-i.y;
  const dist = Math.hypot(dx,dy);
  const threshold = Math.min(overlay.width,overlay.height)*0.05;
  if(dist<threshold){
    pinchPoint.active=true;
    pinchPoint.x=(t.x+i.x)/2;
    pinchPoint.y=(t.y+i.y)/2;
  }
}

function canvasPointToGrid(px,py){
  const col = Math.max(0, Math.min(gridSize-1, Math.floor((px-gridOffsetX)/cellSize)));
  const row = Math.max(0, Math.min(gridSize-1, Math.floor((py-gridOffsetY)/cellSize)));
  return { row, col };
}

function tryStartDrag(){
  if(!pinchPoint.active || draggingIndex!==-1 || isShowingPattern) return;
  const g = canvasPointToGrid(pinchPoint.x, pinchPoint.y);
  const idx = pieces.findIndex(p=>p.row===g.row && p.col===g.col);
  if(idx!==-1) draggingIndex=idx;
}

function updateDrag(){
  if(draggingIndex===-1) return;
  if(!pinchPoint.active){
    draggingIndex=-1;
    return;
  }
  const g = canvasPointToGrid(pinchPoint.x, pinchPoint.y);
  const p = pieces[draggingIndex];
  p.row=g.row;
  p.col=g.col;
}

function onResults(results){
  drawOverlay(results);
  updatePinch(results);
  if(!isShowingPattern){
    if(pinchPoint.active) tryStartDrag();
    updateDrag();
    drawScene();
  }
}

function initHands(){
  const hands=new window.Hands({ locateFile:(file)=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
  hands.setOptions({ maxNumHands:1, minDetectionConfidence:0.6, minTrackingConfidence:0.6, modelComplexity:0 });
  hands.onResults(onResults);

  const camera=new window.Camera(video,{
    onFrame: async ()=>{ await hands.send({image:video}); },
    width:overlay.width || 640,
    height:overlay.height || 480
  });
  camera.start();
}

function init(){
  window.addEventListener('resize', ()=>{ resizeCanvas(); });
  video.addEventListener('loadedmetadata', resizeCanvas);
  drawScene();
  initHands();
}

window.addEventListener('load',init);
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('completeBtn').addEventListener('click', checkWin);
document.getElementById('hintBtn').addEventListener('click', showHint);











