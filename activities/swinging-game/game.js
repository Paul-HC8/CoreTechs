(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const scoreEl = document.getElementById('score');
  const bestEl = document.getElementById('best');
  const button = document.getElementById('play-button');
  const picker = document.getElementById('character-picker');
  const chooseAgain = document.getElementById('choose-again');
  const themeToggle = document.getElementById('theme-toggle');
  const W = canvas.width, H = canvas.height, ground = 464;
  let state = 'ready', last = 0, time = 0, score = 0, best = Number(localStorage.getItem('skylineSwingBest') || 0);
  let buildings = [], birds = [], birdTimer = 0, aircraft = null, aircraftTimer = 0, player, swing = null, pointerHeld = false, cameraX = 0, toastTimer;
  let selectedCharacter = 'Stickman';
  let theme = localStorage.getItem('skylineSwingTheme') === 'classic' ? 'classic' : 'night';
  const characterHeads = {
    Raf: loadHead('assets/raf.png'),
    Macoy: loadHead('assets/macoy.png'),
    Pol: loadHead('assets/pol.png'),
    Lance: loadHead('assets/lance.png')
  };
  function loadHead(src){const image=new Image();image.src=src;return image;}
  function setTheme(nextTheme){
    theme=nextTheme;
    document.body.classList.toggle('classic-theme',theme==='classic');
    themeToggle.textContent=theme==='night'?'THEME · NIGHT':'THEME · SKYLINE';
    themeToggle.setAttribute('aria-pressed',String(theme==='classic'));
    themeToggle.setAttribute('aria-label',theme==='night'?'Switch to Skyline theme':'Switch to dark night theme');
    localStorage.setItem('skylineSwingTheme',theme);
  }
  setTheme(theme);
  themeToggle.addEventListener('click',()=>setTheme(theme==='night'?'classic':'night'));
  bestEl.textContent = String(best).padStart(3, '0');

  const rnd = (a,b) => a + Math.random()*(b-a);
  function nextBuildingHeight(previousHeight){
    const choices=[100,140,180,220,260,300].filter(height=>Math.abs(height-previousHeight)>=55&&Math.abs(height-previousHeight)<=100);
    const base=choices[Math.floor(Math.random()*choices.length)];
    return Math.max(90,Math.min(305,base+rnd(-5,5)));
  }
  function setup(){
    buildings = [{x:-100,w:250,h:145},{x:260,w:115,h:200},{x:535,w:120,h:120},{x:820,w:130,h:220},{x:1110,w:105,h:155}];
    // Start just above the roof; the player's collision radius is 8px.
    player = {x:80,y:ground-145-10,vx:0,vy:0,angle:0,trail:[]};
    score=0;cameraX=0;time=0;swing=null;pointerHeld=false;birds=[];birdTimer=0;aircraft=null;aircraftTimer=0;scoreEl.textContent='000';
  }
  setup();
  function showToast(text){const t=document.getElementById('toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1000)}
  function start(){if(state==='playing')return;setup();state='playing';picker.hidden=true;chooseAgain.hidden=true;overlay.classList.add('hidden');player.vx=195;player.vy=-405;}
  function attachRope(anchorX,anchorY){
    if(state!=='playing'||swing)return;
    const dx=player.x-anchorX,dy=player.y-anchorY;
    const len=Math.max(28,Math.hypot(dx,dy));
    const theta=Math.atan2(dx,dy);
    // Give each new swing a forward push so it builds useful momentum quickly.
    swing={x:anchorX,y:anchorY,len,theta,omega:2.4*(Math.cos(theta)<0?-1:1)};
  }
  function releaseRope(){if(!swing)return;swing=null;player.vx=Math.max(240,player.vx+135);}
  function startKeyboardSwing(){
    if(state==='ready'||state==='over'){start();}
    if(state==='playing')attachRope(player.x+100,Math.max(45,player.y-130));
  }
  document.querySelectorAll('.character-option').forEach(option=>option.addEventListener('click',()=>{
    selectedCharacter=option.dataset.character;
    document.querySelectorAll('.character-option').forEach(item=>{const chosen=item===option;item.classList.toggle('selected',chosen);item.setAttribute('aria-checked',String(chosen));});
  }));
  button.addEventListener('click',start);
  chooseAgain.addEventListener('click',()=>{
    state='ready';picker.hidden=false;chooseAgain.hidden=true;
    document.getElementById('panel-icon').textContent='✦';
    document.getElementById('panel-kicker').textContent='PICK YOUR RUNNER';
    document.getElementById('panel-title').innerHTML='Who’s taking<br>the leap?';
    document.getElementById('panel-copy').textContent='Choose a character, then swing through the skyline.';
    button.innerHTML='START RUN <span>→</span>';
  });
  window.addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='ArrowUp'){e.preventDefault();if(!e.repeat){pointerHeld=true;startKeyboardSwing()}}});
  window.addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='ArrowUp'){pointerHeld=false;releaseRope()}});
  window.addEventListener('blur',()=>{pointerHeld=false;releaseRope()});
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();pointerHeld=true;
    if(state==='ready'||state==='over')start();
    const rect=canvas.getBoundingClientRect();
    const x=(e.clientX-rect.left)*W/rect.width+cameraX;
    const y=(e.clientY-rect.top)*H/rect.height;
    attachRope(x,y);
  });
  window.addEventListener('pointerup',()=>{pointerHeld=false;releaseRope()});
  window.addEventListener('pointercancel',()=>{pointerHeld=false;releaseRope()});

  function update(dt){
    time+=dt;
    if(state!=='playing')return;
    const p=player;const prevX=p.x,prevY=p.y;
    if(swing){const s=swing;s.omega+=(-1100/s.len*Math.sin(s.theta))*dt;s.omega*=.999;s.theta+=s.omega*dt;p.x=s.x+Math.sin(s.theta)*s.len;p.y=s.y+Math.cos(s.theta)*s.len;p.vx=(p.x-prevX)/dt;p.vy=(p.y-prevY)/dt;}
    else {p.vy+=820*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx=Math.max(165,p.vx-8*dt);}
    cameraX=Math.max(0,p.x-220);
    const right=cameraX+W+180;
    while(buildings[buildings.length-1].x+buildings[buildings.length-1].w<right){const prev=buildings[buildings.length-1];buildings.push({x:prev.x+prev.w+rnd(105,190),w:rnd(90,148),h:nextBuildingHeight(prev.h)});}
    buildings=buildings.filter(b=>b.x+b.w>cameraX-180);
    // Landing on a rooftop is safe. Passing through a building or dropping below the floor ends the run.
    let landed=false;
    for(const b of buildings){const top=ground-b.h;if(p.x+10>b.x&&p.x-10<b.x+b.w){if(prevY+9<=top&&p.y+9>=top&&p.vy>0&&!swing){p.y=top-9;p.vy=0;p.vx=Math.max(170,p.vx);landed=true;const center=p.x-cameraX;if(center>260){} }} }
    // Award one point as each building's near edge is cleared.
    for(const b of buildings){if(!b.passed&&b.x+b.w< p.x-9){b.passed=true;score++;scoreEl.textContent=String(score).padStart(3,'0');if(score>best){best=score;bestEl.textContent=String(best).padStart(3,'0');localStorage.setItem('skylineSwingBest',best)}}}
    if(score>=10){
      birdTimer-=dt;
      if(birdTimer<=0){birds.push({x:p.x+W+100,y:rnd(65,Math.min(270,ground-45)),speed:rnd(170,260),phase:rnd(0,Math.PI*2)});birdTimer=rnd(1.6,2.5);}
    }
    for(const bird of birds){bird.x-=bird.speed*dt;bird.phase+=dt*12;if(Math.hypot(p.x-bird.x,p.y-bird.y)<18){end();return}}
    birds=birds.filter(bird=>bird.x>cameraX-50);
    if(score>=30){
      if(!aircraft){aircraftTimer-=dt;if(aircraftTimer<=0)warnAircraft();}
      else if(aircraft.phase==='warning'){
        aircraft.timer-=dt;
        if(aircraft.timer<=0){aircraft.phase='flying';showToast('DODGE!');}
      }else{
        const oldAirX=aircraft.x,oldAirY=aircraft.y;
        aircraft.x+=aircraft.vx*dt;aircraft.y+=aircraft.vy*dt;
        const rx0=prevX-oldAirX,ry0=prevY-oldAirY,rx1=p.x-aircraft.x,ry1=p.y-aircraft.y;
        const dx=rx1-rx0,dy=ry1-ry0,denom=dx*dx+dy*dy;
        const nearest=denom?Math.max(0,Math.min(1,-(rx0*dx+ry0*dy)/denom)):0;
        if(Math.hypot(rx0+dx*nearest,ry0+dy*nearest)<34){end();return}
        if(aircraft.x<cameraX-100||aircraft.y< -80||aircraft.y>H+80){aircraft=null;aircraftTimer=rnd(5.5,8);}
      }
    }
    p.trail.push({x:p.x,y:p.y});if(p.trail.length>9)p.trail.shift();
    const screenX=p.x-cameraX;
    if(screenX< -10||screenX>W+10||p.y< -10||p.y>H+10){end();return}
    if(p.y>ground+8){end();return}
    // Contact with the front/side of a building is a collision; top landings are handled above.
    for(const b of buildings){const top=ground-b.h;if(p.x+8>b.x&&p.x-8<b.x+b.w&&p.y+8>top&&p.y-8<ground&&p.y+8>top+3){end();return}}
    if(landed){p.y-=.2;}
  }
  function warnAircraft(){
    const p=player,delay=1.8;
    const flightTime=.38,predictTime=delay+flightTime;
    const targetX=p.x+Math.max(165,p.vx)*predictTime;
    const targetY=Math.max(65,Math.min(ground-55,p.y+Math.max(-90,Math.min(90,p.vy))*.45));
    const startX=targetX+700;
    const startY=Math.max(55,Math.min(ground-55,targetY+rnd(-135,135)));
    const dx=targetX-startX,dy=targetY-startY,length=Math.hypot(dx,dy),speed=1850;
    aircraft={phase:'warning',x:startX,y:startY,startX,startY,targetX,targetY,vx:dx/length*speed,vy:dy/length*speed,timer:delay,duration:delay,flash:0};
    showToast('AIRPLANE INCOMING');
  }
  function end(){
    state='over';swing=null;aircraft=null;
    picker.hidden=true;chooseAgain.hidden=false;
    document.getElementById('panel-icon').textContent='↻';
    document.getElementById('panel-kicker').textContent='RUN COMPLETE';
    document.getElementById('panel-title').innerHTML=`${score} point${score===1?'':'s'}<br>this run.`;
    document.getElementById('panel-copy').innerHTML=`SCORE <b>${String(score).padStart(3,'0')}</b> &nbsp; · &nbsp; BEST <b>${String(best).padStart(3,'0')}</b><br>Ready to take another swing?`;
    button.innerHTML='TRY AGAIN <span>→</span>';
    overlay.classList.remove('hidden');
  }

  function draw(){ctx.clearRect(0,0,W,H);drawSky();ctx.save();ctx.translate(-cameraX,0);drawCity();drawBuildings();drawAircraftWarning();drawAircraft();drawBirds();drawSwing();drawPlayer();ctx.restore();drawForeground();}
  function drawSky(){const night=theme==='night';const colors=night?{top:'#08080b',mid:'#141418',low:'#202026',stars:'244,244,245',glow:'#f4f4f518',city:'#151519',windows:'#1e1e22',lit:'#d4d4d824',ground:'#0c0c0f'}:{top:'#162746',mid:'#273b5b',low:'#344a69',stars:'207,224,255',glow:'#f2bd7e22',city:'#253754',windows:'#304664',lit:'#eac67b24',ground:'#172845'};const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,colors.top);g.addColorStop(.68,colors.mid);g.addColorStop(1,colors.low);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // Faint stars and a cool moonlit glow.
    for(let i=0;i<55;i++){const x=(i*173+40-cameraX*.08)%(W+20),y=45+(i*71)%210;ctx.fillStyle=`rgba(${colors.stars},${.13+(i%4)*.05})`;ctx.fillRect(x,y,2,2)}
    const glow=ctx.createRadialGradient(720,300,10,720,300,420);glow.addColorStop(0,colors.glow);glow.addColorStop(1,night?'#f4f4f500':'#f2bd7e00');ctx.fillStyle=glow;ctx.fillRect(250,100,700,380);
    ctx.fillStyle=colors.city;for(let i=0;i<17;i++){const x=((i*91-cameraX*.19)%(W+100)+W+100)%(W+100)-30;const h=70+(i*47)%140;ctx.fillRect(x,ground-h,48,h);ctx.fillStyle=colors.windows;for(let wy=ground-h+12;wy<ground-10;wy+=19)for(let wx=x+9;wx<x+40;wx+=16){ctx.fillStyle=night?'#d4d4d824':(i+wy+wx)%3?'#a2c4d122':'#eac67b24';ctx.fillRect(wx,wy,5,7)}ctx.fillStyle=colors.city}
    ctx.fillStyle=colors.ground;ctx.fillRect(0,ground,W,H-ground);
  }
  function drawCity(){ctx.strokeStyle=theme==='night'?'#f4f4f512':'#c7d8ed15';ctx.lineWidth=1;for(let i=0;i<12;i++){const x=cameraX+i*110;ctx.beginPath();ctx.moveTo(x,ground-80);ctx.lineTo(x,ground);ctx.stroke()}}
  function drawBuildings(){const night=theme==='night';for(const b of buildings){const top=ground-b.h;let g=ctx.createLinearGradient(b.x,top,b.x+b.w,ground);g.addColorStop(0,night?'#29292f':'#3b5274');g.addColorStop(1,night?'#18181d':'#253958');ctx.fillStyle=g;ctx.fillRect(b.x,top,b.w,b.h);ctx.fillStyle=night?'#d4d4d81c':'#91a5c51c';ctx.fillRect(b.x,top,b.w,4);ctx.fillStyle=night?'#d4d4d826':'#d9bc7638';for(let wy=top+18;wy<ground-12;wy+=24)for(let wx=b.x+12;wx<b.x+b.w-9;wx+=22){ctx.fillRect(wx,wy,8,11)}ctx.fillStyle=night?'#f4f4f526':'#a8b9d533';ctx.fillRect(b.x+6,top+7,2,b.h-12);ctx.save();ctx.shadowColor=night?'#f4f4f566':'#c8f36a99';ctx.shadowBlur=12;ctx.strokeStyle=night?'#c7c7ce':'#d9f39a';ctx.globalAlpha=.78;ctx.lineWidth=1.5;ctx.strokeRect(b.x+.75,top+.75,b.w-1.5,b.h-1.5);ctx.restore();ctx.fillStyle=night?'#f4f4f5':'#ecf6c5';ctx.globalAlpha=.88;ctx.fillRect(b.x,top,b.w,2);ctx.globalAlpha=1;}}
  function drawBirds(){for(const bird of birds){ctx.save();ctx.translate(bird.x,bird.y);ctx.strokeStyle='#f4e7c8';ctx.fillStyle='#f4e7c8';ctx.lineWidth=2.4;ctx.lineCap='round';ctx.beginPath();ctx.ellipse(0,0,9,5,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(6,-1);ctx.lineTo(12,-4);ctx.lineTo(9,1);ctx.closePath();ctx.fill();const flap=Math.sin(bird.phase)*6;ctx.beginPath();ctx.moveTo(-2,0);ctx.quadraticCurveTo(-7,-flap,-13,-7-flap);ctx.moveTo(-1,1);ctx.quadraticCurveTo(-7,flap,-13,7+flap);ctx.stroke();ctx.restore();}}
  function drawAircraftWarning(){if(!aircraft||aircraft.phase!=='warning')return;const elapsed=aircraft.duration-aircraft.timer;if(Math.floor(elapsed*8)%2===1)return;const light='#ffd84a';ctx.save();ctx.lineCap='round';ctx.strokeStyle=light;ctx.shadowColor=light;ctx.shadowBlur=16;ctx.globalAlpha=.22;ctx.lineWidth=13;ctx.beginPath();ctx.moveTo(aircraft.startX,aircraft.startY);ctx.lineTo(aircraft.targetX,aircraft.targetY);ctx.stroke();ctx.globalAlpha=.9;ctx.lineWidth=2;ctx.setLineDash([14,10]);ctx.beginPath();ctx.moveTo(aircraft.startX,aircraft.startY);ctx.lineTo(aircraft.targetX,aircraft.targetY);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;ctx.font='800 38px Manrope,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';ctx.lineWidth=5;ctx.strokeStyle='#18181b';ctx.shadowBlur=14;ctx.strokeText('!',aircraft.targetX,aircraft.targetY-25);ctx.fillStyle=light;ctx.fillText('!',aircraft.targetX,aircraft.targetY-25);ctx.restore();}
  function drawAircraft(){if(!aircraft||aircraft.phase!=='flying')return;const angle=Math.atan2(aircraft.vy,aircraft.vx),color=theme==='night'?'#f4f4f5':'#eef4ff';ctx.save();ctx.translate(aircraft.x,aircraft.y);ctx.scale(1.2,1.2);ctx.rotate(angle);ctx.shadowColor=color;ctx.shadowBlur=14;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(24,0);ctx.lineTo(-7,-4);ctx.lineTo(-1,-13);ctx.lineTo(-5,-15);ctx.lineTo(-13,-5);ctx.lineTo(-19,-5);ctx.lineTo(-19,5);ctx.lineTo(-13,5);ctx.lineTo(-5,15);ctx.lineTo(-1,13);ctx.lineTo(-7,4);ctx.closePath();ctx.fill();ctx.strokeStyle=theme==='night'?'#a0a0a8':'#8394ad';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-20,0);ctx.lineTo(-34,0);ctx.stroke();ctx.restore();}
  function drawSwing(){if(!swing)return;const p=player,s=swing,ropeColor=theme==='night'?'#f4f4f5':'#e4f4bd';ctx.strokeStyle=ropeColor;ctx.lineWidth=2;ctx.shadowColor=theme==='night'?'#f4f4f5':'#c8f36a';ctx.shadowBlur=8;ctx.setLineDash([5,3]);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);ctx.shadowBlur=0;ctx.fillStyle=theme==='night'?'#f4f4f5':'#c8f36a';ctx.beginPath();ctx.arc(s.x,s.y,5,0,Math.PI*2);ctx.fill()}
  function drawPlayer(){const p=player,trailColor=theme==='night'?'244,244,245':'200,243,106';for(let i=0;i<p.trail.length;i++){const t=p.trail[i];ctx.fillStyle=`rgba(${trailColor},${i/p.trail.length*.16})`;ctx.beginPath();ctx.arc(t.x,t.y,2+i/5,0,Math.PI*2);ctx.fill()}ctx.save();ctx.translate(p.x,p.y);const lean=Math.max(-.35,Math.min(.35,p.vx/1000));ctx.rotate(lean);ctx.strokeStyle='#eaf1ff';ctx.lineWidth=3.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();if(selectedCharacter==='Stickman'||!characterHeads[selectedCharacter]?.complete){ctx.arc(0,-14,7,0,Math.PI*2);ctx.stroke()}ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(0,13);ctx.moveTo(0,-1);ctx.lineTo(-11,5);ctx.moveTo(0,-1);ctx.lineTo(10,4);ctx.moveTo(0,13);ctx.lineTo(-8,25);ctx.moveTo(0,13);ctx.lineTo(9,24);ctx.stroke();const head=characterHeads[selectedCharacter];if(head?.complete&&head.naturalWidth>0)ctx.drawImage(head,-18,-42,36,36);ctx.restore()}
  function drawForeground(){const night=theme==='night';ctx.fillStyle=night?'#f4f4f5':'#c8f36a';ctx.fillRect(0,ground,W,2);const grad=ctx.createLinearGradient(0,ground,0,H);grad.addColorStop(0,night?'#18181b':'#1c2e4b');grad.addColorStop(1,night?'#0c0c0f':'#101d35');ctx.fillStyle=grad;ctx.fillRect(0,ground+2,W,H-ground);ctx.fillStyle=night?'#f4f4f512':'#a9bdd421';for(let i=0;i<12;i++){const x=((i*103-cameraX*.6)%W+W)%W;ctx.fillRect(x,ground+19,35,2)}}
  function loop(ts){const dt=Math.min((ts-last)/1000||0,.033);last=ts;update(dt);draw();requestAnimationFrame(loop)}
  requestAnimationFrame(loop);
})();
