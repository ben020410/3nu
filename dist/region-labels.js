/* Representative college locations, never invented administrative boundaries. */
function drawRegionLabels(ctx,regions,project,wide,size){
 const used=[];ctx.save();ctx.font=(wide?'9':'10')+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
 for(const r of [...regions].sort((a,b)=>a.priority-b.priority)){if(!wide&&r.priority>1)continue;const [x,y]=project(r.center),w=ctx.measureText(r.short).width+8,h=15;if(x<w/2+2||x>size-w/2-2||y<12||y>size-12)continue;const box=[x-w/2,y-h/2,x+w/2,y+h/2];if(used.some(a=>box[0]<a[2]+3&&box[2]>a[0]-3&&box[1]<a[3]+2&&box[3]>a[1]-2))continue;used.push(box);ctx.fillStyle='rgba(249,247,233,.92)';ctx.fillRect(box[0],box[1],w,h);ctx.fillStyle='#284f40';ctx.fillText(r.short,x,y);}
 ctx.restore();
}
