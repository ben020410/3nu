/* Game-only selection protection. Text fields/editor content keep native editing.
 * A cancellation clears every held input; ordinary pointerup releases only its control. */
function createInputSafety124(hooks){
 const game='#nu-next,#world,#mobile108,#gameTools124,#navigationHud,#joystick,#playerName,#buildingLabels,#interact97,#interaction103,#shuttleHint100,#guestPrompt107,#guide124',editable='input,textarea,select,[contenteditable]:not([contenteditable="false"]),[data-native-selection]';
 const pointers=new Map(),off=[];let clearing=false,clears=0,lastReason='';
 const element=t=>t?.nodeType===1?t:t?.parentElement,isGame=t=>{const el=element(t);return !!(hooks.active()&&el?.closest(game)&&!el.closest(editable))};
 function clear(reason){if(clearing)return;clearing=true;lastReason=reason;clears++;const old=[...pointers];pointers.clear();hooks.clear();for(const [id,el]of old)try{if(el.hasPointerCapture(id))el.releasePointerCapture(id)}catch{}clearing=false;}
 function on(target,type,fn,options=true){target.addEventListener(type,fn,options);off.push(()=>target.removeEventListener(type,fn,options))}
 on(document,'pointerdown',e=>{if(!isGame(e.target))return;const el=element(e.target),role=el.closest('.m108Stick,[data-up],[data-down],#world')||el;if(e.pointerType==='touch'&&([...pointers.values()].includes(role)||pointers.size>=3))clear('multitouch-reset');pointers.set(e.pointerId,role)});
 on(document,'pointerup',e=>pointers.delete(e.pointerId));
 on(document,'pointercancel',e=>{if(pointers.has(e.pointerId)||isGame(e.target))clear('pointercancel')});
 on(document,'lostpointercapture',e=>{if(pointers.has(e.pointerId))clear('lostpointercapture')});
 for(const type of ['contextmenu','selectstart','dragstart'])on(document,type,e=>{if(isGame(e.target)){if(e.cancelable)e.preventDefault();clear(type)}});
 on(document,'selectionchange',()=>{const s=getSelection();if(s&&!s.isCollapsed&&isGame(s.anchorNode)){s.removeAllRanges();clear('selectionchange')}});
 for(const type of ['blur','pagehide','orientationchange','resize'])on(window,type,()=>clear(type));
 on(document,'visibilitychange',()=>clear('visibilitychange'));on(document,'focusin',e=>{if(element(e.target)?.closest(editable))clear('editing')});
 const observer=new MutationObserver(records=>{for(const {target,attributeName}of records){if(target.matches?.('dialog[open]')||target.matches?.('#explorer:not([hidden]),#selection95:not([hidden]),#information95:not([hidden]),#guide124:not([hidden])')||target===document.body&&attributeName==='class'&&document.body.classList.contains('capturing97')){clear('overlay');break}}});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','hidden','class']});
 return{forget(){pointers.clear()},clear,audit:()=>({pointers:pointers.size,clears,lastReason}),dispose(){clear('dispose');observer.disconnect();off.forEach(f=>f())}};
}
