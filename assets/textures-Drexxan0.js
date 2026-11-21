const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./browserAll-DX9euJ0V.js","./Geometry-ByQVI1Dc.js","./rolldown-runtime-XKyaHtl9.js","./Filter-BI-BAMb4.js","./init-5a8oPeM0.js","./canvasUtils-DKVKlWLe.js","./webworkerAll-CM6-LUZB.js"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-XKyaHtl9.js";import{t}from"./index-Bv9d3Y1v.js";import{A as n,C as r,D as i,F as a,G as o,K as s,N as c,O as l,P as u,R as d,S as f,U as p,W as m,_ as h,a as g,b as _,c as v,d as y,h as b,i as x,j as S,k as C,m as w,n as ee,o as te,p as ne,r as T,s as re,t as ie,u as ae,x as oe,y as se,z as E}from"./Geometry-ByQVI1Dc.js";import{_ as ce,a as le,f as ue,g as de,h as fe,i as D,l as pe,n as O,o as me,p as he,r as ge,s as _e}from"./Filter-BI-BAMb4.js";import{n as k,t as A}from"./Cache-Zz9lBgN5.js";import{n as ve,r as j,t as M}from"./canvasUtils-DKVKlWLe.js";import{a as ye,c as be,i as xe,l as Se,n as Ce,o as we,r as Te,s as Ee,t as N,u as De}from"./GraphicsContext-BAARAinz.js";import{a as Oe,c as ke,d as Ae,f as je,l as Me,m as Ne,n as Pe,o as P,p as Fe,r as Ie,t as Le,u as Re}from"./RenderTargetSystem-BxM1u-iP.js";import{a as ze,c as Be,d as Ve,f as He,h as Ue,i as We,l as Ge,m as Ke,o as qe,r as Je,s as Ye,t as F,u as Xe}from"./GCManagedHash-BWfMQfPL.js";import{t as Ze}from"./getTextureBatchBindGroup-Bt82LeET.js";import{a as Qe,c as $e,d as et,f as tt,i as nt,l as rt,m as it,n as at,o as ot,p as st,r as ct,s as lt,t as ut,u as dt}from"./getTexelRangeRects-BgWA0Goa.js";var ft=(e=>(e[e.Low=0]=`Low`,e[e.Normal=1]=`Normal`,e[e.High=2]=`High`,e))(ft||{});function I(e){if(typeof e!=`string`)throw TypeError(`Path must be a string. Received ${JSON.stringify(e)}`)}function pt(e){return e.split(`?`)[0].split(`#`)[0]}function mt(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function ht(e,t,n){return e.replace(new RegExp(mt(t),`g`),n)}function gt(e,t){let n=``,r=0,i=-1,a=0,o=-1;for(let s=0;s<=e.length;++s){if(s<e.length)o=e.charCodeAt(s);else if(o===47)break;else o=47;if(o===47){if(i!==s-1&&a!==1){if(i!==s-1&&a===2){if(n.length<2||r!==2||n.charCodeAt(n.length-1)!==46||n.charCodeAt(n.length-2)!==46){if(n.length>2){let e=n.lastIndexOf(`/`);if(e!==n.length-1){e===-1?(n=``,r=0):(n=n.slice(0,e),r=n.length-1-n.lastIndexOf(`/`)),i=s,a=0;continue}}else if(n.length===2||n.length===1){n=``,r=0,i=s,a=0;continue}}t&&(n.length>0?n+=`/..`:n=`..`,r=2)}else n.length>0?n+=`/${e.slice(i+1,s)}`:n=e.slice(i+1,s),r=s-i-1}i=s,a=0}else o===46&&a!==-1?++a:a=-1}return n}var L={toPosix(e){return ht(e,`\\`,`/`)},isUrl(e){return/^https?:/.test(this.toPosix(e))},isDataUrl(e){return/^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i.test(e)},isBlobUrl(e){return e.startsWith(`blob:`)},hasProtocol(e){return/^[^/:]+:/.test(this.toPosix(e))},getProtocol(e){I(e),e=this.toPosix(e);let t=/^file:\/\/\//.exec(e);if(t)return t[0];let n=/^[^/:]+:\/{0,2}/.exec(e);return n?n[0]:``},toAbsolute(e,t,n){if(I(e),this.isDataUrl(e)||this.isBlobUrl(e))return e;let r=pt(this.toPosix(t??b.get().getBaseUrl())),i=pt(this.toPosix(n??this.rootname(r)));return e=this.toPosix(e),e.startsWith(`/`)?L.join(i,e.slice(1)):this.isAbsolute(e)?e:this.join(r,e)},normalize(e){if(I(e),e.length===0)return`.`;if(this.isDataUrl(e)||this.isBlobUrl(e))return e;e=this.toPosix(e);let t=``,n=e.startsWith(`/`);this.hasProtocol(e)&&(t=this.rootname(e),e=e.slice(t.length));let r=e.endsWith(`/`);return e=gt(e,!1),e.length>0&&r&&(e+=`/`),n?`/${e}`:t+e},isAbsolute(e){return I(e),e=this.toPosix(e),this.hasProtocol(e)?!0:e.startsWith(`/`)},join(...e){if(e.length===0)return`.`;let t;for(let n=0;n<e.length;++n){let r=e[n];if(I(r),r.length>0){if(t===void 0)t=r;else{let i=e[n-1]??``;this.joinExtensions.includes(this.extname(i).toLowerCase())?t+=`/../${r}`:t+=`/${r}`}}}return t===void 0?`.`:this.normalize(t)},dirname(e){if(I(e),e.length===0)return`.`;e=this.toPosix(e);let t=e.charCodeAt(0),n=t===47,r=-1,i=!0,a=this.getProtocol(e),o=e;e=e.slice(a.length);for(let n=e.length-1;n>=1;--n)if(t=e.charCodeAt(n),t===47){if(!i){r=n;break}}else i=!1;return r===-1?n?`/`:this.isUrl(o)?a+e:a:n&&r===1?`//`:a+e.slice(0,r)},rootname(e){I(e),e=this.toPosix(e);let t=``;if(t=e.startsWith(`/`)?`/`:this.getProtocol(e),this.isUrl(e)){let n=e.indexOf(`/`,t.length);t=n===-1?e:e.slice(0,n),t.endsWith(`/`)||(t+=`/`)}return t},basename(e,t){I(e),t&&I(t),e=pt(this.toPosix(e));let n=0,r=-1,i=!0,a;if(t!==void 0&&t.length>0&&t.length<=e.length){if(t.length===e.length&&t===e)return``;let o=t.length-1,s=-1;for(a=e.length-1;a>=0;--a){let c=e.charCodeAt(a);if(c===47){if(!i){n=a+1;break}}else s===-1&&(i=!1,s=a+1),o>=0&&(c===t.charCodeAt(o)?--o===-1&&(r=a):(o=-1,r=s))}return n===r?r=s:r===-1&&(r=e.length),e.slice(n,r)}for(a=e.length-1;a>=0;--a)if(e.charCodeAt(a)===47){if(!i){n=a+1;break}}else r===-1&&(i=!1,r=a+1);return r===-1?``:e.slice(n,r)},extname(e){I(e),e=pt(this.toPosix(e));let t=-1,n=0,r=-1,i=!0,a=0;for(let o=e.length-1;o>=0;--o){let s=e.charCodeAt(o);if(s===47){if(!i){n=o+1;break}}else r===-1&&(i=!1,r=o+1),s===46?t===-1?t=o:a!==1&&(a=1):t!==-1&&(a=-1)}return t===-1||r===-1||a===0||a===1&&t===r-1&&t===n+1?``:e.slice(t,r)},parse(e){I(e);let t={root:``,dir:``,base:``,ext:``,name:``};if(e.length===0)return t;e=pt(this.toPosix(e));let n=e.charCodeAt(0),r=this.isAbsolute(e),i;t.root=this.rootname(e),i=r||this.hasProtocol(e)?1:0;let a=-1,o=0,s=-1,c=!0,l=e.length-1,u=0;for(;l>=i;--l)if(n=e.charCodeAt(l),n===47){if(!c){o=l+1;break}}else s===-1&&(c=!1,s=l+1),n===46?a===-1?a=l:u!==1&&(u=1):a!==-1&&(u=-1);return a===-1||s===-1||u===0||u===1&&a===s-1&&a===o+1?s!==-1&&(t.base=t.name=o===0&&r?e.slice(1,s):e.slice(o,s)):(o===0&&r?(t.name=e.slice(1,a),t.base=e.slice(1,s)):(t.name=e.slice(o,a),t.base=e.slice(o,s)),t.ext=e.slice(a,s)),t.dir=this.dirname(e),t},sep:`/`,delimiter:`:`,joinExtensions:[`.html`]};function _t(e,t,n,r,i){let a=t[n];for(let o=0;o<a.length;o++){let s=a[o];n<t.length-1?_t(e.replace(r[n],s),t,n+1,r,i):i.push(e.replace(r[n],s))}}function vt(e){let t=e.match(/\{(.*?)\}/g),n=[];if(t){let r=[];t.forEach(e=>{let t=e.substring(1,e.length-1).split(`,`);r.push(t)}),_t(e,r,0,t,n)}else n.push(e);return n}var yt=e=>!Array.isArray(e),bt=class{constructor(){this._defaultBundleIdentifierOptions={connector:`-`,createBundleAssetId:(e,t)=>`${e}${this._bundleIdConnector}${t}`,extractAssetIdFromBundle:(e,t)=>t.replace(`${e}${this._bundleIdConnector}`,``)},this._bundleIdConnector=this._defaultBundleIdentifierOptions.connector,this._createBundleAssetId=this._defaultBundleIdentifierOptions.createBundleAssetId,this._extractAssetIdFromBundle=this._defaultBundleIdentifierOptions.extractAssetIdFromBundle,this._assetMap={},this._preferredOrder=[],this._parsers=[],this._resolverHash={},this._bundles={}}setBundleIdentifier(e){if(this._bundleIdConnector=e.connector??this._bundleIdConnector,this._createBundleAssetId=e.createBundleAssetId??this._createBundleAssetId,this._extractAssetIdFromBundle=e.extractAssetIdFromBundle??this._extractAssetIdFromBundle,this._extractAssetIdFromBundle(`foo`,this._createBundleAssetId(`foo`,`bar`))!==`bar`)throw Error(`[Resolver] GenerateBundleAssetId are not working correctly`)}prefer(...e){e.forEach(e=>{this._preferredOrder.push(e),e.priority||(e.priority=Object.keys(e.params))}),this._resolverHash={}}set basePath(e){this._basePath=e}get basePath(){return this._basePath}set rootPath(e){this._rootPath=e}get rootPath(){return this._rootPath}get parsers(){return this._parsers}reset(){this.setBundleIdentifier(this._defaultBundleIdentifierOptions),this._assetMap={},this._preferredOrder=[],this._resolverHash={},this._rootPath=null,this._basePath=null,this._manifest=null,this._bundles={},this._defaultSearchParams=null}setDefaultSearchParams(e){if(typeof e==`string`)this._defaultSearchParams=e;else{let t=e;this._defaultSearchParams=Object.keys(t).map(e=>`${encodeURIComponent(e)}=${encodeURIComponent(t[e])}`).join(`&`)}}getAlias(e){let{alias:t,src:n}=e;return k(t||n,e=>typeof e==`string`?e:Array.isArray(e)?e.map(e=>e?.src??e):e?.src?e.src:e,!0)}removeAlias(e,t){this._assetMap[e]&&(t&&t!==this._resolverHash[e]||(delete this._resolverHash[e],delete this._assetMap[e]))}addManifest(e){this._manifest&&c(`[Resolver] Manifest already exists, this will be overwritten`),this._manifest=e,e.bundles.forEach(e=>{this.addBundle(e.name,e.assets)})}addBundle(e,t){let n=[],r=t;Array.isArray(t)||(r=Object.entries(t).map(([e,t])=>typeof t==`string`||Array.isArray(t)?{alias:e,src:t}:{alias:e,...t})),r.forEach(t=>{let r=t.src,i=t.alias,a;if(typeof i==`string`){let t=this._createBundleAssetId(e,i);n.push(t),a=[i,t]}else{let t=i.map(t=>this._createBundleAssetId(e,t));n.push(...t),a=[...i,...t]}this.add({...t,alias:a,src:r})}),this._bundles[e]=n}add(e){let t=[];Array.isArray(e)?t.push(...e):t.push(e);let n=e=>{this.hasKey(e)&&c(`[Resolver] already has key: ${e} overwriting`)};k(t).forEach(e=>{let{src:t}=e,{data:r,format:i,loadParser:a,parser:o}=e,s=k(t).map(e=>typeof e==`string`?vt(e):Array.isArray(e)?e:[e]),c=this.getAlias(e);Array.isArray(c)?c.forEach(n):n(c);let l=[],u=e=>({src:e,...this._parsers.find(t=>t.test(e))?.parse(e)});s.forEach(t=>{t.forEach(t=>{let n={};if(typeof t==`object`?(r=t.data??r,i=t.format??i,(t.loadParser||t.parser)&&(a=t.loadParser??a,o=t.parser??o),n={...u(t.src),...t}):n=u(t),!c)throw Error(`[Resolver] alias is undefined for this asset: ${n.src}`);n=this._buildResolvedAsset(n,{aliases:c,data:r,format:i,loadParser:a,parser:o,progressSize:e.progressSize}),l.push(n)})}),c.forEach(e=>{this._assetMap[e]=l})})}resolveBundle(e){let t=yt(e);e=k(e);let n={};return e.forEach(e=>{let t=this._bundles[e];if(t){let r=this.resolve(t),i={};for(let t in r){let n=r[t];i[this._extractAssetIdFromBundle(e,t)]=n}n[e]=i}}),t?n[e[0]]:n}resolveUrl(e){let t=this.resolve(e);if(typeof e!=`string`){let e={};for(let n in t)e[n]=t[n].src;return e}return t.src}resolve(e){let t=yt(e);e=k(e);let n={};return e.forEach(e=>{if(!this._resolverHash[e]){if(this._assetMap[e]){let t=this._assetMap[e],n=this._getPreferredOrder(t);n?.priority.forEach(e=>{n.params[e].forEach(n=>{let r=t.filter(t=>t[e]?t[e]===n:!1);r.length&&(t=r)})}),this._resolverHash[e]=t[0]}else this._resolverHash[e]=this._buildResolvedAsset({alias:[e],src:e},{})}n[e]=this._resolverHash[e]}),t?n[e[0]]:n}hasKey(e){return!!this._assetMap[e]}hasBundle(e){return!!this._bundles[e]}_getPreferredOrder(e){for(let t=0;t<e.length;t++){let n=e[t],r=this._preferredOrder.find(e=>e.params.format.includes(n.format));if(r)return r}return this._preferredOrder[0]}_appendDefaultSearchParams(e){return this._defaultSearchParams?`${e}${/\?/.test(e)?`&`:`?`}${this._defaultSearchParams}`:e}_buildResolvedAsset(e,t){let{aliases:n,data:r,loadParser:i,parser:a,format:o,progressSize:s}=t;return(this._basePath||this._rootPath)&&(e.src=L.toAbsolute(e.src,this._basePath,this._rootPath)),e.alias=n??e.alias??[e.src],e.src=this._appendDefaultSearchParams(e.src),e.data={...r||{},...e.data},e.loadParser=i??e.loadParser,e.parser=a??e.parser,e.format=o??e.format??xt(e.src),s!==void 0&&(e.progressSize=s),e}};bt.RETINA_PREFIX=/@([0-9\.]+)x/;function xt(e){return e.split(`.`).pop().split(`?`).shift().split(`#`).shift()}var St=(e,t)=>{let n=t.split(`?`)[1];return n&&(e+=`?${n}`),e},Ct=class e{constructor(e,t){this.linkedSheets=[];let n=e;e?.source instanceof f&&(n={texture:e,data:t});let{texture:r,data:i,cachePrefix:a=``}=n;this.cachePrefix=a,this._texture=r instanceof h?r:null,this.textureSource=r.source,this.textures={},this.animations={},this.data=i;let o=parseFloat(i.meta.scale);o?(this.resolution=o,r.source.resolution=this.resolution):this.resolution=r.source._resolution,this._frames=this.data.frames,this._frameKeys=Object.keys(this._frames),this._batchIndex=0,this._callback=null}parse(){return new Promise(t=>{this._callback=t,this._batchIndex=0,this._frameKeys.length<=e.BATCH_SIZE?(this._processFrames(0),this._processAnimations(),this._parseComplete()):this._nextBatch()})}parseSync(){return this._processFrames(0,!0),this._processAnimations(),this.textures}_processFrames(t,r=!1){let i=t,a=r?1/0:e.BATCH_SIZE;for(;i-t<a&&i<this._frameKeys.length;){let e=this._frameKeys[i],t=this._frames[e],r=t.frame;if(r){let i=null,a=null,o=t.trimmed!==!1&&t.sourceSize?t.sourceSize:t.frame,s=new n(0,0,Math.floor(o.w)/this.resolution,Math.floor(o.h)/this.resolution);i=t.rotated?new n(Math.floor(r.x)/this.resolution,Math.floor(r.y)/this.resolution,Math.floor(r.h)/this.resolution,Math.floor(r.w)/this.resolution):new n(Math.floor(r.x)/this.resolution,Math.floor(r.y)/this.resolution,Math.floor(r.w)/this.resolution,Math.floor(r.h)/this.resolution),t.trimmed!==!1&&t.spriteSourceSize&&(a=new n(Math.floor(t.spriteSourceSize.x)/this.resolution,Math.floor(t.spriteSourceSize.y)/this.resolution,Math.floor(r.w)/this.resolution,Math.floor(r.h)/this.resolution)),this.textures[e]=new h({source:this.textureSource,frame:i,orig:s,trim:a,rotate:t.rotated?2:0,defaultAnchor:t.anchor,defaultBorders:t.borders,label:e.toString()})}i++}}_processAnimations(){let e=this.data.animations||{};for(let t in e){this.animations[t]=[];for(let n=0;n<e[t].length;n++){let r=e[t][n];this.animations[t].push(this.textures[r])}}}_parseComplete(){let e=this._callback;this._callback=null,this._batchIndex=0,e.call(this,this.textures)}_nextBatch(){this._processFrames(this._batchIndex*e.BATCH_SIZE),this._batchIndex++,setTimeout(()=>{this._batchIndex*e.BATCH_SIZE<this._frameKeys.length?this._nextBatch():(this._processAnimations(),this._parseComplete())},0)}destroy(e=!1){for(let e in this.textures)this.textures[e].destroy();this._frames=null,this._frameKeys=null,this.data=null,this.textures=null,e&&(this._texture?.destroy(),this.textureSource.destroy()),this._texture=null,this.textureSource=null,this.linkedSheets=[]}};Ct.BATCH_SIZE=1e3;var wt=Ct,Tt=[`jpg`,`png`,`jpeg`,`avif`,`webp`,`basis`,`etc2`,`bc7`,`bc6h`,`bc5`,`bc4`,`bc3`,`bc2`,`bc1`,`eac`,`astc`];function Et(e,t,n){let r={};if(e.forEach(e=>{r[e]=t}),Object.keys(t.textures).forEach(e=>{r[`${t.cachePrefix}${e}`]=t.textures[e]}),!n){let n=L.dirname(e[0]);t.linkedSheets.forEach((e,i)=>{let a=Et([`${n}/${t.data.meta.related_multi_packs[i]}`],e,!0);Object.assign(r,a)})}return r}var Dt={extension:o.Asset,cache:{test:e=>e instanceof wt,getCacheableAssets:(e,t)=>Et(e,t,!1)},resolver:{extension:{type:o.ResolveParser,name:`resolveSpritesheet`},test:e=>{let t=e.split(`?`)[0].split(`.`),n=t.pop(),r=t.pop();return n===`json`&&Tt.includes(r)},parse:e=>{let t=e.split(`.`);return{resolution:parseFloat(bt.RETINA_PREFIX.exec(e)?.[1]??`1`),format:t[t.length-2],src:e}}},loader:{name:`spritesheetLoader`,id:`spritesheet`,extension:{type:o.LoadParser,priority:ft.Normal,name:`spritesheetLoader`},async testParse(e,t){return L.extname(t.src).toLowerCase()===`.json`&&!!e.frames},async parse(e,t,n){let{texture:r,imageFilename:i,textureOptions:a,cachePrefix:o}=t?.data??{},s=L.dirname(t.src);s&&s.lastIndexOf(`/`)!==s.length-1&&(s+=`/`);let c;if(r instanceof h)c=r;else{let r=St(s+(i??e.meta.image),t.src);c=(await n.load([{src:r,data:a}]))[r]}let l=new wt({texture:c.source,data:e,cachePrefix:o});await l.parse();let u=e?.meta?.related_multi_packs;if(Array.isArray(u)){let e=[];for(let r of u){if(typeof r!=`string`)continue;let i=s+r;t.data?.ignoreMultiPack||(i=St(i,t.src),e.push(n.load({src:i,data:{textureOptions:a,ignoreMultiPack:!0}})))}let r=await Promise.all(e);l.linkedSheets=r,r.forEach(e=>{e.linkedSheets=[l].concat(l.linkedSheets.filter(t=>t!==e))})}return l},async unload(e,t,n){await n.unload(e.textureSource._sourceOrigin),e.destroy(!1)}}};s.add(Dt);var Ot=new C;function kt(e,t,n){let r=Ot;e.measurable=!0,fe(e,n,r),t.addBoundsMask(r),e.measurable=!1}function At(e,t,n){let r=de.get();e.measurable=!0;let i=ce.get().identity(),a=jt(e,n,i);ue(e,r,a),e.measurable=!1,t.addBoundsMask(r),ce.return(i),de.return(r)}function jt(e,t,n){return e?(e!==t&&(jt(e.parent,t,n),e.updateLocalTransform(),n.append(e.localTransform)),n):(c(`Mask bounds, renderable is not inside the root container`),n)}var Mt=class{constructor(e){this.priority=0,this.inverse=!1,this.channel=`red`,this.pipe=`alphaMask`,e?.mask&&this.init(e.mask)}init(e){this.mask=e,this.renderMaskToTexture=!(e instanceof le),this.mask.renderable=this.renderMaskToTexture,this.mask.includeInBuild=!this.renderMaskToTexture,this.mask.measurable=!1}reset(){this.mask!==null&&(this.mask.measurable=!0,this.mask=null)}addBounds(e,t){this.inverse||kt(this.mask,e,t)}addLocalBounds(e,t){At(this.mask,e,t)}containsPoint(e,t){let n=this.mask;return t(n,e)}destroy(){this.reset()}static test(e){return e instanceof le}};Mt.extension=o.MaskEffect;var Nt=class{constructor(e){this.priority=0,this.pipe=`colorMask`,e?.mask&&this.init(e.mask)}init(e){this.mask=e}destroy(){}static test(e){return typeof e==`number`}};Nt.extension=o.MaskEffect;var Pt=class{constructor(e){this.priority=0,this.pipe=`stencilMask`,e?.mask&&this.init(e.mask)}init(e){this.mask=e,this.mask.includeInBuild=!1,this.mask.measurable=!1}reset(){this.mask!==null&&(this.mask.measurable=!0,this.mask.includeInBuild=!0,this.mask=null)}addBounds(e,t){kt(this.mask,e,t)}addLocalBounds(e,t){At(this.mask,e,t)}containsPoint(e,t){let n=this.mask;return t(n,e)}destroy(){this.reset()}static test(e){return e instanceof pe}};Pt.extension=o.MaskEffect;var Ft;async function It(){return Ft??(Ft=(async()=>{let e=b.get().createCanvas(1,1).getContext(`webgl`);if(!e)return`premultiply-alpha-on-upload`;let t=await new Promise(e=>{let t=document.createElement(`video`);t.onloadeddata=()=>e(t),t.onerror=()=>e(null),t.autoplay=!1,t.crossOrigin=`anonymous`,t.preload=`auto`,t.src=`data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmoCrXsYMPQkBNgIRMYXZmV0GETGF2ZkSJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgAAAAAAAAAAZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAJiWgDglLCBArqBApqBAlPAgQFVsIRVuYEBElTDZ9Vzc9JjwItjxYgAAAAAAAAAAWfInEWjh0VOQ09ERVJEh49MYXZjIGxpYnZweC12cDlnyKJFo4hEVVJBVElPTkSHlDAwOjAwOjAwLjA0MDAwMDAwMAAAH0O2dcfngQCgwqGggQAAAIJJg0IAABAAFgA4JBwYSgAAICAAEb///4r+AAB1oZ2mm+6BAaWWgkmDQgAAEAAWADgkHBhKAAAgIABIQBxTu2uRu4+zgQC3iveBAfGCAXHwgQM=`,t.load()});if(!t)return`premultiply-alpha-on-upload`;let n=e.createTexture();e.bindTexture(e.TEXTURE_2D,n);let r=e.createFramebuffer();e.bindFramebuffer(e.FRAMEBUFFER,r),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,n,0),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.NONE),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,t);let i=new Uint8Array(4);return e.readPixels(0,0,1,1,e.RGBA,e.UNSIGNED_BYTE,i),e.deleteFramebuffer(r),e.deleteTexture(n),e.getExtension(`WEBGL_lose_context`)?.loseContext(),i[0]<=i[3]?`premultiplied-alpha`:`premultiply-alpha-on-upload`})()),Ft}var Lt=class e extends f{constructor(t){super(t),this.isReady=!1,this.uploadMethodId=`video`,t={...e.defaultOptions,...t},this._autoUpdate=!0,this._isConnectedToTicker=!1,this._updateFPS=t.updateFPS||0,this._msToNextUpdate=0,this.autoPlay=t.autoPlay!==!1,this.alphaMode=t.alphaMode??`premultiply-alpha-on-upload`,this._videoFrameRequestCallback=this._videoFrameRequestCallback.bind(this),this._videoFrameRequestCallbackHandle=null,this._load=null,this._resolve=null,this._reject=null,this._onCanPlay=this._onCanPlay.bind(this),this._onCanPlayThrough=this._onCanPlayThrough.bind(this),this._onError=this._onError.bind(this),this._onPlayStart=this._onPlayStart.bind(this),this._onPlayStop=this._onPlayStop.bind(this),this._onSeeked=this._onSeeked.bind(this),this._onLoadedMetadata=this._onLoadedMetadata.bind(this),t.autoLoad!==!1&&this.load()}updateFrame(){if(!this.destroyed){if(this._updateFPS){let e=_e.shared.elapsedMS*this.resource.playbackRate;this._msToNextUpdate=Math.floor(this._msToNextUpdate-e)}(!this._updateFPS||this._msToNextUpdate<=0)&&(this._msToNextUpdate=this._updateFPS?Math.floor(1e3/this._updateFPS):0),this.isValid&&this.update()}}_videoFrameRequestCallback(){this.updateFrame(),this._videoFrameRequestCallbackHandle=this.destroyed?null:this.resource.requestVideoFrameCallback(this._videoFrameRequestCallback)}get isValid(){return!!this.resource.videoWidth&&!!this.resource.videoHeight}async load(){if(this._load)return this._load;let e=this.resource,t=this.options;return(e.readyState===e.HAVE_ENOUGH_DATA||e.readyState===e.HAVE_FUTURE_DATA)&&e.width&&e.height&&(e.complete=!0),e.addEventListener(`play`,this._onPlayStart),e.addEventListener(`pause`,this._onPlayStop),e.addEventListener(`seeked`,this._onSeeked),this._isSourceReady()?this._mediaReady():(t.preload||e.addEventListener(`canplay`,this._onCanPlay),e.addEventListener(`canplaythrough`,this._onCanPlayThrough),e.addEventListener(`error`,this._onError,!0)),this.isValid||e.addEventListener(`loadedmetadata`,this._onLoadedMetadata),this.alphaMode=await It(),this._load=new Promise((n,r)=>{this.isValid?n(this):(this._resolve=n,this._reject=r,t.preloadTimeoutMs!==void 0&&(this._preloadTimeout=setTimeout(()=>{this._onError(new ErrorEvent(`Preload exceeded timeout of ${t.preloadTimeoutMs}ms`))})),e.load())}),this._load}_onError(e){this.resource.removeEventListener(`error`,this._onError,!0),this.emit(`error`,e),this._reject&&(this._reject(e),this._reject=null,this._resolve=null)}_isSourcePlaying(){let e=this.resource;return!e.paused&&!e.ended}_isSourceReady(){return this.resource.readyState>2}_onPlayStart(){this._configureAutoUpdate()}_onPlayStop(){this._configureAutoUpdate()}_onSeeked(){this._autoUpdate&&!this._isSourcePlaying()&&(this._msToNextUpdate=0,this.updateFrame(),this._msToNextUpdate=0)}_onLoadedMetadata(){this.isValid&&this._mediaReady()}_onCanPlay(){this.resource.removeEventListener(`canplay`,this._onCanPlay),this._mediaReady()}_onCanPlayThrough(){this.resource.removeEventListener(`canplaythrough`,this._onCanPlayThrough),this._preloadTimeout&&(clearTimeout(this._preloadTimeout),this._preloadTimeout=void 0),this._mediaReady()}_mediaReady(){let e=this.resource;this.isValid&&(this.isReady=!0,this.resize(e.videoWidth,e.videoHeight)),this._msToNextUpdate=0,this.updateFrame(),this._msToNextUpdate=0,this._resolve&&this.isValid&&(this._resolve(this),this._resolve=null,this._reject=null),this._isSourcePlaying()?this._onPlayStart():this.autoPlay&&this.resource.play()}destroy(){this._configureAutoUpdate();let e=this.resource;e&&(e.removeEventListener(`play`,this._onPlayStart),e.removeEventListener(`pause`,this._onPlayStop),e.removeEventListener(`seeked`,this._onSeeked),e.removeEventListener(`canplay`,this._onCanPlay),e.removeEventListener(`canplaythrough`,this._onCanPlayThrough),e.removeEventListener(`loadedmetadata`,this._onLoadedMetadata),e.removeEventListener(`error`,this._onError,!0),e.pause(),e.src=``,e.load()),super.destroy()}get autoUpdate(){return this._autoUpdate}set autoUpdate(e){e!==this._autoUpdate&&(this._autoUpdate=e,this._configureAutoUpdate())}get updateFPS(){return this._updateFPS}set updateFPS(e){e!==this._updateFPS&&(this._updateFPS=e,this._configureAutoUpdate())}_configureAutoUpdate(){this._autoUpdate&&this._isSourcePlaying()?!this._updateFPS&&this.resource.requestVideoFrameCallback?(this._isConnectedToTicker&&(_e.shared.remove(this.updateFrame,this),this._isConnectedToTicker=!1,this._msToNextUpdate=0),this._videoFrameRequestCallbackHandle===null&&(this._videoFrameRequestCallbackHandle=this.resource.requestVideoFrameCallback(this._videoFrameRequestCallback))):(this._videoFrameRequestCallbackHandle!==null&&(this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle),this._videoFrameRequestCallbackHandle=null),this._isConnectedToTicker||(_e.shared.add(this.updateFrame,this),this._isConnectedToTicker=!0,this._msToNextUpdate=0)):(this._videoFrameRequestCallbackHandle!==null&&(this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle),this._videoFrameRequestCallbackHandle=null),this._isConnectedToTicker&&(_e.shared.remove(this.updateFrame,this),this._isConnectedToTicker=!1,this._msToNextUpdate=0))}static test(e){return globalThis.HTMLVideoElement&&e instanceof HTMLVideoElement}};Lt.extension=o.TextureSource,Lt.defaultOptions={...f.defaultOptions,autoLoad:!0,autoPlay:!0,updateFPS:0,crossorigin:!0,loop:!1,muted:!0,playsinline:!0,preload:!1},Lt.MIME_TYPES={ogv:`video/ogg`,mov:`video/quicktime`,m4v:`video/mp4`};var Rt=Lt,zt=[];s.handleByList(o.TextureSource,zt);function Bt(e={}){let t=e&&e.resource,n=t?e.resource:e,r=t?e:{resource:e};for(let e=0;e<zt.length;e++){let t=zt[e];if(t.test(n))return new t(r)}throw Error(`Could not find a source type for resource: ${r.resource}`)}function Vt(e={},t=!1){let n=e&&e.resource,r=n?e.resource:e,i=n?e:{resource:e};if(!t&&A.has(r))return A.get(r);let a=new h({source:Bt(i)});return a.on(`destroy`,()=>{A.has(r)&&A.remove(r)}),t||A.set(r,a),a}function Ht(e,t=!1){return typeof e==`string`?A.get(e):e instanceof f?new h({source:e}):Vt(e,t)}h.from=Ht,f.from=Bt,s.add(Mt,Nt,Pt,Rt,j,D,se);var Ut=`#808080`,Wt=new E,Gt=new E,Kt=new E,qt=new E,Jt=new E;function Yt(e,t,n){e.beginPath();for(let r=0;r<n.length;r+=3){let i=n[r]*2,a=n[r+1]*2,o=n[r+2]*2;e.moveTo(t[i],t[i+1]),e.lineTo(t[a],t[a+1]),e.lineTo(t[o],t[o+1]),e.closePath()}e.fill()}function Xt(e){return`#${(e&16777215).toString(16).padStart(6,`0`)}`}function Zt(e,t,n,r,i,a){a=Math.max(0,Math.min(a,Math.min(r,i)/2)),e.moveTo(t+a,n),e.lineTo(t+r-a,n),e.quadraticCurveTo(t+r,n,t+r,n+a),e.lineTo(t+r,n+i-a),e.quadraticCurveTo(t+r,n+i,t+r-a,n+i),e.lineTo(t+a,n+i),e.quadraticCurveTo(t,n+i,t,n+i-a),e.lineTo(t,n+a),e.quadraticCurveTo(t,n,t+a,n)}function Qt(e,t){switch(t.type){case`rectangle`:{let n=t;e.rect(n.x,n.y,n.width,n.height);break}case`roundedRectangle`:{let n=t;Zt(e,n.x,n.y,n.width,n.height,n.radius);break}case`circle`:{let n=t;e.arc(n.x,n.y,n.radius,0,Math.PI*2);break}case`ellipse`:{let n=t;e.ellipse?e.ellipse(n.x,n.y,n.halfWidth,n.halfHeight,0,0,Math.PI*2):(e.save(),e.translate(n.x,n.y),e.scale(n.halfWidth,n.halfHeight),e.arc(0,0,1,0,Math.PI*2),e.restore());break}case`triangle`:{let n=t;e.moveTo(n.x,n.y),e.lineTo(n.x2,n.y2),e.lineTo(n.x3,n.y3),e.closePath();break}default:{let n=t,r=n.points;if(!r?.length)break;e.moveTo(r[0],r[1]);for(let t=2;t<r.length;t+=2)e.lineTo(r[t],r[t+1]);n.closePath&&e.closePath();break}}}function $t(e,t){if(!t?.length)return!1;for(let n=0;n<t.length;n++){let r=t[n];if(!r?.shape)continue;let i=r.transform,a=i&&!i.isIdentity();a&&(e.save(),e.transform(i.a,i.b,i.c,i.d,i.tx,i.ty)),Qt(e,r.shape),a&&e.restore()}return!0}function en(e,t,n,r){let i=e.fill;if(i instanceof Se){i.buildGradient();let a=i.texture;if(a){let o=M.getTintedPattern(a,t),s=n?qt.copyFrom(n).scale(a.source.pixelWidth,a.source.pixelHeight):qt.copyFrom(i.transform);return r&&!e.textureSpace&&s.append(r),M.applyPatternTransform(o,s),o}}if(i instanceof be){let e=M.getTintedPattern(i.texture,t);return M.applyPatternTransform(e,i.transform,!1),e}let a=e.texture;if(a&&a!==h.WHITE){if(!a.source.resource)return Ut;let r=M.getTintedPattern(a,t),i=e.matrix;if(n){let{resolution:e}=a.source;if(i=qt.copyFrom(n),a.rotate){let{uvs:t,orig:n}=a;i.prepend(Jt.set(t.x1-t.x0,t.y1-t.y0,t.x3-t.x0,t.y3-t.y0,t.x0,t.y0).invert()).scale(n.width*e,n.height*e)}else i.scale(a.source.pixelWidth,a.source.pixelHeight).translate(-a.frame.x*e,-a.frame.y*e)}return M.applyPatternTransform(r,i),r}return Xt(t)}var tn=class{constructor(){this.shader=null}contextChange(e){}execute(e,t){let n=e.renderer,r=n.canvasContext,i=r.activeContext,a=t.groupTransform,o=n.globalUniforms.globalUniformData?.worldColor??4294967295,s=t.groupColorAlpha,c=(o>>>24&255)/255,u=(s>>>24&255)/255,d=n.filter?.alphaMultiplier??1,f=c*u*d;if(f<=0)return;let p=o&16777215,m=s&16777215,g=he(l(m,p)),_=n._roundPixels|t._roundPixels;i.save(),r.setContextTransform(a,_===1),r.setBlendMode(t.groupBlendMode);let v=t.context.instructions;for(let e=0;e<v.length;e++){let t=v[e];if(t.action===`texture`){let e=t.data,n=e.image,o=n?M.getCanvasSource(n):null;if(!o)continue;let s=e.alpha*f;if(s<=0)continue;let c=l(e.style,g);i.globalAlpha=s;let u=o;c!==16777215&&(u=M.getTintedCanvas({texture:n},c));let d=n.frame,p=n.source._resolution??n.source.resolution??1,m=d.x*p,h=d.y*p,v=d.width*p,y=d.height*p;u!==o&&(m=0,h=0);let b=e.transform,x=b&&!b.isIdentity(),S=n.rotate;x||S?(Wt.copyFrom(a),x&&Wt.append(b),S&&oe.matrixAppendRotationInv(Wt,S,e.dx,e.dy,e.dw,e.dh),r.setContextTransform(Wt,_===1)):r.setContextTransform(a,_===1),i.drawImage(u,m,h,u===o?v:u.width,u===o?y:u.height,S?0:e.dx,S?0:e.dy,e.dw,e.dh),(x||S)&&r.setContextTransform(a,_===1);continue}let n=t.data,o=n?.path?.shapePath;if(!o?.shapePrimitives?.length)continue;let s=n.style,c=l(s.color,g),u=s.alpha*f;if(u<=0)continue;let d=t.action===`stroke`;if(i.globalAlpha=u,d){let e=s;i.lineWidth=e.width,i.lineCap=e.cap,i.lineJoin=e.join,i.miterLimit=e.miterLimit}let p=o.shapePrimitives;if(!d&&n.hole?.shapePath?.shapePrimitives?.length){let e=p[p.length-1];e.holes=n.hole.shapePath.shapePrimitives}for(let e=0;e<p.length;e++){let t=p[e];if(!t?.shape)continue;let n=t.transform,r=n&&!n.isIdentity(),o=s.texture&&s.texture!==h.WHITE,l=s.textureSpace===`global`?n:null,u=en(s,c,o?we(Gt,s,t.shape,l):null,r?Kt.copyFrom(a).append(n):a);if(r&&(i.save(),i.transform(n.a,n.b,n.c,n.d,n.tx,n.ty)),d){let e=s;if(e.alignment!==.5&&!e.pixelLine){let n=[],r=[],a=[];if(ye[t.shape.type]?.build(t.shape,n)){let o=t.shape.closePath??!0;De(n,e,!1,o,r,a),i.fillStyle=u,Yt(i,r,a)}else i.strokeStyle=u,i.beginPath(),Qt(i,t.shape),i.stroke()}else i.strokeStyle=u,i.beginPath(),Qt(i,t.shape),i.stroke()}else i.fillStyle=u,i.beginPath(),Qt(i,t.shape),$t(i,t.holes)?i.fill(`evenodd`):i.fill();r&&i.restore()}}i.restore()}destroy(){this.shader=null}};tn.extension={type:[o.CanvasPipesAdaptor],name:`graphics`};var nn=class e{static _getPatternRepeat(e,t){let n=e&&e!==`clamp-to-edge`,r=t&&t!==`clamp-to-edge`;return n&&r?`repeat`:n?`repeat-x`:r?`repeat-y`:`no-repeat`}start(e,t,n){}execute(t,n){let r=n.elements;if(!r||!r.length)return;let i=t.renderer,a=i.canvasContext,o=a.activeContext;for(let t=0;t<r.length;t++){let s=r[t];if(!s.packAsQuad)continue;let c=s,u=c.texture,d=u?M.getCanvasSource(u):null;if(!d)continue;let f=u.source.style,p=a.smoothProperty,m=f.scaleMode!==`nearest`;o[p]!==m&&(o[p]=m),a.setBlendMode(n.blendMode);let h=i.globalUniforms.globalUniformData?.worldColor??4294967295,g=c.color,_=(h>>>24&255)/255,v=(g>>>24&255)/255,y=i.filter?.alphaMultiplier??1,b=_*v*y;if(b<=0)continue;o.globalAlpha=b;let x=h&16777215,S=g&16777215,C=he(l(S,x)),w=u.frame,ee=f.addressModeU??f.addressMode,te=f.addressModeV??f.addressMode,ne=e._getPatternRepeat(ee,te),T=u.source._resolution??u.source.resolution??1,re=c.renderable?.renderGroup?.isCachedAsTexture,ie=w.x*T,ae=w.y*T,se=w.width*T,E=w.height*T,ce=c.bounds,le=i.renderTarget.renderTarget.isRoot,ue=ce.minX,de=ce.minY,fe=ce.maxX-ce.minX,D=ce.maxY-ce.minY,pe=u.rotate,O=u.uvs,me=Math.min(O.x0,O.x1,O.x2,O.x3,O.y0,O.y1,O.y2,O.y3),ge=Math.max(O.x0,O.x1,O.x2,O.x3,O.y0,O.y1,O.y2,O.y3),_e=ne!==`no-repeat`&&(me<0||ge>1),k=pe&&(!!_e||C===16777215&&!pe);k?(e._tempPatternMatrix.copyFrom(c.transform),oe.matrixAppendRotationInv(e._tempPatternMatrix,pe,ue,de,fe,D),a.setContextTransform(e._tempPatternMatrix,c.roundPixels===1,void 0,re&&le)):a.setContextTransform(c.transform,c.roundPixels===1,void 0,re&&le);let A=fe,ve=D,j=k?0:ue,ye=k?0:de;if(!k&&c.roundPixels===1&&(j|=0,ye|=0),_e){let t=d,n=C!==16777215&&!pe,r=w.width<=u.source.width&&w.height<=u.source.height;n&&r&&(t=M.getTintedCanvas({texture:u},C));let i=o.createPattern(t,ne);if(!i)continue;let a=A,s=ve;if(a===0||s===0)continue;let c=1/a,l=1/s,f=(O.x1-O.x0)*c,p=(O.y1-O.y0)*c,m=(O.x3-O.x0)*l,h=(O.y3-O.y0)*l,g=O.x0-f*j-m*ye,_=O.y0-p*j-h*ye,v=u.source.pixelWidth,y=u.source.pixelHeight;e._tempPatternMatrix.set(f*v,p*y,m*v,h*y,g*v,_*y),M.applyPatternTransform(i,e._tempPatternMatrix),o.fillStyle=i,o.fillRect(j,ye,A,ve)}else{let e=C!==16777215||pe?M.getTintedCanvas({texture:u},C):d,t=e!==d;o.drawImage(e,t?0:ie,t?0:ae,t?e.width:se,t?e.height:E,j,ye,A,ve)}}}};nn._tempPatternMatrix=new E,nn.extension={type:[o.CanvasPipesAdaptor],name:`batch`};var rn=nn,an=class{constructor(e){this._colorStack=[],this._colorStackIndex=0,this._currentColor=0,this._renderer=e}buildStart(){this._colorStack[0]=15,this._colorStackIndex=1,this._currentColor=15}push(e,t,n){this._renderer.renderPipes.batch.break(n);let r=this._colorStack;r[this._colorStackIndex]=r[this._colorStackIndex-1]&e.mask;let i=this._colorStack[this._colorStackIndex];i!==this._currentColor&&(this._currentColor=i,n.add({renderPipeId:`colorMask`,colorMask:i,canBundle:!1})),this._colorStackIndex++}pop(e,t,n){this._renderer.renderPipes.batch.break(n);let r=this._colorStack;this._colorStackIndex--;let i=r[this._colorStackIndex-1];i!==this._currentColor&&(this._currentColor=i,n.add({renderPipeId:`colorMask`,colorMask:i,canBundle:!1}))}execute(e){}destroy(){this._renderer=null,this._colorStack=null}};an.extension={type:[o.CanvasPipes],name:`colorMask`};var on=class{constructor(){this.isBatchable=!1}reset(){this.isBatchable=!1,this.context=null,this.graphicsData&&(this.graphicsData.destroy(),this.graphicsData=null)}destroy(){this.reset()}},sn=class{constructor(){this.instructions=new i}init(){this.instructions.reset()}destroy(){this.instructions.destroy(),this.instructions=null}},cn=class e{constructor(e){this._renderer=e,this._managedContexts=new F({renderer:e,type:`resource`,name:`graphicsContext`})}init(t){e.defaultOptions.bezierSmoothness=t?.bezierSmoothness??e.defaultOptions.bezierSmoothness}getContextRenderData(e){return this.getGpuContext(e).graphicsData||this._initContextRenderData(e)}updateGpuContext(e){let t=e._gpuData,n=!!t[this._renderer.uid],r=t[this._renderer.uid]||this._initContext(e);return(e.dirty||!n)&&(n&&r.reset(),r.isBatchable=!1,e.dirty=!1),r}getGpuContext(e){return e._gpuData[this._renderer.uid]||this._initContext(e)}_initContextRenderData(e){let t=new sn,n=this.getGpuContext(e);return n.graphicsData=t,t.init(),t}_initContext(e){let t=new on;return t.context=e,e._gpuData[this._renderer.uid]=t,this._managedContexts.add(e),t}destroy(){this._managedContexts.destroy(),this._renderer=null}};cn.extension={type:[o.CanvasSystem],name:`graphicsContext`},cn.defaultOptions={bezierSmoothness:.5};var ln=cn,un=class{constructor(e,t){this.state=ge.for2d(),this.renderer=e,this._adaptor=t,this.renderer.runners.contextChange.add(this),this._managedGraphics=new F({renderer:e,type:`renderable`,priority:-1,name:`graphics`})}contextChange(){this._adaptor.contextChange(this.renderer)}validateRenderable(e){return!1}addRenderable(e,t){this._managedGraphics.add(e),this.renderer.renderPipes.batch.break(t),t.add(e)}updateRenderable(e){}execute(e){e.isRenderable&&this._adaptor.execute(this,e)}destroy(){this._managedGraphics.destroy(),this.renderer=null,this._adaptor.destroy(),this._adaptor=null}};un.extension={type:[o.CanvasPipes],name:`graphics`};var dn=class{constructor(){this.batches=[],this.batched=!1}destroy(){this.batches.forEach(e=>{S.return(e)}),this.batches.length=0}},fn=class{constructor(e,t,n){this.state=ge.for2d(),this.renderer=e,this._adaptor=t,this.renderer.runners.contextChange.add(this),this._managedGraphics=new F({renderer:e,type:`renderable`,priority:-1,name:n})}contextChange(){this._adaptor.contextChange(this.renderer)}validateRenderable(e){let t=e.context,n=!!e._gpuData,r=this._contextSystem.updateGpuContext(t);return!!(r.isBatchable||n!==r.isBatchable)}addRenderable(e,t){let n=this._contextSystem.updateGpuContext(e.context);(e.didViewUpdate||!e._gpuData[this.renderer.uid])&&this._rebuild(e),n.isBatchable?this._addToBatcher(e,t):(this.renderer.renderPipes.batch.break(t),t.add(e))}updateRenderable(e){let t=this._getGpuDataForRenderable(e).batches;for(let e=0;e<t.length;e++){let n=t[e];n._batcher.updateElement(n)}}execute(e){if(!e.isRenderable)return;let t=this.renderer,n=e.context;if(!this._contextSystem.getGpuContext(n).batches.length)return;let r=n.customShader||this._adaptor.shader;this.state.blendMode=e.groupBlendMode;let i=r.resources.localUniforms.uniforms;i.uTransformMatrix=e.groupTransform,i.uRound=t._roundPixels|e._roundPixels,Me(e.groupColorAlpha,i.uColor,0),this._adaptor.execute(this,e)}_rebuild(e){let t=this._getGpuDataForRenderable(e),n=this._contextSystem.updateGpuContext(e.context);t.destroy(),n.isBatchable&&this._updateBatchesForRenderable(e,t)}_addToBatcher(e,t){let n=this.renderer.renderPipes.batch,r=this._getGpuDataForRenderable(e).batches;for(let e=0;e<r.length;e++){let i=r[e];n.addToBatch(i,t)}}_getGpuDataForRenderable(e){return e._gpuData[this.renderer.uid]||this._initGpuDataForRenderable(e)}_initGpuDataForRenderable(e){let t=new dn;return e._gpuData[this.renderer.uid]=t,this._managedGraphics.add(e),t}_updateBatchesForRenderable(e,t){let n=this._contextSystem.getGpuContext(e.context),r=this.renderer._roundPixels|e._roundPixels;t.batches=n.batches.map(t=>{let n=S.get(this._batchableClass);return t.copyTo(n),n.renderable=e,n.roundPixels=r,n})}destroy(){this._managedGraphics.destroy(),this.renderer=null,this._adaptor.destroy(),this._adaptor=null,this.state=null}},pn=class extends fn{constructor(e,t){super(e,t,`graphics`),this._batchableClass=Ee}get _contextSystem(){return this.renderer.graphicsContext}};pn.extension={type:[o.WebGLPipes,o.WebGPUPipes],name:`graphics`},s.add(un),s.add(pn),s.add(ln),s.add(xe);var mn=class e extends me{constructor(e){e instanceof N&&(e={context:e});let{context:t,roundPixels:n,...r}=e||{};super({label:`Graphics`,...r}),this.renderPipeId=`graphics`,t?this.context=t:(this.context=this._ownedContext=new N,this.context.autoGarbageCollect=this.autoGarbageCollect),this.didViewUpdate=!0,this.allowChildren=!1,this.roundPixels=n??!1}set context(e){e!==this._context&&(this._context&&(this._context.off(`update`,this.onViewUpdate,this),this._context.off(`unload`,this.unload,this)),this._context=e,this._context.on(`update`,this.onViewUpdate,this),this._context.on(`unload`,this.unload,this),this.onViewUpdate())}get context(){return this._context}get bounds(){return this._context.bounds}updateBounds(){}containsPoint(e){return this._context.containsPoint(e)}destroy(e){this._ownedContext&&!e?this._ownedContext.destroy(e):(e===!0||e?.context===!0)&&this._context.destroy(e),this._context?.off(`update`,this.onViewUpdate,this),this._context?.off(`unload`,this.unload,this),this._ownedContext=null,this._context=null,super.destroy(e)}_onTouch(e){this._gcLastUsed=e,this._context._gcLastUsed=e}_callContextMethod(e,t){return this.context[e](...t),this}setFillStyle(...e){return this._callContextMethod(`setFillStyle`,e)}setStrokeStyle(...e){return this._callContextMethod(`setStrokeStyle`,e)}fill(...e){return this._callContextMethod(`fill`,e)}stroke(...e){return this._callContextMethod(`stroke`,e)}texture(...e){return this._callContextMethod(`texture`,e)}beginPath(){return this._callContextMethod(`beginPath`,[])}cut(){return this._callContextMethod(`cut`,[])}arc(...e){return this._callContextMethod(`arc`,e)}arcTo(...e){return this._callContextMethod(`arcTo`,e)}arcToSvg(...e){return this._callContextMethod(`arcToSvg`,e)}bezierCurveTo(...e){return this._callContextMethod(`bezierCurveTo`,e)}closePath(){return this._callContextMethod(`closePath`,[])}ellipse(...e){return this._callContextMethod(`ellipse`,e)}circle(...e){return this._callContextMethod(`circle`,e)}path(...e){return this._callContextMethod(`path`,e)}lineTo(...e){return this._callContextMethod(`lineTo`,e)}moveTo(...e){return this._callContextMethod(`moveTo`,e)}quadraticCurveTo(...e){return this._callContextMethod(`quadraticCurveTo`,e)}rect(...e){return this._callContextMethod(`rect`,e)}roundRect(...e){return this._callContextMethod(`roundRect`,e)}poly(...e){return this._callContextMethod(`poly`,e)}regularPoly(...e){return this._callContextMethod(`regularPoly`,e)}roundPoly(...e){return this._callContextMethod(`roundPoly`,e)}roundShape(...e){return this._callContextMethod(`roundShape`,e)}filletRect(...e){return this._callContextMethod(`filletRect`,e)}chamferRect(...e){return this._callContextMethod(`chamferRect`,e)}star(...e){return this._callContextMethod(`star`,e)}svg(...e){return this._callContextMethod(`svg`,e)}restore(...e){return this._callContextMethod(`restore`,e)}save(){return this._callContextMethod(`save`,[])}getTransform(){return this.context.getTransform()}resetTransform(){return this._callContextMethod(`resetTransform`,[])}rotateTransform(...e){return this._callContextMethod(`rotate`,e)}scaleTransform(...e){return this._callContextMethod(`scale`,e)}setTransform(...e){return this._callContextMethod(`setTransform`,e)}transform(...e){return this._callContextMethod(`transform`,e)}translateTransform(...e){return this._callContextMethod(`translate`,e)}clear(){return this._callContextMethod(`clear`,[])}get fillStyle(){return this._context.fillStyle}set fillStyle(e){this._context.fillStyle=e}get strokeStyle(){return this._context.strokeStyle}set strokeStyle(e){this._context.strokeStyle=e}clone(t=!1){return t?new e(this._context.clone()):(this._ownedContext=null,new e(this._context))}lineStyle(e,t,n){u(a,`Graphics#lineStyle is no longer needed. Use Graphics#setStrokeStyle to set the stroke style.`);let r={};return e&&(r.width=e),t&&(r.color=t),n&&(r.alpha=n),this.context.strokeStyle=r,this}beginFill(e,t){u(a,`Graphics#beginFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.`);let n={};return e!==void 0&&(n.color=e),t!==void 0&&(n.alpha=t),this.context.fillStyle=n,this}endFill(){u(a,`Graphics#endFill is no longer needed. Use Graphics#fill to fill the shape with the desired style.`),this.context.fill();let e=this.context.strokeStyle;return(e.width!==N.defaultStrokeStyle.width||e.color!==N.defaultStrokeStyle.color||e.alpha!==N.defaultStrokeStyle.alpha)&&this.context.stroke(),this}drawCircle(...e){return u(a,`Graphics#drawCircle has been renamed to Graphics#circle`),this._callContextMethod(`circle`,e)}drawEllipse(...e){return u(a,`Graphics#drawEllipse has been renamed to Graphics#ellipse`),this._callContextMethod(`ellipse`,e)}drawPolygon(...e){return u(a,`Graphics#drawPolygon has been renamed to Graphics#poly`),this._callContextMethod(`poly`,e)}drawRect(...e){return u(a,`Graphics#drawRect has been renamed to Graphics#rect`),this._callContextMethod(`rect`,e)}drawRoundedRect(...e){return u(a,`Graphics#drawRoundedRect has been renamed to Graphics#roundRect`),this._callContextMethod(`roundRect`,e)}drawStar(...e){return u(a,`Graphics#drawStar has been renamed to Graphics#star`),this._callContextMethod(`star`,e)}};function hn(e,t,n,r,i,a){a=Math.max(0,Math.min(a,Math.min(r,i)/2)),e.moveTo(t+a,n),e.lineTo(t+r-a,n),e.quadraticCurveTo(t+r,n,t+r,n+a),e.lineTo(t+r,n+i-a),e.quadraticCurveTo(t+r,n+i,t+r-a,n+i),e.lineTo(t+a,n+i),e.quadraticCurveTo(t,n+i,t,n+i-a),e.lineTo(t,n+a),e.quadraticCurveTo(t,n,t+a,n)}function gn(e,t){switch(t.type){case`rectangle`:{let n=t;e.rect(n.x,n.y,n.width,n.height);break}case`roundedRectangle`:{let n=t;hn(e,n.x,n.y,n.width,n.height,n.radius);break}case`circle`:{let n=t;e.moveTo(n.x+n.radius,n.y),e.arc(n.x,n.y,n.radius,0,Math.PI*2);break}case`ellipse`:{let n=t;e.ellipse?(e.moveTo(n.x+n.halfWidth,n.y),e.ellipse(n.x,n.y,n.halfWidth,n.halfHeight,0,0,Math.PI*2)):(e.save(),e.translate(n.x,n.y),e.scale(n.halfWidth,n.halfHeight),e.moveTo(1,0),e.arc(0,0,1,0,Math.PI*2),e.restore());break}case`triangle`:{let n=t;e.moveTo(n.x,n.y),e.lineTo(n.x2,n.y2),e.lineTo(n.x3,n.y3),e.closePath();break}default:{let n=t,r=n.points;if(!r?.length)break;e.moveTo(r[0],r[1]);for(let t=2;t<r.length;t+=2)e.lineTo(r[t],r[t+1]);n.closePath&&e.closePath();break}}}function _n(e,t,n){let r=[],i=[],a=[];if(!ye[t.type]?.build(t,r))return!1;let o=t.closePath??!0;De(r,n,!1,o,i,a);for(let t=0;t<a.length;t+=3){let n=a[t]*2,r=a[t+1]*2,o=a[t+2]*2;e.moveTo(i[n],i[n+1]),e.lineTo(i[r],i[r+1]),e.lineTo(i[o],i[o+1]),e.closePath()}return!0}function vn(e,t){if(!t?.length)return!1;for(let n=0;n<t.length;n++){let r=t[n];if(!r?.shape)continue;let i=r.transform,a=i&&!i.isIdentity();a&&(e.save(),e.transform(i.a,i.b,i.c,i.d,i.tx,i.ty)),gn(e,r.shape),a&&e.restore()}return!0}var yn=class{constructor(e){this._warnedMaskTypes=new Set,this._canvasMaskStack=[],this._renderer=e}push(e,t,n){this._renderer.renderPipes.batch.break(n),n.add({renderPipeId:`stencilMask`,action:`pushMaskBegin`,mask:e,inverse:t._maskOptions.inverse,canBundle:!1})}pop(e,t,n){this._renderer.renderPipes.batch.break(n),n.add({renderPipeId:`stencilMask`,action:`popMaskEnd`,mask:e,inverse:t._maskOptions.inverse,canBundle:!1})}execute(e){if(e.action!==`pushMaskBegin`&&e.action!==`popMaskEnd`)return;let t=this._renderer,n=t.canvasContext,r=n?.activeContext;if(!r)return;if(e.action===`popMaskEnd`){this._canvasMaskStack.pop()&&r.restore();return}e.inverse&&this._warnOnce(`inverse`,`CanvasRenderer: inverse masks are not supported on Canvas2D; ignoring inverse flag.`);let i=e.mask.mask;if(!(i instanceof mn)){this._warnOnce(`nonGraphics`,`CanvasRenderer: only Graphics masks are supported in Canvas2D; skipping mask.`),this._canvasMaskStack.push(!1);return}let a=i,o=a.context?.instructions;if(!o?.length){this._canvasMaskStack.push(!1);return}r.save(),n.setContextTransform(a.groupTransform,(t._roundPixels|a._roundPixels)===1),r.beginPath();let s=!1,c=!1;for(let e=0;e<o.length;e++){let t=o[e],n=t.action;if(n!==`fill`&&n!==`stroke`)continue;let i=t.data,a=i?.path?.shapePath;if(!a?.shapePrimitives?.length)continue;let l=n===`stroke`,u=a.shapePrimitives;for(let e=0;e<u.length;e++){let t=u[e];if(!t?.shape)continue;let n=t.transform,a=n&&!n.isIdentity();a&&(r.save(),r.transform(n.a,n.b,n.c,n.d,n.tx,n.ty)),l&&i.style?s=_n(r,t.shape,i.style)||s:(gn(r,t.shape),c=vn(r,t.holes)||c,s=!0),a&&r.restore()}}s?(c?r.clip(`evenodd`):r.clip(),this._canvasMaskStack.push(!0)):(r.restore(),this._canvasMaskStack.push(!1))}destroy(){this._renderer=null,this._warnedMaskTypes=null,this._canvasMaskStack=null}_warnOnce(e,t){this._warnedMaskTypes.has(e)||(this._warnedMaskTypes.add(e),c(t))}};yn.extension={type:[o.CanvasPipes],name:`stencilMask`};var R=`source-over`;function bn(){let e=ve(),t=Object.create(null);return t.inherit=R,t.none=R,t.normal=`source-over`,t.add=`lighter`,t.multiply=e?`multiply`:R,t.screen=e?`screen`:R,t.overlay=e?`overlay`:R,t.darken=e?`darken`:R,t.lighten=e?`lighten`:R,t[`color-dodge`]=e?`color-dodge`:R,t[`color-burn`]=e?`color-burn`:R,t[`hard-light`]=e?`hard-light`:R,t[`soft-light`]=e?`soft-light`:R,t.difference=e?`difference`:R,t.exclusion=e?`exclusion`:R,t.saturation=e?`saturation`:R,t.color=e?`color`:R,t.luminosity=e?`luminosity`:R,t[`linear-burn`]=e?`color-burn`:R,t[`linear-dodge`]=e?`color-dodge`:R,t[`linear-light`]=e?`hard-light`:R,t[`pin-light`]=e?`hard-light`:R,t[`vivid-light`]=e?`hard-light`:R,t[`hard-mix`]=R,t.negation=e?`difference`:R,t[`normal-npm`]=t.normal,t[`add-npm`]=t.add,t[`screen-npm`]=t.screen,t.erase=`destination-out`,t.subtract=R,t.divide=R,t.min=R,t.max=R,t}var xn=new E,Sn=class{constructor(e){this.activeResolution=1,this.smoothProperty=`imageSmoothingEnabled`,this.blendModes=bn(),this._activeBlendMode=`normal`,this._projTransform=null,this._outerBlend=!1,this._warnedBlendModes=new Set,this._renderer=e}resolutionChange(e){this.activeResolution=e}init(){let e=this._renderer.background.alpha<1;if(this.rootContext=this._renderer.canvas.getContext(`2d`,{alpha:e}),this.activeContext=this.rootContext,this.activeResolution=this._renderer.resolution,!this.rootContext.imageSmoothingEnabled){let e=this.rootContext;e.webkitImageSmoothingEnabled?this.smoothProperty=`webkitImageSmoothingEnabled`:e.mozImageSmoothingEnabled?this.smoothProperty=`mozImageSmoothingEnabled`:e.oImageSmoothingEnabled?this.smoothProperty=`oImageSmoothingEnabled`:e.msImageSmoothingEnabled&&(this.smoothProperty=`msImageSmoothingEnabled`)}}setContextTransform(e,t,n,r){let i=r?E.IDENTITY:this._renderer.globalUniforms.globalUniformData?.worldTransformMatrix||E.IDENTITY,a=xn;a.copyFrom(i),a.append(e);let o=this._projTransform,s=this.activeResolution;if(n=n||s,o){let e=E.shared;e.copyFrom(a),e.prepend(o),a=e}t?this.activeContext.setTransform(a.a*n,a.b*n,a.c*n,a.d*n,a.tx*s|0,a.ty*s|0):this.activeContext.setTransform(a.a*n,a.b*n,a.c*n,a.d*n,a.tx*s,a.ty*s)}clear(e,t){let n=this.activeContext,r=this._renderer;if(n.clearRect(0,0,r.width,r.height),e){let i=p.shared.setValue(e);n.globalAlpha=t??i.alpha,n.fillStyle=i.toHex(),n.fillRect(0,0,r.width,r.height),n.globalAlpha=1}}setBlendMode(e){if(this._activeBlendMode===e)return;this._activeBlendMode=e,this._outerBlend=!1;let t=this.blendModes[e];t?this.activeContext.globalCompositeOperation=t:(this._warnedBlendModes.has(e)||(console.warn(`CanvasRenderer: blend mode "${e}" is not supported in Canvas2D; falling back to "source-over".`),this._warnedBlendModes.add(e)),this.activeContext.globalCompositeOperation=`source-over`)}destroy(){this.rootContext=null,this.activeContext=null,this._warnedBlendModes.clear()}};Sn.extension={type:[o.CanvasSystem],name:`canvasContext`};var Cn=class{constructor(){this.maxTextures=16,this.maxBatchableTextures=16,this.maxUniformBindings=0,this.minUniformBufferOffsetAlignment=0}init(){}};Cn.extension={type:[o.CanvasSystem],name:`limits`};var wn=class{init(e,t){this._renderer=e,this._renderTargetSystem=t}initGpuRenderTarget(e){let t=e.colorTexture,{canvas:n,context:r}=this._ensureCanvas(t);return{canvas:n,context:r,width:n.width,height:n.height}}resizeGpuRenderTarget(e){let t=e.colorTexture,{canvas:n}=this._ensureCanvas(t);n.width=e.pixelWidth,n.height=e.pixelHeight}startRenderPass(e,t,n,r){let i=this._renderTargetSystem.getGpuRenderTarget(e);this._renderer.canvasContext.activeContext=i.context,this._renderer.canvasContext.activeResolution=e.resolution,t&&this.clear(e,t,n,r)}clear(e,t,n,r){let i=this._renderTargetSystem.getGpuRenderTarget(e).context,a=r||{x:0,y:0,width:e.pixelWidth,height:e.pixelHeight};if(i.setTransform(1,0,0,1,0,0),i.clearRect(a.x,a.y,a.width,a.height),n){let e=p.shared.setValue(n);e.alpha>0&&(i.globalAlpha=e.alpha,i.fillStyle=e.toHex(),i.fillRect(a.x,a.y,a.width,a.height),i.globalAlpha=1)}}finishRenderPass(){}copyToTexture(e,t,n,r,i){let a=this._renderTargetSystem.getGpuRenderTarget(e).canvas,o=t.source,{context:s}=this._ensureCanvas(o),c=i?.x??0,l=i?.y??0;return s.drawImage(a,n.x,n.y,r.width,r.height,c,l,r.width,r.height),o.update(),t}copyDepthTexture(e,t,n,r,i){c(`[CanvasRenderTargetAdaptor] copyDepthTexture is not supported in the canvas renderer`)}destroyGpuRenderTarget(e){}_ensureCanvas(e){let t=e.resource;t&&D.test(t)||(t=b.get().createCanvas(e.pixelWidth,e.pixelHeight),e.resource=t),(t.width!==e.pixelWidth||t.height!==e.pixelHeight)&&(t.width=e.pixelWidth,t.height=e.pixelHeight);let n=t.getContext(`2d`);return{canvas:t,context:n}}},Tn=class extends Le{constructor(e){super(e),this.adaptor=new wn,this.adaptor.init(e,this)}};Tn.extension={type:[o.CanvasSystem],name:`renderTarget`};var En=class{constructor(e){}init(){}initSource(e){}generateCanvas(e){let t=b.get().createCanvas(),n=t.getContext(`2d`),r=M.getCanvasSource(e);if(!r)return t;let i=e.frame,a=e.source._resolution??e.source.resolution??1,o=i.x*a,s=i.y*a,c=i.width*a,l=i.height*a;return t.width=Math.ceil(c),t.height=Math.ceil(l),n.drawImage(r,o,s,c,l,0,0,c,l),t}getPixels(e){let t=this.generateCanvas(e);return{pixels:t.getContext(`2d`,{willReadFrequently:!0}).getImageData(0,0,t.width,t.height).data,width:t.width,height:t.height}}destroy(){}};En.extension={type:[o.CanvasSystem],name:`texture`};var Dn=e({CanvasRenderer:()=>Fn}),On=[...Ie,Sn,Cn,En,Tn],kn=[ke,Ae,je,Fe,Re,yn,an,Ne],An=[rn,tn],jn=[],Mn=[],Nn=[],Pn=[];s.handleByNamedList(o.CanvasSystem,jn),s.handleByNamedList(o.CanvasPipes,Mn),s.handleByNamedList(o.CanvasPipesAdaptor,Nn),s.handleByNamedList(o.CanvasLoader,Pn),s.add(...On,...kn,...An);var Fn=class extends Oe{constructor(){let e={name:`canvas`,type:re.CANVAS,systems:jn,renderPipes:Mn,renderPipeAdaptors:Nn,loaders:Pn};super(e)}},In=class{_getShader(e){return this.shader}execute(e,t){let n=t.context,r=e.renderer,i=this._getRenderData(r,n),{batcher:a,instructions:o}=i,s=n.customShader||this._getShader(i);s.groups[0]=r.globalUniforms.bindGroup,r.state.set(e.state),r.shader.bind(s),r.geometry.bind(a.geometry,s.glProgram);let c=o.instructions;for(let e=0;e<o.instructionSize;e++){let t=c[e];if(t.size){for(let e=0;e<t.textures.count;e++)r.texture.bind(t.textures.textures[e],e);r.texture.unbindIntegerTextures(t.textures.count),r.geometry.draw(t.topology,t.size,t.start)}}}destroy(){this.shader.destroy(!0),this.shader=null}},Ln=class extends In{contextChange(e){let t=new g({uColor:{value:new Float32Array([1,1,1,1]),type:`vec4<f32>`},uTransformMatrix:{value:new E,type:`mat3x3<f32>`},uRound:{value:0,type:`f32`}}),n=e.limits.maxBatchableTextures,r=Xe({name:`graphics`,bits:[Ge,Ye(n),st,ze]});this.shader=new x({glProgram:r,resources:{localUniforms:t,batchSamplers:Je(n)}})}_getRenderData(e,t){return e.graphicsContext.getContextRenderData(t)}};Ln.extension={type:[o.WebGLPipesAdaptor],name:`graphics`};var Rn=class{init(){let e=Xe({name:`mesh`,bits:[st,et,ze]});this._shader=new x({glProgram:e,resources:{uTexture:h.EMPTY.source,textureUniforms:{uTextureMatrix:{type:`mat3x3<f32>`,value:new E}}}})}execute(e,t){let n=e.renderer,r=t._shader;if(!r){r=this._shader;let e=t.texture,n=e.source;r.resources.uTexture=n,r.resources.uSampler=n.style,r.resources.textureUniforms.uniforms.uTextureMatrix=e.textureMatrix.mapCoord}else if(!r.glProgram){c(`Mesh shader has no glProgram`,t.shader);return}r.groups[100]=n.globalUniforms.bindGroup,r.groups[101]=e.localUniformsBindGroup,n.encoder.draw({geometry:t._geometry,shader:r,state:t.state})}destroy(){this._shader.destroy(!0),this._shader=null}};Rn.extension={type:[o.WebGLPipesAdaptor],name:`mesh`};var zn=class{constructor(){this._tempState=ge.for2d(),this._didUploadHash={}}init(e){e.renderer.runners.contextChange.add(this)}contextChange(){this._didUploadHash={}}start(e,t,n){let r=e.renderer,i=this._didUploadHash[n.uid];r.shader.bind(n,i),i||(this._didUploadHash[n.uid]=!0),r.shader.updateUniformGroup(r.globalUniforms.uniformGroup),r.geometry.bind(t,n.glProgram)}execute(e,t){let n=e.renderer;this._tempState.blendMode=t.blendMode,n.state.set(this._tempState);let r=t.textures.textures;for(let e=0;e<t.textures.count;e++)n.texture.bind(r[e],e);n.texture.unbindIntegerTextures(t.textures.count),n.geometry.draw(t.topology,t.size,t.start)}};zn.extension={type:[o.WebGLPipesAdaptor],name:`batch`};var Bn=(e=>(e[e.ELEMENT_ARRAY_BUFFER=34963]=`ELEMENT_ARRAY_BUFFER`,e[e.ARRAY_BUFFER=34962]=`ARRAY_BUFFER`,e[e.UNIFORM_BUFFER=35345]=`UNIFORM_BUFFER`,e))(Bn||{}),Vn=class{constructor(e,t){this.buffer=e||null,this.updateID=-1,this.byteLength=-1,this.type=t}destroy(){this.buffer=null,this.updateID=-1,this.byteLength=-1,this.type=-1}},Hn=class{constructor(e){this._boundBuffers=[],this._boundOffsets=[],this._boundSizes=[],this._renderer=e,this._managedBuffers=new F({renderer:e,type:`resource`,onUnload:this.onBufferUnload.bind(this),name:`glBuffer`})}destroy(){this._managedBuffers.destroy(),this._renderer=null,this._gl=null,this._boundBuffers.length=0}contextChange(){this._gl=this._renderer.gl,this.destroyAll(!0),this._boundBuffers.length=0}getGlBuffer(e){return e._gcLastUsed=this._renderer.gc.now,e._gpuData[this._renderer.uid]||this.createGLBuffer(e)}bind(e){let{_gl:t}=this,n=this.getGlBuffer(e);t.bindBuffer(n.type,n.buffer)}bindBufferBase(e,t){(this._boundBuffers[t]!==e||this._boundSizes[t]!==-1)&&(this._boundBuffers[t]=e,this._boundOffsets[t]=0,this._boundSizes[t]=-1,this._gl.bindBufferBase(this._gl.UNIFORM_BUFFER,t,e.buffer))}bindBufferRange(e,t=0,n=0,r){r??(r=e.byteLength-n),(this._boundBuffers[t]!==e||this._boundOffsets[t]!==n||this._boundSizes[t]!==r)&&(this._boundBuffers[t]=e,this._boundOffsets[t]=n,this._boundSizes[t]=r,this._gl.bindBufferRange(this._gl.UNIFORM_BUFFER,t,e.buffer,n,r))}updateBuffer(e){let t=this.getGlBuffer(e);return this._upload(e,t,t.type),t}_upload(e,t,n){let{_gl:r}=this;if(e._updateID===t.updateID)return;t.updateID=e._updateID,r.bindBuffer(n,t.buffer);let i=e.data,a=e.descriptor.usage&T.STATIC?r.STATIC_DRAW:r.DYNAMIC_DRAW;if(i){if(t.byteLength>=i.byteLength){let t=e._updateOffset/i.BYTES_PER_ELEMENT,a=(e._updateSize||i.byteLength)/i.BYTES_PER_ELEMENT;this._renderer.context.webGLVersion===2?r.bufferSubData(n,e._updateOffset,i,t,a):r.bufferSubData(n,e._updateOffset,a===i.length?i:i.subarray(t,t+a))}else t.byteLength=i.byteLength,r.bufferData(n,i,a)}else t.byteLength=e.descriptor.size,r.bufferData(n,t.byteLength,a)}destroyAll(e=!1){this._managedBuffers.removeAll(e)}onBufferUnload(e,t=!1){e.off(`update`,this.updateBuffer,this),e.off(`update`,this._updateIndexBuffer,this);let n=e._gpuData[this._renderer.uid];n&&(t||this._gl.deleteBuffer(n.buffer))}createGLBuffer(e){let{_gl:t}=this,n=Bn.ARRAY_BUFFER;e.descriptor.usage&T.INDEX?n=Bn.ELEMENT_ARRAY_BUFFER:e.descriptor.usage&T.UNIFORM&&(n=Bn.UNIFORM_BUFFER);let r=new Vn(t.createBuffer(),n);return e._gpuData[this._renderer.uid]=r,this._managedBuffers.add(e)&&(n===Bn.ELEMENT_ARRAY_BUFFER?e.on(`update`,this._updateIndexBuffer,this):e.on(`update`,this.updateBuffer,this)),r}_updateIndexBuffer(e){let t=this.getGlBuffer(e);t.byteLength<0||(this._renderer.context.webGLVersion===2?this._upload(e,t,this._gl.COPY_WRITE_BUFFER):(this._renderer.geometry._activeVao&&this._renderer.geometry.resetState(),this._upload(e,t,t.type)))}resetState(){this._boundBuffers.length=0}};Hn.extension={type:[o.WebGLSystem],name:`buffer`};var Un=class e{constructor(e){this.supports={uint32Indices:!0,uniformBufferObject:!0,vertexArrayObject:!0,srgbTextures:!0,nonPowOf2wrapping:!0,msaa:!0,nonPowOf2mipmaps:!0},this._renderer=e,this.extensions=Object.create(null),this.handleContextLost=this.handleContextLost.bind(this),this.handleContextRestored=this.handleContextRestored.bind(this)}get isLost(){return!this.gl||this.gl.isContextLost()}contextChange(e){this.gl=e,this._renderer.gl=e}init(t){t={...e.defaultOptions,...t};let n=this.multiView=t.multiView;if(t.context&&n&&(c(`Renderer created with both a context and multiview enabled. Disabling multiView as both cannot work together.`),n=!1),this.canvas=n?b.get().createCanvas(this._renderer.canvas.width,this._renderer.canvas.height):this._renderer.view.canvas,t.context)this.initFromContext(t.context);else{let e=this._renderer.background.alpha<1,n=t.premultipliedAlpha??!0,r=t.antialias&&!this._renderer.backBuffer.useBackBuffer;this.createContext(t.preferWebGLVersion,{alpha:e,premultipliedAlpha:n,antialias:r,stencil:!0,preserveDrawingBuffer:t.preserveDrawingBuffer,powerPreference:t.powerPreference??`default`})}}ensureCanvasSize(e){if(!this.multiView){e!==this.canvas&&c(`multiView is disabled, but targetCanvas is not the main canvas`);return}let{canvas:t}=this;(t.width<e.width||t.height<e.height)&&(t.width=Math.max(e.width,e.width),t.height=Math.max(e.height,e.height))}initFromContext(e){this.gl=e,this.webGLVersion=e instanceof b.get().getWebGLRenderingContext()?1:2,this.getExtensions(),this.validateContext(e),this._renderer.runners.contextChange.emit(e);let t=this._renderer.view.canvas;t.addEventListener(`webglcontextlost`,this.handleContextLost,!1),t.addEventListener(`webglcontextrestored`,this.handleContextRestored,!1)}createContext(e,t){let n,r=this.canvas;if(e===2&&(n=r.getContext(`webgl2`,t)),!n&&(n=r.getContext(`webgl`,t),!n))throw Error(`This browser does not support WebGL. Try using the canvas renderer`);this.gl=n,this.initFromContext(this.gl)}getExtensions(){let{gl:e}=this,t={anisotropicFiltering:e.getExtension(`EXT_texture_filter_anisotropic`),floatTextureLinear:e.getExtension(`OES_texture_float_linear`),s3tc:e.getExtension(`WEBGL_compressed_texture_s3tc`),s3tc_sRGB:e.getExtension(`WEBGL_compressed_texture_s3tc_srgb`),etc:e.getExtension(`WEBGL_compressed_texture_etc`),etc1:e.getExtension(`WEBGL_compressed_texture_etc1`),pvrtc:e.getExtension(`WEBGL_compressed_texture_pvrtc`)||e.getExtension(`WEBKIT_WEBGL_compressed_texture_pvrtc`),atc:e.getExtension(`WEBGL_compressed_texture_atc`),astc:e.getExtension(`WEBGL_compressed_texture_astc`),bptc:e.getExtension(`EXT_texture_compression_bptc`),rgtc:e.getExtension(`EXT_texture_compression_rgtc`),loseContext:e.getExtension(`WEBGL_lose_context`)};if(this.webGLVersion===1)this.extensions={...t,drawBuffers:e.getExtension(`WEBGL_draw_buffers`),depthTexture:e.getExtension(`WEBGL_depth_texture`),vertexArrayObject:e.getExtension(`OES_vertex_array_object`)||e.getExtension(`MOZ_OES_vertex_array_object`)||e.getExtension(`WEBKIT_OES_vertex_array_object`),uint32ElementIndex:e.getExtension(`OES_element_index_uint`),floatTexture:e.getExtension(`OES_texture_float`),floatTextureLinear:e.getExtension(`OES_texture_float_linear`),textureHalfFloat:e.getExtension(`OES_texture_half_float`),textureHalfFloatLinear:e.getExtension(`OES_texture_half_float_linear`),vertexAttribDivisorANGLE:e.getExtension(`ANGLE_instanced_arrays`),srgb:e.getExtension(`EXT_sRGB`)};else{this.extensions={...t,colorBufferFloat:e.getExtension(`EXT_color_buffer_float`)};let n=e.getExtension(`WEBGL_provoking_vertex`);n&&n.provokingVertexWEBGL(n.FIRST_VERTEX_CONVENTION_WEBGL)}}handleContextLost(e){e.preventDefault(),this._contextLossForced&&(this._contextLossForced=!1,setTimeout(()=>{this.gl.isContextLost()&&this.extensions.loseContext?.restoreContext()},0))}handleContextRestored(){this.getExtensions(),this._renderer.runners.contextChange.emit(this.gl)}destroy(){let e=this._renderer.view.canvas;this._renderer=null,e.removeEventListener(`webglcontextlost`,this.handleContextLost),e.removeEventListener(`webglcontextrestored`,this.handleContextRestored),this.gl.useProgram(null),this.extensions.loseContext?.loseContext()}forceContextLoss(){this.extensions.loseContext?.loseContext(),this._contextLossForced=!0}validateContext(e){let t=e.getContextAttributes();t&&!t.stencil&&c(`Provided WebGL context does not have a stencil buffer, masks may not render correctly`);let n=this.supports,r=this.webGLVersion===2,i=this.extensions;n.uint32Indices=r||!!i.uint32ElementIndex,n.uniformBufferObject=r,n.vertexArrayObject=r||!!i.vertexArrayObject,n.srgbTextures=r||!!i.srgb,n.nonPowOf2wrapping=r,n.nonPowOf2mipmaps=r,n.msaa=r,n.uint32Indices||c(`Provided WebGL context does not support 32 index buffer, large scenes may not render correctly`)}};Un.extension={type:[o.WebGLSystem],name:`context`},Un.defaultOptions={context:null,premultipliedAlpha:!0,preserveDrawingBuffer:!1,powerPreference:void 0,preferWebGLVersion:2,multiView:!1};var Wn=Un,Gn=(e=>(e[e.RGBA=6408]=`RGBA`,e[e.RGB=6407]=`RGB`,e[e.RG=33319]=`RG`,e[e.RED=6403]=`RED`,e[e.RGBA_INTEGER=36249]=`RGBA_INTEGER`,e[e.RGB_INTEGER=36248]=`RGB_INTEGER`,e[e.RG_INTEGER=33320]=`RG_INTEGER`,e[e.RED_INTEGER=36244]=`RED_INTEGER`,e[e.ALPHA=6406]=`ALPHA`,e[e.LUMINANCE=6409]=`LUMINANCE`,e[e.LUMINANCE_ALPHA=6410]=`LUMINANCE_ALPHA`,e[e.DEPTH_COMPONENT=6402]=`DEPTH_COMPONENT`,e[e.DEPTH_STENCIL=34041]=`DEPTH_STENCIL`,e))(Gn||{}),Kn=(e=>(e[e.TEXTURE_2D=3553]=`TEXTURE_2D`,e[e.TEXTURE_CUBE_MAP=34067]=`TEXTURE_CUBE_MAP`,e[e.TEXTURE_2D_ARRAY=35866]=`TEXTURE_2D_ARRAY`,e[e.TEXTURE_3D=32879]=`TEXTURE_3D`,e[e.TEXTURE_CUBE_MAP_POSITIVE_X=34069]=`TEXTURE_CUBE_MAP_POSITIVE_X`,e[e.TEXTURE_CUBE_MAP_NEGATIVE_X=34070]=`TEXTURE_CUBE_MAP_NEGATIVE_X`,e[e.TEXTURE_CUBE_MAP_POSITIVE_Y=34071]=`TEXTURE_CUBE_MAP_POSITIVE_Y`,e[e.TEXTURE_CUBE_MAP_NEGATIVE_Y=34072]=`TEXTURE_CUBE_MAP_NEGATIVE_Y`,e[e.TEXTURE_CUBE_MAP_POSITIVE_Z=34073]=`TEXTURE_CUBE_MAP_POSITIVE_Z`,e[e.TEXTURE_CUBE_MAP_NEGATIVE_Z=34074]=`TEXTURE_CUBE_MAP_NEGATIVE_Z`,e))(Kn||{}),z=(e=>(e[e.UNSIGNED_BYTE=5121]=`UNSIGNED_BYTE`,e[e.UNSIGNED_SHORT=5123]=`UNSIGNED_SHORT`,e[e.UNSIGNED_SHORT_5_6_5=33635]=`UNSIGNED_SHORT_5_6_5`,e[e.UNSIGNED_SHORT_4_4_4_4=32819]=`UNSIGNED_SHORT_4_4_4_4`,e[e.UNSIGNED_SHORT_5_5_5_1=32820]=`UNSIGNED_SHORT_5_5_5_1`,e[e.UNSIGNED_INT=5125]=`UNSIGNED_INT`,e[e.UNSIGNED_INT_10F_11F_11F_REV=35899]=`UNSIGNED_INT_10F_11F_11F_REV`,e[e.UNSIGNED_INT_2_10_10_10_REV=33640]=`UNSIGNED_INT_2_10_10_10_REV`,e[e.UNSIGNED_INT_24_8=34042]=`UNSIGNED_INT_24_8`,e[e.UNSIGNED_INT_5_9_9_9_REV=35902]=`UNSIGNED_INT_5_9_9_9_REV`,e[e.BYTE=5120]=`BYTE`,e[e.SHORT=5122]=`SHORT`,e[e.INT=5124]=`INT`,e[e.FLOAT=5126]=`FLOAT`,e[e.FLOAT_32_UNSIGNED_INT_24_8_REV=36269]=`FLOAT_32_UNSIGNED_INT_24_8_REV`,e[e.HALF_FLOAT=36193]=`HALF_FLOAT`,e))(z||{}),qn={uint8x2:z.UNSIGNED_BYTE,uint8x4:z.UNSIGNED_BYTE,sint8x2:z.BYTE,sint8x4:z.BYTE,unorm8x2:z.UNSIGNED_BYTE,unorm8x4:z.UNSIGNED_BYTE,snorm8x2:z.BYTE,snorm8x4:z.BYTE,uint16x2:z.UNSIGNED_SHORT,uint16x4:z.UNSIGNED_SHORT,sint16x2:z.SHORT,sint16x4:z.SHORT,unorm16x2:z.UNSIGNED_SHORT,unorm16x4:z.UNSIGNED_SHORT,snorm16x2:z.SHORT,snorm16x4:z.SHORT,float16x2:z.HALF_FLOAT,float16x4:z.HALF_FLOAT,float32:z.FLOAT,float32x2:z.FLOAT,float32x3:z.FLOAT,float32x4:z.FLOAT,uint32:z.UNSIGNED_INT,uint32x2:z.UNSIGNED_INT,uint32x3:z.UNSIGNED_INT,uint32x4:z.UNSIGNED_INT,sint32:z.INT,sint32x2:z.INT,sint32x3:z.INT,sint32x4:z.INT};function Jn(e){return qn[e]??qn.float32}var Yn={"point-list":0,"line-list":1,"line-strip":3,"triangle-list":4,"triangle-strip":5},Xn=class{constructor(){this.vaoCache=Object.create(null)}destroy(){this.vaoCache=Object.create(null)}},Zn=class{constructor(e){this._renderer=e,this._activeGeometry=null,this._activeVao=null,this.hasVao=!0,this.hasInstance=!0,this._managedGeometries=new F({renderer:e,type:`resource`,onUnload:this.onGeometryUnload.bind(this),name:`glGeometry`})}contextChange(){let e=this.gl=this._renderer.gl;if(!this._renderer.context.supports.vertexArrayObject)throw Error(`[PixiJS] Vertex Array Objects are not supported on this device`);this.destroyAll(!0);let t=this._renderer.context.extensions.vertexArrayObject;t&&(e.createVertexArray=()=>t.createVertexArrayOES(),e.bindVertexArray=e=>t.bindVertexArrayOES(e),e.deleteVertexArray=e=>t.deleteVertexArrayOES(e));let n=this._renderer.context.extensions.vertexAttribDivisorANGLE;n&&(e.drawArraysInstanced=(e,t,r,i)=>{n.drawArraysInstancedANGLE(e,t,r,i)},e.drawElementsInstanced=(e,t,r,i,a)=>{n.drawElementsInstancedANGLE(e,t,r,i,a)},e.vertexAttribDivisor=(e,t)=>n.vertexAttribDivisorANGLE(e,t)),this._activeGeometry=null,this._activeVao=null}bind(e,t){let n=this.gl;this._activeGeometry=e;let r=this.getVao(e,t);this._activeVao!==r&&(this._activeVao=r,n.bindVertexArray(r)),this.updateBuffers()}resetState(){this.unbind()}updateBuffers(){let e=this._activeGeometry,t=this._renderer.buffer;for(let n=0;n<e.buffers.length;n++){let r=e.buffers[n];t.updateBuffer(r)}e._gcLastUsed=this._renderer.gc.now}checkCompatibility(e,t){let n=e.attributes,r=t._attributeData;for(let e in r)if(!n[e])throw Error(`shader and geometry incompatible, geometry missing the "${e}" attribute`)}getSignature(e,t){let n=e.attributes,r=t._attributeData,i=[`g`,e.uid];for(let e in n)r[e]&&i.push(e,r[e].location);return i.join(`-`)}getVao(e,t){return e._gpuData[this._renderer.uid]?.vaoCache[t._key]||this.initGeometryVao(e,t)}initGeometryVao(e,t,n=!0){let r=this._renderer.gl,i=this._renderer.buffer;this._renderer.shader._getProgramData(t),this.checkCompatibility(e,t);let a=this.getSignature(e,t),o=e._gpuData[this._renderer.uid];o||(o=new Xn,e._gpuData[this._renderer.uid]=o,this._managedGeometries.add(e));let s=o.vaoCache,c=s[a];if(c)return s[t._key]=c,c;rt(e,t._attributeData);let l=e.buffers;c=r.createVertexArray(),r.bindVertexArray(c);for(let e=0;e<l.length;e++){let t=l[e];i.bind(t)}return this.activateVao(e,t),s[t._key]=c,s[a]=c,r.bindVertexArray(null),c}onGeometryUnload(e,t=!1){let n=e._gpuData[this._renderer.uid];if(!n)return;let r=n.vaoCache;if(!t)for(let e in r)this._activeVao===r[e]&&this.resetState(),this.gl.deleteVertexArray(r[e])}destroyAll(e=!1){this._managedGeometries.removeAll(e)}activateVao(e,t){let n=this._renderer.gl,r=this._renderer.buffer,i=e.attributes;e.indexBuffer&&r.bind(e.indexBuffer);let a=null;for(let e in i){let o=i[e],s=o.buffer,c=r.getGlBuffer(s),l=t._attributeData[e];if(l){a!==c&&(r.bind(s),a=c);let e=l.location;n.enableVertexAttribArray(e);let t=ae(o.format),i=Jn(o.format);if(l.format?.substring(1,4)===`int`?n.vertexAttribIPointer(e,t.size,i,o.stride,o.offset):n.vertexAttribPointer(e,t.size,i,t.normalised,o.stride,o.offset),o.instance){if(this.hasInstance){let t=o.divisor??1;n.vertexAttribDivisor(e,t)}else throw Error(`geometry error, GPU Instancing is not supported on this device`)}}}}draw(e,t,n,r){let{gl:i}=this._renderer,a=this._activeGeometry,o=Yn[e||a.topology];if(r??(r=a.instanceCount),a.indexBuffer){let e=a.indexBuffer.data.BYTES_PER_ELEMENT,s=e===2?i.UNSIGNED_SHORT:i.UNSIGNED_INT,c=t||a.indexCount||a.indexBuffer.data.length,l=(n||0)*e;r===1?i.drawElements(o,c,s,l):i.drawElementsInstanced(o,c,s,l,r)}else r===1?i.drawArrays(o,n||0,t||a.vertexCount):i.drawArraysInstanced(o,n||0,t||a.vertexCount,r);return this}unbind(){this.gl.bindVertexArray(null),this._activeVao=null,this._activeGeometry=null}destroy(){this._managedGeometries.destroy(),this._renderer=null,this.gl=null,this._activeVao=null,this._activeGeometry=null}};Zn.extension={type:[o.WebGLSystem],name:`geometry`};var Qn=new ie({attributes:{aPosition:[-1,-1,3,-1,-1,3]}}),$n=class e{constructor(e){this.useBackBuffer=!1,this._useBackBufferThisRender=!1,this._renderer=e}init(t={}){let{useBackBuffer:n,antialias:r}={...e.defaultOptions,...t};this.useBackBuffer=n,this._antialias=r,this._renderer.context.supports.msaa||(c(`antialiasing, is not supported on when using the back buffer`),this._antialias=!1),this._state=ge.for2d();let i=new y({vertex:`
                attribute vec2 aPosition;
                out vec2 vUv;

                void main() {
                    gl_Position = vec4(aPosition, 0.0, 1.0);

                    vUv = (aPosition + 1.0) / 2.0;

                    // flip dem UVs
                    vUv.y = 1.0 - vUv.y;
                }`,fragment:`
                in vec2 vUv;
                out vec4 finalColor;

                uniform sampler2D uTexture;

                void main() {
                    finalColor = texture(uTexture, vUv);
                }`,name:`big-triangle`});this._bigTriangleShader=new x({glProgram:i,resources:{uTexture:h.WHITE.source}})}renderStart(e){let t=this._renderer.renderTarget.getRenderTarget(e.target);if(this._useBackBufferThisRender=this.useBackBuffer&&!!t.isRoot,this._useBackBufferThisRender){let t=this._renderer.renderTarget.getRenderTarget(e.target);this._targetTexture=t.colorTexture,e.target=this._getBackBufferTexture(t.colorTexture)}}renderEnd(){this._presentBackBuffer()}_presentBackBuffer(){let e=this._renderer;e.renderTarget.finishRenderPass(),this._useBackBufferThisRender&&(e.renderTarget.bind({target:this._targetTexture,clear:!1}),this._bigTriangleShader.resources.uTexture=this._backBufferTexture.source,e.encoder.draw({geometry:Qn,shader:this._bigTriangleShader,state:this._state}))}_getBackBufferTexture(e){return this._backBufferTexture=this._backBufferTexture||new h({source:new f({width:e.width,height:e.height,resolution:e._resolution,antialias:this._antialias})}),this._backBufferTexture.source.resize(e.width,e.height,e._resolution),this._backBufferTexture}destroy(){this._backBufferTexture&&(this._backBufferTexture.destroy(),this._backBufferTexture=null)}};$n.extension={type:[o.WebGLSystem],name:`backBuffer`,priority:1},$n.defaultOptions={useBackBuffer:!1};var er=$n,tr=class{constructor(e){this._colorMaskCache=15,this._renderer=e}setMask(e){this._colorMaskCache!==e&&(this._colorMaskCache=e,this._renderer.gl.colorMask(!!(e&8),!!(e&4),!!(e&2),!!(e&1)))}};tr.extension={type:[o.WebGLSystem],name:`colorMask`};var nr=class{constructor(e){this.commandFinished=Promise.resolve(),this._renderer=e}setGeometry(e,t){this._renderer.geometry.bind(e,t.glProgram)}finishRenderPass(){}draw(e){let t=this._renderer,{geometry:n,shader:r,state:i,skipSync:a,topology:o,size:s,start:c,instanceCount:l}=e;t.shader.bind(r,a),t.geometry.bind(n,t.shader._activeProgram),i&&t.state.set(i),t.geometry.draw(o,s,c,l??n.instanceCount)}destroy(){this._renderer=null}};nr.extension={type:[o.WebGLSystem],name:`encoder`};var rr=class{constructor(e){this._renderer=e}contextChange(){let e=this._renderer.gl;this.maxTextures=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),this.maxBatchableTextures=He(this.maxTextures,e);let t=this._renderer.context.webGLVersion===2;this.maxUniformBindings=t?e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS):0,this.minUniformBufferOffsetAlignment=t?e.getParameter(e.UNIFORM_BUFFER_OFFSET_ALIGNMENT):0}destroy(){}};rr.extension={type:[o.WebGLSystem],name:`limits`};var ir=class{constructor(e){this._stencilCache={enabled:!1,stencilReference:0,stencilMode:Ke.NONE},this._renderer=e,e.renderTarget.onRenderTargetChange.add(this)}contextChange(e){this._gl=e,this._comparisonFuncMapping={always:e.ALWAYS,never:e.NEVER,equal:e.EQUAL,"not-equal":e.NOTEQUAL,less:e.LESS,"less-equal":e.LEQUAL,greater:e.GREATER,"greater-equal":e.GEQUAL},this._stencilOpsMapping={keep:e.KEEP,zero:e.ZERO,replace:e.REPLACE,invert:e.INVERT,"increment-clamp":e.INCR,"decrement-clamp":e.DECR,"increment-wrap":e.INCR_WRAP,"decrement-wrap":e.DECR_WRAP},this._activeGpuRenderTarget=null,this.resetState()}onRenderTargetChange(e){if(this._activeRenderTarget===e)return;this._activeRenderTarget=e;let t=this._renderer.renderTarget.getGpuRenderTarget(e);this._activeGpuRenderTarget=t,this.setStencilMode(t.stencilMode,t.stencilReference)}resetState(){this._stencilCache.enabled=!1,this._stencilCache.stencilMode=Ke.NONE,this._stencilCache.stencilReference=0}setStencilMode(e,t){let n=this._activeGpuRenderTarget??(this._activeGpuRenderTarget=this._renderer.renderTarget.getGpuRenderTarget(this._activeRenderTarget)),r=this._gl,i=$e[e],a=this._stencilCache;n.stencilMode=e,n.stencilReference=t,e===Ke.DISABLED?this._stencilCache.enabled&&(this._stencilCache.enabled=!1,r.disable(r.STENCIL_TEST)):(this._stencilCache.enabled||(this._stencilCache.enabled=!0,r.enable(r.STENCIL_TEST)),(e!==a.stencilMode||a.stencilReference!==t)&&(a.stencilMode=e,a.stencilReference=t,r.stencilFunc(this._comparisonFuncMapping[i.stencilBack.compare],t,255),r.stencilOp(r.KEEP,r.KEEP,this._stencilOpsMapping[i.stencilBack.passOp])))}destroy(){this._renderer.renderTarget.onRenderTargetChange.remove(this),this._renderer=null,this._gl=null,this._activeRenderTarget=null,this._activeGpuRenderTarget=null}};ir.extension={type:[o.WebGLSystem],name:`stencil`};var ar={f32:4,i32:4,"vec2<f32>":8,"vec3<f32>":12,"vec4<f32>":16,"vec2<i32>":8,"vec3<i32>":12,"vec4<i32>":16,u32:4,"vec2<u32>":8,"vec3<u32>":12,"vec4<u32>":16,"mat2x2<f32>":32,"mat3x3<f32>":48,"mat4x4<f32>":64};function or(e){let t=e.map(e=>({data:e,offset:0,size:0})),n=0,r=0;for(let e=0;e<t.length;e++){let i=t[e];if(n=ar[i.data.type],!n)throw Error(`Unknown type ${i.data.type}`);i.data.size>1&&(n=Math.max(n,16)*i.data.size);let a=n===12?16:n;i.size=n;let o=r%16;o>0&&16-o<a?r+=(16-o)%16:r+=(n-o%n)%n,i.offset=r,r+=n}return r=Math.ceil(r/16)*16,{uboElements:t,size:r}}function sr(e,t){let n=Math.max(ar[e.data.type]/16,1),r=e.data.value.length/e.data.size,i=(4-r%4)%4,a=e.data.type.indexOf(`i32`)>=0?`dataInt32`:`data`;return`
        v = uv.${e.data.name};
        offset += ${t};

        arrayOffset = offset;

        t = 0;

        for(var i=0; i < ${e.data.size*n}; i++)
        {
            for(var j = 0; j < ${r}; j++)
            {
                ${a}[arrayOffset++] = v[t++];
            }
            ${i===0?``:`arrayOffset += ${i};`}
        }
    `}function cr(e){return Qe(e,ct,sr)}var lr=class extends lt{constructor(){super({createUboElements:or,generateUboSync:cr})}};lr.extension={type:[o.WebGLSystem],name:`ubo`};var ur=class{constructor(){this.width=-1,this.height=-1,this.msaa=!1,this._attachedMipLevel=0,this._attachedLayer=0,this._drawBuffersMask=-1,this._attachedDepthStencilRenderBuffer=null,this.stencilMode=Ke.DISABLED,this.stencilReference=0,this.maskStackIndex=0}},dr=class{constructor(){this._clearColorCache=[0,0,0,0],this._viewPortCache=new n,this._boundFramebuffer=void 0,this._canvasMultisampled=!1,this._clearUint=new Uint32Array(4),this._clearInt=new Int32Array(4)}init(e,t){this._renderer=e,this._renderTargetSystem=t,e.runners.contextChange.add(this)}contextChange(){this._clearColorCache=[0,0,0,0],this._viewPortCache=new n,this._boundFramebuffer=void 0;let e=this._renderer.gl;this._canvasMultisampled=!!e.getContextAttributes()?.antialias,this._drawBuffersCache=[]}copyToTexture(e,t,n,r,i){let a=this._renderTargetSystem,o=this._renderer,s=a.getGpuRenderTarget(e),c=o.gl;return this.finishRenderPass(e),c.bindFramebuffer(c.FRAMEBUFFER,s.resolveTargetFramebuffer),this._boundFramebuffer=s.resolveTargetFramebuffer,o.texture.bind(t,0),c.copyTexSubImage2D(c.TEXTURE_2D,0,i.x,i.y,n.x,n.y,r.width,r.height),t}copyDepthTexture(e,t,n,r,i){let a=this._renderTargetSystem,o=this._renderer.gl;this.finishRenderPass(e);let s=a.getRenderTarget(t),c=a.getGpuRenderTarget(e),l=a.getGpuRenderTarget(s),u=c.framebuffer;(c.msaa||e.isRoot&&this._canvasMultisampled)&&(n.x!==i.x||n.y!==i.y)&&(c.resolveTargetFramebuffer??(c.resolveTargetFramebuffer=o.createFramebuffer()),o.bindFramebuffer(o.FRAMEBUFFER,c.resolveTargetFramebuffer),this._attachDepthStencilTexture(e,0,0),o.bindFramebuffer(o.READ_FRAMEBUFFER,c.framebuffer),o.blitFramebuffer(n.x,n.y,n.x+r.width,n.y+r.height,n.x,n.y,n.x+r.width,n.y+r.height,o.DEPTH_BUFFER_BIT,o.NEAREST),u=c.resolveTargetFramebuffer),o.bindFramebuffer(o.READ_FRAMEBUFFER,u),o.bindFramebuffer(o.DRAW_FRAMEBUFFER,l.framebuffer),this._boundFramebuffer=void 0,o.blitFramebuffer(n.x,n.y,n.x+r.width,n.y+r.height,i.x,i.y,i.x+r.width,i.y+r.height,o.DEPTH_BUFFER_BIT,o.NEAREST)}startRenderPass(e,t=!0,n,r,i=0,a=0){let o=this._renderTargetSystem.getGpuRenderTarget(e);if(a!==0&&this._renderer.context.webGLVersion<2)throw Error(`[RenderTargetSystem] Rendering to array layers requires WebGL2.`);if(i>0){if(o.msaa)throw Error(`[RenderTargetSystem] Rendering to mip levels is not supported with MSAA render targets.`);if(this._renderer.context.webGLVersion<2)throw Error(`[RenderTargetSystem] Rendering to mip levels requires WebGL2.`)}e.colorAttachments.forEach(e=>{this._renderer.texture.unbind(e.texture)});let s=this._renderer.gl;this.bindFramebuffer(o.framebuffer),!e.isRoot&&e.colorAttachments.length>0&&(o._attachedMipLevel!==i||o._attachedLayer!==a)&&(e.colorAttachments.forEach((e,t)=>{let n=e.texture,r=this._renderer.texture.getGlSource(n);if(r.target===s.TEXTURE_2D){if(a!==0)throw Error(`[RenderTargetSystem] layer must be 0 when rendering to 2D textures in WebGL.`);s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+t,s.TEXTURE_2D,r.texture,i)}else if(r.target===s.TEXTURE_2D_ARRAY||r.target===s.TEXTURE_3D)s.framebufferTextureLayer(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+t,r.texture,i,a);else if(r.target===s.TEXTURE_CUBE_MAP){if(a<0||a>5)throw Error(`[RenderTargetSystem] Cube map layer must be between 0 and 5.`);s.framebufferTexture2D(s.FRAMEBUFFER,s.COLOR_ATTACHMENT0+t,s.TEXTURE_CUBE_MAP_POSITIVE_X+a,r.texture,i)}else throw Error(`[RenderTargetSystem] Unsupported texture target for render-to-layer in WebGL.`)}),o._attachedMipLevel=i,o._attachedLayer=a),o.framebuffer&&(e.depthStencilAttachment?o.msaa?this._attachMsaaDepthStencil(e,o):this._attachDepthStencilTexture(e,i,a):!o.depthStencilRenderBuffer&&(e.stencil||e.depth)&&this._initStencil(o));let c=e.colorAttachments.length;c>1&&o._drawBuffersMask===-1&&this._setDrawBuffers(e,(1<<c)-1);let l=r.y;e.isRoot&&(l=e.pixelHeight-r.height-r.y);let u=this._viewPortCache;(u.x!==r.x||u.y!==l||u.width!==r.width||u.height!==r.height)&&(u.x=r.x,u.y=l,u.width=r.width,u.height=r.height,s.viewport(r.x,l,r.width,r.height)),this.clear(e,t,n);let d=this._renderer.shader._activeProgram;c>1&&d&&this.setFragmentOutputs(d)}setFragmentOutputs(e){let t=this._renderTargetSystem.renderTarget,n=t?.colorAttachments.length??0;if(n<2||this._renderer.context.webGLVersion===1)return;let r=(1<<n)-1;this._setDrawBuffers(t,(e.fragmentOutputMask??r)&r)}_setDrawBuffers(e,t){if(e.colorAttachments.length<2)return;let n=this._renderTargetSystem.getGpuRenderTarget(e);if(n.framebuffer!==this._boundFramebuffer||n._drawBuffersMask===t)return;n._drawBuffersMask=t;let r=this._getDrawBuffers(t);if(this._renderer.context.webGLVersion===1){let e=this._renderer.context.extensions.drawBuffers;e?e.drawBuffersWEBGL(r):c(`[RenderTexture] This WebGL1 context does not support rendering to multiple targets`)}else this._renderer.gl.drawBuffers(r)}_getDrawBuffers(e){let t=this._drawBuffersCache[e];if(!t){let n=this._renderer.gl;t=this._drawBuffersCache[e]=[];for(let r=0;e>>r>0;r++)t[r]=e&1<<r?n.COLOR_ATTACHMENT0+r:n.NONE;t.length===0&&(t[0]=n.NONE)}return t}finishRenderPass(e){let t=this._renderTargetSystem.getGpuRenderTarget(e);if(!t.msaa||e.colorAttachments.length===0)return;let n=this._renderer.gl;n.bindFramebuffer(n.FRAMEBUFFER,t.resolveTargetFramebuffer),n.bindFramebuffer(n.READ_FRAMEBUFFER,t.framebuffer);let r=e.colorAttachments.length;if(r===1)n.blitFramebuffer(0,0,t.width,t.height,0,0,t.width,t.height,n.COLOR_BUFFER_BIT,n.NEAREST);else{for(let e=0;e<r;e++)n.readBuffer(n.COLOR_ATTACHMENT0+e),n.drawBuffers(this._getDrawBuffers(1<<e)),n.blitFramebuffer(0,0,t.width,t.height,0,0,t.width,t.height,n.COLOR_BUFFER_BIT,n.NEAREST);n.readBuffer(n.COLOR_ATTACHMENT0),n.drawBuffers(this._getDrawBuffers(1))}n.bindFramebuffer(n.FRAMEBUFFER,t.framebuffer),this._boundFramebuffer=t.framebuffer}initGpuRenderTarget(e){let t=this._renderer.gl,n=new ur;n._attachedMipLevel=0,n._attachedLayer=0;let r=e.colorTexture;return r instanceof D?(this._renderer.context.ensureCanvasSize(r.resource),n.framebuffer=null,n):(n.width=e.pixelWidth,n.height=e.pixelHeight,e.colorAttachments.length===0?this._initDepth(e,n):this._initColor(e,n),e.depthStencilAttachment&&!n.msaa&&this._attachDepthStencilTexture(e,0,0),t.bindFramebuffer(t.FRAMEBUFFER,null),this._boundFramebuffer=null,n)}destroyGpuRenderTarget(e){let t=this._renderer.gl;e.framebuffer&&(t.deleteFramebuffer(e.framebuffer),e.framebuffer=null),e.resolveTargetFramebuffer&&(t.deleteFramebuffer(e.resolveTargetFramebuffer),e.resolveTargetFramebuffer=null),e.depthStencilRenderBuffer&&(t.deleteRenderbuffer(e.depthStencilRenderBuffer),e.depthStencilRenderBuffer=null)}clear(e,t,n,r,i=0,a=0){if(a!==0)throw Error(`[RenderTargetSystem] Clearing array layers is not supported in WebGL renderer.`);typeof t==`boolean`&&(t=t?P.ALL:P.NONE);let o=e.colorAttachments,s=0;if(t&P.COLOR)for(let e=0;e<o.length;e++)o[e].loadOp!==`load`&&(s|=1<<e);if(s||(t&=~P.COLOR),!t)return;let c=this._renderer.gl,l=!!(t&P.DEPTH)&&!this._renderer.state.depthMaskEnabled;if(l&&c.depthMask(!0),t&P.COLOR){let r=this._renderTargetSystem.getGpuRenderTarget(e);if(this._renderer.context.webGLVersion===2&&(o.length>1||_(o[0].texture.format))&&r.framebuffer===this._boundFramebuffer){let i=r._drawBuffersMask;this._setDrawBuffers(e,(1<<o.length)-1),this._clearEachAttachment(e,s,n),i!==-1&&this._setDrawBuffers(e,i),t&=~P.COLOR}else{let e=o[0].clearValue??n??this._renderTargetSystem.defaultClearColor,t=this._clearColorCache;(t[0]!==e[0]||t[1]!==e[1]||t[2]!==e[2]||t[3]!==e[3])&&(t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],c.clearColor(e[0],e[1],e[2],e[3]))}}t&&c.clear(t),l&&c.depthMask(!1)}_clearEachAttachment(e,t,n){let r=this._renderer.gl,i=e.colorAttachments,a=n??this._renderTargetSystem.defaultClearColor;for(let e=0;e<i.length;e++){if(!(t&1<<e))continue;let n=i[e].texture.format,o=i[e].clearValue??a;n.endsWith(`uint`)?(this._clearUint.set(o),r.clearBufferuiv(r.COLOR,e,this._clearUint)):n.endsWith(`sint`)?(this._clearInt.set(o),r.clearBufferiv(r.COLOR,e,this._clearInt)):r.clearBufferfv(r.COLOR,e,o)}}resizeGpuRenderTarget(e){if(e.isRoot)return;let t=this._renderTargetSystem.getGpuRenderTarget(e);t.width=e.pixelWidth,t.height=e.pixelHeight,e.colorAttachments.length>0&&this._resizeColor(e,t),t.depthStencilRenderBuffer&&this._resizeStencil(t),this._boundFramebuffer=void 0}_initColor(e,t){let n=this._renderer,r=n.gl,i=r.createFramebuffer();t.resolveTargetFramebuffer=i,r.bindFramebuffer(r.FRAMEBUFFER,i),e.colorAttachments.forEach((e,i)=>{let a=e.texture;a.antialias&&(n.context.supports.msaa?t.msaa=!0:c(`[RenderTexture] Antialiasing on textures is not supported in WebGL1`)),n.texture.bindSource(a,0);let o=n.texture.getGlSource(a),s=o.texture;if(o.target===r.TEXTURE_2D)r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+i,r.TEXTURE_2D,s,0);else if(o.target===r.TEXTURE_2D_ARRAY||o.target===r.TEXTURE_3D)r.framebufferTextureLayer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+i,s,0,0);else if(o.target===r.TEXTURE_CUBE_MAP)r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+i,r.TEXTURE_CUBE_MAP_POSITIVE_X,s,0);else throw Error(`[RenderTargetSystem] Unsupported texture target for framebuffer attachment.`)}),t.framebuffer=t.msaa?r.createFramebuffer():i,this._resizeColor(e,t)}_initDepth(e,t){let n=this._renderer;if(n.context.webGLVersion<2)throw Error(`[RenderTargetSystem] Depth-only render targets require WebGL2.`);let r=n.gl,i=r.createFramebuffer();t.resolveTargetFramebuffer=i,t.framebuffer=i,r.bindFramebuffer(r.FRAMEBUFFER,i),r.drawBuffers([r.NONE]),r.readBuffer(r.NONE)}_resizeColor(e,t){let n=e.colorAttachments[0].texture;if(t._attachedMipLevel=0,t._attachedLayer=0,e.colorAttachments.forEach((e,t)=>{t!==0&&e.texture.resize(n.width,n.height,n._resolution)}),t.msaa){let n=this._renderer,r=n.gl;r.bindFramebuffer(r.FRAMEBUFFER,t.framebuffer),e.colorAttachments.forEach((e,t)=>{r.framebufferRenderbuffer(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0+t,r.RENDERBUFFER,n.texture.getMsaaRenderBuffer(e.texture))})}}_attachMsaaDepthStencil(e,t){let n=this._renderer.gl,r=this._renderer.texture,i=e.depthStencilAttachment.texture,a=t.depthStencilRenderBuffer;if(a){let e=r.getGlSource(i);!e.msaaRenderBuffer&&e.internalFormat===n.DEPTH24_STENCIL8?(e.msaaRenderBuffer=a,e.msaaWidth=t.width,e.msaaHeight=t.height,t._attachedDepthStencilRenderBuffer=a):n.deleteRenderbuffer(a),t.depthStencilRenderBuffer=null}let o=r.getMsaaRenderBuffer(i);t._attachedDepthStencilRenderBuffer!==o&&(t._attachedDepthStencilRenderBuffer=o,n.framebufferRenderbuffer(n.FRAMEBUFFER,this._getDepthStencilAttachmentPoint(e),n.RENDERBUFFER,o))}_attachDepthStencilTexture(e,t,n){let r=this._renderer,i=r.gl,a=e.depthStencilAttachment.texture,o=r.texture.getGlSource(a),s=o.texture,c=this._getDepthStencilAttachmentPoint(e);o.target===i.TEXTURE_2D?i.framebufferTexture2D(i.FRAMEBUFFER,c,i.TEXTURE_2D,s,t):o.target===i.TEXTURE_2D_ARRAY||o.target===i.TEXTURE_3D?i.framebufferTextureLayer(i.FRAMEBUFFER,c,s,t,n):o.target===i.TEXTURE_CUBE_MAP&&i.framebufferTexture2D(i.FRAMEBUFFER,c,i.TEXTURE_CUBE_MAP_POSITIVE_X+n,s,t)}_getDepthStencilAttachmentPoint(e){let t=this._renderer.gl,n=e.depthStencilAttachment.texture.format;return n===`depth24plus-stencil8`||n===`depth32float-stencil8`?t.DEPTH_STENCIL_ATTACHMENT:n===`stencil8`?t.STENCIL_ATTACHMENT:t.DEPTH_ATTACHMENT}_initStencil(e){if(e.framebuffer===null)return;let t=this._renderer.gl,n=t.createRenderbuffer();e.depthStencilRenderBuffer=n,t.bindRenderbuffer(t.RENDERBUFFER,n),t.framebufferRenderbuffer(t.FRAMEBUFFER,t.DEPTH_STENCIL_ATTACHMENT,t.RENDERBUFFER,n),this._resizeStencil(e)}_resizeStencil(e){let t=this._renderer.gl;t.bindRenderbuffer(t.RENDERBUFFER,e.depthStencilRenderBuffer),e.msaa?t.renderbufferStorageMultisample(t.RENDERBUFFER,4,t.DEPTH24_STENCIL8,e.width,e.height):t.renderbufferStorage(t.RENDERBUFFER,this._renderer.context.webGLVersion===2?t.DEPTH24_STENCIL8:t.DEPTH_STENCIL,e.width,e.height)}prerender(e){if(e.colorAttachments.length===0)return;let t=e.colorAttachments[0].texture.resource;this._renderer.context.multiView&&D.test(t)&&this._renderer.context.ensureCanvasSize(t)}postrender(e){if(!this._renderer.context.multiView||e.colorAttachments.length===0)return;let t=e.colorAttachments[0].texture;if(D.test(t.resource)){let e=this._renderer.context.canvas,n=t;n.context2D.drawImage(e,0,n.pixelHeight-e.height)}}resetState(){this._boundFramebuffer=void 0,this._viewPortCache=new n,this._clearColorCache=[0,0,0,0]}bindFramebuffer(e){this._boundFramebuffer!==e&&(this._boundFramebuffer=e,this._renderer.gl.bindFramebuffer(this._renderer.gl.FRAMEBUFFER,e))}},fr=class extends Le{constructor(e){super(e),this.adaptor=new dr,this.adaptor.init(e,this)}resetState(){this.adaptor.resetState()}};fr.extension={type:[o.WebGLSystem],name:`renderTarget`};var pr=class extends m{constructor(e,t){super(),this._resourceType=`textureView`,this._resourceId=d(`resource`),this.source=e,this.viewDescriptor=t,this._onChange=this._onChange.bind(this),this._onDestroy=this._onDestroy.bind(this),this.source.on(`change`,this._onChange),this.source.on(`destroy`,this._onDestroy)}_onChange(){this.emit(`change`,this)}_onDestroy(){this.destroy()}get destroyed(){return this.source.destroyed}destroy(){this.source&&(this.source.off(`change`,this._onChange),this.source.off(`destroy`,this._onDestroy)),this.emit(`destroy`,this),this.removeAllListeners()}};function mr(e){let t={};for(let n in e)t[e[n]]=n;return t}function hr(e,t){let n=[],r=[`
        var g = s.groups;
        var sS = r.shader;
        var p = s.glProgram;
        var ugS = r.uniformGroup;
        var resources;
    `],i=!1,a=0,o=t._getProgramData(e.glProgram);for(let s in e.groups){let c=e.groups[s],l=c.layout?mr(c.layout):e._uniformBindMap[s];n.push(`
            resources = g[${s}].resources;
        `);for(let s in c.resources){let u=c.resources[s];if(u instanceof g&&!u.ubo)n.push(`
                    ugS.updateUniformGroup(resources[${s}], p, sD);
                `);else if(u instanceof g||u instanceof at){let t=l[Number(s)];e.glProgram._uniformBlockData[t]&&n.push(`
                        sS.bindUniformBlock(
                            resources[${s}],
                            '${t}'
                        );
                    `)}else if(u instanceof f||u instanceof pr){let e=l[Number(s)],c=o.uniformData[e];c&&(i||(i=!0,r.push(`
                        var tS = r.texture;
                        `)),t._gl.uniform1i(c.location,a),n.push(`
                        tS.bind(resources[${s}], ${a});
                    `),a++)}}}let s=[...r,...n].join(`
`);return Function(`r`,`s`,`sD`,s)}var gr=class{constructor(e,t){this.program=e,this.uniformData=t,this.uniformGroups={},this.uniformDirtyGroups={}}destroy(){this.uniformData=null,this.uniformGroups=null,this.uniformDirtyGroups=null,this.program=null}};function _r(e,t,n){let r=e.createShader(t);return e.shaderSource(r,n),e.compileShader(r),r}function vr(e){let t=Array(e);for(let e=0;e<t.length;e++)t[e]=!1;return t}function yr(e,t){switch(e){case`float`:return 0;case`vec2`:return new Float32Array(2*t);case`vec3`:return new Float32Array(3*t);case`vec4`:return new Float32Array(4*t);case`int`:case`uint`:case`sampler2D`:case`sampler2DArray`:case`sampler3D`:return 0;case`ivec2`:return new Int32Array(2*t);case`ivec3`:return new Int32Array(3*t);case`ivec4`:return new Int32Array(4*t);case`uvec2`:return new Uint32Array(2*t);case`uvec3`:return new Uint32Array(3*t);case`uvec4`:return new Uint32Array(4*t);case`bool`:return!1;case`bvec2`:return vr(2*t);case`bvec3`:return vr(3*t);case`bvec4`:return vr(4*t);case`mat2`:return new Float32Array([1,0,0,1]);case`mat3`:return new Float32Array([1,0,0,0,1,0,0,0,1]);case`mat4`:return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])}return null}var br=null,xr={FLOAT:`float`,FLOAT_VEC2:`vec2`,FLOAT_VEC3:`vec3`,FLOAT_VEC4:`vec4`,INT:`int`,INT_VEC2:`ivec2`,INT_VEC3:`ivec3`,INT_VEC4:`ivec4`,UNSIGNED_INT:`uint`,UNSIGNED_INT_VEC2:`uvec2`,UNSIGNED_INT_VEC3:`uvec3`,UNSIGNED_INT_VEC4:`uvec4`,BOOL:`bool`,BOOL_VEC2:`bvec2`,BOOL_VEC3:`bvec3`,BOOL_VEC4:`bvec4`,FLOAT_MAT2:`mat2`,FLOAT_MAT3:`mat3`,FLOAT_MAT4:`mat4`,SAMPLER_2D:`sampler2D`,INT_SAMPLER_2D:`sampler2D`,UNSIGNED_INT_SAMPLER_2D:`sampler2D`,SAMPLER_2D_SHADOW:`sampler2DShadow`,SAMPLER_CUBE:`samplerCube`,INT_SAMPLER_CUBE:`samplerCube`,UNSIGNED_INT_SAMPLER_CUBE:`samplerCube`,SAMPLER_CUBE_SHADOW:`samplerCubeShadow`,SAMPLER_2D_ARRAY:`sampler2DArray`,INT_SAMPLER_2D_ARRAY:`sampler2DArray`,UNSIGNED_INT_SAMPLER_2D_ARRAY:`sampler2DArray`,SAMPLER_2D_ARRAY_SHADOW:`sampler2DArrayShadow`,SAMPLER_3D:`sampler3D`,INT_SAMPLER_3D:`sampler3D`,UNSIGNED_INT_SAMPLER_3D:`sampler3D`},Sr={float:`float32`,vec2:`float32x2`,vec3:`float32x3`,vec4:`float32x4`,int:`sint32`,ivec2:`sint32x2`,ivec3:`sint32x3`,ivec4:`sint32x4`,uint:`uint32`,uvec2:`uint32x2`,uvec3:`uint32x3`,uvec4:`uint32x4`,bool:`uint32`,bvec2:`uint32x2`,bvec3:`uint32x3`,bvec4:`uint32x4`};function Cr(e,t){if(!br){let t=Object.keys(xr);br={};for(let n=0;n<t.length;++n){let r=t[n];br[e[r]]=xr[r]}}return br[t]}function wr(e,t){return Sr[Cr(e,t)]||`float32`}function Tr(e,t,n=!1){let r={},i=t.getProgramParameter(e,t.ACTIVE_ATTRIBUTES);for(let n=0;n<i;n++){let i=t.getActiveAttrib(e,n);if(i.name.startsWith(`gl_`))continue;let a=wr(t,i.type);r[i.name]={location:0,format:a,stride:ae(a).stride,offset:0,instance:!1,start:0}}let a=Object.keys(r);if(n){a.sort((e,t)=>e>t?1:-1);for(let n=0;n<a.length;n++)r[a[n]].location=n,t.bindAttribLocation(e,n,a[n]);t.linkProgram(e)}else for(let n=0;n<a.length;n++)r[a[n]].location=t.getAttribLocation(e,a[n]);return r}function Er(e,t,n=0){if(!t.ACTIVE_UNIFORM_BLOCKS)return{};let r={},i=t.getProgramParameter(e,t.ACTIVE_UNIFORM_BLOCKS);for(let a=0;a<i;a++){let i=t.getActiveUniformBlockName(e,a),o=t.getUniformBlockIndex(e,i),s=t.getActiveUniformBlockParameter(e,a,t.UNIFORM_BLOCK_DATA_SIZE);r[i]={name:i,index:o,binding:o+n,size:s}}return r}function Dr(e,t){let n={},r=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let i=0;i<r;i++){let r=t.getActiveUniform(e,i),a=r.name.replace(/\[.*?\]$/,``),o=!!r.name.match(/\[.*?\]$/),s=Cr(t,r.type);n[a]={name:a,index:i,type:s,size:r.size,isArray:o,value:yr(s,r.size)}}return n}function Or(e,t){let n=e.getShaderSource(t);if(n===null){console.error(`PixiJS Error: Could not retrieve shader source (WebGL context may be lost).`);return}let r=n.split(`
`).map((e,t)=>`${t}: ${e}`),i=e.getShaderInfoLog(t)??``,a=i.split(`
`),o={},s=a.map(e=>parseFloat(e.replace(/^ERROR\: 0\:([\d]+)\:.*$/,`$1`))).filter(e=>e&&!o[e]?(o[e]=!0,!0):!1),c=[``];s.forEach(e=>{r[e-1]=`%c${r[e-1]}%c`,c.push(`background: #FF0000; color:#FFFFFF; font-size: 10px`,`font-size: 10px`)}),c[0]=r.join(`
`),console.error(i),console.groupCollapsed(`click to view full shader code`),console.warn(...c),console.groupEnd()}function kr(e,t,n,r){e.getProgramParameter(t,e.LINK_STATUS)||(e.getShaderParameter(n,e.COMPILE_STATUS)||Or(e,n),e.getShaderParameter(r,e.COMPILE_STATUS)||Or(e,r),console.error(`PixiJS Error: Could not initialize shader.`),e.getProgramInfoLog(t)!==``&&console.warn(`PixiJS Warning: gl.getProgramInfoLog()`,e.getProgramInfoLog(t)))}function Ar(e,t){let n=_r(e,e.VERTEX_SHADER,t.vertex),r=_r(e,e.FRAGMENT_SHADER,t.fragment),i=e.createProgram();e.attachShader(i,n),e.attachShader(i,r);let a=t.transformFeedbackVaryings;a&&(typeof e.transformFeedbackVaryings==`function`?e.transformFeedbackVaryings(i,a.names,a.bufferMode===`separate`?e.SEPARATE_ATTRIBS:e.INTERLEAVED_ATTRIBS):c(`TransformFeedback is not supported but TransformFeedbackVaryings are given.`)),e.linkProgram(i),e.getProgramParameter(i,e.LINK_STATUS)||kr(e,i,n,r),t._attributeData=Tr(i,e,!/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(t.vertex)),t._uniformData=Dr(i,e),t._uniformBlockData=Er(i,e,+!!a);for(let n in t._uniformBlockData){let{index:r,binding:a}=t._uniformBlockData[n];e.uniformBlockBinding(i,r,a)}e.deleteShader(n),e.deleteShader(r);let o={};for(let n in t._uniformData){let r=t._uniformData[n];o[n]={location:e.getUniformLocation(i,n),value:yr(r.type,r.size)}}return new gr(i,o)}var jr={textureCount:0},Mr=class{constructor(e){this._activeProgram=null,this._programDataHash=Object.create(null),this._shaderSyncFunctions=Object.create(null),this._renderer=e}contextChange(e){this._gl=e,this._programDataHash=Object.create(null),this._shaderSyncFunctions=Object.create(null),this._activeProgram=null}bind(e,t){if(this._setProgram(e.glProgram),t)return;jr.textureCount=0;let n=this._shaderSyncFunctions[e.glProgram._key];n||(n=this._shaderSyncFunctions[e.glProgram._key]=this._generateShaderSync(e,this)),n(this._renderer,e,jr)}updateUniformGroup(e){this._renderer.uniformGroup.updateUniformGroup(e,this._activeProgram,jr)}bindUniformBlock(e,t){let n=this._renderer.buffer,{binding:r}=this._activeProgram._uniformBlockData[t],i=e._bufferResource;i||this._renderer.ubo.updateUniformGroup(e);let a=n.updateBuffer(e.buffer);if(!i){n.bindBufferBase(a,r);return}let{offset:o,size:s}=e;if(o===0&&(s===void 0||s===a.byteLength)){n.bindBufferBase(a,r);return}let l=this._renderer.limits.minUniformBufferOffsetAlignment;o%l!==0&&c(`[GlShaderSystem] uniform block "${t}" has a BufferResource offset of ${o}, which is not a multiple of renderer.limits.minUniformBufferOffsetAlignment (${l}). WebGL will not bind it.`),n.bindBufferRange(a,r,o,s)}_setProgram(e){if(this._activeProgram===e)return;this._activeProgram=e;let t=this._getProgramData(e);this._gl.useProgram(t.program),this._renderer.renderTarget.adaptor.setFragmentOutputs(e)}_getProgramData(e){return this._programDataHash[e._key]||this._createProgramData(e)}_createProgramData(e){let t=e._key;return this._programDataHash[t]=Ar(this._gl,e),this._programDataHash[t]}destroy(){for(let e of Object.keys(this._programDataHash))this._programDataHash[e].destroy();this._programDataHash=null,this._shaderSyncFunctions=null,this._activeProgram=null,this._renderer=null,this._gl=null}_generateShaderSync(e,t){return hr(e,t)}resetState(){this._activeProgram=null}};Mr.extension={type:[o.WebGLSystem],name:`shader`};var Nr={f32:`if (cv !== v) {
            cu.value = v;
            gl.uniform1f(location, v);
        }`,"vec2<f32>":`if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2f(location, v[0], v[1]);
        }`,"vec3<f32>":`if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3f(location, v[0], v[1], v[2]);
        }`,"vec4<f32>":`if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4f(location, v[0], v[1], v[2], v[3]);
        }`,i32:`if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,"vec2<i32>":`if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,"vec3<i32>":`if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,"vec4<i32>":`if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,u32:`if (cv !== v) {
            cu.value = v;
            gl.uniform1ui(location, v);
        }`,"vec2<u32>":`if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2ui(location, v[0], v[1]);
        }`,"vec3<u32>":`if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3ui(location, v[0], v[1], v[2]);
        }`,"vec4<u32>":`if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4ui(location, v[0], v[1], v[2], v[3]);
        }`,bool:`if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,"vec2<bool>":`if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,"vec3<bool>":`if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,"vec4<bool>":`if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,"mat2x2<f32>":`gl.uniformMatrix2fv(location, false, v);`,"mat3x3<f32>":`gl.uniformMatrix3fv(location, false, v);`,"mat4x4<f32>":`gl.uniformMatrix4fv(location, false, v);`},Pr={f32:`gl.uniform1fv(location, v);`,"vec2<f32>":`gl.uniform2fv(location, v);`,"vec3<f32>":`gl.uniform3fv(location, v);`,"vec4<f32>":`gl.uniform4fv(location, v);`,"mat2x2<f32>":`gl.uniformMatrix2fv(location, false, v);`,"mat3x3<f32>":`gl.uniformMatrix3fv(location, false, v);`,"mat4x4<f32>":`gl.uniformMatrix4fv(location, false, v);`,i32:`gl.uniform1iv(location, v);`,"vec2<i32>":`gl.uniform2iv(location, v);`,"vec3<i32>":`gl.uniform3iv(location, v);`,"vec4<i32>":`gl.uniform4iv(location, v);`,u32:`gl.uniform1iv(location, v);`,"vec2<u32>":`gl.uniform2iv(location, v);`,"vec3<u32>":`gl.uniform3iv(location, v);`,"vec4<u32>":`gl.uniform4iv(location, v);`,bool:`gl.uniform1iv(location, v);`,"vec2<bool>":`gl.uniform2iv(location, v);`,"vec3<bool>":`gl.uniform3iv(location, v);`,"vec4<bool>":`gl.uniform4iv(location, v);`};function Fr(e,t){let n=[`
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
        var name = null;
    `];for(let r in e.uniforms){if(!t[r]){e.uniforms[r]instanceof g?e.uniforms[r].ubo?n.push(`
                        renderer.shader.bindUniformBlock(uv.${r}, "${r}");
                    `):n.push(`
                        renderer.shader.updateUniformGroup(uv.${r});
                    `):e.uniforms[r]instanceof at&&n.push(`
                        renderer.shader.bindBufferResource(uv.${r}, "${r}");
                    `);continue}let i=e.uniformStructures[r],a=!1;for(let e=0;e<ot.length;e++){let t=ot[e];if(i.type===t.type&&t.test(i)){n.push(`name = "${r}";`,ot[e].uniform),a=!0;break}}if(!a){let e=(i.size===1?Nr:Pr)[i.type].replace(`location`,`ud["${r}"].location`);n.push(`
            cu = ud["${r}"];
            cv = cu.value;
            v = uv["${r}"];
            ${e};`)}}return Function(`ud`,`uv`,`renderer`,`syncData`,n.join(`
`))}var Ir=class{constructor(e){this._cache={},this._uniformGroupSyncHash={},this._renderer=e,this.gl=null,this._cache={}}contextChange(e){this.gl=e}updateUniformGroup(e,t,n){let r=this._renderer.shader._getProgramData(t);e.isStatic&&e._dirtyId===r.uniformDirtyGroups[e.uid]||(r.uniformDirtyGroups[e.uid]=e._dirtyId,this._getUniformSyncFunction(e,t)(r.uniformData,e.uniforms,this._renderer,n))}_getUniformSyncFunction(e,t){return this._uniformGroupSyncHash[e._signature]?.[t._key]||this._createUniformSyncFunction(e,t)}_createUniformSyncFunction(e,t){let n=this._uniformGroupSyncHash[e._signature]||(this._uniformGroupSyncHash[e._signature]={}),r=this._getSignature(e,t._uniformData,`u`);return this._cache[r]||(this._cache[r]=this._generateUniformsSync(e,t._uniformData)),n[t._key]=this._cache[r],n[t._key]}_generateUniformsSync(e,t){return Fr(e,t)}_getSignature(e,t,n){let r=e.uniforms,i=[`${n}-`];for(let e in r)i.push(e),t[e]&&i.push(t[e].type);return i.join(`-`)}destroy(){this._renderer=null,this._cache=null}};Ir.extension={type:[o.WebGLSystem],name:`uniformGroup`};function Lr(e){let t={};if(t.normal=[e.ONE,e.ONE_MINUS_SRC_ALPHA],t.add=[e.ONE,e.ONE],t.multiply=[e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA],t.screen=[e.ONE,e.ONE_MINUS_SRC_COLOR,e.ONE,e.ONE_MINUS_SRC_ALPHA],t.none=[0,0],t[`normal-npm`]=[e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA],t[`add-npm`]=[e.SRC_ALPHA,e.ONE,e.ONE,e.ONE],t[`screen-npm`]=[e.SRC_ALPHA,e.ONE_MINUS_SRC_COLOR,e.ONE,e.ONE_MINUS_SRC_ALPHA],t.erase=[e.ZERO,e.ONE_MINUS_SRC_ALPHA],!(e instanceof b.get().getWebGLRenderingContext()))t.min=[e.ONE,e.ONE,e.ONE,e.ONE,e.MIN,e.MIN],t.max=[e.ONE,e.ONE,e.ONE,e.ONE,e.MAX,e.MAX];else{let n=e.getExtension(`EXT_blend_minmax`);n&&(t.min=[e.ONE,e.ONE,e.ONE,e.ONE,n.MIN_EXT,n.MIN_EXT],t.max=[e.ONE,e.ONE,e.ONE,e.ONE,n.MAX_EXT,n.MAX_EXT])}return t}var{BLEND:Rr,OFFSET:zr,CULLING:Br,DEPTH_TEST:Vr,WINDING:Hr,DEPTH_MASK:Ur}=O,Wr=class e{constructor(e){this._invertFrontFace=!1,this._renderer=e,this.gl=null,this.stateId=0,this.polygonOffset=0,this.blendMode=`none`,this._blendEq=!1,this.map=[],this.map[Rr]=this.setBlend,this.map[zr]=this.setOffset,this.map[Br]=this.setCullFace,this.map[Vr]=this.setDepthTest,this.map[Hr]=this.setFrontFace,this.map[Ur]=this.setDepthMask,this.checks=[],this.defaultState=ge.for2d(),e.renderTarget.onRenderTargetChange.add(this)}onRenderTargetChange(e){this._invertFrontFace=this._renderer.renderTarget.isFrontFaceInverted(e,e.flipY),this._cullFace?this.setFrontFace(this._frontFace):this._frontFaceDirty=!0}contextChange(e){this.gl=e,this.blendModesMap=Lr(e),this.resetState()}set(e){if(e||(e=this.defaultState),this.stateId!==e.data){let t=this.stateId^e.data,n=0;for(;t;)t&1&&this.map[n].call(this,!!(e.data&1<<n)),t>>=1,n++;this.stateId=e.data}for(let t=0;t<this.checks.length;t++)this.checks[t](this,e)}forceState(e){e||(e=this.defaultState);for(let t=0;t<this.map.length;t++)this.map[t].call(this,!!(e.data&1<<t));for(let t=0;t<this.checks.length;t++)this.checks[t](this,e);this.stateId=e.data}setBlend(t){this._updateCheck(e._checkBlendMode,t),this.gl[t?`enable`:`disable`](this.gl.BLEND)}setOffset(t){this._updateCheck(e._checkPolygonOffset,t),this.gl[t?`enable`:`disable`](this.gl.POLYGON_OFFSET_FILL)}setDepthTest(e){this.gl[e?`enable`:`disable`](this.gl.DEPTH_TEST)}setDepthMask(e){this.gl.depthMask(e)}get depthMaskEnabled(){return!!(this.stateId&1<<Ur)}setCullFace(e){this._cullFace=e,this.gl[e?`enable`:`disable`](this.gl.CULL_FACE),this._cullFace&&this._frontFaceDirty&&this.setFrontFace(this._frontFace)}setFrontFace(e){this._frontFace=e,this._frontFaceDirty=!1;let t=this._invertFrontFace?!e:e;this._glFrontFace!==t&&(this._glFrontFace=t,this.gl.frontFace(this.gl[t?`CW`:`CCW`]))}setBlendMode(e){if(this.blendModesMap[e]||(e=`normal`),e===this.blendMode)return;this.blendMode=e;let t=this.blendModesMap[e],n=this.gl;t.length===2?n.blendFunc(t[0],t[1]):n.blendFuncSeparate(t[0],t[1],t[2],t[3]),t.length===6?(this._blendEq=!0,n.blendEquationSeparate(t[4],t[5])):this._blendEq&&(this._blendEq=!1,n.blendEquationSeparate(n.FUNC_ADD,n.FUNC_ADD))}setPolygonOffset(e,t){this.gl.polygonOffset(e,t)}resetState(){this._glFrontFace=!1,this._frontFace=!1,this._cullFace=!1,this._frontFaceDirty=!1,this._invertFrontFace=!1,this.gl.frontFace(this.gl.CCW),this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL,!1),this.forceState(this.defaultState),this._blendEq=!0,this.blendMode=``,this.setBlendMode(`normal`)}_updateCheck(e,t){let n=this.checks.indexOf(e);t&&n===-1?this.checks.push(e):!t&&n!==-1&&this.checks.splice(n,1)}static _checkBlendMode(e,t){e.setBlendMode(t.blendMode)}static _checkPolygonOffset(e,t){e.setPolygonOffset(1,t.polygonOffset)}destroy(){this.gl=null,this.checks.length=0,this._renderer=null}};Wr.extension={type:[o.WebGLSystem],name:`state`};var Gr=Wr,Kr=class{constructor(e){this.target=Kn.TEXTURE_2D,this._layerInitMask=0,this.msaaRenderBuffer=null,this.msaaWidth=-1,this.msaaHeight=-1,this.texture=e,this.width=-1,this.height=-1,this.type=z.UNSIGNED_BYTE,this.internalFormat=Gn.RGBA,this.format=Gn.RGBA,this.samplerType=0}destroy(){}},qr=[new n,new n,new n],Jr={id:`buffer`,upload(e,t,n,r,i,a=!1){let o=i||t.target,s=e.resource;if(o===Kn.TEXTURE_3D||o===Kn.TEXTURE_2D_ARRAY){a||t.width!==e.width||t.height!==e.height?n.texImage3D(o,0,t.internalFormat,e.width,e.height,e.depthOrArrayLayers,0,t.format,t.type,s):n.texSubImage3D(o,0,0,0,0,e.width,e.height,e.depthOrArrayLayers,t.format,t.type,s),t.width=e.width,t.height=e.height;return}let c=e.width*e.height,l=a||t.width!==e.width||t.height!==e.height,u=e._updateStart>0||e._updateEnd<c;if(l)n.texImage2D(o,0,t.internalFormat,e.width,e.height,0,t.format,t.type,s);else if(u){let r=s.length/c,i=ut(e._updateStart,e._updateEnd,e.width,e.height,qr);for(let a=0;a<i;a++){let i=qr[a],c=(i.y*e.width+i.x)*r;n.texSubImage2D(o,0,i.x,i.y,i.width,i.height,t.format,t.type,s.subarray(c,c+i.width*i.height*r))}}else n.texSubImage2D(o,0,0,0,e.width,e.height,t.format,t.type,s);t.width=e.width,t.height=e.height}},Yr={"bc1-rgba-unorm":!0,"bc1-rgba-unorm-srgb":!0,"bc2-rgba-unorm":!0,"bc2-rgba-unorm-srgb":!0,"bc3-rgba-unorm":!0,"bc3-rgba-unorm-srgb":!0,"bc4-r-unorm":!0,"bc4-r-snorm":!0,"bc5-rg-unorm":!0,"bc5-rg-snorm":!0,"bc6h-rgb-ufloat":!0,"bc6h-rgb-float":!0,"bc7-rgba-unorm":!0,"bc7-rgba-unorm-srgb":!0,"etc2-rgb8unorm":!0,"etc2-rgb8unorm-srgb":!0,"etc2-rgb8a1unorm":!0,"etc2-rgb8a1unorm-srgb":!0,"etc2-rgba8unorm":!0,"etc2-rgba8unorm-srgb":!0,"eac-r11unorm":!0,"eac-r11snorm":!0,"eac-rg11unorm":!0,"eac-rg11snorm":!0,"astc-4x4-unorm":!0,"astc-4x4-unorm-srgb":!0,"astc-5x4-unorm":!0,"astc-5x4-unorm-srgb":!0,"astc-5x5-unorm":!0,"astc-5x5-unorm-srgb":!0,"astc-6x5-unorm":!0,"astc-6x5-unorm-srgb":!0,"astc-6x6-unorm":!0,"astc-6x6-unorm-srgb":!0,"astc-8x5-unorm":!0,"astc-8x5-unorm-srgb":!0,"astc-8x6-unorm":!0,"astc-8x6-unorm-srgb":!0,"astc-8x8-unorm":!0,"astc-8x8-unorm-srgb":!0,"astc-10x5-unorm":!0,"astc-10x5-unorm-srgb":!0,"astc-10x6-unorm":!0,"astc-10x6-unorm-srgb":!0,"astc-10x8-unorm":!0,"astc-10x8-unorm-srgb":!0,"astc-10x10-unorm":!0,"astc-10x10-unorm-srgb":!0,"astc-12x10-unorm":!0,"astc-12x10-unorm-srgb":!0,"astc-12x12-unorm":!0,"astc-12x12-unorm-srgb":!0},Xr={id:`compressed`,upload(e,t,n,r,i,a){let o=i??t.target;n.pixelStorei(n.UNPACK_ALIGNMENT,4);let s=e.pixelWidth,c=e.pixelHeight,l=!!Yr[e.format];for(let r=0;r<e.resource.length;r++){let i=e.resource[r];l?n.compressedTexImage2D(o,r,t.internalFormat,s,c,0,i):n.texImage2D(o,r,t.internalFormat,s,c,0,t.format,t.type,i),s=Math.max(s>>1,1),c=Math.max(c>>1,1)}}},Zr=[`right`,`left`,`top`,`bottom`,`front`,`back`];function Qr(e){return{id:`cube`,upload(t,n,r,i){let a=t.faces;for(let t=0;t<Zr.length;t++){let o=a[Zr[t]];o.resource&&((e[o.uploadMethodId]||e.image).upload(o,n,r,i,Kn.TEXTURE_CUBE_MAP_POSITIVE_X+t,!(n._layerInitMask&1<<t)),n._layerInitMask|=1<<t)}n.width=t.pixelWidth,n.height=t.pixelHeight}}}var $r={id:`image`,upload(e,t,n,r,i,a=!1){let o=i||t.target,s=e.pixelWidth,c=e.pixelHeight,l=e.resourceWidth,u=e.resourceHeight,d=r===2,f=a||t.width!==s||t.height!==c,p=l>=s&&u>=c,m=e.resource;(d?ei:ti)(n,o,t,s,c,l,u,m,f,p),t.width=s,t.height=c}};function ei(e,t,n,r,i,a,o,s,c,l){l?c?e.texImage2D(t,0,n.internalFormat,r,i,0,n.format,n.type,s):e.texSubImage2D(t,0,0,0,n.format,n.type,s):(c&&e.texImage2D(t,0,n.internalFormat,r,i,0,n.format,n.type,null),e.texSubImage2D(t,0,0,0,a,o,n.format,n.type,s))}function ti(e,t,n,r,i,a,o,s,c,l){l?c?e.texImage2D(t,0,n.internalFormat,n.format,n.type,s):e.texSubImage2D(t,0,0,0,n.format,n.type,s):(c&&e.texImage2D(t,0,n.internalFormat,r,i,0,n.format,n.type,null),e.texSubImage2D(t,0,0,0,n.format,n.type,s))}function ni(){let{userAgent:e}=b.get().getNavigator();return/^((?!chrome|android).)*safari/i.test(e)}var ri=ni(),ii={id:`video`,upload(e,t,n,r,i,a=ri){if(e.isValid)$r.upload(e,t,n,r,i,a);else{let e=i??t.target;n.texImage2D(e,0,t.internalFormat,1,1,0,t.format,t.type,null)}}},ai={linear:9729,nearest:9728},oi={linear:{linear:9987,nearest:9985},nearest:{linear:9986,nearest:9984}},si={"clamp-to-edge":33071,repeat:10497,"mirror-repeat":33648},ci={never:512,less:513,equal:514,"less-equal":515,greater:516,"not-equal":517,"greater-equal":518,always:519};function li(e,t,n,r,i,a,o,s){let c=a;if(!s||e.addressModeU!==`repeat`||e.addressModeV!==`repeat`||e.addressModeW!==`repeat`){let n=si[o?`clamp-to-edge`:e.addressModeU],r=si[o?`clamp-to-edge`:e.addressModeV],a=si[o?`clamp-to-edge`:e.addressModeW];t[i](c,t.TEXTURE_WRAP_S,n),t[i](c,t.TEXTURE_WRAP_T,r),t.TEXTURE_WRAP_R&&t[i](c,t.TEXTURE_WRAP_R,a)}if(s&&e.magFilter===`linear`||t[i](c,t.TEXTURE_MAG_FILTER,ai[e.magFilter]),n){if(!s||e.mipmapFilter!==`linear`){let n=oi[e.minFilter][e.mipmapFilter];t[i](c,t.TEXTURE_MIN_FILTER,n)}}else t[i](c,t.TEXTURE_MIN_FILTER,ai[e.minFilter]);if(r&&e.maxAnisotropy>1){let n=Math.min(e.maxAnisotropy,t.getParameter(r.MAX_TEXTURE_MAX_ANISOTROPY_EXT));t[i](c,r.TEXTURE_MAX_ANISOTROPY_EXT,n)}e.compare?(t[i](c,t.TEXTURE_COMPARE_FUNC,ci[e.compare]),t[i](c,t.TEXTURE_COMPARE_MODE,t.COMPARE_REF_TO_TEXTURE)):!s&&t.TEXTURE_COMPARE_MODE&&t[i](c,t.TEXTURE_COMPARE_MODE,t.NONE)}function ui(e){return{r8unorm:e.RED,r8snorm:e.RED,r8uint:e.RED_INTEGER,r8sint:e.RED_INTEGER,r16uint:e.RED_INTEGER,r16sint:e.RED_INTEGER,r16float:e.RED,rg8unorm:e.RG,rg8snorm:e.RG,rg8uint:e.RG_INTEGER,rg8sint:e.RG_INTEGER,r32uint:e.RED_INTEGER,r32sint:e.RED_INTEGER,r32float:e.RED,rg16uint:e.RG_INTEGER,rg16sint:e.RG_INTEGER,rg16float:e.RG,rgba8unorm:e.RGBA,"rgba8unorm-srgb":e.RGBA,rgba8snorm:e.RGBA,rgba8uint:e.RGBA_INTEGER,rgba8sint:e.RGBA_INTEGER,bgra8unorm:e.RGBA,"bgra8unorm-srgb":e.RGBA,rgb9e5ufloat:e.RGB,rgb10a2unorm:e.RGBA,rg11b10ufloat:e.RGB,rg32uint:e.RG_INTEGER,rg32sint:e.RG_INTEGER,rg32float:e.RG,rgba16uint:e.RGBA_INTEGER,rgba16sint:e.RGBA_INTEGER,rgba16float:e.RGBA,rgba32uint:e.RGBA_INTEGER,rgba32sint:e.RGBA_INTEGER,rgba32float:e.RGBA,stencil8:e.STENCIL_INDEX8,depth16unorm:e.DEPTH_COMPONENT,depth24plus:e.DEPTH_COMPONENT,"depth24plus-stencil8":e.DEPTH_STENCIL,depth32float:e.DEPTH_COMPONENT,"depth32float-stencil8":e.DEPTH_STENCIL}}function di(e,t){let n={},r=e.RGBA;return e instanceof b.get().getWebGLRenderingContext()?t.srgb&&(n={"rgba8unorm-srgb":t.srgb.SRGB8_ALPHA8_EXT,"bgra8unorm-srgb":t.srgb.SRGB8_ALPHA8_EXT}):(n={"rgba8unorm-srgb":e.SRGB8_ALPHA8,"bgra8unorm-srgb":e.SRGB8_ALPHA8},r=e.RGBA8),{r8unorm:e.R8,r8snorm:e.R8_SNORM,r8uint:e.R8UI,r8sint:e.R8I,r16uint:e.R16UI,r16sint:e.R16I,r16float:e.R16F,rg8unorm:e.RG8,rg8snorm:e.RG8_SNORM,rg8uint:e.RG8UI,rg8sint:e.RG8I,r32uint:e.R32UI,r32sint:e.R32I,r32float:e.R32F,rg16uint:e.RG16UI,rg16sint:e.RG16I,rg16float:e.RG16F,rgba8unorm:e.RGBA,...n,rgba8snorm:e.RGBA8_SNORM,rgba8uint:e.RGBA8UI,rgba8sint:e.RGBA8I,bgra8unorm:r,rgb9e5ufloat:e.RGB9_E5,rgb10a2unorm:e.RGB10_A2,rg11b10ufloat:e.R11F_G11F_B10F,rg32uint:e.RG32UI,rg32sint:e.RG32I,rg32float:e.RG32F,rgba16uint:e.RGBA16UI,rgba16sint:e.RGBA16I,rgba16float:e.RGBA16F,rgba32uint:e.RGBA32UI,rgba32sint:e.RGBA32I,rgba32float:e.RGBA32F,stencil8:e.STENCIL_INDEX8,depth16unorm:e.DEPTH_COMPONENT16,depth24plus:e.DEPTH_COMPONENT24,"depth24plus-stencil8":e.DEPTH24_STENCIL8,depth32float:e.DEPTH_COMPONENT32F,"depth32float-stencil8":e.DEPTH32F_STENCIL8,...t.s3tc?{"bc1-rgba-unorm":t.s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,"bc2-rgba-unorm":t.s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,"bc3-rgba-unorm":t.s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT}:{},...t.s3tc_sRGB?{"bc1-rgba-unorm-srgb":t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,"bc2-rgba-unorm-srgb":t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,"bc3-rgba-unorm-srgb":t.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}:{},...t.rgtc?{"bc4-r-unorm":t.rgtc.COMPRESSED_RED_RGTC1_EXT,"bc4-r-snorm":t.rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,"bc5-rg-unorm":t.rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,"bc5-rg-snorm":t.rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}:{},...t.bptc?{"bc6h-rgb-float":t.bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,"bc6h-rgb-ufloat":t.bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,"bc7-rgba-unorm":t.bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,"bc7-rgba-unorm-srgb":t.bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT}:{},...t.etc?{"etc2-rgb8unorm":t.etc.COMPRESSED_RGB8_ETC2,"etc2-rgb8unorm-srgb":t.etc.COMPRESSED_SRGB8_ETC2,"etc2-rgb8a1unorm":t.etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,"etc2-rgb8a1unorm-srgb":t.etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,"etc2-rgba8unorm":t.etc.COMPRESSED_RGBA8_ETC2_EAC,"etc2-rgba8unorm-srgb":t.etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,"eac-r11unorm":t.etc.COMPRESSED_R11_EAC,"eac-rg11unorm":t.etc.COMPRESSED_SIGNED_RG11_EAC}:{},...t.astc?{"astc-4x4-unorm":t.astc.COMPRESSED_RGBA_ASTC_4x4_KHR,"astc-4x4-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,"astc-5x4-unorm":t.astc.COMPRESSED_RGBA_ASTC_5x4_KHR,"astc-5x4-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,"astc-5x5-unorm":t.astc.COMPRESSED_RGBA_ASTC_5x5_KHR,"astc-5x5-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,"astc-6x5-unorm":t.astc.COMPRESSED_RGBA_ASTC_6x5_KHR,"astc-6x5-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,"astc-6x6-unorm":t.astc.COMPRESSED_RGBA_ASTC_6x6_KHR,"astc-6x6-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,"astc-8x5-unorm":t.astc.COMPRESSED_RGBA_ASTC_8x5_KHR,"astc-8x5-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,"astc-8x6-unorm":t.astc.COMPRESSED_RGBA_ASTC_8x6_KHR,"astc-8x6-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,"astc-8x8-unorm":t.astc.COMPRESSED_RGBA_ASTC_8x8_KHR,"astc-8x8-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,"astc-10x5-unorm":t.astc.COMPRESSED_RGBA_ASTC_10x5_KHR,"astc-10x5-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,"astc-10x6-unorm":t.astc.COMPRESSED_RGBA_ASTC_10x6_KHR,"astc-10x6-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,"astc-10x8-unorm":t.astc.COMPRESSED_RGBA_ASTC_10x8_KHR,"astc-10x8-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,"astc-10x10-unorm":t.astc.COMPRESSED_RGBA_ASTC_10x10_KHR,"astc-10x10-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,"astc-12x10-unorm":t.astc.COMPRESSED_RGBA_ASTC_12x10_KHR,"astc-12x10-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,"astc-12x12-unorm":t.astc.COMPRESSED_RGBA_ASTC_12x12_KHR,"astc-12x12-unorm-srgb":t.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR}:{}}}function fi(e){return{r8unorm:e.UNSIGNED_BYTE,r8snorm:e.BYTE,r8uint:e.UNSIGNED_BYTE,r8sint:e.BYTE,r16uint:e.UNSIGNED_SHORT,r16sint:e.SHORT,r16float:e.HALF_FLOAT,rg8unorm:e.UNSIGNED_BYTE,rg8snorm:e.BYTE,rg8uint:e.UNSIGNED_BYTE,rg8sint:e.BYTE,r32uint:e.UNSIGNED_INT,r32sint:e.INT,r32float:e.FLOAT,rg16uint:e.UNSIGNED_SHORT,rg16sint:e.SHORT,rg16float:e.HALF_FLOAT,rgba8unorm:e.UNSIGNED_BYTE,"rgba8unorm-srgb":e.UNSIGNED_BYTE,rgba8snorm:e.BYTE,rgba8uint:e.UNSIGNED_BYTE,rgba8sint:e.BYTE,bgra8unorm:e.UNSIGNED_BYTE,"bgra8unorm-srgb":e.UNSIGNED_BYTE,rgb9e5ufloat:e.UNSIGNED_INT_5_9_9_9_REV,rgb10a2unorm:e.UNSIGNED_INT_2_10_10_10_REV,rg11b10ufloat:e.UNSIGNED_INT_10F_11F_11F_REV,rg32uint:e.UNSIGNED_INT,rg32sint:e.INT,rg32float:e.FLOAT,rgba16uint:e.UNSIGNED_SHORT,rgba16sint:e.SHORT,rgba16float:e.HALF_FLOAT,rgba32uint:e.UNSIGNED_INT,rgba32sint:e.INT,rgba32float:e.FLOAT,stencil8:e.UNSIGNED_BYTE,depth16unorm:e.UNSIGNED_SHORT,depth24plus:e.UNSIGNED_INT,"depth24plus-stencil8":e.UNSIGNED_INT_24_8,depth32float:e.FLOAT,"depth32float-stencil8":e.FLOAT_32_UNSIGNED_INT_24_8_REV}}function pi(e){return{"2d":e.TEXTURE_2D,cube:e.TEXTURE_CUBE_MAP,"1d":null,"3d":e?.TEXTURE_3D||null,"2d-array":e?.TEXTURE_2D_ARRAY||null,"cube-array":e?.TEXTURE_CUBE_MAP_ARRAY||null}}var mi=4,hi=class e{constructor(t){this._glSamplers=Object.create(null),this._boundTextures=[],this._integerUnits=0,this._activeTextureLocation=-1,this._boundSamplers=Object.create(null),this._premultiplyAlpha=!1,this._useSeparateSamplers=!1,this._renderer=t,this._managedTextures=new F({renderer:t,type:`resource`,onUnload:this.onSourceUnload.bind(this),name:`glTexture`});let n={image:$r,buffer:Jr,video:ii,compressed:Xr,...e.uploadExtensions};this._uploads={...n,cube:Qr(n)}}get managedTextures(){return Object.values(this._managedTextures.items)}contextChange(e){this._gl=e,this._mapFormatToInternalFormat||(this._mapFormatToInternalFormat=di(e,this._renderer.context.extensions),this._mapFormatToType=fi(e),this._mapFormatToFormat=ui(e),this._mapViewDimensionToGlTarget=pi(e)),this._managedTextures.removeAll(!0),this._glSamplers=Object.create(null),this._boundSamplers=Object.create(null),this._premultiplyAlpha=!1;for(let e=0;e<16;e++)this.bind(h.EMPTY,e)}initSource(e){this.bind(e)}bind(e,t=0){let n=e.source;e?(this.bindSource(n,t),this._useSeparateSamplers&&this._bindSampler(n.style,t)):(this.bindSource(null,t),this._useSeparateSamplers&&this._bindSampler(null,t))}bindSource(e,t=0){let n=this._gl;if(e._gcLastUsed=this._renderer.gc.now,this._boundTextures[t]!==e){this._setBoundTexture(t,e),this._activateLocation(t),e||(e=h.EMPTY.source);let r=this.getGlSource(e);n.bindTexture(r.target,r.texture)}}unbindIntegerTextures(e){if(e>=32)return;let t=this._integerUnits>>>e<<e;for(;t;){let e=31-Math.clz32(t);t&=~(1<<e),this.bind(h.EMPTY,e)}}_setBoundTexture(e,t){this._boundTextures[e]=t,e<0||e>31||t&&t.viewDimension===`2d`&&(_(t.format)?this._integerUnits|=1<<e:this._integerUnits&=~(1<<e))}_bindSampler(e,t=0){let n=this._gl;if(!e){this._boundSamplers[t]=null,n.bindSampler(t,null);return}let r=this._getGlSampler(e);this._boundSamplers[t]!==r&&(this._boundSamplers[t]=r,n.bindSampler(t,r))}unbind(e){let t=e.source,n=this._boundTextures,r=this._gl;for(let e=0;e<n.length;e++)if(n[e]===t){this._activateLocation(e);let n=this.getGlSource(t);r.bindTexture(n.target,null),this._setBoundTexture(e,null)}}_activateLocation(e){this._activeTextureLocation!==e&&(this._activeTextureLocation=e,this._gl.activeTexture(this._gl.TEXTURE0+e))}_initSource(e){let t=this._gl,n=new Kr(t.createTexture());if(n.type=this._mapFormatToType[e.format],n.internalFormat=this._mapFormatToInternalFormat[e.format],n.format=this._mapFormatToFormat[e.format],n.target=this._mapViewDimensionToGlTarget[e.viewDimension],n.target===null)throw Error(`Unsupported view dimension: ${e.viewDimension} with this webgl version: ${this._renderer.context.webGLVersion}`);if(e.autoGenerateMipmaps&&(this._renderer.context.supports.nonPowOf2mipmaps||e.isPowerOfTwo)){let t=Math.max(e.width,e.height,e.depth);e.mipLevelCount=Math.floor(Math.log2(t))+1}return e._gpuData[this._renderer.uid]=n,this._managedTextures.add(e)&&(e.on(`update`,this.onSourceUpdate,this),e.on(`resize`,this.onSourceUpdate,this),e.on(`styleChange`,this.onStyleChange,this),e.on(`updateMipmaps`,this.onUpdateMipmaps,this)),this.onSourceUpdate(e),this.updateStyle(e,!1),n}onStyleChange(e){this.updateStyle(e,!1)}updateStyle(e,t){let n=this._gl,r=this.getGlSource(e);n.bindTexture(r.target,r.texture),this._setBoundTexture(this._activeTextureLocation,e),li(e.style,n,e.mipLevelCount>1,this._renderer.context.extensions.anisotropicFiltering,`texParameteri`,r.target,!this._renderer.context.supports.nonPowOf2wrapping&&!e.isPowerOfTwo,t)}onSourceUnload(e,t=!1){let n=e._gpuData[this._renderer.uid];n&&(t||(this.unbind(e),this._gl.deleteTexture(n.texture),n.msaaRenderBuffer&&this._gl.deleteRenderbuffer(n.msaaRenderBuffer)),e.off(`update`,this.onSourceUpdate,this),e.off(`resize`,this.onSourceUpdate,this),e.off(`styleChange`,this.onStyleChange,this),e.off(`updateMipmaps`,this.onUpdateMipmaps,this))}onSourceUpdate(e){let t=this._gl,n=this.getGlSource(e);t.bindTexture(n.target,n.texture),this._setBoundTexture(this._activeTextureLocation,e);let r=e.alphaMode===`premultiply-alpha-on-upload`&&!_(e.format)&&n.target!==t.TEXTURE_3D&&n.target!==t.TEXTURE_2D_ARRAY;if(this._premultiplyAlpha!==r&&(this._premultiplyAlpha=r,t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,r)),this._uploads[e.uploadMethodId])this._uploads[e.uploadMethodId].upload(e,n,t,this._renderer.context.webGLVersion);else if(n.target===t.TEXTURE_2D)this._initEmptyTexture2D(n,e);else if(n.target===t.TEXTURE_2D_ARRAY||n.target===t.TEXTURE_3D)this._initEmptyTexture3D(n,e);else if(n.target===t.TEXTURE_CUBE_MAP)this._initEmptyTextureCube(n,e);else throw Error(`[GlTextureSystem] Unsupported texture target for empty allocation.`);this._applyMipRange(n,e),e.autoGenerateMipmaps&&e.mipLevelCount>1&&this.onUpdateMipmaps(e,!1)}onUpdateMipmaps(e,t=!0){t&&this.bindSource(e,0);let n=this.getGlSource(e);this._gl.generateMipmap(n.target)}_initEmptyTexture2D(e,t){let n=this._gl;n.texImage2D(n.TEXTURE_2D,0,e.internalFormat,t.pixelWidth,t.pixelHeight,0,e.format,e.type,null);let r=Math.max(t.pixelWidth>>1,1),i=Math.max(t.pixelHeight>>1,1);for(let a=1;a<t.mipLevelCount;a++)n.texImage2D(n.TEXTURE_2D,a,e.internalFormat,r,i,0,e.format,e.type,null),r=Math.max(r>>1,1),i=Math.max(i>>1,1)}_initEmptyTexture3D(e,t){let n=this._gl,r=e.target===n.TEXTURE_3D,i=t.pixelWidth,a=t.pixelHeight,o=t.depthOrArrayLayers;for(let s=0;s<t.mipLevelCount;s++)n.texImage3D(e.target,s,e.internalFormat,i,a,o,0,e.format,e.type,null),i=Math.max(i>>1,1),a=Math.max(a>>1,1),r&&(o=Math.max(o>>1,1))}_initEmptyTextureCube(e,t){let n=this._gl;for(let r=0;r<6;r++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+r,0,e.internalFormat,t.pixelWidth,t.pixelHeight,0,e.format,e.type,null);let r=Math.max(t.pixelWidth>>1,1),i=Math.max(t.pixelHeight>>1,1);for(let a=1;a<t.mipLevelCount;a++){for(let t=0;t<6;t++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+t,a,e.internalFormat,r,i,0,e.format,e.type,null);r=Math.max(r>>1,1),i=Math.max(i>>1,1)}}_applyMipRange(e,t){if(this._renderer.context.webGLVersion!==2||t.mipLevelCount<=1)return;let n=this._gl,r=Math.max((t.mipLevelCount|0)-1,0);n.texParameteri(e.target,n.TEXTURE_BASE_LEVEL,0),n.texParameteri(e.target,n.TEXTURE_MAX_LEVEL,r)}_initSampler(e){let t=this._gl,n=this._gl.createSampler();return this._glSamplers[e._resourceId]=n,li(e,t,this._boundTextures[this._activeTextureLocation].mipLevelCount>1,this._renderer.context.extensions.anisotropicFiltering,`samplerParameteri`,n,!1,!0),this._glSamplers[e._resourceId]}_getGlSampler(e){return this._glSamplers[e._resourceId]||this._initSampler(e)}getGlSource(e){return e._gcLastUsed=this._renderer.gc.now,e._gpuData[this._renderer.uid]||this._initSource(e)}getMsaaRenderBuffer(e){let t=this._gl,n=this.getGlSource(e);return n.msaaRenderBuffer??(n.msaaRenderBuffer=t.createRenderbuffer()),(n.msaaWidth!==e.pixelWidth||n.msaaHeight!==e.pixelHeight)&&(n.msaaWidth=e.pixelWidth,n.msaaHeight=e.pixelHeight,t.bindRenderbuffer(t.RENDERBUFFER,n.msaaRenderBuffer),t.renderbufferStorageMultisample(t.RENDERBUFFER,4,n.internalFormat,e.pixelWidth,e.pixelHeight)),n.msaaRenderBuffer}generateCanvas(e){let{pixels:t,width:n,height:r}=this.getPixels(e),i=b.get().createCanvas();i.width=n,i.height=r;let a=i.getContext(`2d`);if(a){let e=a.createImageData(n,r);e.data.set(t),a.putImageData(e,0,0)}return i}getPixels(e){let t=e.source.resolution,n=e.frame,r=Math.max(Math.round(n.width*t),1),i=Math.max(Math.round(n.height*t),1),a=new Uint8Array(mi*r*i),o=this._renderer,s=o.renderTarget.getRenderTarget(e),c=o.renderTarget.getGpuRenderTarget(s),l=o.gl;return o.renderTarget.adaptor.bindFramebuffer(c.resolveTargetFramebuffer),l.readPixels(Math.round(n.x*t),Math.round(n.y*t),r,i,l.RGBA,l.UNSIGNED_BYTE,a),{pixels:new Uint8ClampedArray(a.buffer),width:r,height:i}}destroy(){this._managedTextures.destroy(),this._glSamplers=null,this._boundTextures=null,this._boundSamplers=null,this._mapFormatToInternalFormat=null,this._mapFormatToType=null,this._mapFormatToFormat=null,this._uploads=null,this._renderer=null}resetState(){let e=this._renderer.limits.maxTextures;this._activeTextureLocation=-1,this._boundTextures.fill(null),this._integerUnits=e>=32?-1:(1<<e)-1,this._boundSamplers=Object.create(null);let t=this._gl;this._premultiplyAlpha=!1,t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this._premultiplyAlpha)}};hi.extension={type:[o.WebGLSystem],name:`texture`},hi.uploadExtensions=Object.create(null);var gi=hi;s.handleByMap(o.TextureUploaderWebGL,gi.uploadExtensions);var _i=e({WebGLRenderer:()=>Ti}),vi=[...Ie,lr,er,Wn,rr,Hn,gi,fr,Zn,Ir,Mr,nr,Gr,ir,tr],yi=[...Pe],bi=[zn,Rn,Ln],xi=[],Si=[],Ci=[],wi=[];s.handleByNamedList(o.WebGLSystem,xi),s.handleByNamedList(o.WebGLPipes,Si),s.handleByNamedList(o.WebGLPipesAdaptor,Ci),s.handleByNamedList(o.WebGLLoader,wi),s.add(...vi,...yi,...bi);var Ti=class extends Oe{constructor(){let e={name:`webgl`,type:re.WEBGL,systems:xi,renderPipes:Si,renderPipeAdaptors:Ci,loaders:wi};super(e)}},Ei=class{constructor(){this._maxTextures=0}_getShader(e){return this.shader}execute(e,t){let n=t.context,r=e.renderer,i=this._getRenderData(r,n),{batcher:a,instructions:o}=i,s=n.customShader||this._getShader(i),c=r.encoder;c.setGeometry(a.geometry,s.gpuProgram);let l=r.globalUniforms.bindGroup;c.setBindGroup(0,l,s.gpuProgram);let u=r.renderPipes.uniformBatch.getUniformBindGroup(s.resources.localUniforms,!0);c.setBindGroup(2,u,s.gpuProgram);let d=s.gpuProgram.layout;for(let e=3;e<d.length;e++){let t=s.groups[e];if(d[e]&&t){for(let e in t.resources){let n=t.resources[e];n?.isUniformGroup&&r.ubo.updateUniformGroup(n)}c.setBindGroup(e,t,s.gpuProgram)}}let f=o.instructions,p=null;for(let t=0;t<o.instructionSize;t++){let n=f[t];if(n.topology!==p&&(p=n.topology,c.setPipelineFromGeometryProgramAndState(a.geometry,s.gpuProgram,e.state,n.topology,s._overrides)),s.groups[1]=n.bindGroup,!n.gpuBindGroup){let e=n.textures;n.bindGroup=Ze(e.textures,e.count,this._maxTextures),n.gpuBindGroup=r.bindGroup.getBindGroup(n.bindGroup,s.gpuProgram,1)}c.setBindGroup(1,n.bindGroup,s.gpuProgram),c.renderPassEncoder.drawIndexed(n.size,1,n.start)}}destroy(){this.shader.destroy(),this.shader=null}},Di=class extends Ei{contextChange(e){let t=new g({uTransformMatrix:{value:new E,type:`mat3x3<f32>`},uColor:{value:new Float32Array([1,1,1,1]),type:`vec4<f32>`},uRound:{value:0,type:`f32`}});this._maxTextures=e.limits.maxBatchableTextures;let n=Ve({name:`graphics`,bits:[Be,qe(this._maxTextures),it,We]});this.shader=new x({gpuProgram:n,resources:{localUniforms:t}})}_getRenderData(e,t){return e.graphicsContext.getContextRenderData(t)}};Di.extension={type:[o.WebGPUPipesAdaptor],name:`graphics`};var Oi=class{init(){let e=Ve({name:`mesh`,bits:[tt,dt,We]});this._shader=new x({gpuProgram:e,resources:{uTexture:h.EMPTY._source,uSampler:h.EMPTY._source.style,textureUniforms:{uTextureMatrix:{type:`mat3x3<f32>`,value:new E}}}})}execute(e,t){let n=e.renderer,r=t._shader;if(!r)r=this._shader,r.groups[2]=n.texture.getTextureBindGroup(t.texture);else if(!r.gpuProgram){c(`Mesh shader has no gpuProgram`,t.shader);return}let i=r.gpuProgram;if(i.autoAssignGlobalUniforms&&(r.groups[0]=n.globalUniforms.bindGroup),i.autoAssignLocalUniforms){let t=e.localUniforms;r.groups[1]=n.renderPipes.uniformBatch.getUniformBindGroup(t,!0)}n.encoder.draw({geometry:t._geometry,shader:r,state:t.state})}destroy(){this._shader.destroy(),this._shader=null}};Oi.extension={type:[o.WebGPUPipesAdaptor],name:`mesh`};var ki=ge.for2d(),Ai=class{start(e,t,n){let r=e.renderer,i=r.encoder,a=n.gpuProgram;this._shader=n,this._geometry=t,i.setGeometry(t,a),ki.blendMode=`normal`,r.pipeline.getPipeline(t,a,ki,void 0,n._overrides);let o=r.globalUniforms.bindGroup;i.resetBindGroup(1),i.setBindGroup(0,o,a)}execute(e,t){let n=this._shader.gpuProgram,r=e.renderer,i=r.encoder;if(!t.bindGroup){let e=t.textures;t.bindGroup=Ze(e.textures,e.count,r.limits.maxBatchableTextures)}ki.blendMode=t.blendMode;let a=r.bindGroup.getBindGroup(t.bindGroup,n,1),o=r.pipeline.getPipeline(this._geometry,n,ki,t.topology,this._shader._overrides);t.bindGroup._touch(r.gc.now),i.setPipeline(o),i.renderPassEncoder.setBindGroup(1,a),i.renderPassEncoder.drawIndexed(t.size,1,t.start)}};Ai.extension={type:[o.WebGPUPipesAdaptor],name:`batch`};var ji=0,Mi=class{constructor(e,t,n,r,i,a){this.autoGarbageCollect=!0,this._gpuData=null,this.gpuBindGroup=e,this._gcLastUsed=t,this.keyLow=n,this.keyHigh=r,this.layoutKey=i,this.cacheId=a}unload(){this.gpuBindGroup=null}},Ni=class{constructor(e){this._hash=Object.create(null),this._cacheId=0,this._renderer=e,e.gc.addResourceHash(this,`_hash`,`resource`),e.gc.addCollection(this,`_hash`,`hash`)}contextChange(e){this._gpu=e,this._cacheId=++ji,this._hash=Object.create(null)}getBindGroup(e,t,n){let r=t._layoutKey<<4|n,i=e._gpuEntry;if(i!==null&&e._gpuEntryLayoutKey===r&&i.gpuBindGroup!==null&&i.cacheId===this._cacheId)return i._gcLastUsed=this._renderer.gc.now,i.gpuBindGroup;let a=e._keyLow,o=e._keyHigh,s=(a^Math.imul(r+1,2654435761))&1073741823;return i=this._hash[s],i&&i.keyLow===a&&i.keyHigh===o&&i.layoutKey===r?i._gcLastUsed=this._renderer.gc.now:(i=new Mi(this._createBindGroup(e,t,n),this._renderer.gc.now,a,o,r,this._cacheId),this._hash[s]=i),e._gpuEntry=i,e._gpuEntryLayoutKey=r,i.gpuBindGroup}_createBindGroup(e,t,n){let r=this._gpu.device,i=t.layout[n],a=e.layout,o=[],s=this._renderer;for(let t in i){let n=e.resources[a?a[t]:i[t]];if(!n||n.destroyed)throw Error(`[BindGroup] no usable resource for the shader's '${t}' binding: it was never set, was destroyed while a shader still uses it, or is missing from the bind group's layout.`);let r;if(n._resourceType===`uniformGroup`){let e=n;s.ubo.updateUniformGroup(e);let t=e.buffer;r={buffer:s.buffer.getGPUBuffer(t),offset:0,size:t.descriptor.size}}else if(n._resourceType===`buffer`){let e=n;r={buffer:s.buffer.getGPUBuffer(e),offset:0,size:e.descriptor.size}}else if(n._resourceType===`bufferResource`){let e=n;r={buffer:s.buffer.getGPUBuffer(e.buffer),offset:e.offset,size:e.size}}else if(n._resourceType===`textureSampler`){let e=n;r=s.texture.getGpuSampler(e)}else if(n._resourceType===`textureSource`){let e=n;r=s.texture.getTextureView(e)}else if(n._resourceType===`textureView`){let e=n;r=s.texture.getTextureView(e.source,e.viewDescriptor)}o.push({binding:i[t],resource:r})}let c=s.shader.getProgramData(t).bindGroups[n];return r.createBindGroup({layout:c,entries:o})}destroy(){this._hash=null,this._renderer=null}};Ni.extension={type:[o.WebGPUSystem],name:`bindGroup`};var Pi=class{constructor(e){this.gpuBuffer=e}destroy(){this.gpuBuffer.destroy(),this.gpuBuffer=null}},Fi=class{constructor(e){this._renderer=e,this._managedBuffers=new F({renderer:e,type:`resource`,onUnload:this.onBufferUnload.bind(this),name:`gpuBuffer`})}contextChange(e){this._gpu=e,this.destroyAll()}getGPUBuffer(e){return e._gcLastUsed=this._renderer.gc.now,e._gpuData[this._renderer.uid]?.gpuBuffer||this.createGPUBuffer(e)}updateBuffer(e){let t=this.getGPUBuffer(e),n=e.data;return e._updateID&&n&&(e._updateID=0,this._gpu.device.queue.writeBuffer(t,e._updateOffset,n.buffer,n.byteOffset+e._updateOffset,(e._updateSize||n.byteLength)+3&-4)),t}destroyAll(){this._managedBuffers.removeAll()}onBufferUnload(e){e.off(`update`,this.updateBuffer,this),e.off(`change`,this.onBufferChange,this)}createGPUBuffer(e){let t=this._gpu.device.createBuffer(e.descriptor);return e._updateID=0,e.data&&(Ue(e.data.buffer,t.getMappedRange(),e.data.byteOffset,e.data.byteLength),t.unmap()),e._gpuData[this._renderer.uid]=new Pi(t),this._managedBuffers.add(e)&&(e.on(`update`,this.updateBuffer,this),e.on(`change`,this.onBufferChange,this)),t}onBufferChange(e){this._managedBuffers.remove(e),e._updateID=0,this.createGPUBuffer(e)}destroy(){this._managedBuffers.destroy(),this._renderer=null,this._gpu=null}};Fi.extension={type:[o.WebGPUSystem],name:`buffer`};var Ii=class{constructor(e){this._colorMaskCache=15,this._renderer=e}setMask(e){this._colorMaskCache!==e&&(this._colorMaskCache=e,this._renderer.pipeline.setColorMask(e))}destroy(){this._renderer=null,this._colorMaskCache=null}};Ii.extension={type:[o.WebGPUSystem],name:`colorMask`};function Li(e){let{userAgent:t}=b.get().getNavigator();if(!/AppleWebKit\//.test(t)||/Chrome\/|Chromium\//.test(t))return!1;if(!e)return!0;let n=/Version\/([\d.]+)/.exec(t)?.[1];return!n||!(e.from&&Ri(n,e.from)<0||e.before&&Ri(n,e.before)>=0)}function Ri(e,t){let n=e.split(`.`),r=t.split(`.`);for(let e=0;e<Math.max(n.length,r.length);e++){let t=(parseInt(n[e],10)||0)-(parseInt(r[e],10)||0);if(t)return t}return 0}var zi=new Set([`apple`,`arm`,`qualcomm`,`img-tec`]),Bi=class{constructor(e){this._renderer=e}async init(e){return this._initPromise||(this._options=e,this._initPromise=(e.gpu?Promise.resolve(e.gpu):this._createDeviceAndAdaptor(e)).then(e=>this._setGpu(e))),this._initPromise}_setGpu(e){this.gpu=e,this.extensions={transientAttachment:typeof GPUTextureUsage.TRANSIENT_ATTACHMENT==`number`&&!Li({from:`27.1`,before:`28`}),tileBased:zi.has(e.adapter?.info?.vendor)},this._options.gpu||e.device.lost.then(()=>this._restoreDevice()).catch(e=>c(`WebGPU device was lost and could not be restored`,e)),this._renderer.runners.contextChange.emit(this.gpu)}async _restoreDevice(){if(!this._renderer)return;let e=await this._createDeviceAndAdaptor(this._options);this._renderer?this._setGpu(e):e.device.destroy()}contextChange(e){this._renderer.gpu=e}async _createDeviceAndAdaptor(e){let t=await b.get().getNavigator().gpu.requestAdapter({powerPreference:e.powerPreference,forceFallbackAdapter:e.forceFallbackAdapter});if(!t)throw Error(`WebGPU not supported. No GPU adapter was returned by navigator.gpu.requestAdapter().`);let n=[`texture-compression-bc`,`texture-compression-astc`,`texture-compression-etc2`,`indirect-first-instance`,`bgra8unorm-storage`,`texture-formats-tier1`].filter(e=>t.features.has(e));return{adapter:t,device:await t.requestDevice({requiredFeatures:n,requiredLimits:{maxSampledTexturesPerShaderStage:t.limits.maxSampledTexturesPerShaderStage,maxSamplersPerShaderStage:t.limits.maxSamplersPerShaderStage,minUniformBufferOffsetAlignment:t.limits.minUniformBufferOffsetAlignment}})}}destroy(){this._options?.gpu||this.gpu?.device.destroy(),this.gpu=null,this.extensions=null,this._renderer=null}};Bi.extension={type:[o.WebGPUSystem],name:`device`},Bi.defaultOptions={powerPreference:void 0,forceFallbackAdapter:!1};var Vi=class{constructor(e,t,n,r){this.gpuBundle=e,this.stateKey=t,this.device=n,this.label=r}},Hi=class{constructor(e){this._boundBindGroup=Object.create(null),this._boundVertexBuffer=Object.create(null),this._renderer=e;for(let e=0;e<16;e++)this._boundBindGroup[e]={bindGroup:null,program:null,entry:null}}renderStart(){this.commandFinished=new Promise(e=>{this._resolveCommandFinished=e}),this.commandEncoder=this._renderer.gpu.device.createCommandEncoder()}beginRenderPass(e){return this.endRenderPass(),this._clearCache(),this._passEncoder=this.commandEncoder.beginRenderPass(e.descriptor),this.renderPassEncoder=this._passEncoder,this._passEncoder}endRenderPass(){this._passEncoder&&this._passEncoder.end(),this.renderPassEncoder=null,this._passEncoder=null}beginBundle(e){if(this._passEncoder!==this.renderPassEncoder)throw Error(`Cannot begin a new render bundle while one is already being recorded.`);this._clearCache();let t=this._renderer.pipeline,n=t.getBundleDescriptor();n.label=e,this._bundleStateKey=t.bundleStateKey,this._bundleLabel=e,this.renderPassEncoder=this._gpu.device.createRenderBundleEncoder(n)}endBundle(){let e=this.renderPassEncoder;if(!e||!(`finish`in e))throw Error(`endBundle called without an active render bundle.`);let t=e.finish({label:this._bundleLabel});return this.renderPassEncoder=this._passEncoder,this._clearCache(),new Vi(t,this._bundleStateKey,this._gpu.device,this._bundleLabel)}isBundleValid(e){return e?.stateKey===this._renderer.pipeline.bundleStateKey&&e.device===this._gpu.device}executeBundle(e){let t=[];if(Array.isArray(e))for(let n=0;n<e.length;n++)t[n]=this._getGpuBundle(e[n]);else t[0]=this._getGpuBundle(e);this._clearCache(),this._passEncoder.executeBundles(t)}_getGpuBundle(e){return this.isBundleValid(e)||c(`Render bundle ${e?.label??`(unlabeled)`} was recorded against a different render target state or on a lost device. Re-record it \u2014 replaying it will either be rejected by WebGPU or draw with the wrong winding. Check encoder.isBundleValid(bundle) before executing.`),e.gpuBundle}setViewport(e){this._passEncoder.setViewport(e.x,e.y,e.width,e.height,0,1)}setStencilReference(e){this._passEncoder.setStencilReference(e)}setPipelineFromGeometryProgramAndState(e,t,n,r,i){let a=this._renderer.pipeline.getPipeline(e,t,n,r,i);this.setPipeline(a)}setPipeline(e){this._boundPipeline!==e&&(this._boundPipeline=e,this.renderPassEncoder.setPipeline(e))}_setVertexBuffer(e,t){this._boundVertexBuffer[e]!==t&&(this._boundVertexBuffer[e]=t,this.renderPassEncoder.setVertexBuffer(e,this._renderer.buffer.updateBuffer(t)))}_setIndexBuffer(e){if(this._boundIndexBuffer===e)return;this._boundIndexBuffer=e;let t=e.data.BYTES_PER_ELEMENT===2?`uint16`:`uint32`;this.renderPassEncoder.setIndexBuffer(this._renderer.buffer.updateBuffer(e),t)}resetBindGroup(e){let t=this._boundBindGroup[e];t.bindGroup=null,t.program=null,t.entry=null}setBindGroup(e,t,n){let r=this._boundBindGroup[e];if(r.bindGroup===t&&r.program===n&&r.entry===t._gpuEntry)return;r.bindGroup=t,r.program=n,t._touch(this._renderer.gc.now);let i=this._renderer.bindGroup.getBindGroup(t,n,e);r.entry=t._gpuEntry,this.renderPassEncoder.setBindGroup(e,i)}setGeometry(e,t){let n=this._renderer.pipeline.getBufferNamesToBind(e,t);for(let t=0;t<n.length;t++)this._setVertexBuffer(t,e.attributes[n[t]].buffer);e.indexBuffer&&this._setIndexBuffer(e.indexBuffer)}_setShaderBindGroups(e,t){let n=e.gpuProgram,r=n.layout;for(let i=0;i<r.length;i++){let a=e.groups[i];r[i]&&a&&(t||this._syncBindGroup(a),this.setBindGroup(i,a,n))}}_syncBindGroup(e){let t=e.resources,n=e._resourceKeys;for(let e=0;e<n.length;e++){let r=t[n[e]];r&&r.isUniformGroup&&this._renderer.ubo.updateUniformGroup(r)}}draw(e){let{geometry:t,shader:n,state:r,topology:i,size:a,start:o,baseVertex:s,instanceCount:c,skipSync:l,firstInstance:u}=e;this.setPipelineFromGeometryProgramAndState(t,n.gpuProgram,r,i,n._overrides),this.setGeometry(t,n.gpuProgram),this._setShaderBindGroups(n,l),t.indexBuffer?this.renderPassEncoder.drawIndexed(a||t.indexCount||t.indexBuffer.data.length,c??t.instanceCount,o||0,s||0,u||0):this.renderPassEncoder.draw(a||t.vertexCount,c??t.instanceCount,o||0,u||0)}drawIndirect(e){let{geometry:t,shader:n,state:r,topology:i,skipSync:a,indirectBuffer:o,indirectOffset:s}=e;this.setPipelineFromGeometryProgramAndState(t,n.gpuProgram,r,i,n._overrides),this.setGeometry(t,n.gpuProgram),this._setShaderBindGroups(n,a),t.indexBuffer?this.renderPassEncoder.drawIndexedIndirect(o,s):this.renderPassEncoder.drawIndirect(o,s)}finishRenderPass(){this._passEncoder&&(this._passEncoder.end(),this.renderPassEncoder=null,this._passEncoder=null)}postrender(){this.finishRenderPass(),this._gpu.device.queue.submit([this.commandEncoder.finish()]),this._resolveCommandFinished(),this.commandEncoder=null}_clearCache(){for(let e=0;e<16;e++){let t=this._boundBindGroup[e];t.bindGroup=null,t.program=null,t.entry=null,this._boundVertexBuffer[e]=null}this._boundIndexBuffer=null,this._boundPipeline=null}destroy(){this._renderer=null,this._gpu=null,this._boundBindGroup=null,this._boundVertexBuffer=null,this._boundIndexBuffer=null,this._boundPipeline=null,this.renderPassEncoder=null,this._passEncoder=null}contextChange(e){this._gpu=e}};Hi.extension={type:[o.WebGPUSystem],name:`encoder`,priority:1};var Ui=class{constructor(e){this.supportsOverrideConstants=!1,this._renderer=e}contextChange(){let e=this._renderer.device.gpu.device;this.maxTextures=Math.min(e.limits.maxSampledTexturesPerShaderStage,e.limits.maxSamplersPerShaderStage),this.maxBatchableTextures=this.maxTextures,this.minUniformBufferOffsetAlignment=e.limits.minUniformBufferOffsetAlignment,this._detectOverrideConstantsSupport(e)}_detectOverrideConstantsSupport(e){e.pushErrorScope(`validation`);let t=e.createShaderModule({code:`override TEST_VALUE: f32 = 0.0;
@compute @workgroup_size(1) fn main() {}`});e.createComputePipeline({layout:`auto`,compute:{module:t,entryPoint:`main`,constants:{TEST_VALUE:1}}}),e.popErrorScope().then(e=>{this.supportsOverrideConstants=!e})}destroy(){}};Ui.extension={type:[o.WebGPUSystem],name:`limits`};var Wi=class{constructor(e){this._renderer=e,e.renderTarget.onRenderTargetChange.add(this)}contextChange(){this._activeGpuRenderTarget=null}onRenderTargetChange(e){let t=this._renderer.renderTarget.getGpuRenderTarget(e);this._activeRenderTarget=e,this._activeGpuRenderTarget=t,this.setStencilMode(t.stencilMode,t.stencilReference)}setStencilMode(e,t){let n=this._activeGpuRenderTarget??(this._activeGpuRenderTarget=this._renderer.renderTarget.getGpuRenderTarget(this._activeRenderTarget));n.stencilMode=e,n.stencilReference=t;let r=this._renderer;r.pipeline.setStencilMode(e),r.encoder.setStencilReference(t)}destroy(){this._renderer.renderTarget.onRenderTargetChange.remove(this),this._renderer=null,this._activeRenderTarget=null,this._activeGpuRenderTarget=null}};Wi.extension={type:[o.WebGPUSystem],name:`stencil`};var Gi={i32:{align:4,size:4},u32:{align:4,size:4},f32:{align:4,size:4},f16:{align:2,size:2},"vec2<i32>":{align:8,size:8},"vec2<u32>":{align:8,size:8},"vec2<f32>":{align:8,size:8},"vec2<f16>":{align:4,size:4},"vec3<i32>":{align:16,size:12},"vec3<u32>":{align:16,size:12},"vec3<f32>":{align:16,size:12},"vec3<f16>":{align:8,size:6},"vec4<i32>":{align:16,size:16},"vec4<u32>":{align:16,size:16},"vec4<f32>":{align:16,size:16},"vec4<f16>":{align:8,size:8},"mat2x2<f32>":{align:8,size:16},"mat2x2<f16>":{align:4,size:8},"mat3x2<f32>":{align:8,size:24},"mat3x2<f16>":{align:4,size:12},"mat4x2<f32>":{align:8,size:32},"mat4x2<f16>":{align:4,size:16},"mat2x3<f32>":{align:16,size:32},"mat2x3<f16>":{align:8,size:16},"mat3x3<f32>":{align:16,size:48},"mat3x3<f16>":{align:8,size:24},"mat4x3<f32>":{align:16,size:64},"mat4x3<f16>":{align:8,size:32},"mat2x4<f32>":{align:16,size:32},"mat2x4<f16>":{align:8,size:16},"mat3x4<f32>":{align:16,size:48},"mat3x4<f16>":{align:8,size:24},"mat4x4<f32>":{align:16,size:64},"mat4x4<f16>":{align:8,size:32}};function Ki(e){let t=e.map(e=>({data:e,offset:0,size:0})),n=0;for(let e=0;e<t.length;e++){let r=t[e],i=Gi[r.data.type].size,a=Gi[r.data.type].align;if(!Gi[r.data.type])throw Error(`[Pixi.js] WebGPU UniformBuffer: Unknown type ${r.data.type}`);r.data.size>1&&(i=Math.max(i,a)*r.data.size),n=Math.ceil(n/a)*a,r.size=i,r.offset=n,n+=i}return n=Math.ceil(n/16)*16,{uboElements:t,size:n}}function qi(e,t){let{size:n,align:r}=Gi[e.data.type],i=(Math.max(n,r)-n)/4,a=e.data.type.indexOf(`i32`)>=0?`dataInt32`:`data`;return`
         v = uv.${e.data.name};
         ${t===0?``:`offset += ${t};`}

         arrayOffset = offset;

         t = 0;

         for(var i=0; i < ${e.data.size}; i++)
         {
             for(var j = 0; j < ${n/4}; j++)
             {
                 ${a}[arrayOffset++] = v[t++];
             }
             ${i===0?``:`arrayOffset += ${i};`}
         }
     `}function Ji(e){return Qe(e,nt,qi)}var Yi=class extends lt{constructor(){super({createUboElements:Ki,generateUboSync:Ji})}};Yi.extension={type:[o.WebGPUSystem],name:`ubo`};var Xi=class{constructor({minUniformOffsetAlignment:e}){this._minUniformOffsetAlignment=256,this.byteIndex=0,this._minUniformOffsetAlignment=e,this.data=new Float32Array(65535)}clear(){this.byteIndex=0}addEmptyGroup(e){if(e>this._minUniformOffsetAlignment/4)throw Error(`UniformBufferBatch: array is too large: ${e*4}`);let t=this.byteIndex,n=t+e*4;if(n=Math.ceil(n/this._minUniformOffsetAlignment)*this._minUniformOffsetAlignment,n>this.data.length*4)throw Error(`UniformBufferBatch: ubo batch got too big`);return this.byteIndex=n,t}addGroup(e){let t=this.addEmptyGroup(e.length);for(let n=0;n<e.length;n++)this.data[t/4+n]=e[n];return t}destroy(){this.data=null}},B=128,Zi=class{constructor(e){this._bindGroupHash=Object.create(null),this._buffers=[],this._bindGroups=[],this._bufferResources=[],this._renderer=e,this._batchBuffer=new Xi({minUniformOffsetAlignment:B});let t=256/B;for(let e=0;e<t;e++)this._buffers.push(new ee({data:this._batchBuffer.data,usage:T.UNIFORM|T.COPY_DST}))}renderEnd(){this._uploadBindGroups(),this._resetBindGroups()}_resetBindGroups(){this._bindGroupHash=Object.create(null),this._batchBuffer.clear()}getUniformBindGroup(e,t){if(!t&&this._bindGroupHash[e.uid])return this._bindGroupHash[e.uid];this._renderer.ubo.ensureUniformGroup(e);let n=e.buffer.data,r=this._batchBuffer.addEmptyGroup(n.length);return this._renderer.ubo.syncUniformGroup(e,this._batchBuffer.data,r/4),this._bindGroupHash[e.uid]=this._getBindGroup(r/B),this._bindGroupHash[e.uid]}getUboResource(e){this._renderer.ubo.updateUniformGroup(e);let t=e.buffer.data,n=this._batchBuffer.addGroup(t);return this._getBufferResource(n/B)}getArrayBindGroup(e){let t=this._batchBuffer.addGroup(e);return this._getBindGroup(t/B)}getArrayBufferResource(e){let t=this._batchBuffer.addGroup(e)/B;return this._getBufferResource(t)}_getBufferResource(e){if(!this._bufferResources[e]){let t=this._buffers[e%2];this._bufferResources[e]=new at({buffer:t,offset:(e/2|0)*256,size:B})}return this._bufferResources[e]}_getBindGroup(e){if(!this._bindGroups[e]){let t=new v({0:this._getBufferResource(e)});this._bindGroups[e]=t}return this._bindGroups[e]}_uploadBindGroups(){let e=this._renderer.buffer,t=this._buffers[0];t.update(this._batchBuffer.byteIndex),e.updateBuffer(t);let n=this._batchBuffer.data,r=this._batchBuffer.byteIndex-B;if(!(r<=0))for(let t=1;t<this._buffers.length;t++)this._renderer.gpu.device.queue.writeBuffer(e.getGPUBuffer(this._buffers[t]),0,n.buffer,n.byteOffset+B,r)}destroy(){for(let e=0;e<this._bindGroups.length;e++)this._bindGroups[e]?.destroy();this._bindGroups=null,this._bindGroupHash=null;for(let e=0;e<this._buffers.length;e++)this._buffers[e].destroy();this._buffers=null;for(let e=0;e<this._bufferResources.length;e++)this._bufferResources[e].destroy();this._bufferResources=null,this._batchBuffer.destroy(),this._renderer=null}};Zi.extension={type:[o.WebGPUPipes],name:`uniformBatch`};var Qi={"point-list":0,"line-list":1,"line-strip":2,"triangle-list":3,"triangle-strip":4},$i=new te({}),ea={"depth24plus-stencil8":{depth:!0,stencil:!0,index:1},depth24plus:{depth:!0,stencil:!1,index:2},depth32float:{depth:!0,stencil:!1,index:3},"depth32float-stencil8":{depth:!0,stencil:!0,index:4},depth16unorm:{depth:!0,stencil:!1,index:5},stencil8:{depth:!1,stencil:!0,index:6}},ta={depth:!1,stencil:!1,index:0};function na(e,t){for(let[n,r]of Object.entries(t)){let t=RegExp(`override\\s+${n}\\s*:\\s*(\\w+)\\s*(?:=[^;]*)?;`);e=e.replace(t,(e,t)=>{let i;return i=t===`u32`?`${Math.trunc(r)}u`:t===`i32`?`${Math.trunc(r)}`:Number.isInteger(r)?`${r}.0`:`${r}`,`const ${n}: ${t} = ${i};`})}return e}function ra(e,t,n,r,i,a){return e*35184372088832+t*536870912+a*16384+(n<<8)+(r<<3)+i}var ia=Object.create(null),aa=0;function oa(e){let t=ia[e];return t===void 0&&(t=ia[e]=aa++),t}function sa(e,t,n,r,i,a,o){return i<<13|o<<12|r<<9|n<<5|e<<2|a<<1|t}function ca(e,t,n,r,i,a){return a<<7|i<<6|r<<5|n<<4|t<<1|e}var la=class{constructor(e){this._moduleCache=Object.create(null),this._bufferLayoutsCache=Object.create(null),this._bindingNamesCache=Object.create(null),this._pipeCache=new Map,this._pipeStateCaches=Object.create(null),this._colorMask=15,this._multisampleCount=1,this._colorFormats=[`bgra8unorm`],this._colorFormatId=oa(`bgra8unorm`),this._depthStencilFormat=`depth24plus-stencil8`,this._depthStencilFormatData=ta,this._depthReadOnly=!1,this._stencilReadOnly=!1,this._invertFrontFace=!1,this._renderer=e}contextChange(e){this._gpu=e,this._moduleCache=Object.create(null),this._pipeStateCaches=Object.create(null),this.setStencilMode(Ke.DISABLED),this._updatePipeHash()}setMultisampleCount(e){this._multisampleCount!==e&&(this._multisampleCount=e,this._updatePipeHash())}setRenderTarget(e){let t=e.colorAttachments[0]?.texture;this._multisampleCount=t?.source.antialias?4:1,this._setColorFormats(e),this._depthStencilFormat=e.depthStencilAttachment?.texture.format,this._depthStencilFormatData=ea[this._depthStencilFormat]||ta,this._depthReadOnly=e.depthStencilAttachment?.depthReadOnly??!1,this._stencilReadOnly=e.depthStencilAttachment?.stencilReadOnly??this._depthReadOnly,this._invertFrontFace=this._renderer.renderTarget.isFrontFaceInverted(e,e.flipY),this._updatePipeHash()}setColorMask(e){this._colorMask!==e&&(this._colorMask=e,this._updatePipeHash())}setStencilMode(e){this._stencilMode!==e&&(this._stencilMode=e,this._stencilState=$e[e],this._updatePipeHash())}get bundleStateKey(){let e=this._depthStencilFormatData;return ca(this._multisampleCount===1?0:1,e.index,e.depth&&this._depthReadOnly?1:0,e.stencil&&this._stencilReadOnly?1:0,+!!this._invertFrontFace,this._colorFormatId)}getBundleDescriptor(){let e={colorFormats:this._colorFormats.slice(),sampleCount:this._multisampleCount},t=this._depthStencilFormatData;return(t.depth||t.stencil)&&(e.depthStencilFormat=this._depthStencilFormat,t.depth&&this._depthReadOnly&&(e.depthReadOnly=!0),t.stencil&&this._stencilReadOnly&&(e.stencilReadOnly=!0)),e}setPipeline(e,t,n,r){let i=this.getPipeline(e,t,n);r.setPipeline(i)}getPipelineKey(e,t,n,r,i){return e._layoutKey||(rt(e,t.attributeData),this._generateBufferKey(e)),ra(e._layoutKey,t._layoutKey,n.data,n._blendModeId,Qi[r],i.id)}getPipeline(e,t,n,r,i){e._layoutKey||(rt(e,t.attributeData),this._generateBufferKey(e)),r||(r=e.topology),i||(i=$i);let a=ra(e._layoutKey,t._layoutKey,n.data,n._blendModeId,Qi[r],i.id),o=this._pipeCache.get(a);return o||(o=this._createPipeline(e,t,n,r,i),this._pipeCache.set(a,o)),o}_createPipeline(e,t,n,r,i){let a=this._gpu.device,o=this._createVertexBufferLayouts(e,t),s=this._renderer.state.getColorTargets(n,this._colorFormats),c=this._stencilMode===Ke.RENDERING_MASK_ADD?0:this._colorMask;this._applyFragmentOutputs(s,t,c);let l=this._renderer.shader.getProgramData(t).pipeline,u=Object.keys(i.data).length>0,d=t.vertex.source,f=t.fragment.source,p;u&&(this._renderer.limits.supportsOverrideConstants?p=i.data:(d=na(d,i.data),f=na(f,i.data)));let m={vertex:{module:this._getModule(d),entryPoint:t.vertex.entryPoint,constants:p,buffers:o},fragment:{module:this._getModule(f),entryPoint:t.fragment.entryPoint,targets:s,constants:p},primitive:{topology:r,cullMode:n.culling?`back`:`none`,frontFace:n.clockwiseFrontFace===this._invertFrontFace?`ccw`:`cw`},layout:l,multisample:{count:this._multisampleCount},label:t.name?`PIXI Pipeline (${t.name})`:`PIXI Pipeline`};if(this._depthStencilFormatData.depth||this._depthStencilFormatData.stencil){let e=this._depthStencilFormatData;m.depthStencil={...this._stencilState,format:this._depthStencilFormat,depthWriteEnabled:e.depth?n.depthMask&&!this._depthReadOnly:!1,depthCompare:e.depth&&n.depthTest?`less`:`always`}}return a.createRenderPipeline(m)}_getModule(e){return this._moduleCache[e]||this._createModule(e)}_createModule(e){let t=this._gpu.device;return this._moduleCache[e]=t.createShaderModule({code:e}),this._moduleCache[e]}_generateBufferKey(e){let t=[],n=0,r=Object.keys(e.attributes).sort();for(let i=0;i<r.length;i++){let a=e.attributes[r[i]];t[n++]=a.offset,t[n++]=a.format,t[n++]=a.stride,t[n++]=a.instance}let i=t.join(`|`);return e._layoutKey=ne(i,`geometry`),e._layoutKey}_generateAttributeLocationsKey(e){let t=[],n=0,r=Object.keys(e.attributeData).sort();for(let i=0;i<r.length;i++){let a=e.attributeData[r[i]];t[n++]=a.location}let i=t.join(`|`);return e._attributeLocationsKey=ne(i,`programAttributes`),e._attributeLocationsKey}getBufferNamesToBind(e,t){e._layoutKey||(rt(e,t.attributeData),this._generateBufferKey(e)),t._attributeLocationsKey||this._generateAttributeLocationsKey(t);let n=e._layoutKey<<16|t._attributeLocationsKey;if(this._bindingNamesCache[n])return this._bindingNamesCache[n];let r=this._createVertexBufferLayouts(e,t),i=[],a=t.attributeData;for(let e=0;e<r.length;e++){let t=Object.values(r[e].attributes)[0].shaderLocation;for(let n in a)if(a[n].location===t){i[e]=n;break}}return this._bindingNamesCache[n]=i,i}_createVertexBufferLayouts(e,t){t._attributeLocationsKey||this._generateAttributeLocationsKey(t);let n=e._layoutKey<<16|t._attributeLocationsKey;if(this._bufferLayoutsCache[n])return this._bufferLayoutsCache[n];let r=[];return e.buffers.forEach(n=>{let i={arrayStride:0,stepMode:`vertex`,attributes:[]},a=i.attributes;for(let r in t.attributeData){let o=e.attributes[r];(o.divisor??1)!==1&&c(`Attribute ${r} has an invalid divisor value of '${o.divisor}'. WebGPU only supports a divisor value of 1`),o.buffer===n&&(i.arrayStride=o.stride,i.stepMode=o.instance?`instance`:`vertex`,a.push({shaderLocation:t.attributeData[r].location,offset:o.offset,format:o.format}))}a.length&&r.push(i)}),this._bufferLayoutsCache[n]=r,r}_setColorFormats(e){let t=e.colorAttachments,n=this._colorFormats;n.length=t.length;for(let e=0;e<t.length;e++)n[e]=t[e].texture.format;this._colorFormatId=oa(n.join(`|`))}_applyFragmentOutputs(e,t,n){let r=t.fragmentOutputMask??-1;for(let t=0;t<e.length;t++){let i=!!(r&1<<t);e[t].writeMask=i?n:0,i||(e[t].blend=void 0)}}_updatePipeHash(){var e;let t=sa(this._stencilMode,this._multisampleCount===1?0:1,this._colorMask,this._depthStencilFormatData.index,this._colorFormatId,+!!this._depthReadOnly,+!!this._invertFrontFace);this._pipeCache=(e=this._pipeStateCaches)[t]??(e[t]=new Map)}destroy(){this._bufferLayoutsCache=null,this._pipeCache=null,this._gpu=null,this._renderer=null,this._bindingNamesCache=null,this._pipeStateCaches=null,this._moduleCache=null}};la.extension={type:[o.WebGPUSystem],name:`pipeline`};var ua=class{constructor(e,t){let{tileBased:n,transientAttachment:r}=e.device.extensions;this.transient=n||t.transient;let i=GPUTextureUsage.RENDER_ATTACHMENT;this.transient&&r&&(i|=GPUTextureUsage.TRANSIENT_ATTACHMENT),this.texture=e.gpu.device.createTexture({label:t.label,size:{width:t.pixelWidth,height:t.pixelHeight,depthOrArrayLayers:t.depthOrArrayLayers},format:t.format,sampleCount:4,mipLevelCount:1,usage:i}),this.view=this.texture.createView()}destroy(){this.texture.destroy(),this.texture=null,this.view=null}},da=class{constructor(e){this._variants=Object.create(null),this._bindGroups=new WeakMap,this._depthStencilAttachment={view:null,depthLoadOp:`load`,depthStoreOp:`store`},this._passDescriptor={label:`depth-copy`,colorAttachments:[],depthStencilAttachment:this._depthStencilAttachment},this._renderer=e,this._device=e.gpu.device}copy(e,t,n,r,i,a){var o,s;let c=this._renderer.texture.getGpuSource(t),l=c.sampleCount,u=(o=this._variants)[l]??(o[l]=this._createVariant(l)),d=this._bindGroups.get(c);d||(d=this._device.createBindGroup({layout:u.layout,entries:[{binding:0,resource:c.createView({aspect:`depth-only`})}]}),this._bindGroups.set(c,d));let f=n.format,p=this._depthStencilAttachment,m=f.includes(`stencil`);p.view=this._renderer.texture.getTextureView(n),p.stencilLoadOp=m?`load`:void 0,p.stencilStoreOp=m?`store`:void 0;let h=e.beginRenderPass(this._passDescriptor);p.view=null;let g=(r.x-a.x+32768|r.y-a.y+32768<<16)>>>0;h.setViewport(a.x,a.y,i.width,i.height,0,1),h.setPipeline((s=u.pipelines)[f]??(s[f]=this._createPipeline(f,u))),h.setBindGroup(0,d),h.draw(3,1,0,g),h.end()}_createVariant(e){let t=e>1,n=this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`depth`,multisampled:t}}]}),r=this._device.createShaderModule({label:`depth-copy`,code:`
                @group(0) @binding(0) var source: ${t?`texture_depth_multisampled_2d`:`texture_depth_2d`};

                struct Varyings {
                    @builtin(position) position: vec4<f32>,
                    @location(0) @interpolate(flat) offset: vec2<i32>,
                };

                @vertex
                fn vertexMain(@builtin(vertex_index) i: u32, @builtin(instance_index) packed: u32) -> Varyings {
                    let pos = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
                    let offset = vec2<i32>(i32(packed & 0xffffu), i32(packed >> 16u)) - vec2<i32>(32768);

                    return Varyings(vec4<f32>(pos[i], 0.0, 1.0), offset);
                }

                @fragment
                fn fragmentMain(varyings: Varyings) -> @builtin(frag_depth) f32 {
                    return textureLoad(source, vec2<i32>(varyings.position.xy) + varyings.offset, 0);
                }
            `});return{layout:n,pipelineLayout:this._device.createPipelineLayout({bindGroupLayouts:[n]}),module:r,pipelines:Object.create(null)}}_createPipeline(e,t){return this._device.createRenderPipeline({label:`depth-copy`,layout:t.pipelineLayout,vertex:{module:t.module,entryPoint:`vertexMain`},fragment:{module:t.module,entryPoint:`fragmentMain`,targets:[]},depthStencil:{format:e,depthWriteEnabled:!0,depthCompare:`always`}})}},fa=class{constructor(e){this._pipelines=Object.create(null),this._modules=Object.create(null),this._bindGroups=new WeakMap,this._renderer=e,this._device=e.gpu.device,this._layout=this._device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:`unfilterable-float`}}]}),this._pipelineLayout=this._device.createPipelineLayout({bindGroupLayouts:[this._layout]})}copy(e,t,n,r){var i;let a=this._renderer.renderTarget.getGpuRenderTarget(t),o=t.colorAttachments[n].texture;(i=a.msaaBackTextures)[n]??(i[n]=new f({label:`msaa-back-texture`,width:o.width,height:o.height,resolution:o._resolution,format:o.format,autoGenerateMipmaps:!1,autoGarbageCollect:!0}));let s=this._renderer.texture.getGpuSource(a.msaaBackTextures[n]);e.copyTextureToTexture({texture:r},{texture:s},{width:Math.min(r.width,s.width),height:Math.min(r.height,s.height)})}draw(e,t,n){var r;let i=this._renderer.renderTarget.getGpuRenderTarget(t),a=this._renderer.texture.getGpuSource(i.msaaBackTextures[n]),o=t.depthStencilAttachment?.texture.format??``;for(let e of t.colorAttachments)o+=`|${e.texture.format}`;let s=(r=this._pipelines)[o]??(r[o]=[]),c=this._bindGroups.get(a);c||(c=this._device.createBindGroup({layout:this._layout,entries:[{binding:0,resource:a.createView()}]}),this._bindGroups.set(a,c)),e.setPipeline(s[n]??(s[n]=this._createPipeline(t,n))),e.setBindGroup(0,c),e.draw(3)}_getModule(e){var t;return(t=this._modules)[e]??(t[e]=this._device.createShaderModule({label:`msaa-restore`,code:`
                @group(0) @binding(0) var resolved: texture_2d<f32>;

                @vertex
                fn vertexMain(@builtin(vertex_index) i: u32) -> @builtin(position) vec4<f32> {
                    let pos = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));

                    return vec4<f32>(pos[i], 0.0, 1.0);
                }

                @fragment
                fn fragmentMain(@builtin(position) position: vec4<f32>) -> @location(${e}) vec4<f32> {
                    return textureLoad(resolved, vec2<i32>(position.xy), 0);
                }
            `})),this._modules[e]}_createPipeline(e,t){let n=e.depthStencilAttachment?.texture.format,r;n&&(r={format:n},n.includes(`depth`)&&(r.depthWriteEnabled=!1,r.depthCompare=`always`));let i=this._getModule(t);return this._device.createRenderPipeline({label:`msaa-restore`,layout:this._pipelineLayout,vertex:{module:i,entryPoint:`vertexMain`},fragment:{module:i,entryPoint:`fragmentMain`,targets:e.colorAttachments.map((e,n)=>({format:e.texture.format,writeMask:n===t?GPUColorWrite.ALL:0}))},depthStencil:r,multisample:{count:4}})}},pa=class{constructor(){this.contexts=[],this.canvasTextures=[],this.canvasMsaaTextures=[],this.transient=!1,this.msaaSamples=1,this.msaaBackTextures=[],this.stencilMode=Ke.DISABLED,this.stencilReference=0,this.maskStackIndex=0}},ma={bgra8unorm:!0,rgba8unorm:!0,rgba16float:!0};function ha(e){if(ma[e])return e;let t=navigator.gpu.getPreferredCanvasFormat();return c(`[WebGPU] CanvasSource format '${e}' is not a valid GPUCanvasContext format. Falling back to '${t}'. Allowed formats are: bgra8unorm, rgba8unorm, rgba16float.`),t}var ga=class{constructor(){this._activePass=null}init(e,t){this._renderer=e,this._renderTargetSystem=t,e.runners.contextChange.add(this),e.runners.destroy.add(this)}contextChange(){this._msaaRestore=null,this._depthCopy=null}destroy(){this._msaaRestore=null,this._depthCopy=null}copyToTexture(e,t,n,r,i){let a=this._renderer;this.finishRenderPass();let o=this._getGpuColorTexture(e),s=a.texture.getGpuSource(t.source);return a.encoder.commandEncoder.copyTextureToTexture({texture:o,origin:n},{texture:s,origin:i},r),t}copyDepthTexture(e,t,n,r,i){let a=this._renderer;this.finishRenderPass();let o=e.depthStencilAttachment.texture,s=t.source,l=a.texture.getGpuSource(o),u=a.texture.getGpuSource(s),d=l.sampleCount>1||n.x!==0||n.y!==0||i.x!==0||i.y!==0||r.width!==l.width||r.height!==l.height||r.width!==u.width||r.height!==u.height;if(d){if(o.transient){c(`[RenderTargetSystem] copyDepthTexture: the source target is transient, so its multisampled depth is discarded at the end of each pass and there is nothing to copy`);return}if(!o.format.includes(`depth`)||!s.format.includes(`depth`)){c(`[RenderTargetSystem] copyDepthTexture: copying from an antialiased target or a region copies depth only, so both textures need a depth aspect (got '${o.format}' to '${s.format}')`);return}}let f=a.encoder.commandEncoder===null,p=f?a.gpu.device.createCommandEncoder():a.encoder.commandEncoder;d?(this._depthCopy??(this._depthCopy=new da(a)),this._depthCopy.copy(p,o,s,n,r,i)):p.copyTextureToTexture({texture:l},{texture:u},r),f&&a.gpu.device.queue.submit([p.finish()])}startRenderPass(e,t=!0,n,r,i=0,a=0){let o=this._renderTargetSystem.getGpuRenderTarget(e);if(a!==0&&o.msaa)throw Error(`[RenderTargetSystem] Rendering to array layers is not supported with MSAA render targets.`);if(i>0&&o.msaa)throw Error(`[RenderTargetSystem] Rendering to mip levels is not supported with MSAA render targets.`);let s=t;typeof t==`boolean`&&(s=t?P.ALL:P.NONE),(e.stencil||e.depth)&&!e.depthStencilAttachment&&e.ensureDepthStencilTexture();let c=!!e.depthStencilAttachment,l=this._activePass,u=l!==null&&l.renderTarget===e&&l.mipLevel===i&&l.layer===a&&l.depthStencil===c&&this._renderer.encoder.renderPassEncoder!==null&&s===P.NONE;if(this._renderer.pipeline.setRenderTarget(e),u){this._renderer.encoder.setViewport(r);return}let{descriptor:d,restore:f}=this._buildDescriptor(e,s,n,i,a);o.descriptor=d;let p=this._renderer.encoder;f?(p.endRenderPass(),this._beginRestoredPass(e,f,p.commandEncoder,()=>p.beginRenderPass(o))):p.beginRenderPass(o),p.setViewport(r),this._activePass={renderTarget:e,mipLevel:i,layer:a,depthStencil:c}}finishRenderPass(){this._renderer.encoder.endRenderPass(),this._activePass=null}_beginRestoredPass(e,t,n,r){let i=this._msaaRestore??(this._msaaRestore=new fa(this._renderer));for(let r of t)i.copy(n,e,r,this._getGpuColorTexture(e,r));let a=r();for(let n of t)i.draw(a,e,n);return a}_getGpuColorTexture(e,t=0){if(e.colorAttachments.length===0)throw Error(`[GpuRenderTargetAdaptor] cannot get gpu color texture from a depth-only render target`);let n=e.colorAttachments[t].texture;return n instanceof D&&n._gpuContext?n._gpuContext.getCurrentTexture():this._renderer.texture.getGpuSource(n)}getDescriptor(e,t,n,r=0,i=0){return this._buildDescriptor(e,t,n,r,i).descriptor}_buildDescriptor(e,t,n,r=0,i=0){let a=null;typeof t==`boolean`&&(t=t?P.ALL:P.NONE);let o=this._renderTargetSystem,s=o.getGpuRenderTarget(e),c=e.colorAttachments.map((e,c)=>{var l;let u=e.texture,d=u instanceof D?u._gpuContext:null,f,p,m=!1;if(d){if(i!==0)throw Error(`[RenderTargetSystem] Rendering to array layers is not supported for canvas targets.`);let t=d.getCurrentTexture();m=s.canvasTextures[c]!==t,s.canvasTextures[c]=t,f=t.createView(e.viewDescriptor)}else f=this._renderer.texture.getTextureRenderTargetView(e.texture,r,i,e.viewDescriptor);let h=null;u.antialias&&(h=d?(l=s.canvasMsaaTextures)[c]??(l[c]=new ua(this._renderer,u)):this._renderer.texture.getMsaaTexture(u),p=f,f=h.view);let g=(t&P.COLOR)!==0&&e.loadOp!==`load`?`clear`:`load`,_=!!h?.transient,v=_&&g!==`clear`,y=v&&!m;v&&(g=`clear`,y&&(a??(a=[])).push(c));let b={view:f,resolveTarget:p,storeOp:_?`discard`:e.storeOp??`store`,loadOp:g};u.dimension===`3d`&&(b.depthSlice=i),v?b.clearValue=[0,0,0,0]:g===`clear`&&(b.clearValue=e.clearValue??n??o.defaultClearColor);for(let t in e)t!==`texture`&&t!==`viewDescriptor`&&t!==`clearValue`&&t!==`loadOp`&&t!==`storeOp`&&(b[t]=e[t]);return b}),l;if(e.depthStencilAttachment){this._prepareDepthStencil(e,s);let n=e.depthStencilAttachment,a=n.texture.format.includes(`stencil`),o=n.texture.format.includes(`depth`),c=s.transient?`discard`:`store`,u=s.transient?`clear`:`load`;l={view:this._renderer.texture.getTextureRenderTargetView(n.texture,r,i,n.viewDescriptor)};let d=n.depthReadOnly??!1,f=n.stencilReadOnly??d;a&&!f?(l.stencilLoadOp=t&P.STENCIL?`clear`:n.stencilLoadOp??u,l.stencilStoreOp=n.stencilStoreOp??c,l.stencilLoadOp===`clear`&&(l.stencilClearValue=n.stencilClearValue??0)):a&&f&&(l.stencilReadOnly=!0),o&&!d?(l.depthLoadOp=t&P.DEPTH?`clear`:n.depthLoadOp??u,l.depthStoreOp=n.depthStoreOp??c,l.depthLoadOp===`clear`&&(l.depthClearValue=n.depthClearValue??1)):o&&d&&(l.depthReadOnly=!0);for(let e in n)e!==`texture`&&e!==`viewDescriptor`&&e!==`stencilLoadOp`&&e!==`stencilStoreOp`&&e!==`stencilClearValue`&&e!==`stencilReadOnly`&&e!==`depthLoadOp`&&e!==`depthStoreOp`&&e!==`depthClearValue`&&e!==`depthReadOnly`&&(l[e]=n[e])}return{descriptor:{colorAttachments:c,depthStencilAttachment:l,label:e.label},restore:a}}clear(e,t=!0,n,r,i=0,a=0){if(!t)return;let{gpu:o,encoder:s}=this._renderer,c=o.device;if(s.commandEncoder===null){let o=c.createCommandEncoder(),{descriptor:s,restore:l}=this._buildDescriptor(e,t,n,i,a),u=()=>o.beginRenderPass(s),d=l?this._beginRestoredPass(e,l,o,u):u();d.setViewport(r.x,r.y,r.width,r.height,0,1),d.end();let f=o.finish();c.queue.submit([f])}else this.startRenderPass(e,t,n,r,i,a)}initGpuRenderTarget(e){e.isRoot=!0;let t=new pa;return t.transient=!!e.colorTexture?.antialias&&!!e.colorTexture.transient,e.colorAttachments.forEach((e,n)=>{let r=e.texture;if(r instanceof D){let e=r._gpuContext??(r._gpuContext=r.resource.getContext(`webgpu`)),i=r.transparent?`premultiplied`:`opaque`,a=ha(r.format);try{e.configure({device:this._renderer.gpu.device,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC,format:a,alphaMode:i,...a===`rgba16float`?{toneMapping:{mode:`extended`}}:{}})}catch(e){console.error(e)}t.contexts[n]=e}t.msaa||(t.msaa=r.source.antialias)}),t.msaa&&(t.msaaSamples=4),t}_prepareDepthStencil(e,t){let n=e.depthStencilAttachment?.texture;n&&t.msaa&&(n.sampleCount=4,n.transient=t.transient)}destroyGpuRenderTarget(e){e.contexts.forEach(e=>{e.unconfigure()}),e.canvasMsaaTextures.forEach(e=>{e.destroy()}),e.msaaBackTextures.forEach(e=>{e?.destroy()}),e.canvasMsaaTextures.length=0,e.msaaBackTextures.length=0,e.contexts.length=0}ensureDepthStencilTexture(e){this._prepareDepthStencil(e,this._renderTargetSystem.getGpuRenderTarget(e))}resizeGpuRenderTarget(e){let t=this._renderTargetSystem.getGpuRenderTarget(e);t.width=e.width,t.height=e.height,t.msaa&&e.colorAttachments.forEach((e,n)=>{let r=e.texture;r instanceof D&&r.antialias&&(t.canvasMsaaTextures[n]?.destroy(),t.canvasMsaaTextures[n]=null),t.msaaBackTextures[n]?.resize(r.width,r.height,r._resolution)})}},_a=class extends Le{constructor(e){super(e),this.adaptor=new ga,this.adaptor.init(e,this)}};_a.extension={type:[o.WebGPUSystem],name:`renderTarget`};var va=class{constructor(){this._gpuProgramData=Object.create(null)}contextChange(e){this._gpu=e,this._gpuProgramData=Object.create(null)}getProgramData(e){return this._gpuProgramData[e._layoutKey]||this._createGPUProgramData(e)}_createGPUProgramData(e){let t=this._gpu.device,n=e.gpuLayout.map(e=>t.createBindGroupLayout({entries:e})),r={bindGroupLayouts:n};return this._gpuProgramData[e._layoutKey]={bindGroups:n,pipeline:t.createPipelineLayout(r)},this._gpuProgramData[e._layoutKey]}destroy(){this._gpu=null,this._gpuProgramData=null}};va.extension={type:[o.WebGPUSystem],name:`shader`};var V={};V.normal={alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},color:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`}},V.add={alpha:{srcFactor:`one`,dstFactor:`one`,operation:`add`},color:{srcFactor:`one`,dstFactor:`one`,operation:`add`}},V.multiply={alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},color:{srcFactor:`dst`,dstFactor:`one-minus-src-alpha`,operation:`add`}},V.screen={alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},color:{srcFactor:`one`,dstFactor:`one-minus-src`,operation:`add`}},V.overlay={alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},color:{srcFactor:`one`,dstFactor:`one-minus-src`,operation:`add`}},V.none={alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},color:{srcFactor:`zero`,dstFactor:`zero`,operation:`add`}},V[`normal-npm`]={alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},color:{srcFactor:`src-alpha`,dstFactor:`one-minus-src-alpha`,operation:`add`}},V[`add-npm`]={alpha:{srcFactor:`one`,dstFactor:`one`,operation:`add`},color:{srcFactor:`src-alpha`,dstFactor:`one`,operation:`add`}},V[`screen-npm`]={alpha:{srcFactor:`one`,dstFactor:`one-minus-src-alpha`,operation:`add`},color:{srcFactor:`src-alpha`,dstFactor:`one-minus-src`,operation:`add`}},V.erase={alpha:{srcFactor:`zero`,dstFactor:`one-minus-src-alpha`,operation:`add`},color:{srcFactor:`zero`,dstFactor:`one-minus-src-alpha`,operation:`add`}},V.min={alpha:{srcFactor:`one`,dstFactor:`one`,operation:`min`},color:{srcFactor:`one`,dstFactor:`one`,operation:`min`}},V.max={alpha:{srcFactor:`one`,dstFactor:`one`,operation:`max`},color:{srcFactor:`one`,dstFactor:`one`,operation:`max`}};var ya=class{constructor(){this.defaultState=new ge,this.defaultState.blend=!0}contextChange(e){this.gpu=e}getColorTargets(e,t){let n=e.blend?V[e.blendMode]||V.normal:void 0,r=[];for(let e=0;e<t.length;e++){let i=t[e];r[e]={format:i,writeMask:0,blend:_(i)?void 0:n}}return r}destroy(){this.gpu=null}};ya.extension={type:[o.WebGPUSystem],name:`state`};var ba=[new n,new n,new n],xa={type:`image`,upload(e,t,n,r=0){let i=e.resource,a=e.pixelWidth|0,o=e.pixelHeight|0,s=e.depthOrArrayLayers,c=i.byteLength/(a*o*s);if(s>1){n.device.queue.writeTexture({texture:t,origin:{x:0,y:0,z:r}},i,{offset:0,rowsPerImage:o,bytesPerRow:a*c},{width:a,height:o,depthOrArrayLayers:s});return}let l=ut(e._updateStart,e._updateEnd,a,o,ba);for(let e=0;e<l;e++){let o=ba[e];n.device.queue.writeTexture({texture:t,origin:{x:o.x,y:o.y,z:r}},i,{offset:(o.y*a+o.x)*c,rowsPerImage:o.height,bytesPerRow:a*c},{width:o.width,height:o.height,depthOrArrayLayers:1})}}},Sa={"bc1-rgba-unorm":{blockBytes:8,blockWidth:4,blockHeight:4},"bc2-rgba-unorm":{blockBytes:16,blockWidth:4,blockHeight:4},"bc3-rgba-unorm":{blockBytes:16,blockWidth:4,blockHeight:4},"bc7-rgba-unorm":{blockBytes:16,blockWidth:4,blockHeight:4},"etc1-rgb-unorm":{blockBytes:8,blockWidth:4,blockHeight:4},"etc2-rgba8unorm":{blockBytes:16,blockWidth:4,blockHeight:4},"astc-4x4-unorm":{blockBytes:16,blockWidth:4,blockHeight:4}},Ca={blockBytes:4,blockWidth:1,blockHeight:1},wa={type:`compressed`,upload(e,t,n,r=0){let i=e.pixelWidth,a=e.pixelHeight,o=Sa[e.format]||Ca;for(let s=0;s<e.resource.length;s++){let c=e.resource[s],l=Math.ceil(i/o.blockWidth)*o.blockBytes;n.device.queue.writeTexture({texture:t,mipLevel:s,origin:{x:0,y:0,z:r}},c,{offset:0,bytesPerRow:l},{width:Math.ceil(i/o.blockWidth)*o.blockWidth,height:Math.ceil(a/o.blockHeight)*o.blockHeight,depthOrArrayLayers:1}),i=Math.max(i>>1,1),a=Math.max(a>>1,1)}}},Ta=[`right`,`left`,`top`,`bottom`,`front`,`back`];function Ea(e){return{type:`cube`,upload(t,n,r){let i=t.faces;for(let t=0;t<Ta.length;t++){let a=i[Ta[t]];(e[a.uploadMethodId]||e.image).upload(a,n,r,t)}}}}var Da={type:`image`,upload(e,t,n,r=0){let i=e.resource;if(!i)return;if(globalThis.HTMLImageElement&&i instanceof HTMLImageElement){let t=b.get().createCanvas(i.width,i.height);t.getContext(`2d`).drawImage(i,0,0,i.width,i.height),e.resource=t,c(`ImageSource: Image element passed, converting to canvas and replacing resource.`)}let a=Math.min(t.width,e.resourceWidth||e.pixelWidth),o=Math.min(t.height,e.resourceHeight||e.pixelHeight),s=e.alphaMode===`premultiply-alpha-on-upload`;n.device.queue.copyExternalImageToTexture({source:i},{texture:t,origin:{x:0,y:0,z:r},premultipliedAlpha:s},{width:a,height:o})}},Oa={type:`video`,upload(e,t,n,r){Da.upload(e,t,n,r)}},ka=[`rgba8unorm`,`rgba16float`],Aa=4;function ja(e,t){if(!t)throw Error(`[Gpu3dMipmapGenerator] generating mipmaps for a 3D texture needs storage: true.`);if(!ka.includes(e))throw Error(`[Gpu3dMipmapGenerator] format '${e}' can't be downsampled. Use ${ka.join(`, `)}.`)}var Ma=class{constructor(e){this._pipelines={},this._device=e,this._sampler=e.createSampler({magFilter:`linear`,minFilter:`linear`})}_getMipmapPipeline(e){var t;return(t=this._pipelines)[e]??(t[e]=this._device.createComputePipeline({layout:`auto`,compute:{module:this._device.createShaderModule({code:`
                        @group(0) @binding(0) var srcSampler : sampler;
                        @group(0) @binding(1) var src : texture_3d<f32>;
                        @group(0) @binding(2) var dst : texture_storage_3d<${e}, write>;

                        @compute @workgroup_size(${Aa}, ${Aa}, ${Aa})
                        fn main(@builtin(global_invocation_id) gid : vec3<u32>) {
                            let dstSize = textureDimensions(dst);

                            if (gid.x >= dstSize.x || gid.y >= dstSize.y || gid.z >= dstSize.z) {
                                return;
                            }

                            // centre of the 2x2x2 footprint in the previous mip. When a dimension is
                            // odd its last texel, row or slice is never sampled, as in the 2D generator
                            let uv = (vec3<f32>(gid) * 2.0 + 1.0) / vec3<f32>(textureDimensions(src));

                            textureStore(dst, gid, textureSampleLevel(src, srcSampler, uv, 0.0));
                        }
                    `}),entryPoint:`main`}})),this._pipelines[e]}generateMipmap(e){if(e.dimension!==`3d`)throw Error(`[Gpu3dMipmapGenerator] generateMipmap expects a 3D texture.`);if(e.mipLevelCount<2)return;ja(e.format,(e.usage&GPUTextureUsage.STORAGE_BINDING)!==0);let t=this._getMipmapPipeline(e.format),n=t.getBindGroupLayout(0),r=this._device.createCommandEncoder({label:`Gpu3dMipmapGenerator`}),i=r.beginComputePass();i.setPipeline(t);let a=e.width,o=e.height,s=e.depthOrArrayLayers,c=e.createView({dimension:`3d`,baseMipLevel:0,mipLevelCount:1});for(let t=1;t<e.mipLevelCount;t++){a=Math.max(1,a>>1),o=Math.max(1,o>>1),s=Math.max(1,s>>1);let r=e.createView({dimension:`3d`,baseMipLevel:t,mipLevelCount:1});i.setBindGroup(0,this._device.createBindGroup({layout:n,entries:[{binding:0,resource:this._sampler},{binding:1,resource:c},{binding:2,resource:r}]})),i.dispatchWorkgroups(Math.ceil(a/Aa),Math.ceil(o/Aa),Math.ceil(s/Aa)),c=r}i.end(),this._device.queue.submit([r.finish()])}},Na=class{constructor(e){this._pipelines={},this._device=e,this._sampler=e.createSampler({minFilter:`linear`})}_getMipmapPipeline(e){let t=this._pipelines[e];return t||(this._mipmapShaderModule||(this._mipmapShaderModule=this._device.createShaderModule({code:`
                        var<private> pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
                        vec2<f32>(-1.0, -1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0));

                        struct VertexOutput {
                        @builtin(position) position : vec4<f32>,
                        @location(0) texCoord : vec2<f32>,
                        };

                        @vertex
                        fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
                        var output : VertexOutput;
                        output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
                        output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                        return output;
                        }

                        @group(0) @binding(0) var imgSampler : sampler;
                        @group(0) @binding(1) var img : texture_2d<f32>;

                        @fragment
                        fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {
                        return textureSample(img, imgSampler, texCoord);
                        }
                    `})),t=this._device.createRenderPipeline({layout:`auto`,vertex:{module:this._mipmapShaderModule,entryPoint:`vertexMain`},fragment:{module:this._mipmapShaderModule,entryPoint:`fragmentMain`,targets:[{format:e}]}}),this._pipelines[e]=t),t}generateMipmap(e){if(e.dimension===`3d`)throw Error(`[GpuMipmapGenerator] a 3D texture uses Gpu3dMipmapGenerator.`);if(e.dimension===`1d`)throw Error(`Generating mipmaps for 1d textures is currently unsupported!`);let t=this._getMipmapPipeline(e.format),n=e,r=e.depthOrArrayLayers||1,i=e.usage&GPUTextureUsage.RENDER_ATTACHMENT;if(!i){let t={size:{width:Math.ceil(e.width/2),height:Math.ceil(e.height/2),depthOrArrayLayers:r},format:e.format,usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_SRC|GPUTextureUsage.RENDER_ATTACHMENT,mipLevelCount:e.mipLevelCount-1};n=this._device.createTexture(t)}let a=this._device.createCommandEncoder({}),o=t.getBindGroupLayout(0);for(let s=0;s<r;++s){let r=e.createView({baseMipLevel:0,mipLevelCount:1,dimension:`2d`,baseArrayLayer:s,arrayLayerCount:1}),c=+!!i;for(let i=1;i<e.mipLevelCount;++i){let e=n.createView({baseMipLevel:c++,mipLevelCount:1,dimension:`2d`,baseArrayLayer:s,arrayLayerCount:1}),i=a.beginRenderPass({colorAttachments:[{view:e,storeOp:`store`,loadOp:`clear`,clearValue:{r:0,g:0,b:0,a:0}}]}),l=this._device.createBindGroup({layout:o,entries:[{binding:0,resource:this._sampler},{binding:1,resource:r}]});i.setPipeline(t),i.setBindGroup(0,l),i.draw(3,1,0,0),i.end(),r=e}}if(!i){let t={width:Math.ceil(e.width/2),height:Math.ceil(e.height/2),depthOrArrayLayers:r};for(let r=1;r<e.mipLevelCount;++r)a.copyTextureToTexture({texture:n,mipLevel:r-1},{texture:e,mipLevel:r},t),t.width=Math.ceil(t.width/2),t.height=Math.ceil(t.height/2)}return this._device.queue.submit([a.finish()]),i||n.destroy(),e}},Pa=class{constructor(e){this.textureView=null,this.textureViews=Object.create(null),this.msaa=null,this.gpuTexture=e}destroy(){this.gpuTexture.destroy(),this.msaa?.destroy(),this.textureView=null,this.textureViews=null,this.gpuTexture=null,this.msaa=null}},Fa=/^(rgba8|bgra8|bc[1237]-rgba-|etc2-rgb8|etc2-rgb8a1|etc2-rgba8|astc-\d+x\d+-)unorm$/;function Ia(e){return Fa.test(e)?[`${e}-srgb`]:void 0}function La(e){return`${e.format||``}.${e.dimension||``}.${e.aspect||``}.${e.baseMipLevel||0}.${e.mipLevelCount||``}.${e.baseArrayLayer||0}.${e.arrayLayerCount||``}`}var Ra=class e{constructor(t){this._gpuSamplers=Object.create(null),this._bindGroupHash=Object.create(null),this._renderer=t,t.gc.addCollection(this,`_bindGroupHash`,`hash`),this._managedTextures=new F({renderer:t,type:`resource`,onUnload:this.onSourceUnload.bind(this),name:`gpuTextureSource`});let n={image:Da,buffer:xa,video:Oa,compressed:wa,...e.uploadExtensions};this._uploads={...n,cube:Ea(n)}}get managedTextures(){return Object.values(this._managedTextures.items)}contextChange(e){this._gpu=e,this._managedTextures.removeAll(),this._gpuSamplers=Object.create(null),this._mipmapGenerator=null,this._mipmap3dGenerator=null}initSource(e){return e._gpuData[this._renderer.uid]?.gpuTexture||this._initSource(e)}_initSource(e){if(e.autoGenerateMipmaps){e.dimension===`3d`&&ja(e.format,e.storage);let t=Math.max(e.pixelWidth,e.pixelHeight,e.depth);e.mipLevelCount=Math.floor(Math.log2(t))+1}let t,n;e.sampleCount>1?(t=GPUTextureUsage.RENDER_ATTACHMENT,e.transient?this._renderer.device.extensions.transientAttachment&&(t|=GPUTextureUsage.TRANSIENT_ATTACHMENT):e.format.includes(`depth`)&&(t|=GPUTextureUsage.TEXTURE_BINDING)):(t=GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST,e.uploadMethodId!==`compressed`&&(t|=GPUTextureUsage.RENDER_ATTACHMENT,t|=GPUTextureUsage.COPY_SRC),e.storage&&(t|=GPUTextureUsage.STORAGE_BINDING),n=Ia(e.format));let r=Sa[e.format]||{blockBytes:4,blockWidth:1,blockHeight:1},i=Math.ceil(e.pixelWidth/r.blockWidth)*r.blockWidth,a=Math.ceil(e.pixelHeight/r.blockHeight)*r.blockHeight,o={label:e.label,size:{width:i,height:a,depthOrArrayLayers:e.depthOrArrayLayers},format:e.format,viewFormats:n,sampleCount:e.sampleCount,mipLevelCount:e.mipLevelCount,dimension:e.dimension,usage:t},s=this._gpu.device.createTexture(o);return e._gpuData[this._renderer.uid]=new Pa(s),this._managedTextures.add(e)&&(e.on(`update`,this.onSourceUpdate,this),e.on(`resize`,this.onSourceResize,this),e.on(`updateMipmaps`,this.onUpdateMipmaps,this)),this.onSourceUpdate(e),s}onSourceUpdate(e){let t=this.getGpuSource(e);t&&(this._uploads[e.uploadMethodId]&&this._uploads[e.uploadMethodId].upload(e,t,this._gpu),e.autoGenerateMipmaps&&e.mipLevelCount>1&&this.onUpdateMipmaps(e))}onUpdateMipmaps(e){let t=this.getGpuSource(e);e.dimension===`3d`?(this._mipmap3dGenerator??(this._mipmap3dGenerator=new Ma(this._gpu.device)),this._mipmap3dGenerator.generateMipmap(t)):(this._mipmapGenerator??(this._mipmapGenerator=new Na(this._gpu.device)),this._mipmapGenerator.generateMipmap(t))}onSourceUnload(e){e.off(`update`,this.onSourceUpdate,this),e.off(`resize`,this.onSourceResize,this),e.off(`updateMipmaps`,this.onUpdateMipmaps,this)}onSourceResize(e){e._gcLastUsed=this._renderer.gc.now;let t=e._gpuData[this._renderer.uid],n=t?.gpuTexture;n?(n.width!==e.pixelWidth||n.height!==e.pixelHeight)&&(t.destroy(),this._bindGroupHash[e.uid]=null,e._gpuData[this._renderer.uid]=null,this.initSource(e)):this.initSource(e)}_initSampler(e){return this._gpuSamplers[e._resourceId]=this._gpu.device.createSampler(e),this._gpuSamplers[e._resourceId]}getGpuSampler(e){return this._gpuSamplers[e._resourceId]||this._initSampler(e)}getGpuSource(e){return e._gcLastUsed=this._renderer.gc.now,e._gpuData[this._renderer.uid]?.gpuTexture||this.initSource(e)}getMsaaTexture(e){this.getGpuSource(e);let t=e._gpuData[this._renderer.uid];return t.msaa??(t.msaa=new ua(this._renderer,e)),t.msaa}getTextureBindGroup(e){return this._bindGroupHash[e.uid]||this._createTextureBindGroup(e)}_createTextureBindGroup(e){let t=e.source;return this._bindGroupHash[e.uid]=new v({0:t,1:t.style,2:new g({uTextureMatrix:{type:`mat3x3<f32>`,value:e.textureMatrix.mapCoord}})}),this._bindGroupHash[e.uid]}getTextureView(e,t){var n;let r=e.source;r._gcLastUsed=this._renderer.gc.now;let i=r._gpuData[this._renderer.uid];i||(this.initSource(r),i=r._gpuData[this._renderer.uid]);let a=t?La(t):0;return(n=i.textureViews)[a]||(n[a]=i.gpuTexture.createView({dimension:r.viewDimension,...t})),i.textureViews[a]}getTextureRenderTargetView(e,t=0,n=0,r){var i;let a=e.source;a._gcLastUsed=this._renderer.gc.now;let o=a._gpuData[this._renderer.uid];o||(this.initSource(a),o=a._gpuData[this._renderer.uid]);let s=a.dimension===`3d`;s&&(n=0);let c=n*(a.mipLevelCount||1)+t+1;return r&&(c=`${c}.${La(r)}`),(i=o.textureViews)[c]||(i[c]=o.gpuTexture.createView({dimension:s?`3d`:`2d`,baseMipLevel:t,mipLevelCount:1,baseArrayLayer:n,arrayLayerCount:1,...r})),o.textureViews[c]}generateCanvas(e){let t=this._renderer,n=t.gpu.device.createCommandEncoder(),r=b.get().createCanvas();r.width=e.source.pixelWidth,r.height=e.source.pixelHeight;let i=r.getContext(`webgpu`),a=e.source.format.replace(`-srgb`,``),o=ma[a]?a:b.get().getNavigator().gpu.getPreferredCanvasFormat();return i.configure({device:t.gpu.device,usage:GPUTextureUsage.COPY_DST|GPUTextureUsage.COPY_SRC,format:o,alphaMode:`premultiplied`}),n.copyTextureToTexture({texture:t.texture.getGpuSource(e.source),origin:{x:0,y:0}},{texture:i.getCurrentTexture()},{width:r.width,height:r.height}),t.gpu.device.queue.submit([n.finish()]),r}getPixels(e){let t=this.generateCanvas(e),n=w.getOptimalCanvasAndContext(t.width,t.height),r=n.context;r.drawImage(t,0,0);let{width:i,height:a}=t,o=r.getImageData(0,0,i,a),s=new Uint8ClampedArray(o.data.buffer);return w.returnCanvasAndContext(n),{pixels:s,width:i,height:a}}destroy(){this._managedTextures.destroy();for(let e of Object.keys(this._bindGroupHash)){let t=Number(e);this._bindGroupHash[t]?.destroy()}this._renderer=null,this._gpu=null,this._mipmapGenerator=null,this._mipmap3dGenerator=null,this._gpuSamplers=null,this._bindGroupHash=null}};Ra.extension={type:[o.WebGPUSystem],name:`texture`},Ra.uploadExtensions=Object.create(null);var za=Ra;s.handleByMap(o.TextureUploaderWebGPU,za.uploadExtensions);var Ba=e({WebGPURenderer:()=>Ja}),Va=[...Ie,Yi,Hi,Bi,Ui,Fi,za,_a,va,ya,la,Ii,Wi,Ni],Ha=[...Pe,Zi],Ua=[Ai,Oi,Di],Wa=[],Ga=[],Ka=[],qa=[];s.handleByNamedList(o.WebGPUSystem,Wa),s.handleByNamedList(o.WebGPUPipes,Ga),s.handleByNamedList(o.WebGPUPipesAdaptor,Ka),s.handleByNamedList(o.WebGPULoader,qa),s.add(...Va,...Ha,...Ua);var Ja=class extends Oe{constructor(){let e={name:`webgpu`,type:re.WEBGPU,systems:Wa,renderPipes:Ga,renderPipeAdaptors:Ka,loaders:qa};super(e)}},Ya=class extends m{constructor(){super(...arguments),this.chars=Object.create(null),this.lineHeight=0,this.fontFamily=``,this.fontMetrics={fontSize:0,ascent:0,descent:0},this.baseLineOffset=0,this.distanceField={type:`none`,range:0},this.pages=[],this.applyFillAsTint=!0,this.baseMeasurementFontSize=100,this.baseRenderedFontSize=100}get font(){return u(a,`BitmapFont.font is deprecated, please use BitmapFont.fontFamily instead.`),this.fontFamily}get pageTextures(){return u(a,`BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead.`),this.pages}get size(){return u(a,`BitmapFont.size is deprecated, please use BitmapFont.fontMetrics.fontSize instead.`),this.fontMetrics.fontSize}get distanceFieldRange(){return u(a,`BitmapFont.distanceFieldRange is deprecated, please use BitmapFont.distanceField.range instead.`),this.distanceField.range}get distanceFieldType(){return u(a,`BitmapFont.distanceFieldType is deprecated, please use BitmapFont.distanceField.type instead.`),this.distanceField.type}destroy(e=!1){this.emit(`destroy`,this),this.removeAllListeners();for(let e in this.chars)this.chars[e].texture?.destroy();this.chars=null,e&&(this.pages.forEach(e=>e.texture.destroy(!0)),this.pages=null)}},Xa=class{constructor(e=0,t=0,n=!1){this.first=null,this.items=Object.create(null),this.last=null,this.max=e,this.resetTtl=n,this.size=0,this.ttl=t}clear(){return this.first=null,this.items=Object.create(null),this.last=null,this.size=0,this}delete(e){if(this.has(e)){let t=this.items[e];delete this.items[e],this.size--,t.prev!==null&&(t.prev.next=t.next),t.next!==null&&(t.next.prev=t.prev),this.first===t&&(this.first=t.next),this.last===t&&(this.last=t.prev)}return this}entries(e=this.keys()){let t=Array(e.length);for(let n=0;n<e.length;n++){let r=e[n];t[n]=[r,this.get(r)]}return t}evict(e=!1){if(e||this.size>0){let e=this.first;delete this.items[e.key],--this.size===0?(this.first=null,this.last=null):(this.first=e.next,this.first.prev=null)}return this}expiresAt(e){let t;return this.has(e)&&(t=this.items[e].expiry),t}get(e){let t=this.items[e];if(t!==void 0){if(this.ttl>0&&t.expiry<=Date.now()){this.delete(e);return}return this.moveToEnd(t),t.value}}has(e){return e in this.items}moveToEnd(e){this.last!==e&&(e.prev!==null&&(e.prev.next=e.next),e.next!==null&&(e.next.prev=e.prev),this.first===e&&(this.first=e.next),e.prev=this.last,e.next=null,this.last!==null&&(this.last.next=e),this.last=e,this.first===null&&(this.first=e))}keys(){let e=Array(this.size),t=this.first,n=0;for(;t!==null;)e[n++]=t.key,t=t.next;return e}setWithEvicted(e,t,n=this.resetTtl){let r=null;if(this.has(e))this.set(e,t,!0,n);else{this.max>0&&this.size===this.max&&(r={...this.first},this.evict(!0));let n=this.items[e]={expiry:this.ttl>0?Date.now()+this.ttl:this.ttl,key:e,prev:this.last,next:null,value:t};++this.size===1?this.first=n:this.last.next=n,this.last=n}return r}set(e,t,n=!1,r=this.resetTtl){let i=this.items[e];return n||i!==void 0?(i.value=t,n===!1&&r&&(i.expiry=this.ttl>0?Date.now()+this.ttl:this.ttl),this.moveToEnd(i)):(this.max>0&&this.size===this.max&&this.evict(!0),i=this.items[e]={expiry:this.ttl>0?Date.now()+this.ttl:this.ttl,key:e,prev:this.last,next:null,value:t},++this.size===1?this.first=i:this.last.next=i,this.last=i),this}values(e=this.keys()){let t=Array(e.length);for(let n=0;n<e.length;n++)t[n]=this.get(e[n]);return t}};function Za(e=1e3,t=0,n=!1){if(isNaN(e)||e<0)throw TypeError(`Invalid max value`);if(isNaN(t)||t<0)throw TypeError(`Invalid ttl value`);if(typeof n!=`boolean`)throw TypeError(`Invalid resetTtl value`);return new Xa(e,t,n)}function Qa(e){return!!e.tagStyles&&Object.keys(e.tagStyles).length>0}function $a(e){return e.includes(`<`)}function eo(e,t){return e.clone().assign(t)}function to(e,t){let n=[],r=t.tagStyles;if(!Qa(t)||!$a(e))return n.push({text:e,style:t}),n;let i=[t],a=[],o=``,s=0;for(;s<e.length;){let t=e[s];if(t===`<`){let c=e.indexOf(`>`,s);if(c===-1){o+=t,s++;continue}let l=e.indexOf(`<`,s+1);if(l!==-1&&l<c){o+=t,s++;continue}let u=e.slice(s+1,c);if(u.startsWith(`/`)){let t=u.slice(1).trim();if(a.length>0&&a[a.length-1]===t){o.length>0&&(n.push({text:o,style:i[i.length-1]}),o=``),i.pop(),a.pop(),s=c+1;continue}o+=e.slice(s,c+1),s=c+1;continue}{let t=u.trim();if(r[t]){o.length>0&&(n.push({text:o,style:i[i.length-1]}),o=``);let e=i[i.length-1],l=eo(e,r[t]);i.push(l),a.push(t),s=c+1;continue}o+=e.slice(s,c+1),s=c+1;continue}}o+=t,s++}return o.length>0&&n.push({text:o,style:i[i.length-1]}),n}var no=new Set([10,13]),ro=new Set([9,32,8192,8193,8194,8195,8196,8197,8198,8200,8201,8202,8287,12288]),io=new Set([9,32]),ao=new Set([45,8208,8211,8212,173]),oo=/(\r\n|\r|\n)/,so=/(?:\r\n|\r|\n)/;function co(e){return typeof e==`string`&&no.has(e.charCodeAt(0))}function H(e,t){return typeof e==`string`&&ro.has(e.charCodeAt(0))}function lo(e){return typeof e==`string`&&io.has(e.charCodeAt(0))}function uo(e){return typeof e==`string`&&ao.has(e.charCodeAt(0))}function fo(e){return e===`normal`||e===`pre-line`}function po(e){return e===`normal`}function U(e){if(typeof e!=`string`)return``;let t=e.length-1;for(;t>=0&&H(e[t]);)t--;return t<e.length-1?e.slice(0,t+1):e}function mo(e){let t=[],n=[];if(typeof e!=`string`)return t;for(let r=0;r<e.length;r++){let i=e[r],a=e[r+1];H(i,a)||co(i)?(n.length>0&&(t.push(n.join(``)),n.length=0),i===`\r`&&a===`
`?(t.push(`\r
`),r++):t.push(i)):(n.push(i),uo(i)&&a&&!H(a)&&!co(a)&&(t.push(n.join(``)),n.length=0))}return n.length>0&&t.push(n.join(``)),t}function ho(e,t,n,r){let i=n(e),a=[];for(let n=0;n<i.length;n++){let o=i[n],s=o,c=1;for(;i[n+c];){let a=i[n+c];if(!r(s,a,e,n,t))o+=a,s=a,c++;else break}n+=c-1,a.push(o)}return a}var go=/\r\n|\r|\n/g;function _o(e,t,n,r,i,a,o,s,c){let l=to(e,t);if(po(t.whiteSpace))for(let e=0;e<l.length;e++){let t=l[e];l[e]={text:t.text.replace(go,` `),style:t.style}}let u=[],d=[];for(let e of l){let t=e.text.split(oo);for(let n=0;n<t.length;n++){let r=t[n];r===`\r
`||r===`\r`||r===`
`?(u.push(d),d=[]):r.length>0&&d.push({text:r,style:e.style})}}(d.length>0||u.length===0)&&u.push(d);let f=n?vo(u,t,r,a,s,c):u,p=[],m=[],h=[],g=[],_=[],v=0,y=t._fontString,b=o(y);b.fontSize===0&&(b.fontSize=t.fontSize,b.ascent=t.fontSize);let x=``,S=!!t.dropShadow,C=t._stroke?.width||0;for(let e of f){let n=0,a=b.ascent,s=b.descent,c=``;for(let t of e){let e=t.style._fontString,l=o(e);e!==x&&(r.font=e,x=e);let u=i(t.text,t.style.letterSpacing,r);n+=u,a=Math.max(a,l.ascent),s=Math.max(s,l.descent),c+=t.text;let d=t.style._stroke?.width||0;d>C&&(C=d),!S&&t.style.dropShadow&&(S=!0)}e.length===0&&(a=b.ascent,s=b.descent),p.push(n),m.push(a),h.push(s),_.push(c);let l=t.lineHeight||a+s;g.push(l+t.leading),v=Math.max(v,n)}let w=C,ee=v+w+(t.dropShadow?t.dropShadow.distance:0),te=0;for(let e=0;e<g.length;e++)te+=g[e];return te=Math.max(te,g[0]+w),{width:ee,height:te+(t.dropShadow?t.dropShadow.distance:0),lines:_,lineWidths:p,lineHeight:(t.lineHeight||b.fontSize)+t.leading,maxLineWidth:v,fontProperties:b,runsByLine:f,lineAscents:m,lineDescents:h,lineHeights:g,hasDropShadow:S}}function vo(e,t,n,r,i,a){let{letterSpacing:o,whiteSpace:s,wordWrapWidth:c,breakWords:l}=t,u=fo(s),d=c+o,f={},p=``,m=(e,t)=>{let i=`${e}|${t.styleKey}`,a=f[i];if(a===void 0){let o=t._fontString;o!==p&&(n.font=o,p=o),a=r(e,t.letterSpacing,n)+t.letterSpacing,f[i]=a}return a},h=[];for(let t of e){let e=yo(t),n=h.length,r=t=>{let n=0,r=t;do{let{token:t,style:i}=e[r];n+=m(t,i),r++}while(r<e.length&&e[r].continuesFromPrevious);return n},o=t=>{let n=[],r=t;do n.push({token:e[r].token,style:e[r].style}),r++;while(r<e.length&&e[r].continuesFromPrevious);return n},s=[],c=0,f=!u,p=null,g=()=>{p&&p.text.length>0&&s.push(p),p=null},_=()=>{if(g(),s.length>0){let e=s[s.length-1];e.text=U(e.text),e.text.length===0&&s.pop()}h.push(s),s=[],c=0,f=!1};for(let t=0;t<e.length;t++){let{token:n,style:v,continuesFromPrevious:y}=e[t],b=m(n,v);if(u){let e=H(n),t=p?.text[p.text.length-1]??s[s.length-1]?.text.slice(-1)??``,r=t?H(t):!1;if(e&&r)continue}let x=!y,S=x?r(t):b;if(S>d&&x){if(c>0&&_(),l){let e=o(t);for(let t=0;t<e.length;t++){let n=e[t].token,r=e[t].style,o=ho(n,l,a,i);for(let e of o){let t=m(e,r);t+c>d&&_(),!p||p.style!==r?(g(),p={text:e,style:r}):p.text+=e,c+=t}}t+=e.length-1}else{let e=o(t);g(),h.push(e.map(e=>({text:e.token,style:e.style}))),f=!1,t+=e.length-1}}else if(S+c>d&&x){if(H(n)){f=!1;continue}_(),p={text:n,style:v},c=b}else if(y&&!l)!p||p.style!==v?(g(),p={text:n,style:v}):p.text+=n,c+=b;else{let e=H(n);if(c===0&&e&&!f)continue;!p||p.style!==v?(g(),p={text:n,style:v}):p.text+=n,c+=b}}if(g(),s.length>0){let e=s[s.length-1];e.text=U(e.text),e.text.length===0&&s.pop()}(s.length>0||h.length===n)&&h.push(s)}return h}function yo(e){let t=[],n=!1;for(let r of e){let e=mo(r.text),i=!0;for(let a of e){let e=H(a)||co(a),o=i&&n&&!e;t.push({token:a,style:r.style,continuesFromPrevious:o}),n=!e,i=!1}}return t}var bo={willReadFrequently:!0};function xo(e,t,n,r,i){let a=n[e];return typeof a!=`number`&&(a=i(e,t,r)+t,n[e]=a),a}function So(e,t,n,r,i,a,o){let s=n.getContext(`2d`,bo);s.font=t._fontString;let c=0,l=``,u=[],d=Object.create(null),{letterSpacing:f,whiteSpace:p}=t,m=fo(p),h=po(p),g=!m,_=t.wordWrapWidth+f,v=mo(e);for(let e=0;e<v.length;e++){let n=v[e];if(co(n)){if(!h){u.push(U(l)),g=!m,l=``,c=0;continue}n=` `}if(m){let e=H(n),t=H(l[l.length-1]);if(e&&t)continue}let p=xo(n,f,d,s,r);if(p>_){if(l!==``&&(u.push(U(l)),l=``,c=0),i(n,t.breakWords)){let e=ho(n,t.breakWords,o,a);for(let t of e){let e=xo(t,f,d,s,r);e+c>_&&(u.push(U(l)),g=!1,l=``,c=0),l+=t,c+=e}}else l.length>0&&(u.push(U(l)),l=``,c=0),u.push(U(n)),g=!1,l=``,c=0}else p+c>_&&(g=!1,u.push(U(l)),l=``,c=0),(l.length>0||!H(n)||g)&&(l+=n,c+=p)}let y=U(l);return y.length>0&&u.push(y),u.join(`
`)}var Co={willReadFrequently:!0},W=class e{static get experimentalLetterSpacingSupported(){let t=e._experimentalLetterSpacingSupported;if(t===void 0){let n=b.get().getCanvasRenderingContext2D().prototype;t=e._experimentalLetterSpacingSupported=`letterSpacing`in n||`textLetterSpacing`in n}return t}constructor(e,t,n,r,i,a,o,s,c,l){this.text=e,this.style=t,this.width=n,this.height=r,this.lines=i,this.lineWidths=a,this.lineHeight=o,this.maxLineWidth=s,this.fontProperties=c,l&&(this.runsByLine=l.runsByLine,this.lineAscents=l.lineAscents,this.lineDescents=l.lineDescents,this.lineHeights=l.lineHeights,this.hasDropShadow=l.hasDropShadow)}static measureText(t=` `,n,r=e._canvas,i=n.wordWrap){let a=`${t}-${n.styleKey}-wordWrap-${i}`;if(e._measurementCache.has(a))return e._measurementCache.get(a);if(Qa(n)&&$a(t)){let r=_o(t,n,i,e._context,e._measureText,e._measureTextAdvance,e.measureFont,e.canBreakChars,e.wordWrapSplit),o=new e(t,n,r.width,r.height,r.lines,r.lineWidths,r.lineHeight,r.maxLineWidth,r.fontProperties,{runsByLine:r.runsByLine,lineAscents:r.lineAscents,lineDescents:r.lineDescents,lineHeights:r.lineHeights,hasDropShadow:r.hasDropShadow});return e._measurementCache.set(a,o),o}let o=n._fontString,s=e.measureFont(o);s.fontSize===0&&(s.fontSize=n.fontSize,s.ascent=n.fontSize,s.descent=0);let c=e._context;c.font=o;let l=(i?e._wordWrap(t,n,r):t).split(so),u=Array(l.length),d=0;for(let t=0;t<l.length;t++){let r=e._measureText(l[t],n.letterSpacing,c);u[t]=r,d=Math.max(d,r)}let f=n._stroke?.width??0,p=n.lineHeight||s.fontSize,m=e._adjustWidthForStyle(d,n),h=Math.max(p,s.fontSize+f)+(l.length-1)*(p+n.leading),g=e._adjustHeightForStyle(h,n),_=new e(t,n,m,g,l,u,p+n.leading,d,s);return e._measurementCache.set(a,_),_}static _adjustWidthForStyle(e,t){let n=e+(t._stroke?.width||0);return t.dropShadow&&(n+=t.dropShadow.distance),n}static _adjustHeightForStyle(e,t){let n=e;return t.dropShadow&&(n+=t.dropShadow.distance),n}static _measureText(t,n,r){let{metricWidth:i,metrics:a,letterSpacingVal:o}=e._measureTextCore(t,n,r),s=-(a.actualBoundingBoxLeft??0),c=(a.actualBoundingBoxRight??0)-s;return a.width>0&&(c+=o),Math.max(i,c)}static _measureTextAdvance(t,n,r){return e._measureTextCore(t,n,r).metricWidth}static _measureTextCore(t,n,r){let i=!1;e.experimentalLetterSpacingSupported&&(e.experimentalLetterSpacing?(r.letterSpacing=`${n}px`,r.textLetterSpacing=`${n}px`,i=!0):(r.letterSpacing=`0px`,r.textLetterSpacing=`0px`));let a=r.measureText(t),o=a.width,s=0;return o>0&&(s=i?-n:(e.graphemeSegmenter(t).length-1)*n,o+=s),{metricWidth:o,metrics:a,letterSpacingVal:s}}static _wordWrap(t,n,r=e._canvas){return So(t,n,r,e._measureTextAdvance,e.canBreakWords,e.canBreakChars,e.wordWrapSplit)}static isBreakingSpace(e,t){return H(e,t)}static canBreakWords(e,t){return t}static canBreakChars(e,t,n,r,i){return!0}static wordWrapSplit(t){return e.graphemeSegmenter(t)}static measureFont(t){if(e._fonts[t])return e._fonts[t];let n=e._context;n.font=t;let r=n.measureText(e.METRICS_STRING+e.BASELINE_SYMBOL),i=r.actualBoundingBoxAscent??0,a=r.actualBoundingBoxDescent??0,o={ascent:i,descent:a,fontSize:i+a};return e._fonts[t]=o,o}static clearMetrics(t=``){t?delete e._fonts[t]:e._fonts={}}static get _canvas(){if(!e.__canvas){let t;try{let n=new OffscreenCanvas(0,0);if(n.getContext(`2d`,Co)?.measureText)return e.__canvas=n,n;t=b.get().createCanvas()}catch{t=b.get().createCanvas()}t.width=t.height=10,e.__canvas=t}return e.__canvas}static get _context(){return e.__context||(e.__context=e._canvas.getContext(`2d`,Co)),e.__context}};W.METRICS_STRING=`|ÉqÅ`,W.BASELINE_SYMBOL=`M`,W.BASELINE_MULTIPLIER=1.4,W.HEIGHT_MULTIPLIER=2,W.graphemeSegmenter=(()=>{if(typeof Intl?.Segmenter==`function`){let e=new Intl.Segmenter;return t=>{let n=e.segment(t),r=[],i=0;for(let e of n)r[i++]=e.segment;return r}}return e=>[...e]})(),W.experimentalLetterSpacing=!1,W._fonts={},W._measurementCache=Za(1e3);var wo=W,To=[`serif`,`sans-serif`,`monospace`,`cursive`,`fantasy`,`system-ui`];function Eo(e){let t=typeof e.fontSize==`number`?`${e.fontSize}px`:e.fontSize,n=e.fontFamily;Array.isArray(e.fontFamily)||(n=e.fontFamily.split(`,`));for(let e=n.length-1;e>=0;e--){let t=n[e].trim();!/([\"\'])[^\'\"]+\1/.test(t)&&!To.includes(t)&&(t=`"${t}"`),n[e]=t}return`${e.fontStyle} ${e.fontVariant} ${e.fontWeight} ${t} ${n.join(`,`)}`}var Do=class e extends m{constructor(t={}){super(),this.uid=d(`textStyle`),this._tick=0,this._cachedFontString=null,ko(t),t instanceof e&&(t=t._toObject());let n={...e.defaultTextStyle,...t};for(let e in n){let t=e;this[t]=n[e]}this._tagStyles=t.tagStyles??void 0,this.update(),this._tick=0}get align(){return this._align}set align(e){this._align!==e&&(this._align=e,this.update())}get breakWords(){return this._breakWords}set breakWords(e){this._breakWords!==e&&(this._breakWords=e,this.update())}get dropShadow(){return this._dropShadow}set dropShadow(t){this._dropShadow!==t&&(this._dropShadow=typeof t==`object`&&t?this._createProxy({...e.defaultDropShadow,...t}):t?this._createProxy({...e.defaultDropShadow}):null,this.update())}get fontFamily(){return this._fontFamily}set fontFamily(e){this._fontFamily!==e&&(this._fontFamily=e,this.update())}get fontSize(){return this._fontSize}set fontSize(e){this._fontSize!==e&&(this._fontSize=typeof e==`string`?parseInt(e,10):e,this.update())}get fontStyle(){return this._fontStyle}set fontStyle(e){this._fontStyle!==e&&(this._fontStyle=e.toLowerCase(),this.update())}get fontVariant(){return this._fontVariant}set fontVariant(e){this._fontVariant!==e&&(this._fontVariant=e,this.update())}get fontWeight(){return this._fontWeight}set fontWeight(e){this._fontWeight!==e&&(this._fontWeight=e,this.update())}get leading(){return this._leading}set leading(e){this._leading!==e&&(this._leading=e,this.update())}get letterSpacing(){return this._letterSpacing}set letterSpacing(e){this._letterSpacing!==e&&(this._letterSpacing=e,this.update())}get lineHeight(){return this._lineHeight}set lineHeight(e){this._lineHeight!==e&&(this._lineHeight=e,this.update())}get padding(){return this._padding}set padding(e){this._padding!==e&&(this._padding=e,this.update())}get filters(){return this._filters}set filters(e){this._filters!==e&&(this._filters=Object.freeze(e),this.update())}get trim(){return this._trim}set trim(e){this._trim!==e&&(this._trim=e,this.update())}get textBaseline(){return this._textBaseline}set textBaseline(e){this._textBaseline!==e&&(this._textBaseline=e,this.update())}get whiteSpace(){return this._whiteSpace}set whiteSpace(e){this._whiteSpace!==e&&(this._whiteSpace=e,this.update())}get wordWrap(){return this._wordWrap}set wordWrap(e){this._wordWrap!==e&&(this._wordWrap=e,this.update())}get wordWrapWidth(){return this._wordWrapWidth}set wordWrapWidth(e){this._wordWrapWidth!==e&&(this._wordWrapWidth=e,this.update())}get fill(){return this._originalFill}set fill(e){e!==this._originalFill&&(this._originalFill=e,this._isFillStyle(e)&&(this._originalFill=this._createProxy({...N.defaultFillStyle,...e},()=>{this._fill=Ce({...this._originalFill},N.defaultFillStyle)})),this._fill=Ce(e===0?`black`:e,N.defaultFillStyle),this.update())}get stroke(){return this._originalStroke}set stroke(e){e!==this._originalStroke&&(this._originalStroke=e,this._isFillStyle(e)&&(this._originalStroke=this._createProxy({...N.defaultStrokeStyle,...e},()=>{this._stroke=Te({...this._originalStroke},N.defaultStrokeStyle)})),this._stroke=Te(e,N.defaultStrokeStyle),this.update())}get tagStyles(){return this._tagStyles}set tagStyles(e){this._tagStyles!==e&&(this._tagStyles=e??void 0,this.update())}update(){this._tick++,this._cachedFontString=null,this.emit(`update`,this)}reset(){let t=e.defaultTextStyle;for(let e in t)this[e]=t[e]}assign(e){for(let t in e){let n=t;this[n]=e[t]}return this}get styleKey(){return`${this.uid}-${this._tick}`}get _fontString(){return this._cachedFontString===null&&(this._cachedFontString=Eo(this)),this._cachedFontString}_toObject(){return{align:this.align,breakWords:this.breakWords,dropShadow:this._dropShadow?{...this._dropShadow}:null,fill:this._fill?{...this._fill}:void 0,fontFamily:this.fontFamily,fontSize:this.fontSize,fontStyle:this.fontStyle,fontVariant:this.fontVariant,fontWeight:this.fontWeight,leading:this.leading,letterSpacing:this.letterSpacing,lineHeight:this.lineHeight,padding:this.padding,stroke:this._stroke?{...this._stroke}:void 0,textBaseline:this.textBaseline,trim:this.trim,whiteSpace:this.whiteSpace,wordWrap:this.wordWrap,wordWrapWidth:this.wordWrapWidth,filters:this._filters?[...this._filters]:void 0,tagStyles:this._tagStyles?{...this._tagStyles}:void 0}}clone(){return new e(this._toObject())}_getFinalPadding(){let e=0;if(this._filters)for(let t=0;t<this._filters.length;t++)e+=this._filters[t].padding;return Math.max(this._padding,e)}destroy(e=!1){if(this.removeAllListeners(),typeof e==`boolean`?e:e?.texture){let t=typeof e==`boolean`?e:e?.textureSource;this._fill?.texture&&this._fill.texture.destroy(t),this._originalFill?.texture&&this._originalFill.texture.destroy(t),this._stroke?.texture&&this._stroke.texture.destroy(t),this._originalStroke?.texture&&this._originalStroke.texture.destroy(t)}this._fill=null,this._stroke=null,this.dropShadow=null,this._originalStroke=null,this._originalFill=null}_createProxy(e,t){return new Proxy(e,{set:(e,n,r)=>(e[n]===r||(e[n]=r,t?.(n,r),this.update()),!0)})}_isFillStyle(e){return(e??null)!==null&&!(p.isColorLike(e)||e instanceof Se||e instanceof be)}};Do.defaultDropShadow={alpha:1,angle:Math.PI/6,blur:0,color:`black`,distance:5},Do.defaultTextStyle={align:`left`,breakWords:!1,dropShadow:null,fill:`black`,fontFamily:`Arial`,fontSize:26,fontStyle:`normal`,fontVariant:`normal`,fontWeight:`normal`,leading:0,letterSpacing:0,lineHeight:0,padding:0,stroke:null,textBaseline:`alphabetic`,trim:!1,whiteSpace:`pre`,wordWrap:!1,wordWrapWidth:100};var Oo=Do;function ko(e){let t=e;if(typeof t.dropShadow==`boolean`&&t.dropShadow){let n=Oo.defaultDropShadow;e.dropShadow={alpha:t.dropShadowAlpha??n.alpha,angle:t.dropShadowAngle??n.angle,blur:t.dropShadowBlur??n.blur,color:t.dropShadowColor??n.color,distance:t.dropShadowDistance??n.distance}}if(t.strokeThickness!==void 0){u(a,`strokeThickness is now a part of stroke`);let n=t.stroke,r={};if(p.isColorLike(n))r.color=n;else if(n instanceof Se||n instanceof be)r.fill=n;else if(Object.hasOwnProperty.call(n,`color`)||Object.hasOwnProperty.call(n,`fill`))r=n;else throw Error(`Invalid stroke value.`);e.stroke={...r,width:t.strokeThickness}}if(Array.isArray(t.fillGradientStops)){if(u(a,"gradient fill is now a fill pattern: `new FillGradient(...)`"),!Array.isArray(t.fill)||t.fill.length===0)throw Error(`Invalid fill value. Expected an array of colors for gradient fill.`);t.fill.length!==t.fillGradientStops.length&&c(`The number of fill colors must match the number of fill gradient stops.`);let n=new Se({start:{x:0,y:0},end:{x:0,y:1},textureSpace:`local`}),r=t.fillGradientStops.slice(),i=t.fill.map(e=>p.shared.setValue(e).toNumber());r.forEach((e,t)=>{n.addColorStop(e,i[t])}),e.fill={fill:n}}}var Ao=1e5;function jo(e,t,n,r=0,i=0,a=0){if(e.texture===h.WHITE&&!e.fill)return p.shared.setValue(e.color).setAlpha(e.alpha??1).toHexa();if(!e.fill){let n=t.createPattern(e.texture.source.resource,`repeat`),r=e.matrix.copyTo(E.shared);return r.scale(e.texture.source.pixelWidth,e.texture.source.pixelHeight),n.setTransform(r),n}if(e.fill instanceof be){let n=e.fill,r=t.createPattern(n.texture.source.resource,`repeat`);return M.applyPatternTransform(r,n.transform,!1),r}if(e.fill instanceof Se){let o=e.fill,s=o.type===`linear`,c=o.textureSpace===`local`,l=1,u=1;c&&n&&(l=n.width+r,u=n.height+r);let d,f=!1;if(s){let{start:e,end:n}=o;d=t.createLinearGradient(e.x*l+i,e.y*u+a,n.x*l+i,n.y*u+a),f=Math.abs(n.x-e.x)<Math.abs((n.y-e.y)*.1)}else{let{center:e,innerRadius:n,outerCenter:r,outerRadius:s}=o;d=t.createRadialGradient(e.x*l+i,e.y*u+a,n*l,r.x*l+i,r.y*u+a,s*l)}if(f&&c&&n){let e=n.lineHeight/u;for(let t=0;t<n.lines.length;t++){let i=(t*n.lineHeight+r/2)/u;o.colorStops.forEach(t=>{let n=i+t.offset*e;n=Math.max(0,Math.min(1,n)),d.addColorStop(Math.floor(n*Ao)/Ao,p.shared.setValue(t.color).toHex())})}}else o.colorStops.forEach(e=>{d.addColorStop(e.offset,p.shared.setValue(e.color).toHex())});return d}return c(`FillStyle not recognised`,e),`red`}var Mo=class e extends Ya{constructor(t){super(),this.resolution=1,this.pages=[],this._padding=0,this._measureCache=Object.create(null),this._currentChars=[],this._currentX=0,this._currentY=0,this._currentMaxCharHeight=0,this._currentPageIndex=-1,this._skipKerning=!1;let n={...e.defaultOptions,...t};this._textureSize=n.textureSize,this._mipmap=n.mipmap;let i=n.style.clone();n.overrideFill&&(i._fill.color=16777215,i._fill.alpha=1,i._fill.texture=h.WHITE,i._fill.fill=null),this.applyFillAsTint=n.overrideFill;let a=i.fontSize;i.fontSize=this.baseMeasurementFontSize;let o=Eo(i);n.overrideSize?(i._stroke&&(i._stroke.width*=this.baseRenderedFontSize/a),i.dropShadow&&(i.dropShadow.blur*=this.baseRenderedFontSize/a,i.dropShadow.distance*=this.baseRenderedFontSize/a)):i.fontSize=this.baseRenderedFontSize=a,this._style=i,this._skipKerning=n.skipKerning??!1,this.resolution=n.resolution??1,this._padding=n.padding??4,n.textureStyle&&(this._textureStyle=n.textureStyle instanceof r?n.textureStyle:new r(n.textureStyle)),this.fontMetrics=wo.measureFont(o),this.lineHeight=i.lineHeight||this.fontMetrics.fontSize||i.fontSize}ensureCharacters(e){let t=wo.graphemeSegmenter(e).filter(e=>!this._currentChars.includes(e)).filter((e,t,n)=>n.indexOf(e)===t);if(!t.length)return;this._currentChars=[...this._currentChars,...t];let r;r=this._currentPageIndex===-1?this._nextPage():this.pages[this._currentPageIndex];let{canvas:i,context:a}=r.canvasAndContext,o=r.texture.source,s=this._style,c=this._currentX,l=this._currentY,u=this._currentMaxCharHeight,d=this.baseRenderedFontSize/this.baseMeasurementFontSize,f=(s.dropShadow?.distance??0)+(s._stroke?.width??0),p=this._padding+f,m=!1,g=i.width/this.resolution,_=i.height/this.resolution;for(let e=0;e<t.length;e++){let r=t[e],f=wo.measureText(r,s,i,!1);f.lineHeight=f.height;let v=f.width*d,y=Math.ceil((s.fontStyle===`italic`?2:1)*v),b=f.height*d,x=y+p*2,S=b+p*2;if(m=!1,r!==`
`&&r!==`\r`&&r!==`	`&&r!==` `&&(m=!0,u=Math.ceil(Math.max(S,u))),c+x>g&&(l+=u,u=S,c=0,l+u>_)){o.update();let e=this._nextPage();i=e.canvasAndContext.canvas,a=e.canvasAndContext.context,o=e.texture.source,c=0,l=0,u=0}let C=a.measureText(r).width/d;if(this.chars[r]={id:r.codePointAt(0),xOffset:-(p/d),yOffset:-(p/d),xAdvance:C,kerning:{}},m){this._drawGlyph(a,f,c+p,l+p,d,s);let e=o.width*d,t=o.height*d,i=new n(c/e*o.width,l/t*o.height,x/e*o.width,S/t*o.height);this.chars[r].texture=new h({source:o,frame:i}),c+=Math.ceil(x)}}o.update(),this._currentX=c,this._currentY=l,this._currentMaxCharHeight=u,this._skipKerning||this._applyKerning(t,a,d)}get pageTextures(){return u(a,`BitmapFont.pageTextures is deprecated, please use BitmapFont.pages instead.`),this.pages}_applyKerning(e,t,n){let r=this._measureCache;for(let i=0;i<e.length;i++){let a=e[i];for(let e=0;e<this._currentChars.length;e++){let i=this._currentChars[e],o=r[a];o||(o=r[a]=t.measureText(a).width);let s=r[i];s||(s=r[i]=t.measureText(i).width);let c=t.measureText(a+i).width,l=c-(o+s);l&&this.chars[a]&&(this.chars[a].kerning[i]=l/n),c=t.measureText(a+i).width,l=c-(o+s),l&&this.chars[i]&&(this.chars[i].kerning[a]=l/n)}}}_nextPage(){this._currentPageIndex++;let e=this.resolution,t=w.getOptimalCanvasAndContext(this._textureSize,this._textureSize,e);this._setupContext(t.context,this._style,e);let n=e*(this.baseRenderedFontSize/this.baseMeasurementFontSize),r=new h({source:new j({resource:t.canvas,resolution:n,alphaMode:`premultiply-alpha-on-upload`,autoGenerateMipmaps:this._mipmap})});this._textureStyle&&(r.source.style=this._textureStyle);let i={canvasAndContext:t,texture:r};return this.pages[this._currentPageIndex]=i,i}_setupContext(e,t,n){t.fontSize=this.baseRenderedFontSize,e.scale(n,n),e.font=Eo(t),t.fontSize=this.baseMeasurementFontSize,e.textBaseline=t.textBaseline;let r=t._stroke,i=r?.width??0;if(r&&(e.lineWidth=i,e.lineJoin=r.join,e.miterLimit=r.miterLimit,e.strokeStyle=jo(r,e)),t._fill&&(e.fillStyle=jo(t._fill,e)),t.dropShadow){let r=t.dropShadow,i=p.shared.setValue(r.color).toArray(),a=r.blur*n,o=r.distance*n;e.shadowColor=`rgba(${i[0]*255},${i[1]*255},${i[2]*255},${r.alpha})`,e.shadowBlur=a,e.shadowOffsetX=Math.cos(r.angle)*o,e.shadowOffsetY=Math.sin(r.angle)*o}else e.shadowColor=`black`,e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0}_drawGlyph(e,t,n,r,i,a){let o=t.text,s=t.fontProperties,c=(a._stroke?.width??0)*i,l=n+c/2,u=r-c/2,d=s.descent*i,f=t.lineHeight*i,p=!1;a.stroke&&c&&(p=!0,e.strokeText(o,l,u+f-d));let{shadowBlur:m,shadowOffsetX:h,shadowOffsetY:g}=e;a._fill&&(p&&(e.shadowBlur=0,e.shadowOffsetX=0,e.shadowOffsetY=0),e.fillText(o,l,u+f-d)),p&&(e.shadowBlur=m,e.shadowOffsetX=h,e.shadowOffsetY=g)}destroy(){super.destroy();for(let e=0;e<this.pages.length;e++){let{canvasAndContext:t,texture:n}=this.pages[e];w.returnCanvasAndContext(t),n.destroy(!0)}this.pages=null}};Mo.defaultOptions={textureSize:512,style:new Oo,mipmap:!0};var No=Mo;function Po(e,t,n,r){let i={width:0,height:0,offsetY:0,scale:t.fontSize/n.baseMeasurementFontSize,lines:[{width:0,charPositions:[],spaceWidth:0,spacesIndex:[],chars:[]}]};i.offsetY=n.baseLineOffset;let a=i.lines[0],o=null,s=!0,c={spaceWord:!1,width:0,start:0,index:0,positions:[],chars:[]},l=n.baseMeasurementFontSize/t.fontSize,u=t.letterSpacing*l,d=t.wordWrapWidth*l,f=t.lineHeight?t.lineHeight*l:n.lineHeight,p=t.wordWrap&&t.breakWords,m=fo(t.whiteSpace),h=po(t.whiteSpace);if(m||h){let t=[],n=m;for(let r=0;r<e.length;r++){let i=e[r];if(i===`\r`||i===`
`){if(h)i===`\r`&&e[r+1]===`
`&&r++,i=` `;else{m&&(n=!0),t.push(i);continue}}if(H(i)){if(m&&lo(i)){if(n)continue;n=!0,t.push(` `)}else n=!1,t.push(i)}else n=!1,t.push(i)}e=t}let g=e=>{let t=a.width;for(let n=0;n<c.index;n++){let r=e.positions[n];a.chars.push(e.chars[n]),a.charPositions.push(r+t)}a.width+=e.width,(c.index>0||!m)&&(s=!1),c.width=0,c.index=0,c.chars.length=0},_=()=>{let e=a.chars.length-1;if(r){let t=a.chars[e];for(;lo(t);)a.width-=n.chars[t].xAdvance,a.spacesIndex.pop(),t=a.chars[--e]}i.width=Math.max(i.width,a.width),a={width:0,charPositions:[],chars:[],spaceWidth:0,spacesIndex:[]},s=!0,i.lines.push(a),i.height+=f},v=e=>e-u>d;for(let r=0;r<e.length+1;r++){let i,l=r===e.length;l||(i=e[r]);let d=n.chars[i];if(/(?:\s)/.test(i)||i===`\r`||i===`
`||l){if(!s&&t.wordWrap&&v(a.width+c.width)?(_(),g(c),!l&&d&&a.charPositions.push(0)):(c.start=a.width,g(c),!l&&d&&a.charPositions.push(0)),i===`\r`||i===`
`)_();else if(!l&&d){let e=d.xAdvance+(d.kerning?.[o]||0)+u;a.width+=e,a.spaceWidth=e,a.spacesIndex.push(a.charPositions.length),a.chars.push(i)}}else if(d){let e=d.kerning?.[o]||0,n=d.xAdvance+e+u;p&&v(c.width+n)&&(s||_(),g(c),_()),c.positions[c.index++]=c.width+e,c.chars.push(i),c.width+=n,uo(i)&&(!s&&t.wordWrap&&v(a.width+c.width)&&_(),g(c))}o=i}return _(),t.align===`center`?Fo(i):t.align===`right`?Io(i):t.align===`justify`&&Lo(i),i}function Fo(e){for(let t=0;t<e.lines.length;t++){let n=e.lines[t],r=e.width/2-n.width/2;for(let e=0;e<n.charPositions.length;e++)n.charPositions[e]+=r}}function Io(e){for(let t=0;t<e.lines.length;t++){let n=e.lines[t],r=e.width-n.width;for(let e=0;e<n.charPositions.length;e++)n.charPositions[e]+=r}}function Lo(e){let t=e.width;for(let n=0;n<e.lines.length-2;n++){let r=e.lines[n],i=0,a=r.spacesIndex[i++],o=0,s=r.spacesIndex.length,c=(t-r.width)/s;for(let e=0;e<r.charPositions.length;e++)e===a&&(a=r.spacesIndex[i++],o+=c),r.charPositions[e]+=o}}function Ro(e){if(e===``)return[];typeof e==`string`&&(e=[e]);let t=[];for(let n=0,r=e.length;n<r;n++){let r=e[n];if(Array.isArray(r)){if(r.length!==2)throw Error(`[BitmapFont]: Invalid character range length, expecting 2 got ${r.length}.`);if(r[0].length===0||r[1].length===0)throw Error(`[BitmapFont]: Invalid character delimiter.`);let e=r[0].charCodeAt(0),n=r[1].charCodeAt(0);if(n<e)throw Error(`[BitmapFont]: Invalid character range.`);for(let r=e,i=n;r<=i;r++)t.push(String.fromCharCode(r))}else t.push(...Array.from(r))}if(t.length===0)throw Error(`[BitmapFont]: Empty set when resolving characters.`);return t}var zo=0,Bo=new class{constructor(){this.ALPHA=[[`a`,`z`],[`A`,`Z`],` `],this.NUMERIC=[[`0`,`9`]],this.ALPHANUMERIC=[[`a`,`z`],[`A`,`Z`],[`0`,`9`],` `],this.ASCII=[[` `,`~`]],this.defaultOptions={chars:this.ALPHANUMERIC,resolution:1,padding:4,skipKerning:!1,textureStyle:null},this.measureCache=Za(1e3)}getFont(e,t){let n=`${t.fontFamily}-bitmap`,r=!0;if(A.has(n)){let t=A.get(n);return t.ensureCharacters?.(e),t}if(t._fill.fill&&!t._stroke?(n+=t._fill.fill.styleKey,r=!1):(t._stroke||t.dropShadow)&&(n=`${t.styleKey}-bitmap`,r=!1),n+=`-${t.fontStyle}`,n+=`-${t.fontVariant}`,n+=`-${t.fontWeight}`,!A.has(n)){let e=Object.create(t);e._lineHeight=0;let i=new No({style:e,overrideFill:r,overrideSize:!0,...this.defaultOptions});zo++,zo>50&&c(`BitmapText`,`You have dynamically created ${zo} bitmap fonts, this can be inefficient. Try pre installing your font styles using \`BitmapFont.install({name:"style1", style})\``),i.once(`destroy`,()=>{zo--,A.remove(n)}),A.set(n,i)}let i=A.get(n);return i.ensureCharacters?.(e),i}getLayout(e,t,n=!0){let r=this.getFont(e,t),i=`${e}-${t.styleKey}-${n}`;if(this.measureCache.has(i))return this.measureCache.get(i);let a=Po(wo.graphemeSegmenter(e),t,r,n);return this.measureCache.set(i,a),a}measureText(e,t,n=!0){return this.getLayout(e,t,n)}install(...e){let t=e[0];typeof t==`string`&&(t={name:t,style:e[1],chars:e[2]?.chars,resolution:e[2]?.resolution,padding:e[2]?.padding,skipKerning:e[2]?.skipKerning},u(a,`BitmapFontManager.install(name, style, options) is deprecated, use BitmapFontManager.install({name, style, ...options})`));let n=t?.name;if(!n)throw Error("[BitmapFontManager] Property `name` is required.");t={...this.defaultOptions,...t};let r=t.style,i=r instanceof Oo?r:new Oo(r),o=new No({style:i,overrideFill:t.dynamicFill??this._canUseTintForStyle(i),skipKerning:t.skipKerning,padding:t.padding,resolution:t.resolution,overrideSize:!1,textureStyle:t.textureStyle}),s=Ro(t.chars);return o.ensureCharacters(s.join(``)),A.set(`${n}-bitmap`,o),o.once(`destroy`,()=>A.remove(`${n}-bitmap`)),o}uninstall(e){let t=`${e}-bitmap`,n=A.get(t);n&&n.destroy()}_canUseTintForStyle(e){return!e._stroke&&(!e.dropShadow||e.dropShadow.color===0)&&!e._fill.fill&&e._fill.color===16777215}},Vo=e({BitmapFont:()=>Ho}),Ho=class extends Ya{constructor(e,t){super();let{textures:r,data:i}=e;Object.keys(i.pages).forEach(e=>{let t=i.pages[parseInt(e,10)],n=r[t.id];this.pages.push({texture:n})}),Object.keys(i.chars).forEach(e=>{let t=i.chars[e],{frame:a,source:o,rotate:s}=r[t.page],c=oe.transformRectCoords(t,a,s,new n),l=new h({frame:c,orig:new n(0,0,t.width,t.height),source:o,rotate:s});this.chars[e]={id:e.codePointAt(0),xOffset:t.xOffset,yOffset:t.yOffset,xAdvance:t.xAdvance,kerning:t.kerning??{},texture:l}}),this.baseRenderedFontSize=i.fontSize,this.baseMeasurementFontSize=i.fontSize,this.fontMetrics={ascent:0,descent:0,fontSize:i.fontSize},this.baseLineOffset=i.baseLineOffset,this.lineHeight=i.lineHeight,this.fontFamily=i.fontFamily,this.distanceField=i.distanceField??{type:`none`,range:0},this.url=t}destroy(){super.destroy();for(let e=0;e<this.pages.length;e++){let{texture:t}=this.pages[e];t.destroy(!0)}this.pages=null}static install(e){Bo.install(e)}static uninstall(e){Bo.uninstall(e)}},Uo=`﻿id,kind,season,name,map,scene,desc,note
raid,raid,1,특급 괴이 토벌,,,강화된 괴이 1체와 타임어택,"도전 모드의 컨텐츠. kind: raid = 그 시즌의 보스 섹터에서 강화된 보스 1체를 제한 시간 안에 쓰러뜨린다 (난이도는 params.csv 의 raid.*) / wave = 닫힌 전투장에서 몰려오는 무리를 버틴다 (waves.csv, params.csv 의 wave.*). season = 전투장과 몬스터를 가져올 시즌. map·scene = wave 가 쓰는 맵과 맵 그림 세트 (raid 는 비운다). id 는 기록을 저장하는 이름이므로 바꾸지 않는다"
raid2,raid,2,특급 괴이 토벌,,,강화된 괴이 1체와 타임어택,
wave,wave,1,괴이 범람,arena_wave,alley,몰려오는 괴이를 끝까지 버틴다,
`,Wo=`﻿id,name,grade,position,attr,weapon,weaponType,aim,muzzleX,muzzleY,hp,atk,speed,range,hairStyle,hair,hair2,outfit,accent,eye,skin,desc
serin,에트나,A,leader,substance,대검,greatsword,dpad,24,30,1400,105,225,190,bob,#e8a9b0,#cf8d97,#c9303c,#2a2a33,#e2434e,#fde4d8,넓은 근접 범위와 검기로 난전을 이끄는 리더
mido,라이,A,striker,nature,메카 건틀렛,gauntlet,auto,20,38,1000,95,240,430,twintail,#45b392,#2f8f74,#2aa67e,#f1f3f2,#5aaad6,#fde4d8,전격을 연사하고 주변을 휩쓰는 광역 타격
sia,키온,A,support,form,활,bow,auto,22,48,950,110,235,560,long,#aec6f6,#93a4ea,#2b4296,#f4f6ff,#7b52d3,#fde4d8,긴 사거리의 화살과 화살비로 뒤를 받치는 지원
karen,카렌,S,striker,reverse,산탄총,shotgun,auto,37,41,1150,125,245,260,pony,#2b2b36,#d23c4b,#8f1f2e,#1e1e26,#ff5a5a,#fde4d8,근거리에서 한 번에 쏟아붓는 폭딜. 회피 직후가 가장 강하다
raon,라온,A,striker,substance,해머,hammer,dpad,22,28,1250,110,225,170,short,#f0c36a,#d9a144,#e07b39,#3a3028,#c98a2b,#fde4d8,해머로 지면을 내려찍어 범위를 쓸어버리는 근접 누커
yuna,유나,S,leader,form,기관단총,smg,auto,32,53,1200,105,235,400,pony,#6a5acd,#5345b0,#3b3f55,#c9d1ff,#9fe7ff,#fde4d8,연사로 빌드업을 쌓고 포탑을 깔아 전장을 장악하는 리더
haru,하루,A,leader,reverse,쌍검,daggers,dpad,20,28,1050,100,255,150,short,#f2f2f7,#c9c9d8,#23232e,#6d5cff,#b06cff,#fde4d8,돌진 베기로 적 사이를 누비는 고속 근접 리더
roa,로아,S,support,nature,부적,talisman,auto,44,58,1050,100,230,460,long,#7b4ea3,#5b3780,#f2ead8,#c8323c,#ffd45a,#fde4d8,유도 부적과 정화 결계로 팀을 살리는 지원
eve,이브,A,support,substance,깃창,lance,dpad,30,30,1200,95,225,190,bob,#c8824a,#a66a38,#2f6f5e,#f3e9c8,#5fb37a,#fde4d8,깃발과 나팔로 팀의 공격력을 끌어올리는 지원
`,Go=`﻿id,name,stat,value,desc
frail,부서진 몸,dmgTaken,12,받는 피해 +{value}%
weak,빠진 기력,atk,-8,공격력 {value}%
slow,무거운 발,speed,-8,이동 속도 {value}%
thin,옅어진 숨,maxHp,-10,최대 체력 {value}%
dull,흐린 눈,critRate,-6,치명타 확률 {value}%p
`,Ko=`﻿slot,stat,role,min,max,label,note
weapon,atk,main,6,10,공격력 +{v}%,role: main=주 옵션(항상 붙음) / sub=보조 옵션. min~max는 일반 등급 기준이며 희귀도 배율이 곱해진다
weapon,critRate,sub,3,5,치명타 확률 +{v}%,
weapon,critDmg,sub,8,14,치명타 피해 +{v}%,
weapon,aspd,sub,4,7,공격 속도 +{v}%,
weapon,basicDmg,sub,6,10,기본 공격 피해 +{v}%,
weapon,activeDmg,sub,8,12,액티브 피해 +{v}%,
armor,hp,main,8,12,최대 체력 +{v}%,
armor,guard,sub,3,5,받는 피해 -{v}%,
armor,speed,sub,3,5,이동 속도 +{v}%,
acc,cdr,main,4,7,쿨타임 -{v}%,
acc,ultGain,main,8,12,궁극기 게이지 획득 +{v}%,
acc,critRate,sub,3,5,치명타 확률 +{v}%,
acc,activeDmg,sub,8,12,액티브 피해 +{v}%,
acc,ultDmg,sub,8,12,궁극기 피해 +{v}%,
`,qo=`﻿id,slot,name,v1,v2,cooldown,chance,team,desc,season
w_crescent,weapon,초승달 칼날,80,4,0,0,0,"기본 공격 {v2}회마다 조준 방향으로 관통 검기 발사, 피해 {v1}%",1
w_chain,weapon,연쇄 뇌전,60,3,1,20,0,"적중 시 {chance}% 확률로 주변 적 최대 {v2}체에게 연쇄 번개, 각 {v1}%",1
w_blast,weapon,폭렬 탄두,100,70,1.5,0,0,치명타 시 대상 위치에 소범위 폭발 {v1}%,1
w_bleed,weapon,출혈 낙인,15,4,0,0,0,"적중 시 출혈 {v2}초, 초당 {v1}%, 최대 3중첩",1
w_wisp,weapon,유도 혼불,50,3,6,0,0,"{cooldown}초마다 다음 공격 시 적을 추적하는 혼불 {v2}개 발사, 각 {v1}%",1
w_slow,weapon,둔화의 못,25,2,3,0,0,적중 시 {v2}초간 대상 이동 속도 -{v1}%,1
w_execute,weapon,처형 선고,8,5,0,0,0,"적 처치 시 {v2}초간 공격력 +{v1}%, 최대 3중첩",1
a_thorn,armor,가시 외피,80,0,1,0,0,피격 시 공격한 적에게 반사 피해 {v1}%,1
a_repel,armor,충격 반발,0.5,160,8,0,0,피격 시 주변 적 넉백 + 기절 {v1}초,1
a_shield,armor,비상 보호막,15,5,30,0,0,체력이 40% 이하로 떨어질 때 {v2}초간 최대 체력의 {v1}% 보호막,1
a_guts,armor,불굴,1.5,0,0,0,0,치명적 피해를 받을 때 체력 1로 버티고 {v1}초 무적 (섹터당 1회),1
a_absorb,armor,흡수 장갑,15,4,0,0,0,피격 시 받은 피해의 {v1}%를 {v2}초에 걸쳐 회복,1
a_counter,armor,역습 태세,5,5,0,0,0,"피격 시 {v2}초간 공격력 +{v1}%, 최대 3중첩",1
a_blur,armor,잔상 외투,1,30,6,0,0,피격 시 {v1}초간 이동 속도 +{v2}%,1
c_ribbon,acc,교대의 리본,20,3,0,0,0,"교체 등장 시 {v2}초간 이동 속도 +{v1}%, 교체 쿨타임 -0.3초",1
c_pendant,acc,재충전 펜던트,0.6,0,0,0,0,회피 사용 시 액티브 쿨타임 {v1}초 감소,1
c_bell,acc,공명 방울,1.5,0,0,0,0,액티브 사용 시 펫 스킬 쿨타임 {v1}초 감소,1
c_seal,acc,궁극의 인장,10,0,0,0,0,궁극기 사용 시 궁극기 게이지 {v1}% 반환,1
c_charm,acc,생명의 부적,0.8,0,1,0,0,적 처치 시 체력 {v1}% 회복,1
c_collector,acc,수집가의 심볼,15,0,0,0,1,"[팀 공통] 괴담 조각 획득량 +{v1}%, 수색 시간 절반",1
c_radar,acc,탐지 귀걸이,1,0,0,0,1,"[팀 공통] 미니맵에 수색 오브젝트와 NPC 위치 표시. 희귀 등급부터 몬스터 무리, 영웅 등급부터 출구 위치도 표시",1
w2_axe,weapon,나무꾼의 도끼날,110,5,0,0,0,"기본 공격 {v2}회마다 조준 방향 앞을 내려찍는다, 범위 피해 {v1}%",2
w2_spore,weapon,독포자 탄,40,3,4,25,0,"적중 시 {chance}% 확률로 그 자리에 {v2}초간 독 안개, 초당 {v1}%",2
w2_ember,weapon,불씨 지팡이,25,4,0,0,0,"치명타 시 대상에게 화상 {v2}초, 초당 {v1}%",2
w2_feather,weapon,검은 깃털,45,5,6,0,0,"{cooldown}초마다 다음 공격 시 관통하는 깃털 {v2}개를 부채꼴로 발사, 각 {v1}%",2
w2_strings,weapon,꼭두각시 줄,40,2,4,0,0,적중 시 {v2}초간 대상을 줄로 묶어 이동 속도 -{v1}%,2
w2_spot,weapon,핀 조명,4,5,0,0,0,"같은 적을 이어서 공격할 때마다 공격력 +{v1}%, 최대 {v2}중첩. 대상이 바뀌면 사라진다",2
w2_bow,weapon,피날레의 인사,6,5,0,0,0,"적 처치 시 {v2}초간 공격 속도 +{v1}%, 최대 3중첩",2
a2_straw,armor,밀짚 속,60,0,4,25,0,"피격 시 {chance}% 확률로 밀짚이 대신 맞는다: 받은 피해의 {v1}%를 바로 회복",2
a2_tin,armor,양철 갑옷,4,5,0,0,0,"피격 시 {v2}초간 받는 피해 -{v1}%, 최대 3중첩",2
a2_rust,armor,녹슨 가시,60,2,1,0,0,피격 시 공격한 적에게 반사 피해 {v1}% + {v2}초 둔화,2
a2_curtain,armor,막 뒤로,1.5,30,40,0,0,체력이 35% 이하로 떨어질 때 {v1}초간 무적 + 이동 속도 +{v2}%,2
a2_poppy,armor,양귀비 향,1.2,150,10,0,0,피격 시 주변 적을 {v1}초간 잠재운다,2
a2_heart,armor,빌린 심장,20,0,0,0,0,치명적 피해를 받을 때 체력 {v1}%로 버틴다 (섹터당 1회),2
a2_ember,armor,잿불 망토,20,3,3,0,0,"피격 시 주변 적에게 화상 {v2}초, 초당 {v1}%",2
c2_shoes,acc,은 구두,25,2,0,0,0,회피 사용 시 {v2}초간 이동 속도 +{v1}%,2
c2_cap,acc,황금 모자,6,0,0,0,0,궁극기 사용 시 펫 스킬 쿨타임 {v1}초 감소,2
c2_script,acc,낡은 대본,1.5,0,0,0,0,교체 등장 시 액티브 쿨타임 {v1}초 감소,2
c2_bouquet,acc,꽃다발,2,0,1,0,0,적 처치 시 궁극기 게이지 +{v1}%,2
c2_mask,acc,두 얼굴의 가면,12,6,0,0,0,궁극기 사용 시 {v2}초간 공격력 +{v1}%,2
c2_ticket,acc,관람권,15,0,0,0,1,"[팀 공통] 괴담 조각 획득량 +{v1}%, 수색 시간 절반",2
c2_glasses,acc,초록 안경,1,0,0,0,1,[팀 공통] 가려진 경로의 위험을 미리 본다. 희귀 등급부터 보상도 미리 본다,2
`,Jo=`﻿grade,name,hpMult,atkMult,scale,quality,shardMult
0,일반,1,1,1,1,1
1,정예,1.8,1.3,1.25,2,2
2,특급,2.5,1.5,1.4,3,4
`,Yo=`﻿id,name,size,radius,hp,atk,speed,ai,weak,range,windup,cooldown,p1,p2,p3,p4,shards,color,eye,summon,note
wisp,잡귀,S,14,220,42,150,chaser,form,50,0.45,1.1,62,0,0,0,2,#5b4a8a,#ffe27a,,p1=타격 반경(px)
hound,그림자 개,S,13,160,38,235,lunger,substance,180,0.4,1.8,640,230,0,0,2,#3a3550,#ff5a5a,,"p1=도약 속도(px/초), p2=도약 거리(px)"
eye,응시자,S,15,180,48,110,shooter,nature,420,0.6,2.2,330,290,0,0,3,#7a3b6e,#b9f2ff,,"p1=투사체 속도(px/초), p2=유지하려는 거리(px)"
bloat,부푼 것,S,17,150,110,175,bomber,reverse,74,0.8,0,118,0,0,0,3,#8a5a3a,#ffb347,,p1=자폭 반경(px)
brute,문지기,M,30,1500,85,105,charger,nature,340,0.9,3,780,440,125,0.8,15,#4a5a7a,#ff7a4a,,"range=돌진을 시작하는 거리, p1=돌진 속도, p2=돌진 거리, p3=내려찍기 반경, p4=내려찍기 예고 시간(초)"
seer,주술자,M,26,1100,65,90,caster,reverse,480,1,3.2,95,3,8,280,15,#6a3a7a,#d9a6ff,,"p1=지연 폭발 반경, p2=지연 폭발 수, p3=방사 탄 수, p4=탄속"
boss,그믐의 우산,L,46,32000,95,115,boss,form,0,0.9,0,0,0,0,0,100,#2a2440,#ff4d6a,wisp:2|hound:2,보스. 패턴 수치는 params.csv의 boss.* 항목. 약점 속성은 런마다 무작위로 바뀐다. summon=페이즈 전환 때 부르는 몬스터
scarecrow,부서져 가는 허수아비,S,16,260,30,140,spinner,reverse,64,0.5,1.7,82,3,0.75,70,2,#b08a4a,#ffe27a,,"spinner = 다가가서 빙글 돌며 여러 번 친다. p1=회전 반경(px), p2=타격 수, p3=도는 시간(초), p4=도는 동안의 이동 속도"
tinman,낡은 양철 나무꾼,M,26,1400,95,78,slammer,nature,120,1,2.8,96,84,0,0,15,#8a8f96,#ffb347,,"slammer = 다가가서 예고 뒤 앞쪽을 크게 내려친다. p1=타격 반경(px), p2=타격 중심까지의 거리(px), p3=맞은 캐릭터가 휘청거리는(느려지는) 시간(초)"
monkey,검은 영혼의 날개 달린 원숭이,S,15,170,44,150,shooter,form,400,0.55,2.2,320,280,0,0,3,#3b2f55,#c79bff,,검은 물질을 던진다
wolf,검은 영혼의 늑대,S,14,190,42,240,lunger,substance,190,0.4,1.7,660,240,0,0,2,#2c2840,#b98cff,,돌진해 문다
lion,사자 인형 옷 입은 영혼,M,27,1250,80,92,slammer,form,100,0.8,2.4,128,36,0.5,0,15,#c98a3c,#3b2f55,,큰 머리를 휘두른다 (자기 둘레의 넓은 범위)
dwarf,검은 영혼의 난쟁이,S,12,150,40,225,shooter,substance,300,0.45,1.9,430,190,0,0,3,#40305e,#ff7ad9,,와다다 달려와 검은 도끼를 던진다
witch,부서져 가는 마녀 인형,L,44,33000,92,125,witch,form,0,0.9,0,0,0,0,0,100,#5a2a5e,#ff8a3c,dwarf:2|monkey:2,시즌 2 보스. 패턴 수치는 params.csv의 witch.* 항목. 약점 속성은 런마다 무작위로 바뀐다
`,Xo=`﻿scene,sat,dark,lit,tint,warm,inner,outer,vignette,keep,note
alley,0.92,0.72,1,#9aa8e0,#fff3e0,0.34,1.0,0.3,0.8,"화면 분위기 (맵 그림 세트마다 한 줄). sat = 채도(1이면 그대로, 낮을수록 빛바랜 색). dark = 필드 캐릭터에게서 먼 곳의 밝기(1이면 그대로, 낮을수록 어둡다). lit = 필드 캐릭터 둘레의 밝기. tint = 어두운 곳에 입히는 색. warm = 필드 캐릭터 둘레의 빛 색. inner·outer = 빛이 온전한 반지름과 다 꺼지는 반지름(화면 세로 = 1). vignette = 화면 가장자리를 더 어둡게(0~1). keep = 밝은 것(이펙트·불빛)이 어둠을 덜 받는 정도(0~1). 표에 없는 세트는 물들이지 않는다. 전체 세기는 params.csv 의 mood.strength"
oz_field,0.64,0.46,0.92,#8894d8,#ffeeda,0.3,0.95,0.4,0.75,해 질 녘의 꽃밭: 빛이 바래고 푸르스름하게 가라앉는다
oz_forest,0.66,0.46,0.92,#7fa8b8,#fff0dc,0.28,0.9,0.42,0.75,안개 숲: 더 어둡고 청록빛
oz_stage,0.8,0.5,0.96,#a890c8,#ffe9c4,0.3,0.95,0.45,0.8,무너진 극장: 조명이 닿는 곳만 따뜻하고 나머지는 보랏빛 어둠
`,Zo=`﻿id,name,weight,v1,v2,desc
crate,보급 상자,50,12,22,괴담 조각 {v1}~{v2}개
medkit,구급 상자,25,25,0,팀 전원 체력 {v1}% 회복
relic,괴담의 잔재,15,3,0,무작위 능력치 소폭 상승 (런이 끝날 때까지 유지)
sealed,봉인 상자,10,0,0,열면 괴이 무리가 나타난다. 처치하면 희귀 이상 보상 상자
stash,수상한 보따리,8,0,0,귀중품이 들어 있다. 어떻게 챙길지 골라야 한다
`,Qo=`﻿id,minSector,maxSector,weight,members,note,season
wisps,1,9,10,wisp:4,잡귀 무리,1
wisps_eye,1,9,10,wisp:3|eye:1,잡귀 + 응시자,1
hounds,1,9,8,hound:3,그림자 개 무리,1
bloats,2,9,6,bloat:2|wisp:2,자폭 + 잡귀,1
eyes_hounds,3,9,6,eye:2|hound:2,원거리 + 돌격,1
swarm,4,9,5,wisp:4|hound:2,대규모 무리,1
s2_scarecrows,1,5,10,scarecrow:4,허수아비 무리,2
s2_scare_monkey,1,5,10,scarecrow:3|monkey:1,허수아비 + 원숭이,2
s2_wolves,1,5,8,wolf:3,늑대 무리,2
s2_dwarves,1,5,8,dwarf:3|scarecrow:1,난쟁이 + 허수아비,2
s2_monkeys_wolves,2,5,6,monkey:2|wolf:2,원거리 + 돌격,2
s2_swarm,2,5,5,scarecrow:3|dwarf:2|wolf:1,대규모 무리,2
s2_tin,2,5,5,tinman:1|scarecrow:2,양철 나무꾼 + 허수아비,2
s2_lion,3,5,5,lion:1|dwarf:2,사자 인형 + 난쟁이,2
s2_costume,3,5,5,lion:1|monkey:2,사자 인형 + 원숭이,2
s2_heavy,4,5,4,tinman:1|lion:1,중형 2체,2
`,$o=`﻿key,value,설명
view.height,620,화면 세로에 보이는 월드 높이(px). 작을수록 캐릭터가 크게 보인다
view.isoHeight,680,마름모(아이소메트릭) 화면에서 세로에 보이는 높이(px). 작을수록 캐릭터가 크게 보인다. 벽이 높아 기존 화면보다 조금 넓게 본다
view.maxPixels,2600000,화면을 그리는 내부 픽셀 수의 상한. 화소 밀도가 높은 화면에서 이 수를 넘지 않게 해상도를 낮춘다 (넓은 이펙트가 겹칠 때 느려지는 것을 막는다). 1920x1080 은 약 207만
mood.strength,100,화면 분위기(어둡게 물들이기)의 전체 세기(%). 0이면 끈다. 100이면 moods.csv 에 적힌 그대로
player.radius,16,캐릭터 충돌 반경(px)
dodge.distance,190,회피 이동 거리(px)
dodge.duration,0.22,회피 이동 시간(초)
dodge.invuln,0.3,회피 무적 시간(초)
dodge.charges,2,회피 기본 잔여 카운트
dodge.recharge,3,회피 카운트 1회 충전 시간(초)
swap.cooldown,1.5,교체 쿨타임(초)
swap.invuln,0.4,교체 등장 직후 무적 시간(초)
swap.lane,26,교체 연출: 들어오는 캐릭터와 나가는 캐릭터의 길이 정면·정후방에서 옆으로 벌어지는 각도(도). 0이면 같은 줄에서 엇갈린다
swap.enterTime,0.2,교체 연출: 새 캐릭터가 들어오는 데 걸리는 시간(초). 등장 기술이 있으면 이 값 대신 그 첫 타격 시점에 맞춘다
swap.enterDist,150,교체 연출: 새 캐릭터가 달려 들어오기 시작하는 거리(px)
swap.enterHeight,190,교체 연출: 위에서 떨어지며 나오는 캐릭터(라온·라이)가 떨어지기 시작하는 높이(px)
swap.entryLunge,200,등장 기술: 근접 캐릭터(에트나·라온·하루·이브)가 겨눈 적 앞으로 뛰어드는 최대 거리(px)
swap.entryStep,50,등장 기술: 겨눈 적이 없을 때 근접 캐릭터가 앞으로 내딛는 거리(px)
swap.exitTime,0.14,교체 연출: 나가는 캐릭터가 뒤로 짧게 물러나는 데 걸리는 시간(초). 하던 공격 동작을 마친 뒤부터 센다
swap.exitDist,90,교체 연출: 나가는 캐릭터가 뒤로 물러나는 거리(px)
swap.exitLinger,0.2,교체 연출: 물러난 자리에 머물며 흐려져 사라지는 시간(초)
hit.invuln,0.25,피격 직후 무적 시간(초). 한꺼번에 여러 번 맞는 것을 막는다
crit.rate,5,기본 치명타 확률(%)
crit.dmg,150,기본 치명타 피해(%)
weak.mult,130,약점 속성 피해(%)
basic.cleaveFalloff,60,근접 기본 공격이 여러 적을 한꺼번에 칠 때: 가까운 적부터 차례로 피해가 이 비율(%)씩 줄어든다. 100이면 줄지 않는다
basic.cleaveMin,30,근접 기본 공격의 다중 타격 피해가 줄어드는 하한(%)
aim.assistDeg,25,D패드 방향 공격의 조준 보정 각도(도). 0이면 보정 없음
aim.targetBonus,1,추천 타겟 탐색 거리 = 캐릭터 사거리 x 이 값. 1보다 크면 닿지 않는 적을 조준할 수 있다
auto.radius,520,자동 공격: 이쪽을 알아챈 적을 상대하는 반경(px). 이 안의 적에게는 닿을 때까지 스스로 다가가 공격한다. 사거리가 이보다 긴 캐릭터는 사거리까지 본다
auto.near,300,자동 공격: 아직 이쪽을 알아채지 못한 적은 이 거리(px) 안에 있을 때만 먼저 건드린다 (멀리 있는 무리를 줄줄이 깨우지 않게)
auto.reach,85,자동 공격: 사거리의 이 비율(%) 안으로 들어가면 멈춰서 치기 시작한다. 치는 동안에는 사거리 끝까지 그대로 친다
auto.ult,0,자동 공격 중의 궁극기: 0 = 직접 누른다 / 1 = 게이지가 차면 바로 쓴다 / 2 = 정예·특급·보스가 반경 안에 있을 때만 쓴다
fx.basicRange,0,기본 공격의 타격 범위(부채꼴)를 화면에 그릴지. 1 = 그린다 / 0 = 그리지 않는다
ult.max,100,궁극기 게이지 최대치
ult.gainPer100,2.2,피해 배율 100%를 적중시킬 때마다 얻는 궁극기 게이지
ult.gainPerKill,2,적 1체 처치 시 얻는 궁극기 게이지
ult.offField,30,오프 필드 캐릭터의 궁극기 게이지 획득 비율(%)
attr.substance.hp,15,실체: 최대 체력 증가(%)
attr.substance.dr,10,실체: 받는 피해 감소(%)
attr.form.maxStacks,10,형상: 빌드업 최대 중첩
attr.form.perStack,3,형상: 중첩당 피해 증가(%)
attr.form.duration,4,형상: 적중이 없으면 중첩이 사라지는 시간(초)
attr.nature.duration,4,자연: 전이 지속시간(초)
attr.nature.chainRatio,25,자연: 연쇄 피해 비율(%)
attr.nature.chainRange,170,자연: 연쇄가 닿는 거리(px)
attr.nature.icd,0.4,자연: 같은 적에서 연쇄가 다시 일어나기까지의 시간(초)
attr.reverse.bonus,35,반전: 회피·교체 직후 피해 증가(%)
attr.reverse.duration,2.5,반전: 피해 증가 지속시간(초)
enemy.aggroRange,380,몬스터가 플레이어를 알아채는 거리(px)
enemy.deathTime,0.75,몬스터가 쓰러지는 동작을 보여 주는 시간(초). 이 시간이 지나면 사라진다
enemy.bossDeathTime,1.6,괴이(보스)가 쓰러지는 동작을 보여 주는 시간(초). 보스를 쓰러뜨리고 섹터가 끝날 때까지의 시간과 같다
enemy.packSpread,90,무리 구성원이 무리 중심에서 퍼지는 거리(px)
scaling.hpPerSector,13,섹터가 1 깊어질 때마다 몬스터 체력 증가(%)
scaling.atkPerSector,6,섹터가 1 깊어질 때마다 몬스터 공격력 증가(%)
search.time,0.8,수색을 시작한 뒤 오브젝트 근처에 머물러야 하는 시간(초)
search.radius,56,수색·상호작용 거리(px)
interact.reach,26,상호작용 버튼이 뜨는 여유 거리(px). 오브젝트의 반응 거리에 더한다
placement.packMinFromStart,8,무리 후보를 뽑을 때 시작 지점에서 떨어져야 하는 최소 칸 수
placement.packMinApart,6,무리끼리 떨어져야 하는 최소 칸 수
reward.skipShards,15,보상 선택을 건너뛸 때 받는 괴담 조각
reward.tier.q1.t1,60,보상 품질 1에서 일반 등급 스킬 성장의 등장 가중치
reward.tier.q1.t2,30,보상 품질 1에서 희귀 등급 스킬 성장의 등장 가중치
reward.tier.q1.t3,10,보상 품질 1에서 영웅 등급 스킬 성장의 등장 가중치
reward.tier.q2.t1,30,보상 품질 2에서 일반 등급 스킬 성장의 등장 가중치
reward.tier.q2.t2,45,보상 품질 2에서 희귀 등급 스킬 성장의 등장 가중치
reward.tier.q2.t3,25,보상 품질 2에서 영웅 등급 스킬 성장의 등장 가중치
reward.tier.q3.t1,8,보상 품질 3에서 일반 등급 스킬 성장의 등장 가중치
reward.tier.q3.t2,40,보상 품질 3에서 희귀 등급 스킬 성장의 등장 가중치
reward.tier.q3.t3,52,보상 품질 3에서 영웅 등급 스킬 성장의 등장 가중치
relic.atk,3,괴담의 잔재: 팀 공격력 증가(%)
relic.hp,4,괴담의 잔재: 팀 최대 체력 증가(%)
relic.crit,2,괴담의 잔재: 팀 치명타 확률 증가(%)
route.bonusChance,35,경로 선택에 보너스 맵이 추가될 확률(%)
route.specialFrom,3,특급 경로가 등장하기 시작하는 섹터 (이 번호의 섹터를 클리어한 뒤부터)
camp.restHeal,40,캠프 휴식: 팀 전원 체력 회복(%)
camp.reviveHp,30,캠프 휴식: 쓰러진 캐릭터가 복귀할 때의 체력(%)
shop.slots,4,상점에 진열되는 상품 수
shop.price.upgrade.t1,40,상점: 일반 등급 스킬 성장 가격
shop.price.upgrade.t2,60,상점: 희귀 등급 스킬 성장 가격
shop.price.upgrade.t3,90,상점: 영웅 등급 스킬 성장 가격
shop.price.equip.r1,30,상점: 일반 장비 가격
shop.price.equip.r2,55,상점: 희귀 장비 가격
shop.price.equip.r3,90,상점: 영웅 장비 가격
shop.price.equip.r4,150,상점: 전설 장비 가격
shop.price.heal,30,상점: 응급 처치 가격
shop.heal,25,상점: 응급 처치 회복량(%)
event.rescue.heal,30,길 잃은 조사원: 팀 체력 회복(%)
event.rescue.shards,25,길 잃은 조사원: 정보를 받을 때 얻는 괴담 조각
event.altar.hpCost,20,저주받은 제단: 바치는 체력(%)
event.gamble.bet,50,도박꾼 유령: 거는 괴담 조각
event.gamble.chance,50,도박꾼 유령: 이길 확률(%)
event.gamble.mult,2.5,도박꾼 유령: 이겼을 때 돌려받는 배율
event.smith.price,40,떠도는 대장장이: 강화 비용
score.upgrade.t1,40,팀 점수: 일반 등급 스킬 성장 1레벨
score.upgrade.t2,70,팀 점수: 희귀 등급 스킬 성장 1레벨
score.upgrade.t3,100,팀 점수: 영웅 등급 스킬 성장 1레벨
score.sector,50,팀 점수: 클리어한 섹터 1개
score.boss,500,팀 점수: 보스 격파
deck.max,10,기기에 저장하는 파티덱 최대 수
boss.phase2,66,보스: 2페이즈로 넘어가는 체력(%)
boss.phase3,33,보스: 3페이즈로 넘어가는 체력(%)
boss.phaseInvuln,1.6,보스: 페이즈 전환 중 무적 시간(초)
boss.shockRadius,280,보스: 페이즈 전환 충격파 반경(px)
boss.shockDmg,130,보스: 페이즈 전환 충격파 피해(공격력 대비 %)
boss.bulletSpeed,250,보스: 탄막 탄속(px/초)
boss.bulletDmg,60,보스: 탄 1발 피해(공격력 대비 %)
boss.radialCount,14,보스: 방사형 탄막의 탄 수
boss.fanCount,5,보스: 조준 부채꼴 탄의 탄 수
boss.fanVolleys,3,보스: 조준 부채꼴 탄의 연사 횟수
boss.slamRadius,115,보스: 내려찍기 반경(px)
boss.slamCount,4,보스: 연속 내려찍기 횟수
boss.slamWindup,0.9,보스: 내려찍기 예고 시간(초)
boss.slamDmg,110,보스: 내려찍기 피해(공격력 대비 %)
boss.chargeSpeed,900,보스: 돌진 속도(px/초)
boss.chargeDist,560,보스: 돌진 거리(px)
boss.chargeDmg,140,보스: 돌진 피해(공격력 대비 %)
boss.gap1,1.7,보스: 1페이즈의 패턴 사이 간격(초)
boss.gap2,1.35,보스: 2페이즈의 패턴 사이 간격(초)
boss.gap3,1,보스: 3페이즈의 패턴 사이 간격(초)
raid.levels,5,특급 괴이 토벌: 난이도 단계 수
raid.timeLimit,180,특급 괴이 토벌: 제한 시간(초)
raid.hpPerLevel,60,특급 괴이 토벌: 난이도 1단계마다 보스 체력 증가(%)
raid.atkPerLevel,20,특급 괴이 토벌: 난이도 1단계마다 보스 공격력 증가(%)
raid.recommendBase,1500,특급 괴이 토벌: 난이도 1의 권장 팀 점수
raid.recommendPerLevel,500,특급 괴이 토벌: 난이도 1단계마다 권장 팀 점수 증가
raid.gradeS,70,특급 괴이 토벌: 이 시간(초) 안에 끝내면 S등급
raid.gradeA,110,특급 괴이 토벌: 이 시간(초) 안에 끝내면 A등급. 넘으면 B등급
wave.duration,180,괴이 범람: 버텨야 하는 시간(초)
wave.stageTime,30,괴이 범람: 웨이브 단계가 오르는 간격(초)
wave.spawnEvery,3.5,괴이 범람: 무리가 나타나는 간격(초). 단계가 오를수록 조금씩 짧아진다
wave.maxAlive,30,괴이 범람: 동시에 살아 있을 수 있는 몬스터 수
wave.hpPerStage,22,괴이 범람: 단계가 오를 때마다 몬스터 체력 증가(%)
wave.atkPerStage,8,괴이 범람: 단계가 오를 때마다 몬스터 공격력 증가(%)
wave.scorePerSecond,2,괴이 범람: 1초 버틸 때마다 얻는 점수
wave.scorePerShard,10,괴이 범람: 처치 점수 = 몬스터의 괴담 조각 수 x 등급 배율 x 이 값
wave.clearBonus,500,괴이 범람: 끝까지 버텼을 때 추가 점수
bag.slots,4,귀중품 가방의 칸 수. 가득 차면 하나를 버려야 새것을 넣을 수 있다
bag.taintMult,180,오염된 귀중품의 가치 배율(%). 들고 있는 동안 저주가 걸린다
bag.digChance,50,더 뒤진다를 골랐을 때 저주를 받을 확률(%). 받든 안 받든 등급이 한 단계 오른다
bag.purifyHp,15,오염된 귀중품을 정화할 때 팀 전원이 잃는 체력(%)
bag.curseMax,5,런 동안 쌓일 수 있는 저주의 최대 개수 (넘으면 가장 오래된 것이 사라진다)
bag.find.plain,50,수상한 보따리의 종류 가중치: 평범한 보따리
bag.find.tainted,30,수상한 보따리의 종류 가중치: 오염된 물건
bag.find.deal,20,수상한 보따리의 종류 가중치: 괴이의 거래
bag.chest.q1,20,일반 무리의 보상 상자에서 귀중품이 함께 나올 확률(%)
bag.chest.q2,50,정예 무리의 보상 상자에서 귀중품이 함께 나올 확률(%)
bag.chest.q3,100,특급 무리의 보상 상자에서 귀중품이 함께 나올 확률(%)
bag.tier.early.t1,72,섹터 1~3에서 귀중품 등급의 가중치: 평범
bag.tier.early.t2,25,섹터 1~3: 희귀
bag.tier.early.t3,3,섹터 1~3: 진귀
bag.tier.early.t4,0,섹터 1~3: 전설
bag.tier.mid.t1,42,섹터 4~6: 평범
bag.tier.mid.t2,40,섹터 4~6: 희귀
bag.tier.mid.t3,16,섹터 4~6: 진귀
bag.tier.mid.t4,2,섹터 4~6: 전설
bag.tier.late.t1,18,섹터 7~9: 평범
bag.tier.late.t2,42,섹터 7~9: 희귀
bag.tier.late.t3,32,섹터 7~9: 진귀
bag.tier.late.t4,8,섹터 7~9: 전설
bag.bossTier,3,보스를 쓰러뜨리면 반드시 나오는 귀중품의 최소 등급
mushroom.count,0.012,시즌 2: 포자 버섯의 수 (바닥 칸 수에 대한 비율). 안개가 있는 섹터에만 놓인다
mushroom.apart,5,포자 버섯끼리 떨어져야 하는 최소 칸 수
mushroom.trigger,78,이 거리(px) 안으로 다가가거나 공격이 닿으면 포자를 뿜는다
mushroom.radius,150,포자 구름의 반경(px)
mushroom.duration,4,포자 구름이 남는 시간(초)
mushroom.delay,0.6,건드린 뒤 뿜기까지의 시간(초). 이 동안 부풀어 오르므로 피할 수 있다
mushroom.cooldown,9,다시 뿜을 수 있게 되기까지의 시간(초)
mushroom.partyDot,3.5,포자 구름 안에서 필드 캐릭터가 초당 잃는 체력 (최대 체력의 %)
mushroom.enemyDot,70,포자 구름 안의 적이 초당 받는 피해 (팀 평균 공격력의 %)
mushroom.poisonTime,2.5,구름을 벗어난 뒤에도 독이 남는 시간(초)
route.hiddenChance,55,경로 선택에 가려진 선택지가 섞여 나올 확률(%)
route.hiddenBoth,25,가려진 선택지가 위험과 보상을 모두 가릴 확률(%). 나머지는 둘 중 하나만 가린다
route.hiddenScore,15,가려진 선택지를 골랐을 때 더해지는 팀 점수
route.hiddenReward.q1,25,가려진 선택지의 실제 보상 품질이 일반(1)으로 뽑힐 비중
route.hiddenReward.q2,45,가려진 선택지의 실제 보상 품질이 희귀 이상(2)으로 뽑힐 비중
route.hiddenReward.q3,30,가려진 선택지의 실제 보상 품질이 영웅 이상(3)으로 뽑힐 비중
event.chance,30,섹터에 돌발 사건이 일어날 확률(%). 보스·보너스 맵에는 일어나지 않는다
witch.spin.radius,150,마녀 인형: 회전 공격의 반경(px)
witch.spin.hits,3,회전 공격의 타격 수
witch.spin.dmg,70,회전 공격 1타의 피해 (공격력의 %)
witch.fire.count,3,불 던지기: 한 번에 던지는 불의 수
witch.fire.speed,340,불 던지기: 탄속(px/초)
witch.fire.dmg,80,불 던지기 피해 (공격력의 %)
witch.pillar.radius,100,불기둥: 폭발 반경(px)
witch.pillar.windup,1,불기둥: 예고 시간(초)
witch.pillar.dmg,130,불기둥 폭발 피해 (공격력의 %)
witch.pillar.burnTime,5,불기둥이 남긴 불바닥이 유지되는 시간(초)
witch.pillar.burnDot,4,불바닥 위에서 필드 캐릭터가 초당 잃는 체력 (최대 체력의 %)
witch.clone.count,2,특수 1: 불의 잔상 수
witch.clone.time,12,잔상이 남는 시간(초)
witch.clone.dmg,50,잔상이 따라 하는 공격의 피해 배율(%)
witch.wave.length,620,특수 2: 불의 파도가 뻗는 거리(px)
witch.wave.half,110,불의 파도 반폭(px)
witch.wave.windup,1.2,불의 파도 예고 시간(초)
witch.wave.dmg,170,불의 파도 피해 (공격력의 %)
witch.finale.count,14,필살기: 폭발 수
witch.finale.gap,0.28,필살기: 폭발 사이 간격(초)
witch.finale.radius,120,필살기: 폭발 반경(px)
witch.finale.windup,0.9,필살기: 폭발 하나의 예고 시간(초)
witch.finale.dmg,150,필살기 폭발 피해 (공격력의 %)
witch.burn.time,3,마녀 인형의 불에 맞으면 걸리는 화상의 시간(초)
witch.burn.dot,2,화상: 필드 캐릭터가 초당 잃는 체력 (최대 체력의 %)
witch.phase2,66,체력이 이 % 아래로 내려가면 2페이즈 (잔상을 쓴다)
witch.phase3,33,체력이 이 % 아래로 내려가면 3페이즈 (필살기를 쓴다)
witch.rest,1.4,패턴 사이에 쉬는 시간(초)
daze.slow,35,"휘청거림(큰 몬스터의 내려찍기에 맞았을 때): 이동 속도 감소(%)"
sound.master,100,소리: 전체 음량의 기본값(%). 사용자가 설정에서 바꾸면 기기에 저장된 값을 쓴다
sound.music,70,소리: 배경음(음악·환경음) 음량의 기본값(%)
sound.sfx,90,소리: 효과음 음량의 기본값(%)
sound.duck,35,소리: 징글(클리어·전멸 등)이 나는 동안 배경음을 이만큼(%)으로 줄인다
sound.musicFade,1.2,소리: 배경음이 바뀔 때 서서히 넘어가는 시간(초)
sound.keepLoops,4,소리: 메모리에 남겨 두는 배경음 수 (한 곡이 10MB쯤). 최근에 쓴 것부터 남긴다
sound.hearNear,320,소리: 필드 캐릭터에게서 이 거리(px) 안에서 난 효과음은 줄지 않는다
sound.hearFar,1100,소리: 이 거리(px)부터는 들리지 않는다. 그 사이는 고르게 줄어든다 (화면 밖의 싸움은 작게 들린다)
sound.panWidth,600,소리: 좌우로 이만큼(px) 떨어진 소리는 한쪽으로 가장 많이 치우친다
sound.panLimit,60,소리: 좌우로 치우치는 한도(%). 100이면 한쪽 스피커에서만 난다
sound.maxVoices,24,소리: 한꺼번에 낼 수 있는 효과음 수. 넘으면 새 소리를 건너뛴다
`,es=`﻿id,name,cooldown,duration,radius,v1,v2,color,desc
A,펑이,14,0,150,300,260,#3d7fbf,가까운 적에게 달려가 자폭. 범위 피해 {v1}% + 넉백
B,포근이,22,6,150,2.5,0.5,#3fc8a0,{duration}초간 회복 구역 생성. {v2}초마다 필드 캐릭터 최대 체력의 {v1}% 회복
C,느릿이,16,6,180,50,0,#b05cc8,가까운 범위에 {duration}초간 슬로우 장판 생성 (이동 속도 -{v1}%)
D,든든이,18,6,150,0,0,#e07a3f,조준 방향에 {duration}초간 방벽 생성. 적 투사체 차단 + 적 진로 방해
`,ts=`﻿rarity,name,skillMult,options,optMult,refund,score,color,w1,w2,w3,note
1,일반,1,1,1,15,30,#b9b9c9,60,25,0,skillMult=장비 스킬 수치 배율. options=능력치 옵션 수. w1~w3=보상 품질 1~3에서의 등장 가중치
2,희귀,1.3,2,1.25,30,60,#6fb6ff,30,45,30,
3,영웅,1.6,2,1.6,60,100,#c58bff,9,24,50,
4,전설,2,3,2,100,160,#ffcf5a,1,6,20,
`,ns=`﻿id,name,grade,packBonus,eliteChance,special,statMult,shardMult,quality,score,hidden,desc,note
normal,일반 경로,1,0,0.1,0,1,1,1,0,30,일반 등급 몬스터 위주. 기본 보상,grade=위험 등급. packBonus=무리당 추가 몬스터 수. eliteChance=무리에 정예가 낄 확률. special=특급 몬스터가 끼는 무리 수. quality=클리어 보상 품질. hidden=가려진 선택지의 실제 위험으로 뽑힐 비중
elite,정예 경로,2,1,0.5,0,1.1,1.5,2,30,45,무리가 커지고 절반에 정예가 낀다. 희귀 보상 확률 상승 · 괴담 조각 +50%,
special,특급 경로,3,1,1,1,1.25,2,3,60,25,모든 무리에 정예가 끼고 특급 몬스터가 나타난다. 클리어 보상 영웅 이상 · 괴담 조각 +100%,
`,rs=`﻿id,name,subtitle,mediums,bossIntro,desc,base,label,note
1,그믐밤의 구도심,달 없는 밤의 오래된 도심 골목,brute|seer,,"섹터 8개를 지나 괴이 ""그믐의 우산""을 토벌한다",,,"mediums = 특급 경로에서 무리에 끼는 중형 몬스터. base = 몬스터 무리·시즌 스킬·장비·귀중품·보스 음악을 가져올 시즌 (비우면 자기 자신. 같은 내용을 다른 맵으로 돌리는 시즌에 적는다). label = 로비에서 시즌 번호 자리에 보여 줄 글 (비우면 시즌 N)"
2,소원을 삼키는 나라,안개 낀 꽃길 끝에서 막이 오른다,tinman|lion,'주연을 맡으실 분을 기다리고 있었습니다.',"긴 꽃길과 안개 숲을 지나, 무너진 극장의 무대에서 ""부서져 가는 마녀 인형""을 토벌한다",,,
3,소원을 삼키는 나라,마름모 화면으로 다시 지은 맵,tinman|lion,'주연을 맡으실 분을 기다리고 있었습니다.',"시즌 2를 마름모(아이소메트릭) 화면으로 다시 만든 시험판. 맵만 새로 짰고 몬스터·보상은 시즌 2와 같다",2,시즌 2 · 마름모,
`,is=`﻿index,name,map,type,packs,chests,gate,loot,npcChance,density,camp,note,season,scene,depth,fog,view
1,골목 어귀,sector01,normal,2,1,wisp:3|eye:1,3,0.4,0.09,0,type: normal / boss / bonus. packs=뽑는 무리 수(출구 수호 무리 제외). chests=그 무리를 모두 처치했을 때 나오는 보상 상자 수(몇 무리마다 하나씩 고르게 나온다. 비우면 무리마다 하나). gate=출구 수호 무리 (몬스터id:수@등급). loot=수색 오브젝트 수. density=바닥 칸 대비 엄폐 오브젝트 비율. camp=1이면 클리어 후 체크포인트 캠프,1,alley,,0,
2,폐상가,sector02,normal,3,1,hound:3|eye:1,4,0.6,0.1,0,,1,alley,,0,
3,주차장 뒷길,sector03,normal,3,1,brute:1|wisp:3,4,0.6,0.11,1,,1,alley,,0,
4,시장 골목,sector04,normal,4,1,eye:2|hound:3,5,0.6,0.11,0,,1,alley,,0,
5,철길 건널목,sector05,normal,4,1,seer:1|bloat:2|wisp:2,5,0.6,0.12,0,,1,alley,,0,
6,학교 뒤편,sector06,normal,4,1,brute:1@1|eye:2,5,0.6,0.12,1,,1,alley,,0,
7,강변 창고,sector07,normal,4,1,seer:1|hound:4,5,0.6,0.12,0,,1,alley,,0,
8,구도심 광장,sector08,normal,5,1,brute:1|seer:1|wisp:3,6,0.6,0.13,0,,1,alley,,0,
9,그믐의 우산,sector09,boss,0,,boss:1,0,0,0,0,,1,alley,,0,
100,버려진 보급소,bonus01,bonus,0,,,6,0,0.08,0,보너스 맵. 몬스터 없음,1,alley,,0,
1,짓밟힌 꽃길,s2_field,normal,8,4,tinman:1|scarecrow:3,9,0.9,0.05,1,긴 맵. depth = 몬스터 강화 단계(비우면 섹터 번호 - 1). fog = 안개의 짙기(0~1),2,oz_field,1,0.5,
2,안개 낀 세트장 숲,s2_forest,normal,9,4,lion:1|wolf:3,10,0.9,0.06,1,,2,oz_forest,4,0.75,
3,무너진 객석,s2_stage1,normal,4,2,tinman:1|monkey:2,5,0.6,0.1,0,,2,oz_stage,6,0,
4,무대 뒤편,s2_stage2,normal,4,2,lion:1@1|dwarf:3,5,0.6,0.11,0,,2,oz_stage,7,0,
5,분장실 복도,s2_stage3,normal,5,2,tinman:1@1|lion:1,6,0.6,0.12,0,,2,oz_stage,8,0,
6,막이 오른 무대,s2_boss,boss,0,,witch:1,0,0,0,0,,2,oz_stage,8,0,
100,의상 보관실,s2_bonus,bonus,0,,,6,0,0.08,0,보너스 맵. 몬스터 없음,2,oz_stage,,0,
1,짓밟힌 꽃길,s3_field,normal,8,4,tinman:1|scarecrow:3,9,0.9,0.05,1,"시즌 3 = 시즌 2의 마름모 화면 판. view = 화면 방식 (비우면 flat 기존 화면, iso 마름모). 맵은 tools/make-iso-maps.mjs 가 만든다",3,oz_field,1,0.5,iso
2,안개 낀 세트장 숲,s3_forest,normal,9,4,lion:1|wolf:3,10,0.9,0.06,1,,3,oz_forest,4,0.75,iso
3,무너진 객석,s3_stage1,normal,4,2,tinman:1|monkey:2,5,0.6,0.1,0,,3,oz_stage,6,0,iso
4,무대 뒤편,s3_stage2,normal,4,2,lion:1@1|dwarf:3,5,0.6,0.11,0,,3,oz_stage,7,0,iso
5,분장실 복도,s3_stage3,normal,5,2,tinman:1@1|lion:1,6,0.6,0.12,0,,3,oz_stage,8,0,iso
6,막이 오른 무대,s3_boss,boss,0,,witch:1,0,0,0,0,,3,oz_stage,8,0,iso
100,의상 보관실,s3_bonus,bonus,0,,,6,0,0.08,0,보너스 맵. 몬스터 없음,3,oz_stage,,0,iso
`,as=`﻿key,value,설명
serin.basic.dmg1,100,1·2타 피해(%)
serin.basic.dmg3,170,3타 피해(%)
serin.basic.reach,125,1·2타 도달 거리(px)
serin.basic.reach3,150,3타 도달 거리(px)
serin.basic.arc,110,1·2타 부채꼴 각도(도)
serin.basic.arc3,150,3타 부채꼴 각도(도)
serin.basic.windup,0.12,공격 시작부터 판정까지(초)
serin.basic.interval,0.45,1·2타 공격 간격(초)
serin.basic.interval3,0.7,3타 공격 간격(초)
serin.basic.lunge,26,타격마다 전진하는 거리(px)
serin.basic.knock,40,1·2타 넉백 세기
serin.basic.knock3,170,3타 넉백 세기
serin.active.dmg,280,검기 피해(%)
serin.active.speed,900,검기 속도(px/초)
serin.active.range,560,검기 사거리(px)
serin.active.radius,44,검기 판정 반경(px)
serin.active.windup,0.15,시전부터 발사까지(초)
serin.active.lock,0.4,시전 중 행동 불가 시간(초)
serin.ult.dmg,650,균열이 뻗을 때의 피해(%)
serin.ult.length,560,균열의 길이(px)
serin.ult.half,85,균열의 반폭(px)
serin.ult.fissureDur,3,균열이 남아 있는 시간(초)
serin.ult.fissureTick,0.5,남은 균열이 피해를 주는 간격(초)
serin.ult.fissureDmg,45,남은 균열의 1회 피해(%)
serin.ult.stun,1.2,기절 시간(초)
serin.ult.windup,0.35,시전부터 판정까지(초)
serin.ult.lock,0.7,시전 중 행동 불가 시간(초)
serin.passive.cdr,0.5,3타 적중 시 액티브 쿨타임 감소(초)
serin.entry.seek,360,등장 기술(강습): 이 거리 안의 가장 가까운 적을 겨눈다(px). 없으면 바라보던 쪽으로 쓴다
serin.entry.standoff,90,등장 기술: 겨눈 적 앞 이만큼 떨어진 곳까지 뛰어든다(px). 뛰어드는 최대 거리는 params.csv 의 swap.entryLunge
serin.entry.windup,0.14,등장 기술: 뛰어드는 시간 = 교체부터 타격까지(초)
serin.entry.reach,165,등장 기술: 내려베기의 도달 거리(px)
serin.entry.arc,150,등장 기술: 내려베기의 부채꼴 각도(도)
serin.entry.dmg,110,등장 기술: 피해(%). 범위 안의 적 모두에게 들어간다
serin.entry.knock,150,등장 기술: 넉백 세기
serin.entry.lock,0.38,등장 기술: 이동할 수 없는 시간(초). 회피·스킬로는 끊을 수 있다
mido.basic.dmg,41,전격탄 1발 피해(%)
mido.basic.interval,0.16,연사 간격(초)
mido.basic.speed,1000,탄속(px/초)
mido.basic.range,430,사거리(px)
mido.basic.spread,3,탄 퍼짐(도)
mido.basic.radius,7,탄 판정 반경(px)
mido.basic.windup,0.03,공격 시작부터 발사까지(초)
mido.active.dmg,320,방출 피해(%)
mido.active.radius,200,방출 범위 반경(px)
mido.active.autoRange,170,자동 공격이 방출을 쓰는 거리(px). 적이 이 안에 있을 때만 쓴다 (자기 둘레에서 터지는 스킬이라 멀리서 쓰면 헛친다). 다른 캐릭터에도 <id>.active.autoRange 를 적으면 그 거리를 따른다 (없으면 기본 공격의 사거리)
mido.active.windup,0.2,시전부터 판정까지(초)
mido.active.lock,0.45,시전 중 행동 불가 시간(초)
mido.ult.dmg,230,낙뢰 1발 피해(%)
mido.ult.repeat,45,같은 적을 다시 칠 때의 피해 비율(%)
mido.ult.count,8,낙뢰 횟수
mido.ult.gap,0.12,낙뢰 사이 간격(초)
mido.ult.windup,0.25,시전부터 첫 낙뢰까지(초)
mido.ult.range,520,낙뢰가 닿는 거리(px)
mido.ult.radius,70,낙뢰 1발의 범위 반경(px)
mido.ult.lock,0.5,시전 중 행동 불가 시간(초)
mido.passive.spreadRange,180,전이가 퍼지는 거리(px)
mido.entry.windup,0.16,등장 기술(낙뢰 착지): 떨어져 내려 전격이 터지기까지(초)
mido.entry.radius,170,등장 기술: 전격 고리 반경(px). 제자리에서 터진다
mido.entry.dmg,100,등장 기술: 피해(%)
mido.entry.knock,150,등장 기술: 넉백 세기
mido.entry.lock,0.4,등장 기술: 이동할 수 없는 시간(초)
sia.basic.dmg,126,화살 1발 피해(%)
sia.basic.interval,0.55,공격 간격(초)
sia.basic.speed,1100,화살 속도(px/초)
sia.basic.range,560,사거리(px)
sia.basic.radius,8,화살 판정 반경(px)
sia.basic.windup,0.14,공격 시작부터 발사까지(초)
sia.active.dmg,45,화살비 1틱 피해(%)
sia.active.radius,150,화살비 범위 반경(px)
sia.active.duration,3,지속시간(초)
sia.active.tick,0.3,틱 간격(초)
sia.active.castRange,300,대상이 없을 때 범위를 놓는 거리(px)
sia.active.lock,0.4,시전 중 행동 불가 시간(초)
sia.ult.dmg,600,궁극기 피해(%)
sia.ult.radius,60,화살 판정 반경(px)
sia.ult.range,900,사거리(px)
sia.ult.speed,1400,화살 속도(px/초)
sia.ult.mark,20,표식: 받는 피해 증가(%)
sia.ult.markDur,6,표식 지속시간(초)
sia.ult.windup,0.3,시전부터 발사까지(초)
sia.ult.lock,0.6,시전 중 행동 불가 시간(초)
sia.passive.crit,5,오프 필드 시 필드 캐릭터 치명타 확률 증가(%)
sia.support.powerPerLevel,20,원호 사격: 레벨이 오를 때마다 늘어나는 위력(%p)
sia.entry.windup,0.14,등장 기술(물러나며 쏘기): 교체부터 발사까지(초)
sia.entry.speed,1300,등장 기술: 화살 속도(px/초). 사거리는 기본 공격과 같고 적을 모두 꿰뚫는다
sia.entry.radius,12,등장 기술: 화살 판정 반경(px)
sia.entry.dmg,130,등장 기술: 피해(%)
sia.entry.knock,70,등장 기술: 넉백 세기
sia.entry.lock,0.36,등장 기술: 이동할 수 없는 시간(초)
karen.basic.pellets,6,산탄 수
karen.basic.dmg,26,발당 피해(%)
karen.basic.spread,28,산탄이 퍼지는 전체 각도(도)
karen.basic.range,260,사거리(px)
karen.basic.speed,900,탄속(px/초)
karen.basic.radius,7,탄 판정 반경(px)
karen.basic.interval,0.6,공격 간격(초)
karen.basic.windup,0.08,공격 시작부터 발사까지(초)
karen.basic.knock,50,넉백 세기
karen.active.dmg,300,부채꼴 사격 피해(%)
karen.active.dash,220,돌진 거리(px)
karen.active.dashTime,0.18,돌진 시간(초)
karen.active.reach,230,부채꼴 사격 도달 거리(px)
karen.active.arc,80,부채꼴 각도(도)
karen.active.lock,0.45,시전 중 행동 불가 시간(초)
karen.ult.dmg,190,산탄 1회 피해(%)
karen.ult.shots,5,연사 횟수
karen.ult.gap,0.11,발 사이 간격(초)
karen.ult.reach,290,부채꼴이 닿는 거리(px)
karen.ult.arc,100,부채꼴 각도(도)
karen.ult.knock,70,발당 넉백 세기
karen.ult.windup,0.2,시전부터 첫 발까지(초)
karen.passive.bonus,15,가까운 적에게 주는 피해 증가(%)
karen.passive.range,120,가깝다고 보는 거리(px)
karen.entry.windup,0.14,등장 기술(슬라이딩 사격): 미끄러져 들어와 쏘기까지(초)
karen.entry.reach,230,등장 기술: 산탄이 닿는 거리(px)
karen.entry.arc,50,등장 기술: 부채꼴 각도(도)
karen.entry.dmg,120,등장 기술: 피해(%)
karen.entry.knock,150,등장 기술: 넉백 세기
karen.entry.lock,0.36,등장 기술: 이동할 수 없는 시간(초)
raon.basic.dmg1,70,1·2타 피해(%)
raon.basic.dmg3,150,3타 피해(%)
raon.basic.reach,105,도달 거리(px)
raon.basic.arc,100,부채꼴 각도(도)
raon.basic.shockRadius,110,3타 충격파 반경(px)
raon.basic.windup,0.1,공격 시작부터 판정까지(초)
raon.basic.interval,0.38,1·2타 공격 간격(초)
raon.basic.interval3,0.65,3타 공격 간격(초)
raon.basic.lunge,30,타격마다 전진하는 거리(px)
raon.basic.knock,30,1·2타 넉백 세기
raon.basic.knock3,150,3타 넉백 세기
raon.active.dmg,380,지면 강타 피해(%)
raon.active.radius,150,지면 강타 반경(px)
raon.active.offset,110,캐릭터에서 범위 중심까지의 거리(px)
raon.active.stun,1,기절 시간(초)
raon.active.windup,0.4,차지 시간(초)
raon.active.lock,0.6,시전 중 행동 불가 시간(초)
raon.ult.dmg,900,궁극기 피해(%)
raon.ult.radius,260,궁극기 범위 반경(px)
raon.ult.leap,300,도약 거리(px)
raon.ult.leapTime,0.35,도약 시간(초)
raon.ult.knock,200,넉백 세기
raon.ult.lock,0.6,시전 중 행동 불가 시간(초)
raon.passive.max,25,투지: 최대 공격력 증가(%)
raon.passive.floor,30,투지: 최대치에 도달하는 체력(%)
raon.entry.seek,360,등장 기술(낙하 강타): 이 거리 안의 가장 가까운 적을 겨눈다(px)
raon.entry.standoff,70,등장 기술: 겨눈 적 앞 이만큼 떨어진 곳에 내려선다(px)
raon.entry.windup,0.18,등장 기술: 뛰어올라 내려찍기까지(초)
raon.entry.offset,40,등장 기술: 충격파의 중심이 몸에서 앞으로 나가 있는 거리(px)
raon.entry.radius,125,등장 기술: 충격파 반경(px)
raon.entry.dmg,100,등장 기술: 피해(%)
raon.entry.knock,160,등장 기술: 넉백 세기
raon.entry.lock,0.42,등장 기술: 이동할 수 없는 시간(초)
yuna.basic.dmg,24.5,탄환 1발 피해(%)
yuna.basic.interval,0.1,연사 간격(초)
yuna.basic.speed,1100,탄속(px/초)
yuna.basic.range,400,사거리(px)
yuna.basic.spread,5,탄 퍼짐(도)
yuna.basic.radius,6,탄 판정 반경(px)
yuna.basic.windup,0.02,공격 시작부터 발사까지(초)
yuna.active.dmg,30,포탑 1발 피해(%)
yuna.active.duration,10,포탑 지속시간(초)
yuna.active.tick,0.3,포탑 사격 간격(초)
yuna.active.range,380,포탑 사거리(px)
yuna.active.lock,0.35,시전 중 행동 불가 시간(초)
yuna.ult.duration,5,집중 포화 지속시간(초)
yuna.ult.lock,0.3,시전 중 행동 불가 시간(초)
yuna.passive.crit,10,빌드업 최대일 때 치명타 확률 증가(%)
yuna.entry.windup,0.16,등장 기술(구르며 점사): 구르듯 들어와 첫 발을 쏘기까지(초)
yuna.entry.shots,3,등장 기술: 쏘는 발 수. 한 발이 적 하나를 꿰뚫는다
yuna.entry.gap,0.06,등장 기술: 발 사이 간격(초)
yuna.entry.dmg,40,등장 기술: 한 발 피해(%)
yuna.entry.knock,25,등장 기술: 넉백 세기
yuna.entry.lock,0.42,등장 기술: 이동할 수 없는 시간(초)
haru.basic.dmg1,60,1~3타 피해(%)
haru.basic.dmg4,120,4타 피해(%)
haru.basic.reach,95,도달 거리(px)
haru.basic.arc,90,부채꼴 각도(도)
haru.basic.interval,0.24,1~3타 공격 간격(초)
haru.basic.interval4,0.5,4타 공격 간격(초)
haru.basic.windup,0.06,공격 시작부터 판정까지(초)
haru.basic.lunge,22,타격마다 전진하는 거리(px)
haru.basic.knock,15,넉백 세기
haru.active.dmg,260,그림자 베기 피해(%)
haru.active.dash,260,돌진 거리(px)
haru.active.dashTime,0.16,돌진 시간(초)
haru.active.half,44,베기 판정 반폭(px)
haru.active.lock,0.2,시전 중 행동 불가 시간(초)
haru.ult.dmg,120,난무 1회 피해(%)
haru.ult.hits,8,난무 베기 횟수
haru.ult.range,340,난무가 닿는 거리(px)
haru.ult.gap,0.09,베기 사이 간격(초)
haru.ult.lock,0.9,시전 중 행동 불가 시간(초)
haru.passive.cdr,1,공격을 흘렸을 때 액티브 충전 쿨타임 감소(초)
haru.entry.seek,260,등장 기술(교차 베기): 이 거리 안의 가장 가까운 적을 겨눈다(px)
haru.entry.past,56,등장 기술: 겨눈 적을 지나쳐 이만큼 더 나아가 선다(px). 지나치기에는 먼 적이면 지나치지 않고 그 앞에서 멈춘다
haru.entry.standoff,30,등장 기술: 지나치지 못할 때 적 앞 이만큼 떨어진 곳에서 멈춘다(px)
haru.entry.reach,70,등장 기술: 멈춘 자리에서 칼이 더 닿는 거리(px)
haru.entry.windup,0.12,등장 기술: 베며 지나가는 시간(초)
haru.entry.half,48,등장 기술: 지나간 길의 판정 반폭(px)
haru.entry.dmg,100,등장 기술: 피해(%)
haru.entry.knock,30,등장 기술: 넉백 세기
haru.entry.lock,0.34,등장 기술: 이동할 수 없는 시간(초)
roa.basic.dmg,78,부적 1발 피해(%)
roa.basic.interval,0.5,공격 간격(초)
roa.basic.speed,560,부적 속도(px/초)
roa.basic.range,460,사거리(px)
roa.basic.radius,9,부적 판정 반경(px)
roa.basic.turn,6,유도 회전 속도(rad/초)
roa.basic.windup,0.1,공격 시작부터 발사까지(초)
roa.active.dmg,40,결계 1틱 피해(%)
roa.active.duration,6,결계 지속시간(초)
roa.active.tick,0.5,틱 간격(초)
roa.active.radius,170,결계 반경(px)
roa.active.heal,2,결계 안 필드 캐릭터 초당 회복(%)
roa.active.castRange,220,대상이 없을 때 결계를 놓는 거리(px)
roa.active.lock,0.4,시전 중 행동 불가 시간(초)
roa.ult.dmg,480,표식이 터질 때의 피해(%)
roa.ult.delay,1.8,표식이 붙고 터지기까지의 시간(초)
roa.ult.heal,25,팀 전원 체력 회복(%)
roa.ult.buff,20,팀 공격력 증가(%)
roa.ult.buffDur,10,공격력 증가 지속시간(초)
roa.ult.range,700,표식이 붙는 거리(px)
roa.ult.windup,0.3,시전부터 판정까지(초)
roa.ult.lock,0.7,시전 중 행동 불가 시간(초)
roa.passive.guard,8,오프 필드 시 필드 캐릭터 받는 피해 감소(%)
roa.entry.windup,0.14,등장 기술(부적 강림): 부적이 꽂히고 나타나 부적을 날리기까지(초)
roa.entry.count,3,등장 기술: 날리는 유도 부적 수
roa.entry.spread,22,등장 기술: 부적 사이 각도(도)
roa.entry.dmg,40,등장 기술: 부적 한 장 피해(%)
roa.entry.knock,30,등장 기술: 넉백 세기
roa.entry.lock,0.36,등장 기술: 이동할 수 없는 시간(초)
eve.basic.dmg,110,찌르기 피해(%)
eve.basic.reach,175,찌르기 길이(px)
eve.basic.half,22,찌르기 판정 반폭(px)
eve.basic.interval,0.5,공격 간격(초)
eve.basic.windup,0.12,공격 시작부터 판정까지(초)
eve.basic.lunge,16,타격마다 전진하는 거리(px)
eve.basic.knock,30,넉백 세기
eve.active.duration,8,깃발 지속시간(초)
eve.active.radius,180,깃발 범위 반경(px)
eve.active.atk,15,깃발 범위 안 공격력 증가(%)
eve.active.guard,10,깃발 범위 안 받는 피해 감소(%)
eve.active.lock,0.4,시전 중 행동 불가 시간(초)
eve.ult.atk,25,팀 공격력 증가(%)
eve.ult.spearDmg,85,협공 창 1발 피해(%)
eve.ult.spearEvery,0.55,협공 창이 나가는 간격(초)
eve.ult.spearRange,560,협공 창 사거리(px)
eve.ult.spearSpeed,950,협공 창 속도(px/초)
eve.ult.aspd,15,팀 공격 속도 증가(%)
eve.ult.buffDur,12,강화 지속시간(초)
eve.ult.windup,0.3,시전부터 판정까지(초)
eve.ult.lock,0.6,시전 중 행동 불가 시간(초)
eve.passive.ult,10,오프 필드 시 필드 캐릭터 궁극기 게이지 획득 증가(%)
eve.entry.seek,380,등장 기술(돌격): 이 거리 안의 가장 가까운 적을 겨눈다(px)
eve.entry.standoff,110,등장 기술: 겨눈 적 앞 이만큼 떨어진 곳까지 달려든다(px)
eve.entry.windup,0.14,등장 기술: 달려드는 시간 = 교체부터 찌르기까지(초)
eve.entry.reach,190,등장 기술: 찌르기 길이(px)
eve.entry.half,26,등장 기술: 찌르기 판정 반폭(px)
eve.entry.dmg,110,등장 기술: 피해(%)
eve.entry.knock,170,등장 기술: 넉백 세기
eve.entry.lock,0.38,등장 기술: 이동할 수 없는 시간(초)
`,os=`﻿char,slot,name,cooldown,charges,desc
serin,basic,대검 3연격,0,0,"전방 부채꼴 근접 범위. 1·2타 {dmg1}%, 3타 {dmg3}% (범위 확대 + 넉백)"
serin,active,검기 사출,8,1,일직선 관통 검기 {dmg}%
serin,ult,붕괴 일섬,0,0,"전방으로 길게 뻗는 균열 {dmg}% + 기절 {stun}초. 균열은 {fissureDur}초간 남아 {fissureTick}초마다 {fissureDmg}%"
serin,passive,선봉의 호흡,0,0,기본 공격 3타 적중 시 액티브 쿨타임 {cdr}초 감소
mido,basic,연속 전격탄,0,0,"메카 건틀렛에서 쏘는 연속 전격 발사체. 발당 {dmg}%"
mido,active,에너지 방출,10,1,자신 주변 원형 범위 {dmg}%
mido,ult,뇌운,0,0,"가까운 적부터 차례로 낙뢰 {count}발. 발당 {dmg}% (같은 적을 다시 치면 {repeat}%)"
mido,passive,과전류,0,0,전이 상태의 적을 처치하면 주변 적에게 전이가 퍼진다
sia,basic,단일 화살,0,0,긴 사거리의 화살 {dmg}%
sia,active,화살비,11,1,지정 범위에 {duration}초간 {tick}초마다 {dmg}% 피해
sia,ult,만월의 화살,0,0,"초대형 관통 화살 {dmg}% + 적중한 적에게 표식 {markDur}초 (받는 피해 +{mark}%)"
sia,passive,원호 태세,0,0,오프 필드일 때 필드 캐릭터의 치명타 확률 +{crit}%
karen,basic,산탄 사격,0,0,"산탄 {pellets}발 부채꼴. 발당 {dmg}%, 짧은 사거리, 넉백"
karen,active,돌파 사격,7,1,전방 돌진(무적) 후 부채꼴 {dmg}%
karen,ult,반전 폭발,0,0,"코앞의 부채꼴에 산탄 {shots}연사, 발당 {dmg}% + 회피 카운트와 액티브 쿨타임 초기화"
karen,passive,근접 화력,0,0,가까운 적에게 주는 피해 +{bonus}%
raon,basic,해머 3연타,0,0,"{dmg1}% / {dmg1}% / {dmg3}% (3타는 소범위 충격파). 타격마다 짧게 전진"
raon,active,지면 강타,9,1,짧은 차지 후 전방 원형 범위 {dmg}% + 기절 {stun}초
raon,ult,유성 낙하,0,0,도약(무적) 후 착지 지점 대범위 {dmg}% + 넉백
raon,passive,투지,0,0,체력이 낮을수록 공격력 증가 (체력 {floor}% 이하에서 최대 +{max}%)
yuna,basic,기관단총 연사,0,0,매우 빠른 연사. 발당 {dmg}%
yuna,active,자율 포탑,12,1,{duration}초간 유지되는 포탑 설치. {tick}초마다 {dmg}% 사격
yuna,ult,집중 포화,0,0,{duration}초간 연사 속도 2배 + 탄환 관통. 설치된 포탑도 과부하
yuna,passive,화력 유지,0,0,빌드업 중첩이 최대일 때 치명타 확률 +{crit}%
haru,basic,쌍검 4연격,0,0,"{dmg1}% 3회 + {dmg4}%. 좁은 범위, 빠른 속도"
haru,active,그림자 베기,6,2,지정 방향으로 돌진하며 경로의 적을 벤다 {dmg}% (무적). 2회 충전
haru,ult,난무,0,0,주변 적들 사이를 오가며 {hits}회 베기 (각 {dmg}%). 시전 중 무적
haru,passive,잔상,0,0,무적 시간으로 공격을 흘리면 임팩트 지속시간 갱신 + 액티브 충전 쿨타임 {cdr}초 감소
roa,basic,유도 부적,0,0,가까운 적을 추적하는 부적 {dmg}%
roa,active,정화 결계,14,1,"{duration}초간 결계 생성. 결계 안의 적에게 {tick}초마다 {dmg}% + 전이 부여, 필드 캐릭터 초당 {heal}% 회복"
roa,ult,백귀 진혼,0,0,"팀 전원 체력 {heal}% 회복 + {buffDur}초간 팀 공격력 +{buff}%. 주변의 모든 적에게 혼령 표식을 붙여 {delay}초 뒤 터뜨린다 ({dmg}%)"
roa,passive,가호,0,0,오프 필드일 때 필드 캐릭터가 받는 피해 -{guard}%
eve,basic,창 찌르기,0,0,전방 직선 관통 찌르기 {dmg}%. 근접보다 긴 사거리
eve,active,전투 깃발,14,1,"{duration}초간 깃발 설치. 범위 안의 필드 캐릭터 공격력 +{atk}%, 받는 피해 -{guard}%"
eve,ult,진군 나팔,0,0,"{buffDur}초간 팀 전체 공격력 +{atk}%, 공속 +{aspd}%. 그동안 필드 캐릭터가 공격하면 {spearEvery}초마다 관통 창이 함께 날아간다 ({spearDmg}%)"
eve,passive,사기,0,0,오프 필드일 때 필드 캐릭터의 궁극기 게이지 획득량 +{ult}%
`,ss=`﻿id,name,weight,v1,v2,desc,note
ambush,난입,30,6,0,"섹터에 들어온 지 {v1}초 뒤 특급 괴이가 파티 근처에 나타난다. 쓰러뜨리면 영웅 이상 보상 상자",돌발 사건: 일반 섹터에 들어갈 때 params.csv 의 event.chance 확률로 하나가 일어난다. weight=뽑힐 비중
cache,떨어진 보급품,25,2,0,섹터 어딘가에 보상 상자(품질 {v1})가 하나 더 놓인다,v1=보상 품질(1~3)
merchant,떠돌이 상인,15,0,0,섹터 어딘가에 상인이 자리를 편다. 말을 걸면 바로 상점이 열린다,
horde,몰려든 무리,20,1,50,"무리마다 몬스터가 {v1}마리씩 늘어난다. 이 섹터의 괴담 조각 +{v2}%",
fortune,운수 좋은 날,10,1,0,이 섹터의 클리어 보상 품질이 {v1}단계 오른다,
`,cs=`﻿id,name,team,pet,season,cleared,outcome,picks,quality,routeScore,seed,note
test1,입문 팀,serin|mido|sia,B,1,3,extract,8,1,50,101,"테스트용 조사 팀 (도전 모드의 덱 고르기에 항상 나온다). 보상을 picks 번 받은 빌드를 seed 로 정해진 대로 만든다. cleared = 클리어한 섹터 수, outcome = boss 보스 격파 / extract 캠프 탈출, quality = 보상 품질(1~3. 높을수록 높은 등급), routeScore = 위험한 경로로 얻은 팀 점수"
test2,근접 돌파 팀,haru|raon|eve,D,1,6,extract,16,1,150,102,
test3,화력 집중 팀,karen|yuna|roa,A,1,9,boss,24,1,200,103,
test4,무대 장악 팀,serin|karen|roa,C,2,6,boss,26,2,300,104,시즌 2에서 만든 팀
test5,완성형 팀,yuna|mido|sia,B,2,6,boss,30,3,450,105,시즌 2에서 만든 팀. 가장 높은 난이도를 시험하는 용도
`,ls=`﻿id,category,owner,plan,name,max,tier,v1,v2,v3,desc,season
serin_wave_cd,unique,serin,중·장거리 대응,쾌속 검기,3,1,15,0,0,액티브 쿨타임 -{v1}%,
serin_wave_count,unique,serin,중·장거리 대응,다중 검기,2,3,1,14,0,검기 수 +{v1},
serin_wind,unique,serin,중·장거리 대응,검풍,2,2,60,520,0,기본 공격 3타에 검풍 발사체({v1}%) 추가. Lv2는 매 타,
serin_dodge,unique,serin,광역·난전 특화,난전의 발놀림,2,2,1,0,0,회피 카운트 +{v1},
serin_range,unique,serin,광역·난전 특화,대검 확장,3,1,18,0,0,기본 공격 범위 +{v1}%,
serin_haste,unique,serin,광역·난전 특화,전투 고양,2,2,12,3,0,기본 공격 적중 시 {v2}초간 공속·이속 +{v1}%,
serin_heavy,unique,serin,광범위 일격,일격필살,3,2,35,8,0,"검기·궁극기 피해 +{v1}%, 액티브 쿨타임 +{v2}%",
mido_nova_range,unique,mido,광역 누킹 특화,방출 확장,3,1,20,0,0,액티브 범위 +{v1}%,
mido_jolt,unique,mido,광역 누킹 특화,감전,2,2,12,4,20,"액티브 적중 적에게 {v2}초 감전 (받는 피해 +{v1}%, 이속 -{v3}%)",
mido_burst,unique,mido,광역 + 기동력,전격 파열,3,2,50,40,20,기본 공격 적중 시 소범위 폭발 {v1}%. 레벨마다 범위 증가,
mido_nova_cd,unique,mido,광역 + 기동력,과충전,3,1,15,0,0,액티브 쿨타임 -{v1}%,
mido_chain,unique,mido,공통,연쇄 증폭,2,3,1,15,0,"연쇄 대상 +{v1}, 연쇄 피해 +{v2}%",
sia_pierce,unique,sia,발사체 공격 특화,관통 화살,2,1,1,0,0,화살 관통 +{v1},
sia_multi,unique,sia,발사체 공격 특화,다중 사격,2,3,1,9,0,화살 수 +{v1},
sia_bounce,unique,sia,발사체 공격 특화,반사 화살,2,2,1,0,0,적중 후 가까운 적에게 튕김 +{v1},
sia_mark,unique,sia,발사체 공격 특화,사냥 표식,2,2,8,5,0,기본 공격 적중 시 표식 {v2}초 (받는 피해 +{v1}%),
sia_support,unique,sia,패시브 지원 공격 특화,원호 사격,2,3,8,50,2,오프 필드 시 {v1}초마다 가장 가까운 적에게 화살비 자동 발동 (위력 {v2}%). Lv2는 6초 / 70%,
sia_rain,unique,sia,패시브 지원 공격 특화,화살비 강화,3,1,15,10,0,"화살비 범위 +{v1}%, 쿨타임 -{v2}%",
s_atk,season,team,팀,그믐의 힘,5,1,8,0,0,팀 공격력 +{v1}%,1
s_hp,season,team,팀,야광 가호,5,1,10,0,0,팀 최대 체력 +{v1}%,1
s_crit,season,team,팀,달그림자 급소,3,2,6,0,0,치명타 확률 +{v1}%,1
s_speed,season,team,팀,밤길 걸음,2,1,6,0,0,이동 속도 +{v1}%,1
s_ult,season,team,팀,잔월 공명,3,2,15,0,0,궁극기 게이지 획득 +{v1}%,1
s_swap,season,team,팀,교대 전술,2,3,150,0.3,140,"교체 등장 시 주변 범위 피해 {v1}%, 교체 쿨타임 -{v2}초",1
s_regen,season,team,팀,밤이슬,2,2,8,0,0,섹터 클리어 시 팀 체력 {v1}% 회복,1
s_striker,season,striker,타격,그믐 폭렬,3,2,20,15,0,"타격 포지션: 액티브 피해 +{v1}%, 치명타 피해 +{v2}%",1
s_striker2,season,striker,타격,처형자,2,3,12,0,0,타격 포지션: 정예·보스 대상 피해 +{v1}%,1
s_leader,season,leader,리더,선봉,3,2,15,5,0,"리더 포지션: 기본 공격 피해 +{v1}%, 받는 피해 -{v2}%",1
s_leader2,season,leader,리더,지휘,2,3,10,6,0,리더 포지션이 교체 등장하면 {v2}초간 팀 공격력 +{v1}%,1
s_support,season,support,지원,원호,3,2,10,4,0,지원 포지션: 쿨타임 -{v1}%. 오프 필드일 때 필드 캐릭터 공격력 +{v2}%,1
s_support2,season,support,지원,응급 처치,2,2,5,0,0,지원 포지션이 액티브를 쓰면 필드 캐릭터 체력 {v1}% 회복,1
p_cd,pet,pet,펫,재빠른 발,3,1,15,0,0,펫 스킬 쿨타임 -{v1}%,
p_power,pet,pet,펫,끈기,3,2,25,0,0,펫 스킬 지속시간·위력 +{v1}%,
p_auto,pet,pet,펫,자율 행동,1,3,0,0,0,펫 스킬이 준비되면 전투 중 자동 발동,
karen_pellet,unique,karen,근접 폭딜,확산탄,2,2,2,0,0,산탄 +{v1}발,
karen_point,unique,karen,근접 폭딜,영거리 사격,3,1,15,0,0,근접 피해 보너스 +{v1}%p,
karen_exec,unique,karen,근접 폭딜,마무리,2,2,20,30,0,체력 {v2}% 이하 적에게 피해 +{v1}%,
karen_reverse,unique,karen,반전 기동,반전 증폭,3,2,15,0.5,0,"임팩트 효과 +{v1}%p, 지속 +{v2}초",
karen_dash,unique,karen,반전 기동,연속 돌파,2,3,50,0,0,돌파 사격으로 처치 시 쿨타임 {v1}% 반환. Lv2는 전부 반환,
raon_crush,unique,raon,누킹,파쇄,3,1,30,0,0,지면 강타 피해 +{v1}%,
raon_wide,unique,raon,누킹,충격 확장,2,2,20,0,0,지면 강타·궁극기 범위 +{v1}%,
raon_after,unique,raon,누킹,여진,2,3,50,1.5,0,지면 강타 지점에 {v2}초 뒤 2차 폭발 (레벨당 위력 {v1}%),
raon_body,unique,raon,체급,강철 몸,3,1,6,0,0,받는 피해 -{v1}%,
raon_guts,unique,raon,체급,투지 강화,2,2,10,0,0,투지의 최대 공격력 증가 +{v1}%p,
yuna_turret_n,unique,yuna,포탑 전개,포탑 증설,2,3,1,3,0,"포탑 동시 유지 +{v1}, 지속 +{v2}초",
yuna_turret_dmg,unique,yuna,포탑 전개,포탑 화력,3,1,30,0,0,포탑 피해 +{v1}%,
yuna_drone,unique,yuna,포탑 전개,정비 드론,2,2,1,0,0,포탑 주변의 필드 캐릭터 초당 {v1}% 회복,
yuna_stack,unique,yuna,지속 화력,빌드업 확장,2,2,5,0,0,빌드업 최대 중첩 +{v1},
yuna_ap,unique,yuna,지속 화력,철갑탄,2,2,1,0,0,탄환 관통 +{v1},
haru_crit,unique,haru,암살,급소 베기,3,1,8,15,0,"치명타 확률 +{v1}%, 치명타 피해 +{v2}%",
haru_back,unique,haru,암살,배후 일격,3,2,30,0,0,그림자 베기 피해 +{v1}%,
haru_charge,unique,haru,난전 기동,그림자 충전,2,3,1,0,0,그림자 베기 충전 +{v1},
haru_after,unique,haru,난전 기동,잔상 강화,2,2,100,0,0,회피 직후 첫 기본 공격이 넓은 범위 베기로 강화 (피해 +{v1}%),
haru_leech,unique,haru,난전 기동,흡혈 칼날,2,2,2,0,0,기본 공격 피해의 {v1}%만큼 체력 회복,
roa_ward_wide,unique,roa,치유 지원,결계 확장,3,1,20,1,0,"결계 범위 +{v1}%, 지속 +{v2}초",
roa_heal,unique,roa,치유 지원,치유 강화,2,2,1,0,0,결계 회복량 초당 +{v1}%p,
roa_guard,unique,roa,치유 지원,수호 부적,2,2,0.3,0,0,오프 필드일 때 필드 캐릭터 초당 {v1}% 회복,
roa_multi,unique,roa,확산 딜링,부적 증식,2,3,1,14,0,부적 수 +{v1},
roa_chain,unique,roa,확산 딜링,연쇄 부적,2,2,60,260,0,부적이 적중 후 전이 상태의 다른 적에게 레벨당 1회 연쇄 (위력 {v1}%),
eve_flag_atk,unique,eve,버프 특화,깃발 강화,3,1,5,0,0,깃발 공격력 버프 +{v1}%p,
eve_flag_wide,unique,eve,버프 특화,광역 깃발,2,2,25,2,0,"깃발 범위 +{v1}%, 지속 +{v2}초",
eve_handover,unique,eve,버프 특화,인계,2,2,12,6,0,이브에서 교체해 나갈 때 다음 캐릭터에게 {v2}초간 공격력 +{v1}%,
eve_combo,unique,eve,서브 딜링,연속 찌르기,2,2,150,3,0,기본 공격 {v2}회마다 추가 찌르기 {v1}%,
eve_flag_shot,unique,eve,서브 딜링,깃발 포격,2,3,60,2,0,깃발이 {v2}초마다 범위 안의 적에게 {v1}% 피해,
s2_atk,season,team,팀,용기의 훈장,5,1,8,0,0,팀 공격력 +{v1}%,2
s2_hp,season,team,팀,양철 심장,5,1,10,0,0,팀 최대 체력 +{v1}%,2
s2_crit,season,team,팀,허수아비의 지혜,3,2,6,0,0,치명타 확률 +{v1}%,2
s2_speed,season,team,팀,은 구두 끈,2,1,6,0,0,이동 속도 +{v1}%,2
s2_ult,season,team,팀,앙코르,3,2,15,0,0,궁극기 게이지 획득 +{v1}%,2
s2_spore,season,team,팀,독버섯 길들이기,2,2,50,30,0,"독 포자가 적에게 주는 피해 +{v1}%, 팀이 받는 독 피해 -{v2}%",2
s2_spot,season,team,팀,스포트라이트,2,3,12,20,4,"교체 등장 시 {v3}초간 조명을 받는다: 치명타 확률 +{v1}%, 궁극기 게이지 획득 +{v2}%",2
s2_striker,season,striker,타격,불꽃 분장,3,2,20,12,3,타격 포지션: 액티브 피해 +{v1}%. 액티브에 맞은 적은 {v3}초간 화상 (초당 공격력의 {v2}%),2
s2_striker2,season,striker,타격,피날레,2,3,15,30,0,타격 포지션: 체력이 {v2}% 이하인 적에게 주는 피해 +{v1}%,2
s2_leader,season,leader,리더,주연 배우,3,2,15,5,0,"리더 포지션: 기본 공격 피해 +{v1}%, 받는 피해 -{v2}%",2
s2_leader2,season,leader,리더,무대 장악,2,3,8,4,0,리더 포지션이 적을 처치하면 {v2}초간 이동 속도·공격 속도 +{v1}%,2
s2_support,season,support,지원,무대 감독,3,2,10,3,0,지원 포지션: 쿨타임 -{v1}%. 오프 필드일 때 필드 캐릭터가 받는 피해 -{v2}%,2
s2_support2,season,support,지원,분장실 구급함,2,2,6,4,0,지원 포지션이 액티브를 쓰면 필드 캐릭터에게 {v2}초간 최대 체력의 {v1}% 보호막,2
`,us=`﻿id,name,tier,value,weight,art,desc,season
charm_bundle,낡은 부적 뭉치,1,24,30,a bundle of old yellowed paper talismans tied with red string,누군가 문틈마다 붙여 두었던 부적,1
key_ring,녹슨 열쇠 꾸러미,1,30,28,a ring of old rusty iron keys,어느 문에도 맞지 않는 열쇠들,1
old_photo,빛바랜 흑백사진,1,36,24,a faded black-and-white photograph in a cracked wooden frame,찍힌 사람의 얼굴만 지워져 있다,1
hand_mirror,깨진 손거울,1,42,20,a cracked antique hand mirror with a brass handle,비춰 보면 등 뒤가 먼저 보인다,1
jade_charm,옥 노리개,2,70,22,a green jade ornament with a long silk tassel,차갑고 축축한 옥,1
silver_pin,은비녀,2,84,20,an ornate silver hairpin with a flower tip,머리카락 한 올이 감겨 있다,1
pocket_watch,멈춘 회중시계,2,98,16,an antique brass pocket watch with a cracked glass face,그믐밤 자정에 멈춰 있다,1
sealed_letter,봉인된 편지,2,112,14,an old envelope sealed with dark red wax,뜯으면 안 된다고 적혀 있다,1
gold_scroll,금박 족자,3,180,12,a rolled hanging scroll with gold leaf edges and a black cord,펼치면 그림이 조금씩 달라진다,1
bronze_bell,청동 방울,3,215,10,an ancient bronze ritual bell with a faint blue patina,흔들지 않아도 울린다,1
cursed_mask,저주받은 탈,3,250,8,a cracked wooden Korean folk mask with an unsettling grin,쓰고 있던 사람은 돌아오지 않았다,1
moon_bead,그믐달 구슬,4,460,5,a dark glass orb with a thin glowing crescent moon inside,달 없는 밤에만 빛난다,1
nameless_tablet,이름 없는 위패,4,580,3,a black lacquered memorial tablet with no name written on it,이름을 적으면 그 사람이 사라진다고 한다,1
straw_tuft,밀짚 한 줌,1,24,30,a small bundle of straw tied with a faded red ribbon,허수아비의 소매에서 빠져나온 것,2
oil_can,녹슨 기름통,1,30,28,a small rusty tin oil can with a long thin spout,삐걱거리던 누군가가 늘 곁에 두던 것,2
torn_script,찢어진 대본,1,36,24,a torn old theater script booklet with a few loose pages (no readable text),마지막 장이 뜯겨 나갔다,2
stage_bulb,깨진 무대 전구,1,42,20,an old cracked stage light bulb with a brass base,아직 따뜻하다,2
silver_shoe,은 구두 한 짝,2,70,22,"a single small silver slipper shoe, slightly tarnished",나머지 한 짝은 끝내 찾지 못했다,2
green_glasses,초록 안경,2,84,20,a pair of round spectacles with green glass lenses and a small brass lock on the strap,쓰면 모든 것이 그럴듯해 보인다,2
mane_tassel,사자 갈기 술,2,98,16,a thick golden tassel of yarn cut from a plush lion costume mane,겁이 날 때마다 만지작거린 흔적,2
tin_heart,양철 하트,2,112,14,a small dented heart-shaped tin locket on a chain,안은 비어 있다,2
gold_cap,황금 모자,3,180,12,a small ornate golden cap with a ring of tiny dark feathers around its brim,세 번 부르면 무언가 날아온다고 한다,2
emerald_shard,에메랄드 조각,3,215,10,a jagged shard of emerald-green stage glass set in a cracked brass frame,가까이 보면 초록 칠을 한 유리다,2
witch_broom,마녀의 빗자루,3,250,8,a miniature old broom with scorched bristles and a twisted handle,끝이 아직도 그을려 있다,2
lead_script,주연의 대본,4,460,5,a pristine theater script bound in dark red leather with a gold star on the cover (no readable text),첫 장에 빈 이름표가 붙어 있다,2
curtain_cord,내려오지 않는 막의 줄,4,580,3,"a coil of thick gold curtain rope with a heavy tassel, faintly glowing",당겨도 막은 내려오지 않는다,2
`,ds=`﻿stage,weight,members,note
0,10,wisp:3,stage=이 무리가 나오기 시작하는 웨이브 단계(0부터). 뒤 단계에서도 계속 나오지만 높은 단계의 무리가 더 자주 뽑힌다. members=몬스터id:수@등급
0,6,hound:2,
1,10,wisp:3|eye:1,
1,8,hound:3,
2,8,eye:2|hound:2,
2,6,bloat:2|wisp:2,
3,7,brute:1|wisp:2,
3,7,wisp:2|hound:2@1,
4,7,seer:1|hound:2,
4,6,eye:2@1|wisp:3,
5,6,brute:1@1|eye:2,
5,6,seer:1@1|bloat:2,
`,fs=`; 괴이 범람 전투장
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##################################
####..........................####
###.............W..............###
##...W......................W...##
#................................#
#...............X................#
#................................#
#........X..............X........#
#................................#
#................................#
#................................#
#..............................W.#
#.W..............S...............#
#................................#
#................................#
#................................#
#........X..............X........#
#................................#
#................X...............#
#................................#
##...W......................W...##
###..............W.............###
####..........................####
##################################
`,ps=`; 보너스 · 버려진 보급소
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##############################
####.....##...L.###...L......#
####.........................#
#...S_____________________...#
#...______________________...#
#.............__###..#..__...#
#........##.L.__###..#.L__...#
#############.__.######.__.###
#############.__.######.__.###
############..__..L#####__..##
############..__...#####__..##
###########...__...##...__...#
###########...__...##...__...#
###########..L.....##...__...#
###########........##...E_...#
##############################
`,ms=`; 시즌 2 · 보너스 · 의상 보관실
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##############################
##.......###.....##.......####
##.........#......L...L...####
#...S_____________________...#
#...______________________L..#
#.............__.L......__####
#.....#####...__###.....__####
#############.__.######.__.###
#############.__.######.__.###
###########...__...##...__####
###########...__..L##...__...#
###########..L__...##...__...#
###########...__...##...__...#
###########........###..__...#
############.....#####..E_...#
##############################
`,hs=`; 시즌 2 · 섹터 6 · 막이 오른 무대 (보스 전투장)
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##############################
####______________________####
###________________________###
##__________________________##
#____________________________#
#_____X________________X_____#
#____________________________#
#______________G_____________#
#____________________________#
#____________________________#
#____________________________#
#____________________________#
#____________________________#
#____________________________#
#_____X________________X_____#
#____________________________#
##_____________S____________##
###________________________###
####______________________####
##############################
`,gs=`; 시즌 2 · 섹터 1 · 짓밟힌 꽃길 (긴 맵)
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
####################################################################################################
#....................###.L###..###........L....##..#....###..###.................###.......#.L.....#
#....................###........................L..#....###..................L.............#.......#
#...S__________M___________________M_________M___________________M___________________M__________...#
#...______________________________________________________________________N_____________________...#
#...__###............##.__...............##...###.....__...........##...............__.............#
#...__###..#.........##.__.......L.......##...###..L..__.....##....##...............__..L..##......#
#...__...############...__...######################...__...######################...__...###########
#...__...############...__...######################...__...######################...__...###########
###.__..#...............__.L.........##............###__###.........#..L....###.....__..........####
#L..__..................__......L....##...............__............#.......###.....__.............#
#...___________M___________________M_________M_________M_____________________________M____________E#
#...____________________N______________________________________________________________________G___#
####..###......................#..............###.................###...L........#.....##.........##
####.L###..###..###.......###..#..L...........###.................###............#.....##.........##
####################################################################################################
`,_s=`; 시즌 2 · 섹터 2 · 안개 낀 세트장 숲 (긴 맵)
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
####################################################################################################
#........##....................###...######........#..............###..#......#...L......#####...L.#
#..................................................#.........L.........#...........................#
#...S__________M_________M___________________M_________M_____________________________M__________...#
#...____________________________________________________________N_______________________________L..#
##...................L..__..L...............__...........##...............__.##...............__..##
##.......###.........##.__.....##L.....###..__.....L.....##...............__.##........######.__..##
#####################...__...##############.__.########################...__...##############.__.###
#####################...__...##############.__.########################...__...##############.__.###
###....L...###..........__..........###..##.__.####................##..###__.....##........##.__####
#.......................__...............##.__.....................##..###__..................__...#
#...___________M___________________M_________M_________M_________M___________________M____________E#
#.L.___________________________________________________________________________________________G___#
#...........................#.........#............................................................#
#..........##...............#.........#.......#####.L....L#..................##.....L..............#
####################################################################################################
`,vs=`; 시즌 2 · 섹터 3 · 무너진 객석
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
########################################
####....#..##......##.....########L....#
####....#......................###.....#
#...S__________M____________________...#
#...________________________________.L.#
#......##.....__.....##........###.....#
###....##..#..__...####......#####.....#
#############.__.#######################
#############.__.#######################
#.....L..##...__.....###.....##.......##
#.............__.....###........L.....##
#...___________M_________M_________M...#
#...N_______________________________...#
#................##.....__.............#
#........##......##.....__...##...L..###
#######################.__.#############
#######################.__.#############
#############....#######__.##.......####
#############...........__..........#..#
###########...________________________E#
###########..._____________________G___#
###########.......L.........#..........#
###########L.......##.......#..#....####
########################################
`,ys=`; 시즌 2 · 섹터 4 · 무대 뒤편
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
########################################
###......####...#######....#############
###L.......##...###..........###########
#...___________M________S_...###########
#...______________________...###########
#.......#.....__.....#.......###########
#L......###.L.__...###....##############
#############.__.#######################
#############.__.#######################
############L.__..#..#.......####....###
###########...__................L....###
###########..._M___________________M...#
###########...______________________...#
###########...__................L.__...#
#############.__..#..........####.__.###
#############.__.################.__.###
#############.__.################.__.###
####..########__###############...__...#
####...L......__###############...__...#
#...____________...############..._M...#
#...N___________...############.L.__...#
#..........#.......############...__...#
##......####.......############...__...#
#################################.__.###
#################################.__.###
#######################......##...__...#
#####################..L..........__...#
#####################...______________E#
#####################...___________G___#
#####################..........###.....#
#######################...L..#####...###
########################################
`,bs=`; 시즌 2 · 섹터 5 · 분장실 복도
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##################################################
#......#####....###..#.......##........##.......L#
#....................#...........................#
#...S__________M_________M____________________...#
#...__________________________________________...#
#..........##...........__.....................L.#
#........####...L.#.....__.L.##........##........#
#######################.__.#######################
#######################.__.#######################
#........##.L......####.__..L........#####.......#
#..L.................##.__...........##.........L#
#...___________M_________M_________M__________...#
#...________________________________________N_...#
###....##...L...........__....................####
###..L.#####......###...__###..###..#####.....####
#######################.__.#######################
#######################.__.#######################
#####################...__.##.........######.....#
#####################...__.##.........#..........#
#####################..._M______________________E#
#####################..._____________________G___#
#####################.....###.........#..........#
#####################.....###..##.....###........#
##################################################
`,xs=`; 시즌 2 (마름모) · 보너스 · 의상 보관실
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
###################################
###################################
###################################
###################################
############......#################
############L......#.....L.########
############................#######
############...................####
############...___L___________E####
############...________________####
############...__..............####
############.X.__...L.......#######
######...L..L..__..........########
####...........__.X..##############
####...........__....##############
####..S__________....##############
####...__________....##############
####.................##############
####..............L..##############
#####......#.........##############
###############..##################
##############...##################
##############.L.##################
##############....#################
##############..###################
###################################
###################################
###################################
###################################
`,Ss=`; 시즌 2 (마름모) · 섹터 6 · 막이 오른 무대 (보스 전투장)
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
################################
################################
################################
################################
####___________________#########
####___________________#########
####___________________#########
####___________________#########
####___________________#########
####______________X_________####
####________________________####
####________________________####
####________G_______________####
####________________________####
####___________________X____####
####________________________####
####________________________####
####________________________####
####_____X__________________####
####________________________####
####________________________####
####_________________S______####
####________________________####
#########_____X_____________####
#########___________________####
#########___________________####
#########___________________####
#########___________________####
################################
################################
################################
################################
`,Cs=`; 시즌 2 (마름모) · 섹터 1 · 짓밟힌 꽃길 (긴 맵)
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
###############################################################......##.L.........########
##############################################################........#............#######
##############################################################........................####
##############################################################........................####
##############################################################.#.__M________G________E####
##############################################################...L____________________####
##############################################################.#.__...................####
##############################################################.X.__...................####
###############################################################..__...#.........L..#######
#############################################################.##.__...............########
#####################################################....L.##....__M...###################
####################################################.............__....###################
###################################################..............__....###################
###################################################..._____________....###################
###################################################.M._____________....###################
###################################################...__...............###################
###################################################...__..#............###################
###################################################...__.####L........####################
####################################################..__..###........#####################
######################################.........###....__...###############################
######################################..M.......##....__....##############################
######################################..............#.__.M..##############################
######################################................__....##############################
######################################....________L_____....##############################
######################################....______________....##############################
######################################....__................##############################
######################################....__..L.....N.......##############################
######################################....__....##........L.##############################
########################################..__..####..........##############################
###########################.........####..__..############################################
###########################.L...........X.__...###########################################
###########################.......M.......__...###########################################
###########################...._____________...###########################################
########################....#.._____________...###########################################
#######################........__...........M..###########################################
#######################..L.....__..............###########################################
#######################........__....##.......############################################
#######################........__..#######################################################
########################...#...__..#######################################################
##################......#......_M....#####################################################
################...............__....#####################################################
################.M.............__....#####################################################
################...______________....#####################################################
################...______________....#####################################################
################...__.......N........#####################################################
#################..__.X..............#####################################################
##################.__.#####.........######################################################
################...__...####.......#######################################################
######......###....__....#################################################################
####.........#.....__M...#################################################################
####...............__....#################################################################
####..S._____________....#################################################################
####...._____________....#################################################################
####.....................#################################################################
####.L...................#################################################################
####..........#.........##################################################################
###############........###################################################################
###################..#####################################################################
##################...#####################################################################
#################..L...###################################################################
##################.....###################################################################
###################...####################################################################
##########################################################################################
##########################################################################################
##########################################################################################
##########################################################################################
`,ws=`; 시즌 2 (마름모) · 섹터 2 · 안개 낀 세트장 숲 (긴 맵)
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
#######################################################################################
#######################################################################################
#######################################################################################
#######################################################################################
############################################################........L.#........########
############################################################....................#######
############################################################....................#######
############################################################.......................####
############################################################.M..__________G_______E####
############################################################....___________________####
############################################################....__.................####
############################################################....__..............#######
############################################################....__....L.........#######
##############################################################..__..#..........########
####################################################.....#####..__...##################
###################################################.......###.X.__...##################
###################################################.M...........L_...##################
###################################################..L____________...##################
###################################################...____________...##################
####################################################..__..........M..##################
####################################################..__.L.###.......##################
##################################################.##.__...####....####################
########################################........##....__.N..###########################
#######################################.......M.##....__....###########################
#######################################...............__....###########################
#######################################...._____________....###########################
#######################################...._____________....###########################
#######################################L...__...............###########################
#######################################....__....#..M.......###########################
#########################################..__..###..........###########################
##########################################.__.######......#############################
#########################################..__..########################################
################################.....####.M__...##.####################################
##############################.....M.###...__...#...###################################
##############################.............__...#.L..##################################
##############################...____________........##################################
##############################...____________........##################################
##############################X..__.............###.###################################
##############################...__...##........#######################################
##############################...__.####......L.#######################################
#####################....####L...__...####......#######################################
###################........##....__....################################################
###################.M......##....__....################################################
###################..............__....################################################
###################..._____________....################################################
###################..._____________.M..################################################
###################...__...............################################################
###################...__N..##..........################################################
###################...__...##..........################################################
####################..__...###........#################################################
##########.....####...__....#####..####################################################
#####..##..M.....#....__M...###.....###################################################
####....#.............__....###..L...##################################################
####.L......____________....###.....###################################################
####........____________....####...####################################################
#####...#...__..............###########################################################
######..#...__...#.L.....X..###########################################################
#########...__..##........#############################################################
#########L..__..#######################################################################
#########...__...######################################################################
#########...__...######################################################################
#########...__...######################################################################
#########...__...######################################################################
#########...S....######################################################################
#########........######################################################################
##########......#######################################################################
#######################################################################################
#######################################################################################
#######################################################################################
#######################################################################################
`,Ts=`; 시즌 2 (마름모) · 섹터 3 · 무너진 객석
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
#########################################################
#########################################################
#########################################################
#########################################################
########################################L........########
###############################................X..#######
###############################....M..............#######
###############################......................####
###############################...._________G_______E####
###############################....__________________####
###############################....__..L.............####
###############################....__.............#######
#######################L......#..M.__....X........#######
#######################........#...__...#.........#######
#######################............__...#################
#######################...___________...#################
#######################...__M________...#################
#######################...__............#################
########################..__...#........#################
######################.##.__...#......L.#################
##############.......#.X..__.M..........#################
#############..M.....#....__....#########################
########...##.............L_....#########################
########.L......____________....#########################
########........____________....#########################
########...##...__.N............#########################
##############..__...#..........#########################
#############.#.__.###L.......X.#########################
#####.......L...__..............#########################
####............__....###################################
####............__M...###################################
####..S___________....###################################
####...___________....###################################
####..................###################################
####.......#.......X..###################################
#####.....####........###################################
#########################################################
#########################################################
#########################################################
#########################################################
`,Es=`; 시즌 2 (마름모) · 섹터 4 · 무대 뒤편
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
###############################################
###############################################
###############################################
###############################################
#####################################E#########
####################################.__.#######
####################################.__.#######
####################################.__.#######
#################################....__..######
#################################....__..X.####
#################################....__....####
#################################....__....####
#################################....G_....####
#################################....__....####
#################################....__....####
#################################....__....####
#################################L...__.L..####
##########################.........X.__...#####
#########################........#...__...#####
#########################.....M......__...#####
#########################..._L_________...#####
#########################...___________...#####
#########################L..__............#####
################........#...__...#...M....#####
##############.X.....M......__..#.........#####
##############............M.__..........#######
##############..............__....#############
##############....____________....#############
##############....____________....#############
##############....__..............#############
##############.N..__............L.#############
##############....__..X.#.........#############
####...........L..__..#########################
####..M....X..#...__...########################
####..............__...########################
####....____________...########################
####....____________...########################
####....__..L.......M..########################
####....__....#........########################
#####...__....##.....##########################
######..__.#######..###########################
#####...__..#####...###########################
#####...__...###..L..##########################
#####...__...###.....##########################
#####...S_...###....###########################
#####........##################################
#####........##################################
#######.....###################################
###############################################
###############################################
###############################################
###############################################
`,Ds=`; 시즌 2 (마름모) · 섹터 5 · 분장실 복도
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
################################################################
################################################################
################################################################
################################################################
###############################################........L.#######
###############################################.X........#######
###############################################..........#######
###############################################.............####
###############################################....G_______E####
###############################################...._________####
###############################################....__.......####
######################################........##...__....#######
######################################.M.....X.#...__....#######
######################################.........#...__M..########
######################################.............__...########
################################.....#..#.___________...########
################################.L...#..#.L__________...########
################################.....#..#.__............########
#################################....#.X#.__....L.......########
#################################..###....__..L........#########
####################L.........##.......##.__....################
####################.......M..#.....X.#...__...#################
####################......................__...#################
##############....##..#.____________________...#################
##############.L...#....L___________________...#################
#############......#.X..__...............M.....#################
##############...###....__........M...#......L.#################
###############..####...__....#.......###......#################
############........#...__...###################################
#####...............#...__...###################################
####....................__...###################################
####..S___________________...###################################
####...___________________...###################################
#####............M....M......###################################
######.....#.......##......N.###################################
############......###........###################################
################################################################
################################################################
################################################################
################################################################
`,Os=`; 섹터 1 · 골목 어귀
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
########################################
####.....###.......###......############
####.................#......############
#...S__________M__________...###########
#...______________________...###########
####....................__L..###########
####.....#####....#####.__##############
#######################.__.#############
#######################.__.#############
###########........##...__.##..###..####
###########.............__.............#
###########L..___________M_________M...#
###########...N_____________________...#
###########..........#......#..##.__.###
###########.......####......#..##L__.###
#################################.__.###
#################################.__.###
########################.....##...__...#
########################..........__...#
#####################...______________E#
#####################...___________G___#
#####################..L....L..#....####
########################....####....####
########################################
`,ks=`; 섹터 2 · 폐상가
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
########################################
####...##..........###.....#############
#....................#L......###########
#...___________M_________M..L###########
#...______________________...###########
#...__..#...............__##############
###.__..#..##......##...__##############
#...__...##############.__.#############
#...__...##############.__.#############
#...__...#############..__...##...L....#
#...__...############...__..L..........#
#...S_...############..._M__________...#
#...__...############...__________N_...#
#........############...__.....#.......#
###......############...__...###.......#
#######################.__.#############
#######################.__.#############
#........##......####..L__.##..........#
#....L...........##.....__.##..........#
#...___________M______________________E#
#.L._______________________________G___#
#......................................#
####.....##........#####...............#
########################################
`,As=`; 섹터 3 · 주차장 뒷길
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##################################################
#####################....L...#####################
#####################........#####################
#####################...__...#####################
#####################...__...#####################
#####################...__...#####################
#######################.__.L.#####################
#######################.__.#######################
#######################.__.#######################
###....##..##....##..#..__...##.......############
#..........##....##..#..__.............###########
#...S__________M_________M__________...###########
#...______________________________N_...###########
#.......#...............__.....L.......###########
#.......#..###.L###.....__...##........###########
#####################...__...#####################
#####################...__...#####################
############L......##...__.##..........###########
###########.............__.............###########
###########..._M_________M__________...###########
###########...______________________...###########
###########.....###...............__...###########
###########L....#####.....L.......__...###########
#################################.__.#############
#################################.__.#############
###############################...__...#####.....#
###############################...__.............#
###############################E______________...#
###############################____G__________.L.#
#################################...........L....#
#################################......##........#
##################################################
`,js=`; 섹터 4 · 시장 골목
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
########################################
####...####.....#####........###########
#......##....................###########
#...___________M________S_...###########
#...______________________...###########
#....L.....###__.....##......###########
#L......######__..L####.....############
#############.__.#######################
#############.__.#######################
###########...__............L##L.......#
###########...__.......................#
###########...___________M_________M...#
###########...______________________...#
###########..........###__.##........###
##############...##..###__.####...L..###
#######################.__.#############
#######################.__.#############
#.L......##.......###...__...###########
#.......................__...###########
#...___________M__________...###########
#...N_____________________...###########
#.............__.............###########
#......####...__...##........###########
#############.__.#######################
#############.__.#######################
############..__.....###..########.....#
###########...__..........###..###.....#
###########..._M_________M____________E#
###########..._____________________G___#
############......#..##.....L..........#
############......#..##......##........#
########################################
`,Ms=`; 섹터 5 · 철길 건널목
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##################################################
####..#######........###...#######.....##.....L###
####.......##..............##....................#
#...S__________M_________M____________________...#
#...__________________________________________.L.#
#......##..#L........##...........__.....##....###
#......#####....###..##......##...__.######....###
#################################.__.#############
#################################.__.#############
#......L###.....###..##......###..__...###########
#..L....#.........L...............__...###########
#...___________M_________M__________...###########
#...________________________________...###########
####..........__............#..........###########
####....######__............###........###########
#############.__.#################################
#############.__.#################################
###########...__..###.......L#####################
###########...__.............#####################
###########...____________...#####################
###########...__________N_...#####################
###########...__.............#####################
###########...__...##.......######################
#############.__.#################################
#############.__.#################################
###########...__.....#.......###.......###########
###########...__...............#.......###########
###########..._M_________M____________E###########
###########..._____________________G___###########
#############........###...............###########
#############........###.....##........###########
##################################################
`,Ns=`; 섹터 6 · 학교 뒤편
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##################################################
#..........###.....#####....######################
#....................###.....#####################
#..._M_________M_________M..L#####################
#...______________________...#####################
#...__................L.__.#######################
#...__L##..###.....##...__.#######################
###.__.################.__.#######################
###.__.################.__.#######################
#...__..################__.....###...####........#
#...__..################__.....###............L..#
#...S_...############..._M_________M__________...#
#...__...############L..______________________...#
#........############...__.......................#
#........############...__.##........#######.L..##
#######################.__.#######################
#######################.__.#######################
#.......L##.......######__...#####################
#.......................__...#####################
#..._____________________M...#####################
#...N_____________________...#####################
#.....###...............__.#######################
###...######.....####...__.#######################
#######################.__.#######################
#######################.__.#######################
#...L....##.............__...##........###########
#.......................__.............###########
#...___________M_________M____________E###########
#..._______________________________G___###########
#....L......................L..........###########
#......####..........#.......####...##############
##################################################
`,Ps=`; 섹터 7 · 강변 창고
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##################################################
########################....######################
########################.....#####################
#####################...S_...#####################
#####################...__...#####################
#####################...__...#####################
#####################...__.#######################
#######################.__.#######################
#######################.__.#######################
#.....#####.............__............###.L....###
#L....###..L............__............#........###
#...___________M_________M_________M__________...#
#...________________________________________N_...#
#.......L.....__.....##...........__.............#
#.....#####...__.##..##..........L__...####....###
#############.__.################.__.#############
#############.__.################.__.#############
##############__##################__..############
##############__##################__...###########
###########L.._M...############..._M...###########
###########...__...############...__...###########
#############.__...############...__..L###########
#############.__...############...__..############
#############.__.################.__.#############
#############.__.################.__.#############
############..__.....##.....#.....__...###########
###########L..__..................__...###########
###########...______________E_______...###########
###########...___________G__________...###########
###########..........#.................###########
###########..........#.................###########
##################################################
`,Fs=`; 섹터 8 · 구도심 광장
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
##################################################
#.......L####........L.......####......###########
#..............................##......###########
#.L._M_________M_________M________S_...###########
#...________________________________...###########
#..........###__........__.............###########
#.......######__.##..##.__...###......############
###########...__...##...__...#####################
###########...__...##...__...#####################
###########.L.__.##..#..__.####.....#######......#
###########...__........__...............##.L....#
###########..._M_________M____________________...#
###########...________________________________...#
###########...__.....##..........L...##..L......##
###########...__.....##......##......#####......##
#############.__.#################################
#############.__.#################################
#L....#######.__..###..........#.......###########
#..........##.__..#............#.......###########
#..._____________________M_________M...###########
#...N_______________________________...###########
#..........##...............#.....__...###########
#........####...#####.......#.....__...###########
#################################.__.#############
#################################.__.#############
#######################......####.__..############
#####################.............__...###########
#####################L..______________E###########
#####################...___________G___###########
#####################..........#.......###########
######################.....L.###.......###########
##################################################
`,Is=`; 섹터 9 · 그믐의 우산 (보스 전투장)
; # 벽·건물   . 바닥(엄폐 오브젝트 무작위 배치 가능)   _ 통로(항상 비움)
; S 시작   E 출구   G 출구 수호 무리 / 보스   M 무리 후보   L 수색 후보   N NPC 후보   X 고정 장애물   W 웨이브 출현
############################
####____________________####
###______________________###
##________________________##
#__________________________#
#__________________________#
#______X____________X______#
#_____________G____________#
#__________________________#
#__________________________#
#__________________________#
#__________________________#
#__________________________#
#______X____________X______#
#__________________________#
#__________________________#
##____________S___________##
###______________________###
####____________________####
############################
`;function Ls(e){e.charCodeAt(0)===65279&&(e=e.slice(1));let t=[],n=[],r=``,i=!1;for(let a=0;a<e.length;a++){let o=e[a];i?o===`"`?e[a+1]===`"`?(r+=`"`,a++):i=!1:r+=o:o===`"`?i=!0:o===`,`?(n.push(r),r=``):o===`
`||o===`\r`?(o===`\r`&&e[a+1]===`
`&&a++,n.push(r),t.push(n),n=[],r=``):r+=o}return(r!==``||n.length)&&(n.push(r),t.push(n)),t}function Rs(e){let t=Ls(e),n=(t[0]??[]).map(e=>e.trim()),r=[];for(let e=1;e<t.length;e++){let i=t[e];if(i.every(e=>e.trim()===``))continue;let a={};n.forEach((e,t)=>{a[e]=(i[t]??``).trim()}),r.push({line:e+1,cells:a})}return{header:n,rows:r}}var zs=Math.PI*2,Bs=(e,t,n)=>e<t?t:e>n?n:e,Vs=e=>e*Math.PI/180;function Hs(e,t){let n=(t-e)%zs;return n>Math.PI?n-=zs:n<-Math.PI&&(n+=zs),n}var Us=e=>1-(1-e)*(1-e);function Ws(e){return parseInt(e.replace(`#`,``),16)}function Gs(e){return`#`+e.toString(16).padStart(6,`0`)}function Ks(e,t){let n=e>>16&255,r=e>>8&255,i=e&255;return t>=0?(n+=(255-n)*t,r+=(255-r)*t,i+=(255-i)*t):(n*=1+t,r*=1+t,i*=1+t),Math.round(n)<<16|Math.round(r)<<8|Math.round(i)}var qs=[`greatsword`,`gauntlet`,`bow`,`shotgun`,`hammer`,`smg`,`daggers`,`talisman`,`lance`],Js=[`substance`,`form`,`nature`,`reverse`],Ys=[`striker`,`leader`,`support`],Xs={substance:`실체`,form:`형상`,nature:`자연`,reverse:`반전`},Zs={striker:`타격`,leader:`리더`,support:`지원`},Qs=[`raid`,`wave`],$s=[`weapon`,`armor`,`acc`],ec={weapon:`무기`,armor:`방어구`,acc:`악세서리`},tc=[`atk`,`hp`,`critRate`,`critDmg`,`aspd`,`basicDmg`,`activeDmg`,`ultDmg`,`guard`,`speed`,`cdr`,`ultGain`];function nc(e){"@babel/helpers - typeof";return nc=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},nc(e)}function rc(e,t){if(nc(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t||`default`);if(nc(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function ic(e){var t=rc(e,`string`);return nc(t)==`symbol`?t:t+``}function ac(e,t,n){return(t=ic(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}var oc=Object.assign({"/data/challenges.csv":Uo,"/data/characters.csv":Wo,"/data/curses.csv":Go,"/data/equipment_options.csv":Ko,"/data/equipment_skills.csv":qo,"/data/grades.csv":Jo,"/data/monsters.csv":Yo,"/data/moods.csv":Xo,"/data/objects.csv":Zo,"/data/packs.csv":Qo,"/data/params.csv":$o,"/data/pets.csv":es,"/data/rarity.csv":ts,"/data/routes.csv":ns,"/data/seasons.csv":rs,"/data/sectors.csv":is,"/data/skill_values.csv":as,"/data/skills.csv":os,"/data/surprises.csv":ss,"/data/test_decks.csv":cs,"/data/upgrades.csv":ls,"/data/valuables.csv":us,"/data/waves.csv":ds}),sc=Object.assign({"/data/maps/arena_wave.txt":fs,"/data/maps/bonus01.txt":ps,"/data/maps/s2_bonus.txt":ms,"/data/maps/s2_boss.txt":hs,"/data/maps/s2_field.txt":gs,"/data/maps/s2_forest.txt":_s,"/data/maps/s2_stage1.txt":vs,"/data/maps/s2_stage2.txt":ys,"/data/maps/s2_stage3.txt":bs,"/data/maps/s3_bonus.txt":xs,"/data/maps/s3_boss.txt":Ss,"/data/maps/s3_field.txt":Cs,"/data/maps/s3_forest.txt":ws,"/data/maps/s3_stage1.txt":Ts,"/data/maps/s3_stage2.txt":Es,"/data/maps/s3_stage3.txt":Ds,"/data/maps/sector01.txt":Os,"/data/maps/sector02.txt":ks,"/data/maps/sector03.txt":As,"/data/maps/sector04.txt":js,"/data/maps/sector05.txt":Ms,"/data/maps/sector06.txt":Ns,"/data/maps/sector07.txt":Ps,"/data/maps/sector08.txt":Fs,"/data/maps/sector09.txt":Is}),cc=class extends Error{constructor(e){super(`수치 테이블 오류
`+e.join(`
`)),ac(this,`problems`,void 0),this.problems=e,this.name=`DataError`}},G=[],lc=class{constructor(e,t){ac(this,`file`,void 0),ac(this,`row`,void 0),this.file=e,this.row=t}fail(e,t){G.push(`${this.file} ${this.row.line}번째 줄 [${e}]: ${t}`)}str(e){let t=this.row.cells[e];return t===void 0||t===``?(this.fail(e,`값이 비어 있습니다`),``):t}opt(e,t=``){let n=this.row.cells[e];return n===void 0||n===``?t:n}num(e,t){let n=this.row.cells[e];if(n===void 0||n===``)return t===void 0?(this.fail(e,`값이 비어 있습니다`),0):t;let r=Number(n);return Number.isFinite(r)?r:(this.fail(e,`숫자가 아닙니다 → "${n}"`),0)}oneOf(e,t){let n=this.str(e);return n&&!t.includes(n)?(this.fail(e,`"${n}"는 쓸 수 없습니다. 가능한 값: ${t.join(`, `)}`),t[0]):n}color(e){return Ws(this.colorText(e))}colorText(e){let t=this.str(e);return t&&!/^#[0-9a-fA-F]{6}$/.test(t)?(this.fail(e,`색은 #rrggbb 형식이어야 합니다 → "${t}"`),`#ffffff`):t||`#ffffff`}members(e,t=!1){let n=this.opt(e);if(!n)return t||this.fail(e,`값이 비어 있습니다`),[];let r=[];for(let t of n.split(`|`)){let n=/^\s*(\w+)\s*(?::\s*(\d+))?\s*(?:@\s*(\d+))?\s*$/.exec(t);n?r.push({id:n[1],count:n[2]?Number(n[2]):1,grade:n[3]?Number(n[3]):0}):this.fail(e,`"몬스터id:수@등급" 형식이 아닙니다 → "${t}"`)}return r}error(e,t){this.fail(e,t)}};function K(e){let t=`${e}.csv`,n=oc[`/data/${t}`];return n===void 0?(G.push(`${t}: 파일이 없습니다`),[]):Rs(n).rows.map(e=>new lc(t,e))}function uc(e){let t=new Map;for(let n of K(e)){let e=n.str(`key`);t.has(e)&&n.error(`key`,`"${e}"가 두 번 나옵니다`),t.set(e,n.num(`value`))}return t}function q(e,t,n){e.has(n.id)&&t.error(`id`,`"${n.id}"가 두 번 나옵니다`),e.set(n.id,n)}var dc=uc(`params`),fc=uc(`skill_values`),pc=new Map;for(let e of K(`characters`))q(pc,e,{id:e.str(`id`),name:e.str(`name`),grade:e.oneOf(`grade`,[`S`,`A`]),position:e.oneOf(`position`,Ys),attr:e.oneOf(`attr`,Js),weapon:e.str(`weapon`),weaponType:e.oneOf(`weaponType`,qs),aim:e.oneOf(`aim`,[`dpad`,`auto`]),muzzle:{x:e.num(`muzzleX`,20),y:e.num(`muzzleY`,24)},hp:e.num(`hp`),atk:e.num(`atk`),speed:e.num(`speed`),range:e.num(`range`),hairStyle:e.oneOf(`hairStyle`,[`bob`,`twintail`,`long`,`short`,`pony`]),colors:{hair:e.color(`hair`),hair2:e.color(`hair2`),outfit:e.color(`outfit`),accent:e.color(`accent`),eye:e.color(`eye`),skin:e.color(`skin`)},desc:e.opt(`desc`)});var mc=new Map;for(let e of K(`skills`)){let t={char:e.str(`char`),slot:e.oneOf(`slot`,[`basic`,`active`,`ult`,`passive`]),name:e.str(`name`),cooldown:e.num(`cooldown`,0),charges:e.num(`charges`,0),desc:e.opt(`desc`)};t.char&&!pc.has(t.char)&&e.error(`char`,`characters.csv에 없는 캐릭터입니다 → "${t.char}"`);for(let n of t.desc.matchAll(/\{([\w.]+)\}/g)){let r=`${t.char}.${t.slot}.${n[1]}`;fc.has(r)||e.error(`desc`,`skill_values.csv에 "${r}"가 없습니다`)}mc.set(`${t.char}.${t.slot}`,t)}for(let e of pc.values())for(let t of[`basic`,`active`,`ult`,`passive`])mc.has(`${e.id}.${t}`)||G.push(`skills.csv: ${e.id}의 ${t} 스킬이 없습니다`);var hc=new Map,gc=K(`monsters`);for(let e of gc)q(hc,e,{id:e.str(`id`),name:e.str(`name`),size:e.oneOf(`size`,[`S`,`M`,`L`]),radius:e.num(`radius`),hp:e.num(`hp`),atk:e.num(`atk`),speed:e.num(`speed`),ai:e.str(`ai`),weak:e.oneOf(`weak`,Js),range:e.num(`range`,0),windup:e.num(`windup`,0),cooldown:e.num(`cooldown`,0),p1:e.num(`p1`,0),p2:e.num(`p2`,0),p3:e.num(`p3`,0),p4:e.num(`p4`,0),shards:e.num(`shards`,0),color:e.color(`color`),eye:e.color(`eye`),summon:e.members(`summon`,!0)});function _c(e,t,n){for(let r of n)hc.has(r.id)||e.error(t,`monsters.csv에 없는 몬스터입니다 → "${r.id}"`)}gc.forEach((e,t)=>_c(e,`summon`,[...hc.values()][t]?.summon??[]));var vc=K(`grades`).map(e=>({grade:e.num(`grade`),name:e.str(`name`),hpMult:e.num(`hpMult`),atkMult:e.num(`atkMult`),scale:e.num(`scale`),quality:e.num(`quality`),shardMult:e.num(`shardMult`)})),yc=K(`packs`).map(e=>{let t={id:e.str(`id`),season:e.num(`season`,1),minSector:e.num(`minSector`,1),maxSector:e.num(`maxSector`,99),weight:e.num(`weight`,1),members:e.members(`members`)};return _c(e,`members`,t.members),t}),bc=new Map;for(let[e,t]of Object.entries(sc)){let n=e.split(`/`).pop().replace(/\.txt$/,``);bc.set(n,t)}var J=K(`sectors`).map(e=>{let t={season:e.num(`season`,1),index:e.num(`index`),view:e.opt(`view`)||`flat`,scene:e.opt(`scene`,`alley`),depth:e.num(`depth`,Math.max(0,e.num(`index`)-1)),fog:e.num(`fog`,0),name:e.str(`name`),map:e.str(`map`),type:e.oneOf(`type`,[`normal`,`boss`,`bonus`]),packs:e.num(`packs`,0),chests:e.num(`chests`,-1),gate:e.members(`gate`,!0),loot:e.num(`loot`,0),npcChance:e.num(`npcChance`,0),density:e.num(`density`,0),camp:e.num(`camp`,0)===1};return _c(e,`gate`,t.gate),t.view!==`flat`&&t.view!==`iso`&&e.error(`view`,`flat(기존 화면) 또는 iso(마름모)여야 합니다 → "${t.view}"`),t.map&&!bc.has(t.map)&&e.error(`map`,`data/maps/${t.map}.txt 파일이 없습니다`),t}),xc=new Map;for(let e of K(`pets`))q(xc,e,{id:e.str(`id`),name:e.str(`name`),cooldown:e.num(`cooldown`),duration:e.num(`duration`,0),radius:e.num(`radius`,0),v1:e.num(`v1`,0),v2:e.num(`v2`,0),color:e.color(`color`),desc:e.opt(`desc`)});var Sc=new Map;for(let e of K(`upgrades`)){let t={id:e.str(`id`),category:e.oneOf(`category`,[`unique`,`season`,`pet`]),owner:e.str(`owner`),plan:e.opt(`plan`),name:e.str(`name`),max:e.num(`max`),tier:e.num(`tier`),v1:e.num(`v1`,0),v2:e.num(`v2`,0),v3:e.num(`v3`,0),desc:e.opt(`desc`),season:e.num(`season`,0)};t.category===`season`&&t.season<=0&&e.error(`season`,`시즌 스킬은 나오는 시즌 번호를 적어야 합니다`),t.category===`unique`&&!pc.has(t.owner)&&e.error(`owner`,`characters.csv에 없는 캐릭터입니다 → "${t.owner}"`),t.category===`season`&&t.owner!==`team`&&!Ys.includes(t.owner)&&e.error(`owner`,`team 또는 포지션(${Ys.join(`, `)})이어야 합니다 → "${t.owner}"`),(t.tier<1||t.tier>3)&&e.error(`tier`,`1~3이어야 합니다`),q(Sc,e,t)}var Cc=new Map;for(let e of K(`equipment_skills`))q(Cc,e,{id:e.str(`id`),slot:e.oneOf(`slot`,$s),name:e.str(`name`),v1:e.num(`v1`,0),v2:e.num(`v2`,0),cooldown:e.num(`cooldown`,0),chance:e.num(`chance`,0),team:e.num(`team`,0)===1,desc:e.opt(`desc`),season:e.num(`season`,1)});var wc=K(`equipment_options`).map(e=>({slot:e.oneOf(`slot`,$s),stat:e.oneOf(`stat`,tc),main:e.oneOf(`role`,[`main`,`sub`])===`main`,min:e.num(`min`),max:e.num(`max`),label:e.str(`label`)}));for(let e of $s)wc.some(t=>t.slot===e&&t.main)||G.push(`equipment_options.csv: ${e} 슬롯의 주 옵션(main)이 없습니다`);var Tc=K(`rarity`).map(e=>({rarity:e.num(`rarity`),name:e.str(`name`),skillMult:e.num(`skillMult`),options:e.num(`options`),optMult:e.num(`optMult`),refund:e.num(`refund`),score:e.num(`score`),color:e.colorText(`color`),weights:[e.num(`w1`),e.num(`w2`),e.num(`w3`)]})).sort((e,t)=>e.rarity-t.rarity),Ec=new Map;for(let e of K(`valuables`))q(Ec,e,{id:e.str(`id`),name:e.str(`name`),tier:e.num(`tier`),value:e.num(`value`),weight:e.num(`weight`),desc:e.opt(`desc`),season:e.num(`season`,1)});var Dc=new Map;for(let e of K(`curses`))q(Dc,e,{id:e.str(`id`),name:e.str(`name`),stat:e.oneOf(`stat`,[`dmgTaken`,`atk`,`speed`,`maxHp`,`critRate`]),value:e.num(`value`),desc:e.opt(`desc`)});var Oc=new Map;for(let e of K(`objects`))q(Oc,e,{id:e.str(`id`),name:e.str(`name`),weight:e.num(`weight`),v1:e.num(`v1`,0),v2:e.num(`v2`,0),desc:e.opt(`desc`)});var kc=new Map;for(let e of K(`routes`))q(kc,e,{id:e.str(`id`),name:e.str(`name`),grade:e.num(`grade`),packBonus:e.num(`packBonus`,0),eliteChance:e.num(`eliteChance`,0),special:e.num(`special`,0),statMult:e.num(`statMult`,1),shardMult:e.num(`shardMult`,1),quality:e.num(`quality`,1),score:e.num(`score`,0),hidden:e.num(`hidden`,0),desc:e.opt(`desc`)});kc.has(`normal`)||G.push(`routes.csv: id가 normal인 기본 경로가 없습니다`);var Ac=[`ambush`,`cache`,`merchant`,`horde`,`fortune`],jc=K(`surprises`).map(e=>{let t={id:e.str(`id`),name:e.str(`name`),weight:e.num(`weight`,1),v1:e.num(`v1`,0),v2:e.num(`v2`,0),desc:e.opt(`desc`)};return t.id&&!Ac.includes(t.id)&&e.error(`id`,`"${t.id}"는 쓸 수 없습니다. 가능한 값: ${Ac.join(`, `)}`),t}),Mc=new Map;for(let e of K(`moods`)){let t={scene:e.str(`scene`),sat:e.num(`sat`,1),dark:e.num(`dark`,1),lit:e.num(`lit`,1),tint:e.color(`tint`),warm:e.color(`warm`),inner:e.num(`inner`,.3),outer:e.num(`outer`,1),vignette:e.num(`vignette`,0),keep:e.num(`keep`,.8)};t.outer<=t.inner&&e.error(`outer`,`inner(${t.inner})보다 커야 합니다 → ${t.outer}`),Mc.has(t.scene)&&e.error(`scene`,`"${t.scene}"가 두 번 나옵니다`),Mc.set(t.scene,t)}var Nc=K(`waves`).map(e=>{let t={stage:e.num(`stage`),weight:e.num(`weight`,1),members:e.members(`members`)};return _c(e,`members`,t.members),t});Nc.some(e=>e.stage===0)||G.push(`waves.csv: stage가 0인 무리가 하나 이상 있어야 합니다`);var Y=K(`seasons`).map(e=>{let t={id:e.num(`id`),name:e.str(`name`),subtitle:e.opt(`subtitle`),mediums:e.opt(`mediums`).split(`|`).map(e=>e.trim()).filter(Boolean),bossIntro:e.opt(`bossIntro`),desc:e.opt(`desc`),base:e.num(`base`,e.num(`id`)),label:e.opt(`label`)};for(let n of t.mediums)hc.has(n)||e.error(`mediums`,`monsters.csv에 없는 몬스터입니다 → "${n}"`);return J.some(e=>e.season===t.id&&e.type!==`bonus`)||e.error(`id`,`sectors.csv에 시즌 ${t.id}의 섹터가 없습니다`),t});Y.some(e=>e.id===1)||G.push(`seasons.csv: id가 1인 시즌이 없습니다`);for(let e of Y){let t=Y.find(t=>t.id===e.base);t&&t.base===t.id||G.push(`seasons.csv: 시즌 ${e.id}의 base(${e.base})는 스스로가 기준인 시즌의 번호여야 합니다`)}for(let e of J)Y.some(t=>t.id===e.season)||G.push(`sectors.csv: 섹터 "${e.name}"의 시즌 ${e.season}이 seasons.csv에 없습니다`);var Pc=K(`challenges`).map(e=>{let t={id:e.str(`id`),kind:e.oneOf(`kind`,Qs),season:e.num(`season`),name:e.str(`name`),map:e.opt(`map`),scene:e.opt(`scene`),desc:e.opt(`desc`)};return Y.some(e=>e.id===t.season)||e.error(`season`,`seasons.csv에 없는 시즌입니다 → ${t.season}`),t.kind===`raid`?J.some(e=>e.season===t.season&&e.type===`boss`)||e.error(`season`,`시즌 ${t.season}에 보스 섹터가 없습니다`):(bc.has(t.map)||e.error(`map`,`data/maps/${t.map}.txt 파일이 없습니다`),t.scene||e.error(`scene`,`맵 그림 세트가 비어 있습니다`)),t});for(let[e,t]of Pc.entries())Pc.findIndex(e=>e.id===t.id)!==e&&G.push(`challenges.csv: id "${t.id}"가 두 번 나옵니다`);var Fc=K(`test_decks`).map(e=>{let t={id:e.str(`id`),name:e.str(`name`),team:e.str(`team`).split(`|`).map(e=>e.trim()).filter(Boolean),pet:e.str(`pet`),season:e.num(`season`),cleared:e.num(`cleared`),outcome:e.oneOf(`outcome`,[`boss`,`extract`]),picks:e.num(`picks`),quality:e.num(`quality`),routeScore:e.num(`routeScore`,0),seed:e.num(`seed`)};(t.team.length!==3||new Set(t.team).size!==3)&&e.error(`team`,`서로 다른 캐릭터 3명을 | 로 나눠 적습니다`);for(let n of t.team)pc.has(n)||e.error(`team`,`characters.csv에 없는 캐릭터입니다 → "${n}"`);return xc.has(t.pet)||e.error(`pet`,`pets.csv에 없는 펫입니다 → "${t.pet}"`),Y.some(e=>e.id===t.season)||e.error(`season`,`seasons.csv에 없는 시즌입니다 → ${t.season}`),(t.quality<1||t.quality>3)&&e.error(`quality`,`1~3 사이여야 합니다`),t});for(let[e,t]of Fc.entries())Fc.findIndex(e=>e.id===t.id)!==e&&G.push(`test_decks.csv: id "${t.id}"가 두 번 나옵니다`);if(G.length)throw new cc(G);var X=1,Ic=1;function Z(e,t,n){let r=e.get(t);if(r===void 0)throw Error(`${n}에 "${t}"가 없습니다`);return r}function Lc(e,t){return e.replace(/\{(\w+)\}/g,(e,n)=>String(t[n]??`?`))}function Rc(e){return Math.round(e*100)/100}var zc={P:e=>Z(dc,e,`params.csv`),pct:e=>Z(dc,e,`params.csv`)/100,sv:e=>Z(fc,e,`skill_values.csv`),svOr:(e,t)=>fc.get(e)??t,chars:pc,charList:[...pc.values()],char:e=>Z(pc,e,`characters.csv`),skill:(e,t)=>Z(mc,`${e}.${t}`,`skills.csv`),skillDesc(e,t){return this.skill(e,t).desc.replace(/\{([\w.]+)\}/g,(n,r)=>String(fc.get(`${e}.${t}.${r}`)??`?`))},monsters:hc,monster:e=>Z(hc,e,`monsters.csv`),grades:vc,grade:e=>vc.find(t=>t.grade===e)??vc[0],seasons:Y,season:e=>Y.find(t=>t.id===e)??Y[0],get seasonId(){return X},get seasonDef(){return Y.find(e=>e.id===X)??Y[0]},useSeason(e){X=Y.some(t=>t.id===e)?e:1,Ic=(Y.find(e=>e.id===X)??Y[0]).base},baseOf:e=>(Y.find(t=>t.id===e)??Y[0]).base,get packs(){return yc.filter(e=>e.season===Ic)},get sectors(){return J.filter(e=>e.season===X)},sectorsOf:e=>J.filter(t=>t.season===e),allSectors:J,sector:e=>{let t=J.find(t=>t.season===X&&t.index===e);if(!t)throw Error(`sectors.csv에 시즌 ${X}의 ${e}번 섹터가 없습니다`);return t},get lastSector(){return Math.max(...J.filter(e=>e.season===X&&e.type!==`bonus`).map(e=>e.index))},get bonusSector(){return J.find(e=>e.season===X&&e.type===`bonus`)??null},pets:xc,petList:[...xc.values()],pet:e=>Z(xc,e,`pets.csv`),petDesc(e){return Lc(this.pet(e).desc,this.pet(e))},upgrades:Sc,upgradeList:[...Sc.values()],upgrade:e=>Z(Sc,e,`upgrades.csv`),upgradeDesc(e){return Lc(this.upgrade(e).desc,this.upgrade(e))},equipSkills:Cc,equipSkillList:[...Cc.values()],get equipPool(){return[...Cc.values()].filter(e=>e.season===Ic)},equipSkill:e=>Z(Cc,e,`equipment_skills.csv`),equipOptions:wc,rarities:Tc,rarity:e=>Tc.find(t=>t.rarity===e)??Tc[0],equipSkillDesc(e,t){let n=this.equipSkill(e);return Lc(n.desc,{...n,v1:Rc(n.v1*this.rarity(t).skillMult)})},valuables:Ec,valuableList:[...Ec.values()],get valuablePool(){return[...Ec.values()].filter(e=>e.season===Ic)},valuable:e=>Z(Ec,e,`valuables.csv`),curses:Dc,curseList:[...Dc.values()],curse:e=>Z(Dc,e,`curses.csv`),curseDesc:e=>{let t=Z(Dc,e,`curses.csv`);return t.desc.replace(`{value}`,String(t.value))},objects:Oc,objectList:[...Oc.values()],object:e=>Z(Oc,e,`objects.csv`),routes:kc,routeList:[...kc.values()],route:e=>kc.get(e)??Z(kc,`normal`,`routes.csv`),waves:Nc,challenges:Pc,challenge:e=>{let t=Pc.find(t=>t.id===e);if(!t)throw Error(`challenges.csv에 "${e}"가 없습니다`);return t},testDecks:Fc,surprises:jc,surpriseDesc:e=>Lc(e.desc,e),mood:e=>Mc.get(e)??null,mapText:e=>Z(bc,e,`data/maps`),mapNames:[...bc.keys()]},Q=Math.SQRT1_2,$=Q/2,Bc=new class{constructor(){ac(this,`iso`,!1)}use(e){this.iso=e===`iso`}x(e,t){return this.iso?(e-t)*Q:e}y(e,t){return this.iso?(e+t)*$:t}depth(e,t){return this.iso?(e+t)*$:t}vx(e,t){return this.iso?(e-t)*Q:e}vy(e,t){return this.iso?(e+t)*$:t}angle(e){if(!this.iso)return e;let t=Math.cos(e),n=Math.sin(e);return Math.atan2((t+n)*$,(t-n)*Q)}get ground(){return this.iso?[Q,$,-Q,$]:[1,0,0,1]}liftX(e){return this.iso?-e/(2*$):0}liftY(e){return this.iso?-e/(2*$):-e}sideX(e){return this.iso?e/(2*Q):e}sideY(e){return this.iso?-e/(2*Q):0}worldDir(e,t,n){let r=e,i=t;this.iso&&(r=e/(2*Q)+t/(2*$),i=t/(2*$)-e/(2*Q));let a=Math.hypot(r,i)||1;n.x=r/a,n.y=i/a}inputX(e,t){return this.iso?(e+t)*Math.SQRT1_2:e}inputY(e,t){return this.iso?(t-e)*Math.SQRT1_2:t}},Vc={extension:{type:o.Environment,name:`browser`,priority:-1},test:()=>!0,load:async()=>{await t(()=>import(`./browserAll-DX9euJ0V.js`),__vite__mapDeps([0,1,2,3,4,5]),import.meta.url)}},Hc={extension:{type:o.Environment,name:`webworker`,priority:0},test:()=>typeof self<`u`&&self.WorkerGlobalScope!==void 0,load:async()=>{await t(()=>import(`./webworkerAll-CM6-LUZB.js`),__vite__mapDeps([6,4,1,2,5,3]),import.meta.url)}},Uc={test(e){return typeof e==`string`&&e.startsWith(`info face=`)},parse(e){let t=e.match(/^[a-z]+\s+.+$/gm),n={info:[],common:[],page:[],char:[],chars:[],kerning:[],kernings:[],distanceField:[]};for(let e in t){let r=t[e].match(/^[a-z]+/gm)[0],i=t[e].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm),a={};for(let e in i){let t=i[e].split(`=`),n=t[0],r=t[1].replace(/"/gm,``),o=parseFloat(r);a[n]=isNaN(o)?r:o}n[r].push(a)}let r={chars:{},pages:[],lineHeight:0,fontSize:0,fontFamily:``,distanceField:null,baseLineOffset:0},[i]=n.info,[a]=n.common,[o]=n.distanceField??[];o&&(r.distanceField={range:parseInt(o.distanceRange,10),type:o.fieldType}),r.fontSize=parseInt(i.size,10),r.fontFamily=i.face,r.lineHeight=parseInt(a.lineHeight,10);let s=n.page;for(let e=0;e<s.length;e++)r.pages.push({id:parseInt(s[e].id,10)||0,file:s[e].file});let c={};r.baseLineOffset=a.base===void 0?0:r.lineHeight-parseInt(a.base,10);let l=n.char;for(let e=0;e<l.length;e++){let t=l[e],n=parseInt(t.id,10),i=t.letter??t.char??String.fromCharCode(n);i===`space`&&(i=` `),c[n]=i,r.chars[i]={id:n,page:parseInt(t.page,10)||0,x:parseInt(t.x,10),y:parseInt(t.y,10),width:parseInt(t.width,10),height:parseInt(t.height,10),xOffset:parseInt(t.xoffset,10),yOffset:parseInt(t.yoffset,10),xAdvance:parseInt(t.xadvance,10),kerning:{}}}let u=n.kerning||[];for(let e=0;e<u.length;e++){let t=parseInt(u[e].first,10),n=parseInt(u[e].second,10),i=parseInt(u[e].amount,10);r.chars[c[n]]&&(r.chars[c[n]].kerning[c[t]]=i)}return r}},Wc={test(e){let t=e;return typeof t!=`string`&&`getElementsByTagName`in t&&t.getElementsByTagName(`page`).length&&t.getElementsByTagName(`info`)[0].getAttribute(`face`)!==null},parse(e){let t={chars:{},pages:[],lineHeight:0,fontSize:0,fontFamily:``,distanceField:null,baseLineOffset:0},n=e.getElementsByTagName(`info`)[0],r=e.getElementsByTagName(`common`)[0],i=e.getElementsByTagName(`distanceField`)[0];i&&(t.distanceField={type:i.getAttribute(`fieldType`),range:parseInt(i.getAttribute(`distanceRange`),10)});let a=e.getElementsByTagName(`page`),o=e.getElementsByTagName(`char`),s=e.getElementsByTagName(`kerning`);t.fontSize=parseInt(n.getAttribute(`size`),10),t.fontFamily=n.getAttribute(`face`),t.lineHeight=parseInt(r.getAttribute(`lineHeight`),10);for(let e=0;e<a.length;e++)t.pages.push({id:parseInt(a[e].getAttribute(`id`),10)||0,file:a[e].getAttribute(`file`)});let c={},l=r.getAttribute(`base`);t.baseLineOffset=l===null?0:t.lineHeight-parseInt(l,10);for(let e=0;e<o.length;e++){let n=o[e],r=parseInt(n.getAttribute(`id`),10),i=n.getAttribute(`letter`)??n.getAttribute(`char`)??String.fromCharCode(r);i===`space`&&(i=` `),c[r]=i,t.chars[i]={id:r,page:parseInt(n.getAttribute(`page`),10)||0,x:parseInt(n.getAttribute(`x`),10),y:parseInt(n.getAttribute(`y`),10),width:parseInt(n.getAttribute(`width`),10),height:parseInt(n.getAttribute(`height`),10),xOffset:parseInt(n.getAttribute(`xoffset`),10),yOffset:parseInt(n.getAttribute(`yoffset`),10),xAdvance:parseInt(n.getAttribute(`xadvance`),10),kerning:{}}}for(let e=0;e<s.length;e++){let n=parseInt(s[e].getAttribute(`first`),10),r=parseInt(s[e].getAttribute(`second`),10),i=parseInt(s[e].getAttribute(`amount`),10);t.chars[c[r]]&&(t.chars[c[r]].kerning[c[n]]=i)}return t}},Gc={test(e){return typeof e==`string`&&e.match(/<font(\s|>)/)?Wc.test(b.get().parseXML(e)):!1},parse(e){return Wc.parse(b.get().parseXML(e))}},Kc=[`.xml`,`.fnt`],qc={extension:{type:o.CacheParser,name:`cacheBitmapFont`},test:e=>!!e?.pages&&!!e?.chars&&typeof e?.fontFamily==`string`&&e.fontFamily!==``,getCacheableAssets(e,t){let n={};return e.forEach(e=>{n[e]=t,n[`${e}-bitmap`]=t}),n[`${t.fontFamily}-bitmap`]=t,n}},Jc={extension:{type:o.LoadParser,priority:ft.Normal},name:`loadBitmapFont`,id:`bitmap-font`,test(e){return Kc.includes(L.extname(e).toLowerCase())},async testParse(e){return Uc.test(e)||Gc.test(e)},async parse(e,n,r){let i=Uc.test(e)?Uc.parse(e):Gc.parse(e),{src:a}=n,{pages:o}=i,s=[],c=i.distanceField?{scaleMode:`linear`,alphaMode:`premultiply-alpha-on-upload`,autoGenerateMipmaps:!1,resolution:1}:{};for(let e=0;e<o.length;++e){let t=o[e].file,n=L.join(L.dirname(a),t);n=St(n,a),s.push({src:n,data:c})}let[l,{BitmapFont:u}]=await Promise.all([r.load(s),t(()=>Promise.resolve().then(()=>Vo),void 0,import.meta.url)]);return new u({data:i,textures:s.map(e=>l[e.src])},a)},async load(e,t){return await(await b.get().fetch(e)).text()},async unload(e,t,n){await Promise.all(e.pages.map(e=>n.unload(e.texture.source._sourceOrigin))),e.destroy()}},Yc=class{constructor(e,t=!1){this._loader=e,this._assetList=[],this._isLoading=!1,this._maxConcurrent=1,this.verbose=t}add(e){e.forEach(e=>{this._assetList.push(e)}),this.verbose&&console.log(`[BackgroundLoader] assets: `,this._assetList),this._isActive&&!this._isLoading&&this._next()}async _next(){if(this._assetList.length&&this._isActive){this._isLoading=!0;let e=[],t=Math.min(this._assetList.length,this._maxConcurrent);for(let n=0;n<t;n++)e.push(this._assetList.pop());await this._loader.load(e),this._isLoading=!1,this._next()}}get active(){return this._isActive}set active(e){this._isActive!==e&&(this._isActive=e,e&&!this._isLoading&&this._next())}},Xc={extension:{type:o.CacheParser,name:`cacheTextureArray`},test:e=>Array.isArray(e)&&e.every(e=>e instanceof h),getCacheableAssets:(e,t)=>{let n={};return e.forEach(e=>{t.forEach((t,r)=>{n[e+(r===0?``:r+1)]=t})}),n}};async function Zc(e){if(`Image`in globalThis)return new Promise(t=>{let n=new Image;n.onload=()=>{t(!0)},n.onerror=()=>{t(!1)},n.src=e});if(`createImageBitmap`in globalThis&&`fetch`in globalThis){try{let t=await(await fetch(e)).blob();await createImageBitmap(t)}catch{return!1}return!0}return!1}var Qc={extension:{type:o.DetectionParser,priority:1},test:async()=>Zc(`data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=`),add:async e=>[...e,`avif`],remove:async e=>e.filter(e=>e!==`avif`)},$c=[`png`,`jpg`,`jpeg`],el={extension:{type:o.DetectionParser,priority:-1},test:()=>Promise.resolve(!0),add:async e=>[...e,...$c],remove:async e=>e.filter(e=>!$c.includes(e))},tl=`WorkerGlobalScope`in globalThis&&globalThis instanceof globalThis.WorkerGlobalScope;function nl(e){return!tl&&document.createElement(`video`).canPlayType(e)!==``}var rl={extension:{type:o.DetectionParser,priority:0},test:async()=>nl(`video/mp4`),add:async e=>[...e,`mp4`,`m4v`],remove:async e=>e.filter(e=>e!==`mp4`&&e!==`m4v`)},il={extension:{type:o.DetectionParser,priority:0},test:async()=>nl(`video/ogg`),add:async e=>[...e,`ogv`],remove:async e=>e.filter(e=>e!==`ogv`)},al={extension:{type:o.DetectionParser,priority:0},test:async()=>nl(`video/webm`),add:async e=>[...e,`webm`],remove:async e=>e.filter(e=>e!==`webm`)},ol={extension:{type:o.DetectionParser,priority:0},test:async()=>Zc(`data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=`),add:async e=>[...e,`webp`],remove:async e=>e.filter(e=>e!==`webp`)},sl=class e{constructor(){this.loadOptions={...e.defaultOptions},this._parsers=[],this._parsersValidated=!1,this.parsers=new Proxy(this._parsers,{set:(e,t,n)=>(this._parsersValidated=!1,e[t]=n,!0)}),this.promiseCache={}}reset(){this._parsersValidated=!1,this.promiseCache={}}_getLoadPromiseAndParser(e,t){let n={promise:null,parser:null};return n.promise=(async()=>{let r=null,i=null;if((t.parser||t.loadParser)&&(i=this._parserHash[t.parser||t.loadParser],t.loadParser&&c(`[Assets] "loadParser" is deprecated, use "parser" instead for ${e}`),i||c(`[Assets] specified load parser "${t.parser||t.loadParser}" not found while loading ${e}`)),!i){for(let n=0;n<this.parsers.length;n++){let r=this.parsers[n];if(r.load&&r.test?.(e,t,this)){i=r;break}}if(!i)return c(`[Assets] ${e} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`),null}r=await i.load(e,t,this),n.parser=i;for(let e=0;e<this.parsers.length;e++){let i=this.parsers[e];i.parse&&i.parse&&await i.testParse?.(r,t,this)&&(r=await i.parse(r,t,this)||r,n.parser=i)}return r})(),n}async load(t,n){this._parsersValidated||this._validateParsers();let{onProgress:r,onError:i,strategy:a,retryCount:o,retryDelay:s}=typeof n==`function`?{...e.defaultOptions,...this.loadOptions,onProgress:n}:{...e.defaultOptions,...this.loadOptions,...n||{}},c=0,l={},u=yt(t),d=k(t,e=>({alias:[e],src:e,data:{}})),f=d.reduce((e,t)=>e+(t.progressSize||1),0),p=d.map(async e=>{let t=L.toAbsolute(e.src);l[e.src]||(await this._loadAssetWithRetry(t,e,{onProgress:r,onError:i,strategy:a,retryCount:o,retryDelay:s},l),c+=e.progressSize||1,r&&r(c/f))});return await Promise.all(p),u?l[d[0].src]:l}async unload(e){let t=k(e,e=>({alias:[e],src:e})).map(async e=>{let t=L.toAbsolute(e.src),n=this.promiseCache[t];if(n){let r=await n.promise;delete this.promiseCache[t],await n.parser?.unload?.(r,e,this)}});await Promise.all(t)}_validateParsers(){this._parsersValidated=!0,this._parserHash=this._parsers.filter(e=>e.name||e.id).reduce((e,t)=>(!t.name&&!t.id?c(`[Assets] parser should have an id`):(e[t.name]||e[t.id])&&c(`[Assets] parser id conflict "${t.id}"`),e[t.name]=t,t.id&&(e[t.id]=t),e),{})}async _loadAssetWithRetry(e,t,n,r){let i=0,{onError:a,strategy:o,retryCount:s,retryDelay:c}=n,l=e=>new Promise(t=>setTimeout(t,e));for(;;)try{this.promiseCache[e]||(this.promiseCache[e]=this._getLoadPromiseAndParser(e,t)),r[t.src]=await this.promiseCache[e].promise;return}catch(n){if(delete this.promiseCache[e],delete r[t.src],i++,o===`retry`&&!(o!==`retry`||i>s)){a&&a(n,t),await l(c);continue}if(o===`skip`){a&&a(n,t);return}a&&a(n,t);let u=Error(`[Loader.load] Failed to load ${e}.
${n}`);throw n instanceof Error&&n.stack&&(u.stack=n.stack),u}}};sl.defaultOptions={onProgress:void 0,onError:void 0,strategy:`throw`,retryCount:3,retryDelay:250};var cl=sl;function ll(e,t){if(Array.isArray(t)){for(let n of t)if(e.startsWith(`data:${n}`))return!0;return!1}return e.startsWith(`data:${t}`)}function ul(e,t){let n=e.split(`?`)[0],r=L.extname(n).toLowerCase();return Array.isArray(t)?t.includes(r):r===t}var dl=`.json`,fl=`application/json`,pl={extension:{type:o.LoadParser,priority:ft.Low},name:`loadJson`,id:`json`,test(e){return ll(e,fl)||ul(e,dl)},async load(e){return await(await b.get().fetch(e)).json()}},ml=`.txt`,hl=`text/plain`,gl={name:`loadTxt`,id:`text`,extension:{type:o.LoadParser,priority:ft.Low,name:`loadTxt`},test(e){return ll(e,hl)||ul(e,ml)},async load(e){return await(await b.get().fetch(e)).text()}},_l=[`normal`,`bold`,`100`,`200`,`300`,`400`,`500`,`600`,`700`,`800`,`900`],vl=[`.ttf`,`.otf`,`.woff`,`.woff2`],yl=[`font/ttf`,`font/otf`,`font/woff`,`font/woff2`],bl=/^(--|-?[A-Z_])[0-9A-Z_-]*$/i;function xl(e){let t=L.extname(e),n=L.basename(e,t).replace(/(-|_)/g,` `).toLowerCase().split(` `).map(e=>e.charAt(0).toUpperCase()+e.slice(1)),r=n.length>0;for(let e of n)if(!e.match(bl)){r=!1;break}let i=n.join(` `);return r||(i=`"${i.replace(/[\\"]/g,`\\$&`)}"`),i}var Sl=/^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;function Cl(e){return Sl.test(e)?e:encodeURI(e)}var wl={extension:{type:o.LoadParser,priority:ft.Low},name:`loadWebFont`,id:`web-font`,test(e){return ll(e,yl)||ul(e,vl)},async load(e,t){let n=b.get().getFontFaceSet();if(n){let r=[],i=t.data?.family??xl(e),a=t.data?.weights?.filter(e=>_l.includes(e))??[`normal`],o=t.data??{};for(let t=0;t<a.length;t++){let s=a[t],c=new FontFace(i,`url('${Cl(e)}')`,{...o,weight:s});await c.load(),n.add(c),r.push(c)}return A.has(`${i}-and-url`)?A.get(`${i}-and-url`).entries.push({url:e,faces:r}):A.set(`${i}-and-url`,{entries:[{url:e,faces:r}]}),r.length===1?r[0]:r}return c(`[loadWebFont] FontFace API is not supported. Skipping loading font`),null},unload(e){let t=Array.isArray(e)?e:[e],n=t[0].family,r=A.get(`${n}-and-url`),i=r.entries.find(e=>e.faces.some(e=>t.indexOf(e)!==-1));i.faces=i.faces.filter(e=>t.indexOf(e)===-1),i.faces.length===0&&(r.entries=r.entries.filter(e=>e!==i)),t.forEach(e=>{b.get().getFontFaceSet().delete(e)}),r.entries.length===0&&A.remove(`${n}-and-url`)}};function Tl(e,t=1){let n=bt.RETINA_PREFIX?.exec(e);return n?parseFloat(n[1]):t}function El(e,t,n){e.label=n,e._sourceOrigin=n;let r=new h({source:e,label:n}),i=()=>{delete t.promiseCache[n],A.has(n)&&A.remove(n)};return r.source.once(`destroy`,()=>{t.promiseCache[n]&&(c(`[Assets] A TextureSource managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the TextureSource.`),i())}),r.once(`destroy`,()=>{e.destroyed||(c(`[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture.`),i())}),r}var Dl=`.svg`,Ol=`image/svg+xml`,kl={extension:{type:o.LoadParser,priority:ft.Low,name:`loadSVG`},name:`loadSVG`,id:`svg`,config:{crossOrigin:`anonymous`,parseAsGraphicsContext:!1},test(e){return ll(e,Ol)||ul(e,Dl)},async load(e,t,n){return t.data?.parseAsGraphicsContext??this.config.parseAsGraphicsContext?jl(e):Al(e,t,n,this.config.crossOrigin)},unload(e){e.destroy(!0)}};async function Al(e,t,n,r){let i=await b.get().fetch(e),a=b.get().createImage();a.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(await i.text())}`,a.crossOrigin=r,await a.decode();let o=t.data?.width??a.width,s=t.data?.height??a.height,c=t.data?.resolution||Tl(e),l=Math.ceil(o*c),u=Math.ceil(s*c),d=b.get().createCanvas(l,u),f=d.getContext(`2d`);f.imageSmoothingEnabled=!0,f.imageSmoothingQuality=`high`,f.drawImage(a,0,0,o*c,s*c);let{parseAsGraphicsContext:p,...m}=t.data??{};return El(new j({resource:d,alphaMode:`premultiply-alpha-on-upload`,resolution:c,...m}),n,e)}async function jl(e){let t=await(await b.get().fetch(e)).text(),n=new N;return n.svg(t),n}var Ml=`(function () {
    'use strict';

    const WHITE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    async function checkImageBitmap() {
      try {
        if (typeof createImageBitmap !== "function") return false;
        const response = await fetch(WHITE_PNG);
        const imageBlob = await response.blob();
        const imageBitmap = await createImageBitmap(imageBlob);
        return imageBitmap.width === 1 && imageBitmap.height === 1;
      } catch (_e) {
        return false;
      }
    }
    void checkImageBitmap().then((result) => {
      self.postMessage(result);
    });

})();
`,Nl=null,Pl=class{constructor(){Nl||(Nl=URL.createObjectURL(new Blob([Ml],{type:`application/javascript`}))),this.worker=new Worker(Nl)}};Pl.revokeObjectURL=function(){Nl&&(URL.revokeObjectURL(Nl),Nl=null)};var Fl=`(function () {
    'use strict';

    async function loadImageBitmap(url, alphaMode) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(\`[WorkerManager.loadImageBitmap] Failed to fetch \${url}: \${response.status} \${response.statusText}\`);
      }
      const imageBlob = await response.blob();
      return alphaMode === "premultiplied-alpha" ? createImageBitmap(imageBlob, { premultiplyAlpha: "none" }) : createImageBitmap(imageBlob);
    }
    self.onmessage = async (event) => {
      try {
        const imageBitmap = await loadImageBitmap(event.data.data[0], event.data.data[1]);
        self.postMessage({
          data: imageBitmap,
          uuid: event.data.uuid,
          id: event.data.id
        }, [imageBitmap]);
      } catch (e) {
        self.postMessage({
          error: e,
          uuid: event.data.uuid,
          id: event.data.id
        });
      }
    };

})();
`,Il=null,Ll=class{constructor(){Il||(Il=URL.createObjectURL(new Blob([Fl],{type:`application/javascript`}))),this.worker=new Worker(Il)}};Ll.revokeObjectURL=function(){Il&&(URL.revokeObjectURL(Il),Il=null)};var Rl=0,zl,Bl=new class{constructor(){this._initialized=!1,this._createdWorkers=0,this._workerPool=[],this._queue=[],this._resolveHash={}}isImageBitmapSupported(){return this._isImageBitmapSupported===void 0&&(this._isImageBitmapSupported=new Promise(e=>{let{worker:t}=new Pl;t.addEventListener(`message`,n=>{t.terminate(),Pl.revokeObjectURL(),e(n.data)})})),this._isImageBitmapSupported}loadImageBitmap(e,t){return this._run(`loadImageBitmap`,[e,t?.data?.alphaMode])}async _initWorkers(){this._initialized||(this._initialized=!0)}_getWorker(){zl===void 0&&(zl=navigator.hardwareConcurrency||4);let e=this._workerPool.pop();return!e&&this._createdWorkers<zl&&(this._createdWorkers++,e=new Ll().worker,e.addEventListener(`message`,e=>{this._complete(e.data),this._returnWorker(e.target),this._next()})),e}_returnWorker(e){this._workerPool.push(e)}_complete(e){this._resolveHash[e.uuid]&&(e.error===void 0?this._resolveHash[e.uuid].resolve(e.data):this._resolveHash[e.uuid].reject(e.error),delete this._resolveHash[e.uuid])}async _run(e,t){await this._initWorkers();let n=new Promise((n,r)=>{this._queue.push({id:e,arguments:t,resolve:n,reject:r})});return this._next(),n}_next(){if(!this._queue.length)return;let e=this._getWorker();if(!e)return;let t=this._queue.pop(),n=t.id;this._resolveHash[Rl]={resolve:t.resolve,reject:t.reject},e.postMessage({data:t.arguments,uuid:Rl++,id:n})}reset(){this._workerPool.forEach(e=>e.terminate()),this._workerPool.length=0,Object.values(this._resolveHash).forEach(({reject:e})=>{e?.(Error(`WorkerManager has been reset before completion`))}),this._resolveHash={},this._queue.length=0,this._initialized=!1,this._createdWorkers=0}},Vl=[`.jpeg`,`.jpg`,`.png`,`.webp`,`.avif`],Hl=[`image/jpeg`,`image/png`,`image/webp`,`image/avif`];async function Ul(e,t){let n=await b.get().fetch(e);if(!n.ok)throw Error(`[loadImageBitmap] Failed to fetch ${e}: ${n.status} ${n.statusText}`);let r=await n.blob();return t?.data?.alphaMode===`premultiplied-alpha`?createImageBitmap(r,{premultiplyAlpha:`none`}):createImageBitmap(r)}var Wl={name:`loadTextures`,id:`texture`,extension:{type:o.LoadParser,priority:ft.High,name:`loadTextures`},config:{preferWorkers:!0,preferCreateImageBitmap:!0,crossOrigin:`anonymous`},test(e){return ll(e,Hl)||ul(e,Vl)},async load(e,t,n){let r=null;return r=globalThis.createImageBitmap&&this.config.preferCreateImageBitmap?this.config.preferWorkers&&await Bl.isImageBitmapSupported()?await Bl.loadImageBitmap(e,t):await Ul(e,t):await new Promise((t,n)=>{r=b.get().createImage(),r.crossOrigin=this.config.crossOrigin,r.src=e,r.complete?t(r):(r.onload=()=>{t(r)},r.onerror=n)}),El(new j({resource:r,alphaMode:`premultiply-alpha-on-upload`,resolution:t.data?.resolution||Tl(e),...t.data}),n,e)},unload(e){e.destroy(!0)}},Gl=[`.mp4`,`.m4v`,`.webm`,`.ogg`,`.ogv`,`.h264`,`.avi`,`.mov`],Kl,ql;function Jl(e,t,n){n===void 0&&!t.startsWith(`data:`)?e.crossOrigin=Xl(t):n!==!1&&(e.crossOrigin=typeof n==`string`?n:`anonymous`)}function Yl(e){return new Promise((t,n)=>{e.addEventListener(`canplaythrough`,r),e.addEventListener(`error`,i),e.load();function r(){a(),t()}function i(e){a(),n(e)}function a(){e.removeEventListener(`canplaythrough`,r),e.removeEventListener(`error`,i)}})}function Xl(e,t=globalThis.location){if(e.startsWith(`data:`))return``;t||(t=globalThis.location);let n=new URL(e,document.baseURI);return n.hostname!==t.hostname||n.port!==t.port||n.protocol!==t.protocol?`anonymous`:``}function Zl(){let e=[],t=[];for(let n of Gl){let r=Rt.MIME_TYPES[n.substring(1)]||`video/${n.substring(1)}`;nl(r)&&(e.push(n),t.includes(r)||t.push(r))}return{validVideoExtensions:e,validVideoMime:t}}var Ql={name:`loadVideo`,id:`video`,extension:{type:o.LoadParser,name:`loadVideo`},test(e){if(!Kl||!ql){let{validVideoExtensions:e,validVideoMime:t}=Zl();Kl=e,ql=t}let t=ll(e,ql),n=ul(e,Kl);return t||n},async load(e,t,n){let r={...Rt.defaultOptions,resolution:t.data?.resolution||Tl(e),alphaMode:t.data?.alphaMode||await It(),...t.data},i=document.createElement(`video`),a={preload:r.autoLoad===!1?void 0:`auto`,"webkit-playsinline":r.playsinline===!1?void 0:``,playsinline:r.playsinline===!1?void 0:``,muted:r.muted===!0?``:void 0,loop:r.loop===!0?``:void 0,autoplay:r.autoPlay===!1?void 0:``};Object.keys(a).forEach(e=>{let t=a[e];t!==void 0&&i.setAttribute(e,t)}),r.muted===!0&&(i.muted=!0),Jl(i,e,r.crossorigin);let o=document.createElement(`source`),s;if(r.mime)s=r.mime;else if(e.startsWith(`data:`))s=e.slice(5,e.indexOf(`;`));else if(!e.startsWith(`blob:`)){let t=e.split(`?`)[0].slice(e.lastIndexOf(`.`)+1).toLowerCase();s=Rt.MIME_TYPES[t]||`video/${t}`}return o.src=e,s&&(o.type=s),new Promise((a,s)=>{r.preload&&!r.autoPlay&&i.load(),i.addEventListener(`canplay`,c),i.addEventListener(`error`,l),o.addEventListener(`error`,l),i.appendChild(o);async function c(){let o=new Rt({...r,resource:i});u(),t.data.preload&&await Yl(i),a(El(o,n,e))}function l(e){u(),s(e)}function u(){i.removeEventListener(`canplay`,c),i.removeEventListener(`error`,l),o.removeEventListener(`error`,l)}})},unload(e){e.destroy(!0)}},$l={extension:{type:o.ResolveParser,name:`resolveTexture`},test:Wl.test,parse:e=>({resolution:parseFloat(bt.RETINA_PREFIX.exec(e)?.[1]??`1`),format:e.split(`.`).pop(),src:e})},eu={extension:{type:o.ResolveParser,priority:-2,name:`resolveJson`},test:e=>bt.RETINA_PREFIX.test(e)&&e.endsWith(`.json`),parse:$l.parse},tu=new class{constructor(){this._detections=[],this._initialized=!1,this.resolver=new bt,this.loader=new cl,this.cache=A,this._backgroundLoader=new Yc(this.loader),this._backgroundLoader.active=!0,this.reset()}async init(e={}){if(this._initialized){c(`[Assets]AssetManager already initialized, did you load before calling this Assets.init()?`);return}if(this._initialized=!0,e.defaultSearchParams&&this.resolver.setDefaultSearchParams(e.defaultSearchParams),e.basePath&&(this.resolver.basePath=e.basePath),e.bundleIdentifier&&this.resolver.setBundleIdentifier(e.bundleIdentifier),e.manifest){let t=e.manifest;typeof t==`string`&&(t=await this.load(t)),this.resolver.addManifest(t)}let t=e.texturePreference?.resolution??1,n=typeof t==`number`?[t]:t,r=await this._detectFormats({preferredFormats:e.texturePreference?.format,skipDetections:e.skipDetections,detections:this._detections});this.resolver.prefer({params:{format:r,resolution:n}}),e.preferences&&this.setPreferences(e.preferences),e.loadOptions&&(this.loader.loadOptions={...this.loader.loadOptions,...e.loadOptions})}add(e){this.resolver.add(e)}async load(e,t){this._initialized||await this.init();let n=yt(e),r=k(e).map(e=>{if(typeof e!=`string`){let t=this.resolver.getAlias(e);return t.some(e=>!this.resolver.hasKey(e))&&this.add(e),Array.isArray(t)?t[0]:t}return this.resolver.hasKey(e)||this.add({alias:e,src:e}),e}),i=this.resolver.resolve(r),a=await this._mapLoadToResolve(i,t);return n?a[r[0]]:a}addBundle(e,t){this.resolver.addBundle(e,t)}async loadBundle(e,t){this._initialized||await this.init();let n=!1;typeof e==`string`&&(n=!0,e=[e]);let r=this.resolver.resolveBundle(e),i={},a=Object.keys(r),o=0,s=[],c=()=>{t?.(s.reduce((e,t)=>e+t,0)/o)},l=a.map((e,t)=>{let n=r[e],a=Object.values(n),l=[...new Set(a.flat())].reduce((e,t)=>e+(t.progressSize||1),0);return s.push(0),o+=l,this._mapLoadToResolve(n,e=>{s[t]=e*l,c()}).then(t=>{i[e]=t})});return await Promise.all(l),n?i[e[0]]:i}async backgroundLoad(e){this._initialized||await this.init(),typeof e==`string`&&(e=[e]);let t=this.resolver.resolve(e);this._backgroundLoader.add(Object.values(t))}async backgroundLoadBundle(e){this._initialized||await this.init(),typeof e==`string`&&(e=[e]);let t=this.resolver.resolveBundle(e);Object.values(t).forEach(e=>{this._backgroundLoader.add(Object.values(e))})}reset(){this.resolver.reset(),this.loader.reset(),this.cache.reset(),this._initialized=!1}get(e){if(typeof e==`string`)return A.get(e);let t={};for(let n=0;n<e.length;n++)t[n]=A.get(e[n]);return t}async _mapLoadToResolve(e,t){let n=[...new Set(Object.values(e))];this._backgroundLoader.active=!1;let r=await this.loader.load(n,t);this._backgroundLoader.active=!0;let i={};return n.forEach(e=>{let t=r[e.src],n=[e.src];e.alias&&n.push(...e.alias),n.forEach(e=>{i[e]=t}),A.set(n,t)}),i}async unload(e){this._initialized||await this.init();let t=k(e).map(e=>typeof e==`string`?e:e.src),n=this.resolver.resolve(t);await this._unloadFromResolved(n)}async unloadBundle(e){this._initialized||await this.init(),e=k(e);let t=this.resolver.resolveBundle(e),n=Object.keys(t).map(e=>this._unloadFromResolved(t[e]));await Promise.all(n)}async _unloadFromResolved(e){let t=Object.values(e);t.forEach(e=>{A.remove(e.src)}),await this.loader.unload(t)}async _detectFormats(e){let t=[];e.preferredFormats&&(t=Array.isArray(e.preferredFormats)?e.preferredFormats:[e.preferredFormats]);for(let n of e.detections)e.skipDetections||await n.test()?t=await n.add(t):e.skipDetections||(t=await n.remove(t));return t=t.filter((e,n)=>t.indexOf(e)===n),t}get detections(){return this._detections}setPreferences(e){this.loader.parsers.forEach(t=>{t.config&&Object.keys(t.config).filter(t=>t in e).forEach(n=>{t.config[n]=e[n]})})}};s.handleByList(o.LoadParser,tu.loader.parsers).handleByList(o.ResolveParser,tu.resolver.parsers).handleByList(o.CacheParser,tu.cache.parsers).handleByList(o.DetectionParser,tu.detections),s.add(Xc,el,Qc,ol,rl,il,al,pl,gl,wl,kl,Wl,Ql,Jc,qc,$l,eu);var nu={loader:o.LoadParser,resolver:o.ResolveParser,cache:o.CacheParser,detection:o.DetectionParser};s.handle(o.Asset,e=>{let t=e.ref;Object.entries(nu).filter(([e])=>!!t[e]).forEach(([e,n])=>s.add(Object.assign(t[e],{extension:t[e].extension??n})))},e=>{let t=e.ref;Object.keys(nu).filter(e=>!!t[e]).forEach(e=>s.remove(t[e]))}),s.add(Vc,Hc);var ru=[];async function iu(e,t=!1){let n=await tu.load(e);return t&&(n.source.addressMode=`repeat`),ru.push(n),n}function au(){return ru.splice(0)}function ou(){return ru.length>0}function su(e){ru.unshift(...e)}export{_i as A,Ks as C,Oo as D,Po as E,mn as M,wo as O,Gs as S,Bo as T,ec as _,tu as a,Vs as b,Bc as c,Rc as d,ac as f,$s as g,Zs as h,au as i,Dn as j,Ba as k,cc as l,Xs as m,ou as n,Q as o,Js as p,iu as r,$ as s,su as t,zc as u,Hs as v,Rs as w,Us as x,Bs as y};