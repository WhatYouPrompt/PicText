const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const captionHeightInput = document.getElementById('captionHeight');
const fontSizeInput = document.getElementById('fontSize');
const fontColorInput = document.getElementById('fontColor');
const fontColorField = document.getElementById('fontColorField');
const bgColorField = document.getElementById('bgColorField');
const bgOverlay = document.getElementById('bgOverlay');
const bgPopover = document.getElementById('bgPopover');
const colorGradient = document.getElementById('colorGradient');
const gradientCursor = document.getElementById('gradientCursor');
const hueBar = document.getElementById('hueBar');
const hueCursor = document.getElementById('hueCursor');
const rgbR = document.getElementById('rgbR');
const rgbG = document.getElementById('rgbG');
const rgbB = document.getElementById('rgbB');
const bgAlphaRange = document.getElementById('bgAlphaRange');
const bgAlphaText = document.getElementById('bgAlphaText');
const fontFamilySelect = document.getElementById('fontFamily');
const fontWeightSelect = document.getElementById('fontWeight');
const textInput = document.getElementById('textInput');
const previewCanvas = document.getElementById('previewCanvas');
const generateBtn = document.getElementById('generateBtn');
const saveOriginalBtn = document.getElementById('saveOriginalBtn');
const toast = document.getElementById('toast');
const warn = document.getElementById('warn');

let img = null; let imgName = 'image'; let offscreen = null; let scale = 1; let pending = false; let hasGenerated = false; let backgroundAlpha = 0.2;
let currentHue = 0; let currentSat = 0; let currentVal = 100; let currentR = 0; let currentG = 0; let currentB = 0;

function showToast(msg, ok = true) { toast.textContent = msg; toast.style.background = ok ? '#2da44e' : '#d1242f'; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 1800) }

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function readLines() { return textInput.value.split('\n').map(s => s.trim()) }

function hsvToRgb(h, s, v) {
  s /= 100; v /= 100;
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (max !== min) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, v: v * 100 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}
function updateColorFields() {
  fontColorField.style.backgroundColor = fontColorInput.value;
  bgOverlay.style.backgroundColor = `rgba(${currentR},${currentG},${currentB},${backgroundAlpha})`;
  bgAlphaText.textContent = Math.round(backgroundAlpha * 100) + '%';
}

function updateColorFromHSV() {
  const rgb = hsvToRgb(currentHue, currentSat, currentVal);
  currentR = rgb.r; currentG = rgb.g; currentB = rgb.b;
  rgbR.value = currentR; rgbG.value = currentG; rgbB.value = currentB;
  updateGradientBackground();
  updateColorFields();
}

function updateGradientBackground() {
  const hueColor = hsvToRgb(currentHue, 100, 100);
  const hueHex = rgbToHex(hueColor.r, hueColor.g, hueColor.b);
  colorGradient.style.background = `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueHex})`;
}

function updateCursors() {
  gradientCursor.style.left = currentSat + '%';
  gradientCursor.style.top = (100 - currentVal) + '%';
  hueCursor.style.left = (currentHue / 360 * 100) + '%';
  hueCursor.style.top = '50%';
}

function computeBarHeight(totalHeight, lines) { const n = lines.length > 0 ? lines.length : 1; return Math.floor(totalHeight / n) }

function render() {
  if (!img) { const ctx = previewCanvas.getContext('2d'); previewCanvas.width = 800; previewCanvas.height = 450; ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height); warn.textContent = ''; return }
  const captionHeight = Number(captionHeightInput.value) || 0; const fontSize = Number(fontSizeInput.value) || 12; const fontColor = fontColorInput.value; const fontFamily = fontFamilySelect.value; const fontWeight = fontWeightSelect.value; const lines = readLines();
  const w = img.width, h = img.height; const bars = lines.length > 0 ? lines.length : captionHeight > 0 ? 1 : 0; const barH = bars > 0 ? computeBarHeight(captionHeight, lines) : 0; const padding = Math.max(4, Math.round(fontSize * 0.2)); const overflow = bars > 0 && (fontSize + padding > barH);
  warn.textContent = overflow ? '字体过大，请增大字幕高度或减小字号' : warn.textContent;
  const pctx = previewCanvas.getContext('2d'); const maxW = previewCanvas.parentElement.clientWidth - 24; scale = Math.min(1, maxW / w); previewCanvas.width = Math.round(w * scale); previewCanvas.height = Math.round(h * scale); pctx.imageSmoothingEnabled = true; pctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  if (hasGenerated && offscreen) { pctx.drawImage(offscreen, 0, 0, previewCanvas.width, previewCanvas.height) } else { pctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height) } updateColorFields()
}

function triggerDownload(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000) }

