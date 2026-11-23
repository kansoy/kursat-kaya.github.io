export const modes = {
  xy: { min: 0, max: 180, initial: 56, step: 1 },
  fourier: { min: 1, max: 18, initial: 5, step: 1 },
  rc: { min: 10, max: 200, initial: 100, step: 5 },
  faraday: { min: 300, max: 1500, initial: 900, step: 60 }
};
const tau = Math.PI * 2;
const radians = degrees => degrees * Math.PI / 180;
export function xy(theta, phase) { return [Math.sin(3 * theta + radians(phase)), Math.sin(2 * theta)]; }
export function fourier(timeMs, terms) {
  let sum = 0;
  for (let n = 0; n < terms; n++) {
    const harmonic = 2 * n + 1;
    sum += Math.sin(harmonic * tau * timeMs) / harmonic;
  }
  return (4 / Math.PI) * sum;
}
export function timeConstantMs(capacitanceNf) { return 0.01 * capacitanceNf; }
export function capacitorVoltage(timeMs, capacitanceNf) { return -Math.expm1(-timeMs / timeConstantMs(capacitanceNf)); }
export function inducedPeak(rpm) { return 100 * 0.1 * 0.002 * tau * rpm / 60; }
export function inducedVoltage(timeMs, rpm) { return inducedPeak(rpm) * Math.sin(tau * rpm / 60 * timeMs / 1000); }

const tint = '#a4e1c7';
const blue = '#e2b480';
function trace(ctx, count, at) {
  ctx.beginPath();
  for (let i = 0; i <= count; i++) {
    const point = at(i / count);
    if (i === 0) ctx.moveTo(...point); else ctx.lineTo(...point);
  }
  ctx.stroke();
}
function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}
function ticks(lower, upper, interval) {
  const values = [];
  for (let j = Math.ceil(lower / interval); j <= Math.floor(upper / interval); j++) values.push(j * interval);
  return values;
}

function grid(ctx, width, height, id, lang) {
  const scales = {
    xy: { bounds:[-1.24,1.24,-1.21,1.21], xstep:.25, ystep:.25, xt:[-1,-.5,0,.5,1], yt:[-1,0,1] },
    fourier: { bounds:[0,2,-1.4,1.4], xstep:.125, ystep:.25, xt:[0,.5,1,1.5,2], yt:[-1,0,1] },
    rc: { bounds:[0,8,-.10,1.14], xstep:.5, ystep:.125, xt:[0,2,4,6,8], yt:[0,.5,1] },
    faraday: { bounds:[0,100,-3.6,3.6], xstep:6.25, ystep:.5, xt:[0,25,50,75,100], yt:[-3,0,3] }
  };
  const {bounds, xstep, ystep, xt, yt}=scales[id];
  const isXY = id === 'xy';
  const left = width < 390 ? 35 : 44, right = width - (width < 390 ? 17 : 26), top = 10, bottom = height - 26;
  const [xmin,xmax,ymin,ymax] = bounds;
  const x = v => left + (v-xmin) / (xmax-xmin) * (right-left);
  const y = v => bottom - (v-ymin) / (ymax-ymin) * (bottom-top);
  ctx.lineWidth = .65;
  ctx.strokeStyle = '#24443d';
  ticks(xmin,xmax,xstep).forEach(v => line(ctx,x(v),top,x(v),bottom));
  ticks(ymin,ymax,ystep).forEach(v => line(ctx,left,y(v),right,y(v)));
  ctx.strokeStyle = '#527d6c'; ctx.lineWidth = .8;
  line(ctx,x(0),top,x(0),bottom); line(ctx,left,y(0),right,y(0));
  ctx.fillStyle='#abcbbe'; ctx.font=width < 380 ? '9px monospace' : '10px monospace';
  const format = value => value.toLocaleString(lang,{maximumFractionDigits:2}).replace('-', '−');
  ctx.textAlign='center'; ctx.textBaseline='alphabetic';
  xt.forEach(v => ctx.fillText(format(v),x(v),bottom+15));
  ctx.textAlign='right'; ctx.textBaseline='middle';
  yt.forEach(v=>ctx.fillText(format(v),left-7,y(v)));
  ctx.textAlign='left'; ctx.textBaseline='top'; ctx.fillText(isXY?'Y/V':'V',5,top);
  ctx.textAlign='right';ctx.textBaseline='bottom';ctx.fillText(isXY?'X/V':'ms',width-3,height-1);
  return { x,y,left,right,top,bottom };
}

