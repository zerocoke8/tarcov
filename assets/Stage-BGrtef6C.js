const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./textures-Drexxan0.js","./rolldown-runtime-XKyaHtl9.js","./index-Bv9d3Y1v.js","./index-DIbLwwh6.css","./Geometry-ByQVI1Dc.js","./Filter-BI-BAMb4.js","./Cache-Zz9lBgN5.js","./canvasUtils-DKVKlWLe.js","./GraphicsContext-BAARAinz.js","./GCManagedHash-BWfMQfPL.js","./getTextureBatchBindGroup-Bt82LeET.js","./RenderTargetSystem-BxM1u-iP.js","./getTexelRangeRects-BgWA0Goa.js"])))=>i.map(i=>d[i]);
import{c as e,f as t,i as n,n as r,t as i,u as a,y as o}from"./textures-Drexxan0.js";import{A as s,F as c,G as l,K as u,P as d,_ as f,d as p,h as m,s as h,z as g}from"./Geometry-ByQVI1Dc.js";import{a as _,i as v}from"./RenderTargetSystem-BxM1u-iP.js";import{t as y}from"./index-Bv9d3Y1v.js";import{c as b,l as x,s as S,t as C}from"./Filter-BI-BAMb4.js";var w;function T(e){return w===void 0&&(w=(()=>{let t={stencil:!0,failIfMajorPerformanceCaveat:e??_.defaultOptions.failIfMajorPerformanceCaveat};try{if(!m.get().getWebGLRenderingContext())return!1;let e=m.get().createCanvas().getContext(`webgl`,t),n=!!e?.getContextAttributes()?.stencil;if(e){let t=e.getExtension(`WEBGL_lose_context`);t&&t.loseContext()}return e=null,n}catch{return!1}})()),w}var E;async function D(e={}){return E===void 0&&(E=await(async()=>{let t=m.get().getNavigator().gpu;if(!t)return!1;try{return await(await t.requestAdapter(e)).requestDevice(),!0}catch{return!1}})()),E}var O=[`webgl`,`webgpu`,`canvas`];async function k(e){let t=[];e.preference?Array.isArray(e.preference)?t=e.preference.slice():(t.push(e.preference),O.forEach(n=>{n!==e.preference&&t.push(n)})):t=O.slice();let n,r={};for(let i=0;i<t.length;i++){let a=t[i];if(a===`webgpu`&&await D()){let{WebGPURenderer:t}=await y(async()=>{let{WebGPURenderer:e}=await import(`./textures-Drexxan0.js`).then(e=>e.k);return{WebGPURenderer:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]),import.meta.url);n=t,r={...e,...e.webgpu};break}if(a===`webgl`&&T(e.failIfMajorPerformanceCaveat??_.defaultOptions.failIfMajorPerformanceCaveat)){let{WebGLRenderer:t}=await y(async()=>{let{WebGLRenderer:e}=await import(`./textures-Drexxan0.js`).then(e=>e.A);return{WebGLRenderer:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]),import.meta.url);n=t,r={...e,...e.webgl};break}if(a===`canvas`){let{CanvasRenderer:t}=await y(async()=>{let{CanvasRenderer:e}=await import(`./textures-Drexxan0.js`).then(e=>e.j);return{CanvasRenderer:e}},__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12]),import.meta.url);n=t,r={...e,...e.canvasOptions};break}}if(delete r.webgpu,delete r.webgl,delete r.canvasOptions,!n)throw Error(`No available renderer for the current environment`);let i=new n;return await i.init(r),i}var A=class{static init(e){Object.defineProperty(this,"resizeTo",{configurable:!0,set(e){globalThis.removeEventListener(`resize`,this.queueResize),this._resizeTo=e,e&&(globalThis.addEventListener(`resize`,this.queueResize),this.resize())},get(){return this._resizeTo}}),this.queueResize=()=>{this._resizeTo&&(this._cancelResize(),this._resizeId=requestAnimationFrame(()=>this.resize()))},this._cancelResize=()=>{this._resizeId&&(cancelAnimationFrame(this._resizeId),this._resizeId=null)},this.resize=()=>{if(!this._resizeTo)return;this._cancelResize();let e,t;if(this._resizeTo===globalThis.window)e=globalThis.innerWidth,t=globalThis.innerHeight;else{let{clientWidth:n,clientHeight:r}=this._resizeTo;e=n,t=r}this.renderer.resize(e,t),this.render()},this._resizeId=null,this._resizeTo=null,this.resizeTo=e.resizeTo||null}static destroy(){globalThis.removeEventListener(`resize`,this.queueResize),this._cancelResize(),this._cancelResize=null,this.queueResize=null,this.resizeTo=null,this.resize=null}};A.extension=l.Application;var j=class{static init(e){e=Object.assign({autoStart:!0,sharedTicker:!1},e),Object.defineProperty(this,"ticker",{configurable:!0,set(e){this._ticker&&this._ticker.remove(this.render,this),this._ticker=e,e&&e.add(this.render,this,b.LOW)},get(){return this._ticker}}),this.stop=()=>{this._ticker.stop()},this.start=()=>{this._ticker.start()},this._ticker=null,this.ticker=e.sharedTicker?S.shared:new S,e.autoStart&&this.start()}static destroy(){if(this._ticker){let e=this._ticker;this.ticker=null,e.destroy()}}};j.extension=l.Application,u.add(A),u.add(j);var M=class e{constructor(...e){this.stage=new x,e[0]!==void 0&&d(c,`Application constructor options are deprecated, please use Application.init() instead.`)}async init(t){t={...t},this.stage||(this.stage=new x),this.renderer=await k(t),e._plugins.forEach(e=>{e.init.call(this,t)})}render(){this.renderer.render({container:this.stage})}get canvas(){return this.renderer.canvas}get view(){return d(c,`Application.view is deprecated, please use Application.canvas instead.`),this.renderer.canvas}get screen(){return this.renderer.screen}get domContainerRoot(){return this.renderer.renderPipes.dom?._domElement}destroy(t=!1,n=!1){let r=e._plugins.slice(0);r.reverse(),r.forEach(e=>{e.destroy.call(this)}),this.stage.destroy(n),this.stage=null,this.renderer.destroy(t),this.renderer=null}};M._plugins=[];var N=M;u.handleByList(l.Application,N._plugins),u.add(v);function P(e,t){let n=n=>1+((e>>n&255)/255-1)*t;return[n(16),n(8),n(0)]}function F(e,t){let n=o(t,0,1.5);if(!e||n<=0)return null;let r=e=>1+(e-1)*n;return{sat:Math.max(0,r(e.sat)),dark:o(r(e.dark),.2,1),lit:o(r(e.lit),.2,1.2),tint:P(e.tint,Math.min(1,n)),warm:P(e.warm,Math.min(1,n)),inner:e.inner,outer:e.outer,vignette:o(e.vignette*n,0,1),keep:o(e.keep,0,1)}}var I=`
in vec2 aPosition;
out vec2 vTextureCoord;
out vec2 vScreen;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

void main(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    gl_Position = vec4(position, 0.0, 1.0);
    vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
    // 화면에서의 자리 (왼쪽 위 0,0 ~ 오른쪽 아래 1,1)
    vScreen = aPosition;
}
`,L=`
in vec2 vTextureCoord;
in vec2 vScreen;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uSat;
uniform float uDark;
uniform float uLit;
uniform vec3 uTint;
uniform vec3 uWarm;
uniform vec2 uLight;
uniform vec2 uRadius;
uniform float uAspect;
uniform float uVignette;
uniform float uKeep;

void main(void)
{
    vec4 c = texture(uTexture, vTextureCoord);
    if (c.a <= 0.0) {
        finalColor = c;
        return;
    }
    vec3 rgb = c.rgb / c.a;
    float luma = dot(rgb, vec3(0.299, 0.587, 0.114));
    rgb = mix(vec3(luma), rgb, uSat);

    // 빛의 웅덩이: 바닥에 드리운 빛처럼 옆으로 조금 넓다
    vec2 d = (vScreen - uLight) * vec2(uAspect, 1.25);
    float lit = 1.0 - smoothstep(uRadius.x, uRadius.y, length(d));
    // 화면 가장자리 (모서리에서 가장 어둡다)
    float edge = smoothstep(0.55, 1.4, length((vScreen - 0.5) * 2.0));
    float amb = mix(uDark, uLit, lit) * (1.0 - uVignette * edge);
    // 밝은 것은 어둠을 덜 받는다
    float keep = smoothstep(0.7, 1.0, luma) * uKeep;
    rgb *= mix(uTint, uWarm, lit) * mix(amb, max(amb, 1.0), keep);

    // 어두운 색이 띠처럼 끊겨 보이지 않게 아주 약하게 흩뿌린다
    float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
    rgb += n / 255.0;
    finalColor = vec4(clamp(rgb, 0.0, 1.0) * c.a, c.a);
}
`,R=class extends C{constructor(){super({glProgram:p.from({vertex:I,fragment:L,name:`mood-filter`}),resources:{moodUniforms:{uSat:{value:1,type:`f32`},uDark:{value:1,type:`f32`},uLit:{value:1,type:`f32`},uTint:{value:new Float32Array([1,1,1]),type:`vec3<f32>`},uWarm:{value:new Float32Array([1,1,1]),type:`vec3<f32>`},uLight:{value:new Float32Array([.5,.5]),type:`vec2<f32>`},uRadius:{value:new Float32Array([.3,1]),type:`vec2<f32>`},uAspect:{value:2,type:`f32`},uVignette:{value:0,type:`f32`},uKeep:{value:.8,type:`f32`}}},resolution:`inherit`,antialias:`inherit`}),t(this,`u`,void 0),this.u=this.resources.moodUniforms.uniforms}use(e){let t=this.u;t.uSat=e.sat,t.uDark=e.dark,t.uLit=e.lit,t.uTint.set(e.tint),t.uWarm.set(e.warm),t.uRadius[0]=e.inner,t.uRadius[1]=e.outer,t.uVignette=e.vignette,t.uKeep=e.keep}light(e,t,n){this.u.uLight[0]=e,this.u.uLight[1]=t,this.u.uAspect=n}};function z(e,t){let n=document.createElement(`canvas`);return n.width=n.height=e,t(n.getContext(`2d`),e),f.from(n)}var B=class c{constructor(e){t(this,`app`,void 0),t(this,`world`,new x),t(this,`scene`,new x),t(this,`ground`,new x),t(this,`decals`,new x),t(this,`objects`,new x),t(this,`fxFlat`,new x),t(this,`fx`,new x),t(this,`tex`,void 0),t(this,`cam`,{x:0,y:0,zoom:1,shake:0}),t(this,`mood`,null),t(this,`moodArea`,new s),this.app=e}static async create(e){let t=new N,n=Math.max(1,e.clientWidth*e.clientHeight),r=c.resolutionFor(e);await t.init({resizeTo:e,background:789268,antialias:r<1.5&&n<=a.P(`view.maxPixels`),resolution:r,autoDensity:!0,powerPreference:`high-performance`,gcActive:!1}),e.appendChild(t.canvas);let i=new c(t);return window.addEventListener(`resize`,()=>{let n=c.resolutionFor(e);Math.abs(n-t.renderer.resolution)<.01||(t.renderer.resolution=n,t.resize())}),i.objects.sortableChildren=!0,i.scene.addChild(i.ground,i.decals,i.objects),i.world.addChild(i.scene,i.fxFlat,i.fx),t.stage.addChild(i.world),i.tex={disc:z(128,(e,t)=>{e.fillStyle=`#fff`,e.beginPath(),e.arc(t/2,t/2,t/2-1,0,Math.PI*2),e.fill()}),ring:z(128,(e,t)=>{e.strokeStyle=`#fff`,e.lineWidth=5,e.beginPath(),e.arc(t/2,t/2,t/2-4,0,Math.PI*2),e.stroke()}),glow:z(128,(e,t)=>{let n=e.createRadialGradient(t/2,t/2,0,t/2,t/2,t/2);n.addColorStop(0,`rgba(255,255,255,1)`),n.addColorStop(.4,`rgba(255,255,255,0.45)`),n.addColorStop(1,`rgba(255,255,255,0)`),e.fillStyle=n,e.fillRect(0,0,t,t)}),dot:z(16,(e,t)=>{e.fillStyle=`#fff`,e.beginPath(),e.arc(t/2,t/2,t/2-1,0,Math.PI*2),e.fill()})},i}static resolutionFor(e){let t=Math.max(1,e.clientWidth*e.clientHeight),n=Math.min(window.devicePixelRatio||1,2);return Math.max(1,Math.min(n,Math.sqrt(a.P(`view.maxPixels`)/t)))}uploadTextures(e=!1){if(!r())return;let t=n(),a=e?t:t.splice(0,1);for(let e of a)try{this.app.renderer.texture.initSource(e.source)}catch(e){console.warn(`그림을 미리 올리지 못했습니다`,e)}e||i(t)}get width(){return this.app.screen.width}get height(){return this.app.screen.height}setView(t){e.use(t);let[n,r,i,a]=e.ground,o=new g(n,r,i,a,0,0);for(let e of[this.ground,this.decals,this.fxFlat])e.setFromMatrix(o);e.iso?this.world.enableRenderGroup():this.world.disableRenderGroup()}setMood(e){let t=this.app.renderer.type===h.WEBGL?F(a.mood(e),a.pct(`mood.strength`)):null;t?(this.mood??(this.mood=new R),this.mood.use(t),this.syncMoodArea(),this.scene.filterArea=this.moodArea,this.scene.filters=[this.mood]):this.scene.filters=null}syncMoodArea(){let e=this.world.scale.x||1;this.moodArea.x=-this.world.x/e,this.moodArea.y=-this.world.y/e,this.moodArea.width=this.width/e,this.moodArea.height=this.height/e}lightAt(e,t){this.mood?.light(e/this.width,t/this.height,this.width/this.height)}updateCamera(t,n,r,i,s,c=!1){let l=this.cam;l.zoom=this.height/a.P(e.iso?`view.isoHeight`:`view.height`);let u=this.width/l.zoom,d=this.height/l.zoom,f=r<=0?t:r<=u?r/2:o(t,u/2,r-u/2),p=i<=0?n:i<=d?i/2:o(n,d/2,i-d/2),m=c?1:Math.min(1,s*7);l.x+=(f-l.x)*m,l.y+=(p-l.y)*m;let h=0,g=0;l.shake>.1?(h=(Math.random()*2-1)*l.shake,g=(Math.random()*2-1)*l.shake,l.shake*=Math.max(0,1-s*10)):l.shake=0,this.world.scale.set(l.zoom),this.world.position.set(Math.round(this.width/2-l.x*l.zoom+h),Math.round(this.height/2-l.y*l.zoom+g)),this.mood&&this.syncMoodArea()}clear(){for(let e of[this.ground,this.decals,this.objects,this.fxFlat,this.fx])for(let t of e.removeChildren())t.destroy({children:!0})}};export{B as Stage};