fileInput.addEventListener('change', async e => { const f = e.target.files && e.target.files[0]; if (!f) { return } const ok = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(f.type); if (!ok) { showToast('不支持的图片类型', false); return } imgName = f.name.replace(/\.(png|jpg|jpeg|webp)$/i, '') || 'image'; const url = URL.createObjectURL(f); const im = new Image(); im.onload = () => { URL.revokeObjectURL(url); img = im; fileInfo.textContent = f.name; render() }; im.onerror = () => { URL.revokeObjectURL(url); showToast('图片加载失败', false) }; im.src = url });

function onParamsChange() { if (pending) return; pending = true; hasGenerated = false; warn.textContent = '参数已变更，请点击生成'; setTimeout(() => { pending = false; render() }, 60) }
captionHeightInput.addEventListener('input', onParamsChange);
fontSizeInput.addEventListener('input', onParamsChange);
fontColorField.addEventListener('click', () => fontColorInput.click());
fontColorField.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { fontColorInput.click() } });
fontColorInput.addEventListener('input', () => { onParamsChange(); updateColorFields() });
bgColorField.addEventListener('click', () => { bgPopover.classList.remove('hidden'); updateCursors(); });
bgAlphaRange.addEventListener('input', () => { backgroundAlpha = clamp(Number(bgAlphaRange.value) / 100, 0, 1); updateColorFields(); onParamsChange(); });

let isDraggingGradient = false, isDraggingHue = false;

function handleGradientMove(e) {
  const rect = colorGradient.getBoundingClientRect();
  const x = clamp(e.clientX - rect.left, 0, rect.width);
  const y = clamp(e.clientY - rect.top, 0, rect.height);
  currentSat = (x / rect.width) * 100;
  currentVal = 100 - (y / rect.height) * 100;
  updateColorFromHSV();
  updateCursors();
  onParamsChange();
}

function handleHueMove(e) {
  const rect = hueBar.getBoundingClientRect();
  const x = clamp(e.clientX - rect.left, 0, rect.width);
  currentHue = (x / rect.width) * 360;
  updateColorFromHSV();
  updateCursors();
  onParamsChange();
}

colorGradient.addEventListener('mousedown', (e) => { isDraggingGradient = true; handleGradientMove(e); });
hueBar.addEventListener('mousedown', (e) => { isDraggingHue = true; handleHueMove(e); });
document.addEventListener('mousemove', (e) => { if (isDraggingGradient) handleGradientMove(e); if (isDraggingHue) handleHueMove(e); });
document.addEventListener('mouseup', () => { isDraggingGradient = false; isDraggingHue = false; });

[rgbR, rgbG, rgbB].forEach(input => {
  input.addEventListener('input', () => {
    currentR = clamp(Number(rgbR.value) || 0, 0, 255);
    currentG = clamp(Number(rgbG.value) || 0, 0, 255);
    currentB = clamp(Number(rgbB.value) || 0, 0, 255);
    const hsv = rgbToHsv(currentR, currentG, currentB);
    currentHue = hsv.h; currentSat = hsv.s; currentVal = hsv.v;
    updateGradientBackground();
    updateCursors();
    updateColorFields();
    onParamsChange();
  });
});
document.addEventListener('click', e => { const within = e.target.closest('.color-host'); if (!within) { bgPopover.classList.add('hidden') } });
fontFamilySelect.addEventListener('change', onParamsChange);
fontWeightSelect.addEventListener('change', onParamsChange);
textInput.addEventListener('input', onParamsChange);

generateBtn.addEventListener('click', () => { if (!img) { showToast('请先上传图片', false); return } const lines = readLines(); const nonEmpty = lines.filter(l => l.length > 0); if (nonEmpty.length === 0) { showToast('请输入字幕内容', false); return } const captionHeight = Number(captionHeightInput.value) || 0; const fontSize = Number(fontSizeInput.value) || 12; const fontColor = fontColorInput.value; const fontFamily = fontFamilySelect.value; const fontWeight = fontWeightSelect.value; const w = img.width, h = img.height; const bars = lines.length > 0 ? lines.length : captionHeight > 0 ? 1 : 0; const barH = bars > 0 ? computeBarHeight(captionHeight, lines) : 0; const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.drawImage(img, 0, 0, w, h); if (bars > 0 && barH > 0) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`; ctx.lineJoin = 'round'; ctx.miterLimit = 2; for (let i = 0; i < bars; i++) { const y = h - captionHeight + i * barH; ctx.fillStyle = `rgba(${currentR},${currentG},${currentB},${backgroundAlpha})`; ctx.fillRect(0, y, w, barH); const ty = y + barH / 2; const text = lines[i] || ''; if (text) { ctx.fillStyle = fontColor; ctx.fillText(text, w / 2, ty) } } } offscreen = canvas; hasGenerated = true; showToast('字幕图片生成成功!'); render() });

saveOriginalBtn.addEventListener('click', () => { if (!hasGenerated || !offscreen) { showToast('请先生成字幕图片', false); return } offscreen.toBlob(b => { if (!b) { showToast('保存失败', false); return } triggerDownload(b, `${imgName}-captioned.png`) }, 'image/png') });

window.addEventListener('resize', render);
updateColorFromHSV();
updateCursors();
render();
