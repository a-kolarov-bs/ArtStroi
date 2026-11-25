// Run in the browser on http://localhost:4352/ (javascript_tool). ClientRouter flow:
// / -> /proekti (hover card) -> detail (open lightbox) -> back (hover card) -> same detail (open lightbox)
const w=(ms)=>new Promise(r=>setTimeout(r,ms)); const out={};
document.querySelector('a[href="/proekti"]').click(); await w(2500); out.p1=location.pathname;
let c=document.querySelector('#proekti-grid .has-hover-slideshow'); c.dispatchEvent(new MouseEvent('mouseenter')); await w(300);
out.hover1=c.querySelectorAll('.slide.is-active').length; c.dispatchEvent(new MouseEvent('mouseleave'));
const a=document.querySelector('#proekti-grid a[href^="/proekti/"]'); const href=a.getAttribute('href'); a.click(); await w(2500); out.p2=location.pathname;
document.querySelector('.g-tile').click(); await w(400); out.open1=document.getElementById('gw-lightbox').open; document.getElementById('gw-lightbox').close();
history.back(); await w(2500); out.p3=location.pathname;
c=document.querySelector('#proekti-grid .has-hover-slideshow'); c.dispatchEvent(new MouseEvent('mouseenter')); await w(300);
out.hover2=c.querySelectorAll('.slide.is-active').length; c.dispatchEvent(new MouseEvent('mouseleave'));
document.querySelector(`#proekti-grid a[href="${href}"]`).click(); await w(2500); out.p4=location.pathname;
document.querySelector('.g-tile').click(); await w(400); out.open2=document.getElementById('gw-lightbox').open;
document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight'})); out.frameAfterOneKey=document.getElementById('gw-current').textContent;
document.getElementById('gw-lightbox').close(); JSON.stringify(out)
