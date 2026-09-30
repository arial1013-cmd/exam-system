/* 共用筆記模組：文字筆記 + 手寫筆記（畫布），依考卷ID與題號存到localStorage */

let _notesExamId = null;
let _notesData = {};
let _notesCanvasReady = {};
let _notesDrawTool = {};

function _notesKey(){ return 'examNotes_' + _notesExamId; }

function initNotesFor(examId){
  _notesExamId = examId;
  try{
    const raw = localStorage.getItem(_notesKey());
    _notesData = raw ? JSON.parse(raw) : {};
  }catch(e){ _notesData = {}; }
}

function _saveNotes(){
  try{
    localStorage.setItem(_notesKey(), JSON.stringify(_notesData));
  }catch(e){
    console.error('筆記儲存失敗，瀏覽器儲存空間可能已滿，建議清除較舊的手寫筆記', e);
  }
}

/* 產生某一題的筆記區塊HTML，插入題目卡片內即可使用 */
function buildNotesHtml(qid){
  return ''
    + '<div class="notes-block">'
    + '  <button class="notes-toggle" onclick="toggleNotes(' + qid + ')">📝 筆記</button>'
    + '  <div class="notes-panel" id="notesPanel' + qid + '" style="display:none;">'
    + '    <div class="notes-tabs">'
    + '      <button class="notes-tab active" data-mode="text" onclick="switchNoteMode(' + qid + ',\'text\')">文字筆記</button>'
    + '      <button class="notes-tab" data-mode="draw" onclick="switchNoteMode(' + qid + ',\'draw\')">手寫筆記</button>'
    + '    </div>'
    + '    <textarea class="notes-textarea" id="notesText' + qid + '" placeholder="在這裡輸入筆記…" oninput="saveTextNote(' + qid + ')"></textarea>'
    + '    <div class="notes-draw" id="notesDraw' + qid + '" style="display:none;">'
    + '      <div class="notes-draw-toolbar">'
    + '        <button class="draw-tool active" id="notesPen' + qid + '" onclick="setDrawMode(' + qid + ',\'pen\')">🖊️ 筆</button>'
    + '        <button class="draw-tool" id="notesEraser' + qid + '" onclick="setDrawMode(' + qid + ',\'eraser\')">🧽 橡皮擦</button>'
    + '        <button onclick="clearDrawing(' + qid + ')">清除畫布</button>'
    + '      </div>'
    + '      <canvas class="notes-canvas" id="notesCanvas' + qid + '" width="600" height="220"></canvas>'
    + '    </div>'
    + '  </div>'
    + '</div>';
}

function toggleNotes(qid){
  const panel = document.getElementById('notesPanel' + qid);
  if(!panel) return;
  const willOpen = panel.style.display === 'none';
  panel.style.display = willOpen ? 'block' : 'none';
  if(willOpen) _restoreNote(qid);
}

function _restoreNote(qid){
  const note = _notesData[qid] || { mode: 'text', text: '', drawing: null };
  const textEl = document.getElementById('notesText' + qid);
  if(textEl) textEl.value = note.text || '';
  switchNoteMode(qid, note.mode || 'text', true);
  _setupCanvas(qid);
  if(note.drawing){
    const canvas = document.getElementById('notesCanvas' + qid);
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function(){ ctx.drawImage(img, 0, 0); };
    img.src = note.drawing;
  }
}

function switchNoteMode(qid, mode, skipSave){
  const textEl = document.getElementById('notesText' + qid);
  const drawEl = document.getElementById('notesDraw' + qid);
  const panel = document.getElementById('notesPanel' + qid);
  if(panel){
    panel.querySelectorAll('.notes-tab').forEach(function(t){
      t.classList.toggle('active', t.getAttribute('data-mode') === mode);
    });
  }
  if(textEl) textEl.style.display = (mode === 'text') ? 'block' : 'none';
  if(drawEl) drawEl.style.display = (mode === 'draw') ? 'block' : 'none';

  if(!_notesData[qid]) _notesData[qid] = { mode: mode, text: '', drawing: null };
  _notesData[qid].mode = mode;
  if(!skipSave) _saveNotes();
  if(mode === 'draw') _setupCanvas(qid);
}

function saveTextNote(qid){
  if(!_notesData[qid]) _notesData[qid] = { mode: 'text', text: '', drawing: null };
  _notesData[qid].text = document.getElementById('notesText' + qid).value;
  _saveNotes();
}

function _setupCanvas(qid){
  if(_notesCanvasReady[qid]) return;
  const canvas = document.getElementById('notesCanvas' + qid);
  if(!canvas) return;
  _notesCanvasReady[qid] = true;
  _notesDrawTool[qid] = 'pen';

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let drawing = false;

  function pos(e){
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    };
  }
  function start(e){
    drawing = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  }
  function move(e){
    if(!drawing) return;
    const p = pos(e);
    const isEraser = _notesDrawTool[qid] === 'eraser';
    ctx.lineWidth = isEraser ? 18 : 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = isEraser ? '#ffffff' : '#1c2b3a';
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  }
  function end(){
    if(!drawing) return;
    drawing = false;
    if(!_notesData[qid]) _notesData[qid] = { mode: 'draw', text: '', drawing: null };
    try{
      _notesData[qid].drawing = canvas.toDataURL('image/png');
    }catch(e){ console.error('手寫筆記轉存失敗', e); }
    _saveNotes();
  }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);
}

function setDrawMode(qid, tool){
  _notesDrawTool[qid] = tool;
  const penBtn = document.getElementById('notesPen' + qid);
  const eraserBtn = document.getElementById('notesEraser' + qid);
  if(penBtn) penBtn.classList.toggle('active', tool === 'pen');
  if(eraserBtn) eraserBtn.classList.toggle('active', tool === 'eraser');
}

function clearDrawing(qid){
  if(!confirm('確定要清除這一題的手寫筆記嗎？')) return;
  const canvas = document.getElementById('notesCanvas' + qid);
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if(!_notesData[qid]) _notesData[qid] = { mode: 'draw', text: '', drawing: null };
  _notesData[qid].drawing = canvas.toDataURL('image/png');
  _saveNotes();
}
