/* 學測題型共用輔助函式：段落標題、題組文章、選項、詳解區塊。
   向下相容：舊的 JSON（只有 text/options/answer/steps/final）不受影響。 */
function escHtml(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function qType(q){ return q.type || 'single'; }

/* 這一題的選項：優先用題目自己的 options，否則用題組文章的 options（文意選填） */
function optionsOf(q, data){
  if(q.options) return q.options;
  const p = q.passageId && data.passages ? data.passages[q.passageId] : null;
  return (p && p.options) ? p.options : null;
}

function sectionHtml(q){
  return q.section ? '<div class="section-title">' + q.section + '</div>' : '';
}

/* 題組文章：同一個 passageId 只在第一題之前顯示一次 */
function passageHtml(q, data, shown){
  if(!q.passageId || !data.passages || shown[q.passageId]) return '';
  const p = data.passages[q.passageId];
  if(!p) return '';
  shown[q.passageId] = true;
  let h = '<div class="passage">';
  if(p.title) h += '<div class="ptitle">' + p.title + '</div>';
  h += '<div class="pbody">' + p.html + '</div>';
  if(p.options){
    h += '<div class="passage-options">';
    Object.keys(p.options).forEach(function(k){ h += '<span>(' + k + ') ' + p.options[k] + '</span>'; });
    h += '</div>';
  }
  h += '</div>';
  return h;
}

function badgeText(q){
  if(qType(q) === 'open') return '非選';
  return q.answer;
}

/* 詳解內容（步驟＋參考答案＋評分原則＋最終答案） */
function solutionInner(q){
  let h = '';
  if(qType(q) === 'open' && q.modelAnswer){
    h += '<div class="model"><div class="mlabel">參考答案</div>';
    q.modelAnswer.forEach(function(m){ h += '<div class="mline">' + m + '</div>'; });
    h += '</div>';
    if(q.scoring) h += '<div class="scoring"><b>評分原則：</b>' + q.scoring + '</div>';
  }
  h += '<div class="label">詳解</div><ul class="steps">';
  (q.steps||[]).forEach(function(s){ h += '<li>' + s + '</li>'; });
  h += '</ul>';
  if(q.final) h += '<div class="final">' + q.final + '</div>';
  return h;
}

function typeTag(q){
  const t = qType(q);
  if(t === 'multi') return '<span class="qtag multi">多選題</span>';
  if(t === 'open') return '<span class="qtag open">非選擇題' + (q.points ? '・' + q.points + '分' : '') + '</span>';
  return '';
}
