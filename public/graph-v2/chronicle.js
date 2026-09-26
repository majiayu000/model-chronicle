(function(){
const V={anthropic:{label:"Anthropic",color:"#D97757"},openai:{label:"OpenAI",color:"#10A37F"},google:{label:"Google",color:"#4285F4"},meta:{label:"Meta",color:"#8B5CF6"},deepseek:{label:"DeepSeek",color:"#4D6BFE"},qwen:{label:"Qwen",color:"#E8A33D"},moonshot:{label:"Kimi",color:"#5AA8F2"},zhipu:{label:"Z.ai",color:"#35C7B2"},minimax:{label:"MiniMax",color:"#F47BA8"},bytedance:{label:"Seed",color:"#F08B4B"},baidu:{label:"ERNIE",color:"#5F91FF"},tencent:{label:"Hunyuan",color:"#48C2D5"},xai:{label:"xAI",color:"#D7D8DC"},mistral:{label:"Mistral",color:"#F7A13C"},cohere:{label:"Cohere",color:"#B995D8"},amazon:{label:"Amazon",color:"#FFB34E"},microsoft:{label:"Microsoft",color:"#7AB8F5"},ibm:{label:"IBM",color:"#9B8BFA"},nvidia:{label:"NVIDIA",color:"#76B900"}};
const VENDORS=["anthropic","openai","google","meta","deepseek","qwen","moonshot","zhipu","minimax","bytedance","baidu","tencent","xai","mistral","cohere","amazon","microsoft","ibm","nvidia"],TIERS=["flagship","mid","small"];
const TIER_LABEL={flagship:"旗舰",mid:"中档",small:"小型"};
const BENCH=["SWE-bench Verified","GPQA Diamond","MMLU","MMLU-Pro","AIME 2024","AIME 2025","MMMU","HumanEval"];
// Only schema-validated YAML records are shown and used in analysis.
const verified = window.__CHRONICLE_MODELS__ || [];
const all = verified.map(m => ({...m, arch: m.arch || null, reasoning: !!m.reasoning, sample: false}));
const rel=m=>m.dates.ga||m.dates.announced;
const toTime=d=>Date.parse(d.length===10?d:d+"-15");
all.forEach(m=>{m.date=rel(m);m.t=toTime(m.date);m.year=+m.date.slice(0,4);m.month=m.date.slice(0,7);m.vendorLabel=V[m.vendor].label;m.color=V[m.vendor].color;m.tierLabel=TIER_LABEL[m.tier];});
all.sort((a,b)=>a.t-b.t);
const lk=m=>m.vendor+"/"+m.family+"/"+m.tier;

const byId=Object.fromEntries(all.map(m=>[m.id,m]));
const fmtTokens=n=>n==null?"未公开":n>=1e6?(Math.round(n/1e5)/10)+"M":Math.round(n/1000)+"K";
const fmtParams=n=>n==null?"未公开":n>=1000?(n/1000)+"T":n+"B";
const gapDays=(a,b)=>Math.round((toTime(b)-toTime(a))/864e5);
const fmtGap=(a,b)=>{if(a.length===10&&b.length===10)return gapDays(a,b)+" 天";const[fy,fm]=a.split("-").map(Number),[ty,tm]=b.split("-").map(Number);return "约 "+((ty-fy)*12+tm-fm)+" 个月";};
const bench=(m,n)=>{const x=m.benchmarks.find(b=>b.name===n);return x?x.score:null;};
const benchRecord=(m,n)=>m.benchmarks.find(b=>b.name===n)||null;
const comparable=(models,n)=>{const groups=new Map();models.forEach(m=>{const b=benchRecord(m,n);if(!b?.comparison_group||!b.evaluation)return;const group=groups.get(b.comparison_group)||[];group.push(m);groups.set(b.comparison_group,group);});const largest=[...groups].sort((a,b)=>b[1].length-a[1].length)[0];return largest&&largest[1].length>=2?{name:largest[0],models:largest[1]}:{name:null,models:[]};};
const CAPS={reasoning:"推理",code:"代码",vision:"多模态",long:"长上下文",open:"开源权重"};
all.forEach(m=>{const c=[];if(m.reasoning)c.push("reasoning");const swe=bench(m,"SWE-bench Verified"),he=bench(m,"HumanEval");if((swe!=null&&swe>=50)||(he!=null&&he>=85)||m.family.includes("coder"))c.push("code");if(m.specs.modalities_in.some(x=>x!=="text"&&x!=="pdf"))c.push("vision");if((m.specs.context_window||0)>=200000)c.push("long");m.caps=c;m.capLabels=c.map(k=>CAPS[k]);
 const a=m.arch;m.archType=a?a.type:null;m.archLabel=!a?"未公开":a.type==="moe"?"MoE":"Dense";
 m.paramsLabel=a&&a.type==="moe"?fmtParams(a.total)+" · 激活 "+fmtParams(a.active):fmtParams(m.specs.params_b);
 m.ctxLabel=fmtTokens(m.specs.context_window);});
all.forEach(m=>{m.prev=m.predecessor?byId[m.predecessor]||null:null;m.next=all.find(x=>x.predecessor===m.id)||null;});
function lines(models){const map=new Map();models.forEach(m=>{let root=m, seen=new Set();while(root.prev&&!seen.has(root.id)){seen.add(root.id);root=root.prev;}const k=lk(m)+"/"+root.id;if(!map.has(k))map.set(k,{key:k,vendor:m.vendor,family:m.family,tier:m.tier,models:[]});map.get(k).models.push(m);});
 return [...map.values()].sort((a,b)=>VENDORS.indexOf(a.vendor)-VENDORS.indexOf(b.vendor)||a.family.localeCompare(b.family)||TIERS.indexOf(a.tier)-TIERS.indexOf(b.tier));}
// 架构方块图数据
function archDiagram(m){const a=m.arch;if(!a)return null;const moe=a.type==="moe";const n=moe&&a.experts?Math.min(a.experts,64):0;
 const experts=Array.from({length:n},(_,i)=>({i,active:i<a.topk}));
 const attnLabel=a.attn==="MLA"?"多头潜在注意力 MLA":a.attn==="GQA"?"分组查询注意力 GQA":a.attn==="MHA"?"多头注意力 MHA":"注意力结构未公开";
 const attnDetail=a.attn==="GQA"&&a.heads?a.heads+" Q 头 / "+a.kv+" KV 头":a.heads?a.heads+" 头":"";
 return {moe,experts,moreExperts:moe&&a.experts>64?"+"+(a.experts-64):"",expertsLabel:moe&&a.experts?a.experts+" 路由专家"+(a.topk?" · 每 token 激活 "+a.topk:"")+(a.shared?" · "+a.shared+" 共享专家":""):moe?"专家数未公开":"",
  layersLabel:a.layers?"× "+a.layers+" 层":"× ? 层",attnLabel,attnDetail,ffnLabel:moe?"MoE 前馈层":"SwiGLU 前馈层",ffnDetail:moe?"":"d_model "+(a.d||"?"),
  vision:a.vision||null,visionLabel:a.vision==="early"?"早期融合：图像 token 与文本共用主干":a.vision==="adapter"?"视觉编码器 + 交叉注意力适配器":"",
  vocabLabel:a.vocab?"词表 "+Math.round(a.vocab/1000)+"K":"",interleave:!!a.interleave,mtp:!!a.mtp,
  rows:[["结构",moe?"稀疏 MoE":"稠密 Dense"],["总参数",fmtParams(a.total)],["激活参数",moe?fmtParams(a.active):fmtParams(a.total)],["层数",a.layers||"未公开"],["隐藏维度",a.d||"未公开"],["注意力",attnLabel+(attnDetail?"（"+attnDetail+"）":"")],["专家",moe&&a.experts?a.experts+(a.topk?" 选 "+a.topk:"")+(a.shared?" + "+a.shared+" 共享":""):"—"],["训练数据",a.tokens?a.tokens+"T token":"未公开"],["词表",a.vocab?a.vocab.toLocaleString():"未公开"]].map(([k,v])=>({k,v:String(v)}))};}
const now=new Date(),today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,"0"),String(now.getDate()).padStart(2,"0")].join("-");
window.MC=Object.assign(window.MC||{},{V,VENDORS,TIERS,TIER_LABEL,BENCH,CAPS,models:all,byId,lines,fmtTokens,fmtParams,fmtGap,toTime,bench,benchRecord,comparable,archDiagram,today});
})();
