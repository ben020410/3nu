'use strict';
const DAY=86400000,KST=32400000;
const proposal=Object.freeze({enabled:false,rawDays:30,aggregateDays:365,feedbackResolvedDays:90});
function policyOf(p={}){const value={...proposal,...p};for(const k of ['rawDays','aggregateDays','feedbackResolvedDays'])if(!Number.isInteger(value[k])||value[k]<1||value[k]>3650)throw Error('Invalid retention days');if(value.rawDays<7||value.aggregateDays<value.rawDays)throw Error('Keep at least 7 raw days, aggregate window >= raw window');if(typeof value.enabled!=='boolean')throw Error('Invalid retention enabled');return value}
function retention112(db,now=()=>Date.now()){
 const all=(s,...a)=>db.prepare(s).all(...a),one=(s,...a)=>db.prepare(s).get(...a),run=(s,...a)=>db.prepare(s).run(...a),day=t=>Math.floor((t+KST)/DAY)*DAY-KST;
 function preview(input){const policy=policyOf(input),t=now(),cutoff=day(t)-policy.rawDays*DAY;
  // Only complete, inactive KST days are eligible; one transaction archives and removes them.
  const days=all(`SELECT CAST((x.start+${KST})/${DAY} AS INTEGER)*${DAY}-${KST} day,x.environment,count(*) rows,
  sum(CASE WHEN x.excluded=0 THEN 1 ELSE 0 END) visits,
  count(DISTINCT CASE WHEN x.excluded=0 THEN x.visitor END) unique_visitors,
  count(DISTINCT CASE WHEN x.excluded=0 AND x.returning_visit=1 THEN x.visitor END) returning_visitors,
  sum(CASE WHEN x.excluded=0 THEN x.explored ELSE 0 END) explorations,
  sum(CASE WHEN x.excluded=0 AND x.explored=1 THEN x.active_ms + CASE WHEN v.session=x.id THEN max(0,min(${t},coalesce((SELECT max(last)+25000 FROM tabs WHERE visitor=v.id AND playing=1 AND visible=1),v.accounted))-v.accounted) ELSE 0 END ELSE 0 END) active_ms
  FROM visits x JOIN visitors v ON v.id=x.visitor WHERE x.start<? GROUP BY day,x.environment
  HAVING sum(CASE WHEN v.session=x.id AND v.last>? THEN 1 ELSE 0 END)=0`,cutoff,t-1800000);
  return{policy,asOf:t,cutoff,days,rawVisits:days.reduce((n,d)=>n+d.rows,0),aggregateRows:one('SELECT count(*) n FROM analytics_daily112 WHERE day<?',day(t)-policy.aggregateDays*DAY).n,resolvedFeedback:one("SELECT count(*) n FROM feedback112 WHERE status IN ('resolved','deleted') AND updated<?",t-policy.feedbackResolvedDays*DAY).n};
 }
 function apply(input,{approved=false}={}){const p=policyOf(input);if(!approved||!p.enabled)throw Error('Retention requires an approved, enabled policy; preview is the default');db.exec('BEGIN IMMEDIATE');try{const plan=preview(p);for(const d of plan.days){run('INSERT INTO analytics_daily112 VALUES(?,?,?,?,?,?,?)',d.day,d.environment,d.visits,d.unique_visitors,d.returning_visitors,d.explorations,d.active_ms);run('UPDATE visitors SET session=NULL WHERE session IN (SELECT id FROM visits WHERE start>=? AND start<? AND environment=?)',d.day,d.day+DAY,d.environment);run('DELETE FROM visits WHERE start>=? AND start<? AND environment=?',d.day,d.day+DAY,d.environment)}run('DELETE FROM tabs WHERE last<?',plan.cutoff);run('DELETE FROM visitors WHERE last<? AND NOT EXISTS(SELECT 1 FROM visits WHERE visitor=visitors.id)',plan.cutoff);run('DELETE FROM analytics_daily112 WHERE day<?',day(plan.asOf)-p.aggregateDays*DAY);run("DELETE FROM feedback112 WHERE status IN ('resolved','deleted') AND updated<?",plan.asOf-p.feedbackResolvedDays*DAY);db.exec('COMMIT');return{...plan,applied:true}}catch(e){db.exec('ROLLBACK');throw e}}
 return{preview,apply};
}
module.exports={retention112,proposal,policyOf};
