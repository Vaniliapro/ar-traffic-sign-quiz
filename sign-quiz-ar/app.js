const video = document.getElementById('video');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const quizContainer = document.getElementById('quiz-container');
const signNameEl = document.getElementById('sign-name');
const answerInput = document.getElementById('answer-input');
const submitBtn = document.getElementById('submit-btn');
const closeBtn = document.getElementById('close-btn');
const scoreEl = document.getElementById('score');
const toastTpl = document.getElementById('toast-template');
let model, detections = [], currentSign = '', score = 0;

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  video.srcObject = stream;
  return new Promise(resolve => { video.onloadedmetadata = () => resolve(video); });
}

async function loadModel() {
  model = await cocoSsd.load();
}

function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  speechSynthesis.speak(utter);
}

function showToast(msg) {
  const toast = toastTpl.content.cloneNode(true).querySelector('.toast');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(()=>toast.remove(), 3000);
}

function showQuiz(sign) {
  currentSign = sign;
  signNameEl.textContent = sign;
  answerInput.value = '';
  quizContainer.classList.remove('hidden');
}

function hideQuiz() {
  quizContainer.classList.add('hidden');
}

async function detectFrame() {
  if (!model) return requestAnimationFrame(detectFrame);
  const predictions = await model.detect(video);
  detections = predictions.filter(p=>['stop sign','traffic light','parking meter'].includes(p.class) && p.score>0.6);
  ctx.clearRect(0,0,overlay.width,overlay.height);
  detections.forEach(d=>{
    const [x,y,w,h]=d.bbox;
    ctx.strokeStyle='#38bdf8';
    ctx.lineWidth=3;
    ctx.strokeRect(x,y,w,h);
    ctx.font='16px sans-serif';
    ctx.fillStyle='#38bdf8';
    ctx.fillText(d.class, x, y>20?y-5:y+15);
  });
  if(detections.length>0){
    showQuiz(detections[0].class);
  }
  requestAnimationFrame(detectFrame);
}

submitBtn.onclick = ()=>{
  const ans = answerInput.value.trim().toLowerCase();
  if(ans){
    score += 10;
    scoreEl.textContent = score;
    showToast('Σωστό! +10');
    speak('Σωστό');
  }else{
    showToast('Λάθος! Δοκίμασε ξανά.');
    speak('Λάθος');
  }
  hideQuiz();
};

closeBtn.onclick = hideQuiz;

window.addEventListener('load', async ()=>{
  await setupCamera();
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
  await loadModel();
  detectFrame();
});