function drawXY(ctx, g, phase) {
  const count = 39;
  for (let n = 0; n < count; n++) {
    const fraction = n / (count-1);
    const offset = phase - 60 * (1-fraction);
    const red = Math.round(42 + 114 * fraction ** 2);
    const green = Math.round(107 + 114 * fraction);
    const b = Math.round(89 + 92 * fraction ** 2);
    ctx.strokeStyle = `rgba(${red},${green},${b},${.26 + .41 * fraction})`;
    ctx.lineWidth = .85;
    trace(ctx, 590, t => { const [vx,vy]=xy(t*tau,offset); return [g.x(vx),g.y(vy)]; });
  }
  ctx.save(); ctx.strokeStyle='#c5f9df'; ctx.shadowColor='#6db69d'; ctx.shadowBlur=5; ctx.lineWidth=1.8;
  trace(ctx,730,t=>{ const [vx,vy]=xy(t*tau,phase); return [g.x(vx),g.y(vy)]; }); ctx.restore();
}

function drawFourier(ctx,g,n) {
  ctx.strokeStyle=blue;ctx.lineWidth=1.35;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.moveTo(g.x(0),g.y(1));
  for(let i=1;i<=4;i++){
    const previous=(i%2)?1:-1;
    ctx.lineTo(g.x(i/2),g.y(previous));
    if(i<4)ctx.lineTo(g.x(i/2),g.y(-previous));
  }
  ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle=tint;ctx.lineWidth=2.6;
  trace(ctx,Math.max(800,Math.ceil(g.right-g.left)*2),p=>[g.x(2*p),g.y(fourier(2*p,n))]);
}

function drawRC(ctx,g,c,lang) {
  ctx.strokeStyle=blue;ctx.lineWidth=1.2;ctx.setLineDash([4,4]);line(ctx,g.x(0),g.y(1),g.x(8),g.y(1));
  const t=timeConstantMs(c),v=capacitorVoltage(t,c);
  ctx.strokeStyle='#ac996e';line(ctx,g.x(t),g.y(0),g.x(t),g.y(v));
  line(ctx,g.x(0),g.y(v),g.x(t),g.y(v));ctx.setLineDash([]);
  ctx.strokeStyle=tint;ctx.lineWidth=2.8;
  trace(ctx,500,p=>[g.x(p*8),g.y(capacitorVoltage(p*8,c))]);
  ctx.fillStyle=tint;ctx.beginPath();ctx.arc(g.x(t),g.y(v),3.8,0,tau);ctx.fill();
  ctx.font='11px monospace';ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillText(`τ = ${t.toLocaleString(lang,{maximumFractionDigits:2})} ms`,g.x(t)+8,g.y(v)+5);
}

function drawFaraday(ctx,g,rpm,lang) {
  const peak=inducedPeak(rpm);
  ctx.strokeStyle=blue;ctx.lineWidth=1;ctx.setLineDash([4,4]);
  line(ctx,g.x(0),g.y(peak),g.x(100),g.y(peak));ctx.setLineDash([]);
  ctx.strokeStyle=tint;ctx.lineWidth=2.7;
  trace(ctx,700,p=>[g.x(p*100),g.y(inducedVoltage(p*100,rpm))]);
  ctx.fillStyle='#dbede4';ctx.font='11px monospace';ctx.textAlign='right';ctx.textBaseline='bottom';
  ctx.fillText(`|ε|max = ${peak.toLocaleString(lang,{maximumFractionDigits:2})} V`,g.right-5,g.y(peak)-4);
}

export function draw(canvas,id,value,lang) {
  const ctx = canvas.getContext('2d'); if (!ctx) return false;
  const rect = canvas.getBoundingClientRect();
  const width=rect.width,height=rect.height;
  if (width < 1 || height < 1) return false;
  const ratio=Math.min(window.devicePixelRatio||1,2);
  const pw=Math.round(width*ratio), ph=Math.round(height*ratio);
  if (canvas.width!==pw || canvas.height!==ph) {canvas.width=pw; canvas.height=ph;}
  ctx.setTransform(pw/width,0,0,ph/height,0,0);
  ctx.fillStyle='#0c2521';ctx.fillRect(0,0,width,height);
  ctx.save();
  const g=grid(ctx,width,height,id,lang);
  ctx.beginPath();ctx.rect(g.left-.5,g.top,g.right-g.left+1,g.bottom-g.top+1);ctx.clip();
  if (id==='xy') drawXY(ctx,g,value);
  else if(id==='fourier') drawFourier(ctx,g,value);
  else if(id==='rc') drawRC(ctx,g,value,lang);
  else drawFaraday(ctx,g,value,lang);
  ctx.restore();
  return true;
}
