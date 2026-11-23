import { draw, modes } from './models.mjs?palette=petrol';

const bench = document.querySelector('#bench');
const canvas = bench.querySelector('#scope');
const input = bench.querySelector('#parameter');
const readout = bench.querySelector('#readout');
const sweep = bench.querySelector('#sweep');
const tabs = [...bench.querySelectorAll('[role="tab"]')];
const lang = document.documentElement.lang;
const state = Object.fromEntries(Object.entries(modes).map(([id,m])=>[id,m.initial]));
const graphDescription = canvas.getAttribute('aria-label').split(' — ')[0];
let id = 'xy', frame = 0, start = 0, startValue = 0;

function render() {
  const value = state[id];
  const unit = {xy:'°',fourier:'',rc:' nF',faraday:lang==='tr'?' dev/dk':' rpm'}[id];
  input.value = value;
  readout.textContent = value.toLocaleString(lang) + unit;
  input.setAttribute('aria-valuetext',readout.textContent);
  if (draw(canvas,id,value,lang)) bench.classList.add('ready');
}
function stop() {
  if(frame) cancelAnimationFrame(frame);
  frame = 0;
  sweep.setAttribute('aria-pressed','false');
  sweep.querySelector('span').textContent=sweep.dataset.run;
}
function animate(now) {
  if (!start) start=now;
  const m=modes[id],span=m.max-m.min,period=11000;
  const progress=(startValue-m.min)/span+(now-start)/period;
  const fraction=1-Math.abs(progress%2-1);
  const value=m.min+m.step*Math.round(span*fraction/m.step);
  if (state[id]!==value) {state[id]=value;render();}
  frame=requestAnimationFrame(animate);
}
function select(next,focus=false) {
  stop();id=next;
  const conf=modes[next],panel=document.getElementById('panel-'+next);
  for (const tab of tabs) {
    const selected=tab.dataset.model===next;
    tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;
    if (selected&&focus) tab.focus();
  }
  input.min=conf.min;input.max=conf.max;input.step=conf.step;
  bench.querySelector('#mode-label').textContent=panel.dataset.mode;
  bench.querySelector('#context-label').textContent=panel.dataset.context;
  bench.querySelector('#parameter-label').textContent=panel.dataset.label;
  canvas.setAttribute('aria-label',graphDescription+' — '+panel.dataset.title);
  canvas.setAttribute('aria-describedby',panel.id);
  render();
}
for (const [index,tab] of tabs.entries()) {
  tab.addEventListener('click',()=>select(tab.dataset.model));
  tab.addEventListener('keydown',e=>{
    const n=tabs.length;
    const destinations={ArrowRight:(index+1)%n,ArrowLeft:(index+n-1)%n,Home:0,End:n-1};
    if (!(e.key in destinations)) return;
    e.preventDefault();select(tabs[destinations[e.key]].dataset.model,true);
  });
}
input.addEventListener('input',()=>{stop();state[id]=Number(input.value);render();});
sweep.addEventListener('click',()=>{
  if(frame){stop();return;}
  sweep.setAttribute('aria-pressed','true');sweep.querySelector('span').textContent=sweep.dataset.stop;
  start=0;startValue=state[id];frame=requestAnimationFrame(animate);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
if ('IntersectionObserver' in window) new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)stop();}).observe(bench);
new ResizeObserver(render).observe(canvas.parentElement);
select('xy');

const menu = document.querySelector('.compact-nav');
menu.addEventListener('click', event => {
  if (event.target.closest('a')) menu.open = false;
});
document.addEventListener('click', event => {
  if (menu.open && !menu.contains(event.target)) menu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
