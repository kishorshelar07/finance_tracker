import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Archive, ArchiveRestore, Pencil, Trash2, PauseCircle, PlayCircle, Download } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAccounts, useBudgets, useGoals, useRecurring, useCategories } from '../hooks/index';
import { formatAmount, formatDate, getDaysLeft } from '../utils/helpers';
import { EmptyState, Skeleton, ProgressBar, RingProgress, ConfirmModal, Badge } from '../components/ui/index';
import { AccountForm, TransferForm, BudgetForm, GoalForm, RecurringForm, ContributionForm } from '../components/forms/index';
import { goalsApi, reportsApi } from '../api/index';

export function Accounts() {
  const { accounts, totalBalance, loading, create, update, remove, archive, transfer } = useAccounts();
  const [showForm, setShowForm] = useState(false);
  const [showTransfer, setTransfer] = useState(false);
  const [editAcc, setEditAcc] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const typeLabel = { bank:'Bank', cash:'Cash', credit_card:'Credit Card', wallet:'Wallet', investment:'Investment' };
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:24}}>
        <div>
          <div style={{fontSize:12,color:'var(--text-3)',fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Total Net Worth</div>
          <div style={{fontFamily:'var(--font-mono)',fontSize:30,fontWeight:700}}>{formatAmount(totalBalance)}</div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn-fv btn-outline" onClick={()=>setTransfer(true)}>↔️ Transfer</button>
          <button className="btn-fv btn-primary" onClick={()=>{setEditAcc(null);setShowForm(true);}}><Plus size={16}/> Add Account</button>
        </div>
      </div>
      {loading ? (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
          {[1,2,3,4].map(i=><Skeleton key={i} height={160} borderRadius={12}/>)}
        </div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:16}}>
          {accounts.map(acc=>(
            <motion.div key={acc._id} className="fv-card" style={{padding:20,opacity:acc.isActive?1:0.65,position:'relative',overflow:'hidden'}} whileHover={{y:-2}}>
              <div style={{position:'absolute',top:0,left:0,right:0,height:4,background:acc.color}}/>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,marginTop:6}}>
                <span style={{fontSize:11,fontWeight:700,color:'var(--text-2)',textTransform:'uppercase'}}>{acc.icon} {typeLabel[acc.type]}</span>
                {!acc.isActive&&<Badge type="warning">Archived</Badge>}
              </div>
              <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{acc.name}</div>
              <div style={{fontFamily:'var(--font-mono)',fontSize:26,fontWeight:700,color:acc.balance<0?'var(--danger)':'var(--text)',marginBottom:16}}>{formatAmount(acc.balance)}</div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn-fv btn-outline btn-sm" onClick={()=>{setEditAcc(acc);setShowForm(true);}}><Pencil size={13}/></button>
                <button className="btn-fv btn-outline btn-sm" onClick={()=>archive(acc._id)}>{acc.isActive?<Archive size={13}/>:<ArchiveRestore size={13}/>}</button>
                <button className="btn-fv btn-outline btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleteId(acc._id)}><Trash2 size={13}/></button>
              </div>
            </motion.div>
          ))}
          <div className="fv-card" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:160,border:'2px dashed var(--border)',boxShadow:'none',cursor:'pointer',color:'var(--text-3)',gap:8}} onClick={()=>{setEditAcc(null);setShowForm(true);}}>
            <Plus size={32}/><span style={{fontSize:14,fontWeight:600}}>Add Account</span>
          </div>
        </div>
      )}
      <AccountForm open={showForm} onClose={()=>setShowForm(false)} editAccount={editAcc} onSaved={async(d)=>{editAcc?await update(editAcc._id,d):await create(d);}}/>
      <TransferForm open={showTransfer} onClose={()=>setTransfer(false)} accounts={accounts} onSaved={transfer}/>
      <ConfirmModal open={!!deleteId} onClose={()=>setDeleteId(null)} danger title="Delete Account" confirmLabel="Delete" message="Cannot delete an account with transactions. Archive it instead." onConfirm={async()=>{try{await remove(deleteId);}catch(e){toast.error(e.response?.data?.message);}setDeleteId(null);}}/>
    </div>
  );
}

export function BudgetProgressSection({ mini=false }) {
  const { budgets, loading } = useBudgets();
  if(loading) return <>{[1,2,3].map(i=><Skeleton key={i} height={42} borderRadius={6} className="mb-3"/>)}</>;
  if(!budgets.length) return <div style={{fontSize:13,color:'var(--text-3)',padding:'16px 0',textAlign:'center'}}>No budgets set</div>;
  return (
    <div style={{marginTop:4}}>
      {(mini?budgets.slice(0,4):budgets).map(b=>{
        const pct=b.percentUsed||0;
        const color=pct<50?'var(--success)':pct<80?'var(--warning)':'var(--danger)';
        return (
          <div key={b._id} style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
              <span style={{fontSize:13,fontWeight:600}}>{b.categoryId?.icon} {b.categoryId?.name}</span>
              <span style={{fontSize:12,color:'var(--text-2)'}}>{formatAmount(b.spentAmount)} / {formatAmount(b.amountLimit)}</span>
            </div>
            <ProgressBar value={b.spentAmount} max={b.amountLimit}/>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:3,fontSize:11}}>
              <span style={{fontWeight:700,color}}>{pct.toFixed(0)}% used</span>
              {pct>100&&<Badge type="danger">Over Budget!</Badge>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Budgets() {
  const { budgets, loading, create, update, remove } = useBudgets();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const today = new Date();
  const daysLeft = new Date(today.getFullYear(),today.getMonth()+1,0).getDate()-today.getDate();
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <button className="btn-fv btn-primary" onClick={()=>{setEditBudget(null);setShowForm(true);}}><Plus size={16}/> Create Budget</button>
      </div>
      {loading ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>{[1,2,3,4].map(i=><Skeleton key={i} height={200} borderRadius={12}/>)}</div>
      : !budgets.length ? <EmptyState icon="📊" title="No budgets yet" description="Create a budget per category to track spending." action={<button className="btn-fv btn-primary" onClick={()=>setShowForm(true)}><Plus size={16}/> Create Budget</button>}/>
      : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {budgets.map(b=>{
            const pct=b.percentUsed||0;
            const color=pct<50?'var(--success)':pct<80?'var(--warning)':'var(--danger)';
            return (
              <motion.div key={b._id} className="fv-card" style={{padding:20}} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <div style={{width:44,height:44,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,background:(b.categoryId?.color||'#94A3B8')+'20',flexShrink:0}}>{b.categoryId?.icon||'📦'}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:700}}>{b.categoryId?.name}</div>
                    <div style={{fontSize:12,color:'var(--text-3)',textTransform:'capitalize'}}>{b.period} Budget</div>
                  </div>
                  {pct>100&&<Badge type="danger">Over!</Badge>}
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:10}}>
                  <div style={{fontFamily:'var(--font-mono)',fontSize:18,fontWeight:700,color:pct>100?'var(--danger)':'var(--text)'}}>{formatAmount(b.spentAmount)}</div>
                  <div style={{fontSize:13,color:'var(--text-2)'}}>of {formatAmount(b.amountLimit)}</div>
                </div>
                <ProgressBar value={b.spentAmount} max={b.amountLimit}/>
                <div style={{display:'flex',justifyContent:'space-between',margin:'10px 0 14px',fontSize:12}}>
                  <span style={{fontWeight:700,color}}>{pct.toFixed(1)}% used</span>
                  <span style={{color:'var(--text-3)'}}>{daysLeft} days left</span>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button className="btn-fv btn-outline btn-sm" onClick={()=>{setEditBudget(b);setShowForm(true);}}><Pencil size={13}/> Edit</button>
                  <button className="btn-fv btn-outline btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleteId(b._id)}><Trash2 size={13}/></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <BudgetForm open={showForm} onClose={()=>setShowForm(false)} categories={categories} editBudget={editBudget} onSaved={async(d)=>{editBudget?await update(editBudget._id,d):await create(d);}}/>
      <ConfirmModal open={!!deleteId} onClose={()=>setDeleteId(null)} danger title="Delete Budget" message="Budget deleted. Transactions unaffected." confirmLabel="Delete" onConfirm={async()=>{await remove(deleteId);setDeleteId(null);}}/>
    </div>
  );
}

function launchConfetti() {
  const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:9999';
  c.width=window.innerWidth;c.height=window.innerHeight;document.body.appendChild(c);
  const ctx=c.getContext('2d'),COLS=['#1A56DB','#059669','#F59E0B','#DC2626','#8B5CF6'];
  const p=Array.from({length:130},()=>({x:Math.random()*c.width,y:-10,r:Math.random()*8+3,dx:(Math.random()-.5)*5,dy:Math.random()*6+2,col:COLS[Math.floor(Math.random()*5)],a:Math.random()*360,s:(Math.random()-.5)*12}));
  let f=0;const draw=()=>{if(f++>220){c.remove();return;}ctx.clearRect(0,0,c.width,c.height);p.forEach(q=>{q.x+=q.dx;q.y+=q.dy;q.a+=q.s;if(q.y>c.height)q.y=-10;ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.a*Math.PI/180);ctx.fillStyle=q.col;ctx.fillRect(-q.r/2,-q.r/2,q.r,q.r);ctx.restore();});requestAnimationFrame(draw);};draw();
  setTimeout(()=>c.remove(),5000);
}

export function Goals() {
  const { goals, loading, create, update, remove, contribute } = useGoals();
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [contributeGoal, setContribute] = useState(null);
  const [contribHistory, setContribHistory] = useState(null);
  const [contributions, setContribs] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const loadContribs = async(goal)=>{try{const{data}=await goalsApi.getContributions(goal._id);setContribs(data.data.contributions);setContribHistory(goal);}catch{toast.error('Failed');}};
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <button className="btn-fv btn-primary" onClick={()=>{setEditGoal(null);setShowForm(true);}}><Plus size={16}/> Add Goal</button>
      </div>
      {loading ? <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>{[1,2,3].map(i=><Skeleton key={i} height={300} borderRadius={12}/>)}</div>
      : !goals.length ? <EmptyState icon="🎯" title="No savings goals" description="Set a goal and start saving." action={<button className="btn-fv btn-primary" onClick={()=>setShowForm(true)}><Plus size={16}/> Add Goal</button>}/>
      : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
          {goals.map(goal=>{
            const dl=getDaysLeft(goal.deadline);
            return (
              <motion.div key={goal._id} className="fv-card" style={{padding:24,textAlign:'center'}} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
                <div style={{display:'flex',justifyContent:'center',marginBottom:14}}><RingProgress value={goal.currentAmount} max={goal.targetAmount} color={goal.color} size={130}/></div>
                <div style={{fontSize:30,marginBottom:8}}>{goal.icon}</div>
                <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>{goal.name}</div>
                <div style={{fontSize:13,color:'var(--text-2)',marginBottom:10}}>
                  <span style={{fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--text)'}}>{formatAmount(goal.currentAmount)}</span> of {formatAmount(goal.targetAmount)}
                </div>
                {dl!==null&&<div style={{fontSize:12,color:'var(--text-3)',marginBottom:12}}>🗓 {dl>0?`${dl} days left`:'Deadline passed'}</div>}
                {goal.status==='completed'&&<div style={{marginBottom:14}}><Badge type="success">✅ Completed!</Badge></div>}
                <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                  {goal.status==='active'&&<button className="btn-fv btn-primary btn-sm" onClick={()=>setContribute(goal)}>+ Contribute</button>}
                  <button className="btn-fv btn-outline btn-sm" onClick={()=>loadContribs(goal)}>History</button>
                  <button className="btn-fv btn-ghost btn-sm" onClick={()=>{setEditGoal(goal);setShowForm(true);}}><Pencil size={13}/></button>
                  <button className="btn-fv btn-ghost btn-sm" style={{color:'var(--danger)'}} onClick={()=>setDeleteId(goal._id)}><Trash2 size={13}/></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      <GoalForm open={showForm} onClose={()=>setShowForm(false)} editGoal={editGoal} onSaved={async(d)=>{editGoal?await update(editGoal._id,d):await create(d);}}/>
      <ContributionForm open={!!contributeGoal} onClose={()=>setContribute(null)} goalName={contributeGoal?.name} onSaved={async(d)=>{const r=await contribute(contributeGoal._id,d);if(r?.goal?.status==='completed')launchConfetti();}}/>
      {contribHistory&&(
        <div className="modal-overlay" onClick={()=>setContribHistory(null)}>
          <div className="modal-box" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><h4 className="modal-title">{contribHistory.icon} {contribHistory.name}</h4><button className="btn-icon" onClick={()=>setContribHistory(null)}>✕</button></div>
            <div className="modal-body">
              {!contributions.length?<p style={{color:'var(--text-3)',fontSize:13}}>No contributions yet.</p>:
              <div className="timeline">{contributions.map(c=>(
                <div key={c._id} className="timeline-item">
                  <div style={{fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--success)'}}>+{formatAmount(c.amount)}</div>
                  {c.note&&<div style={{fontSize:13,color:'var(--text-2)'}}>{c.note}</div>}
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{formatDate(c.contributedAt)}</div>
                </div>))}</div>}
            </div>
            <div className="modal-footer"><button className="btn-fv btn-primary btn-sm" onClick={()=>setContribHistory(null)}>Close</button></div>
          </div>
        </div>
      )}
      <ConfirmModal open={!!deleteId} onClose={()=>setDeleteId(null)} danger title="Delete Goal" message="Goal and all contribution history will be deleted." confirmLabel="Delete" onConfirm={async()=>{await remove(deleteId);setDeleteId(null);}}/>
    </div>
  );
}

export function Recurring({ accounts=[] }) {
  const { recurring, loading, create, remove, pause, resume } = useRecurring();
  const { categories } = useCategories();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  return (
    <div>
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:20}}>
        <button className="btn-fv btn-primary" onClick={()=>setShowForm(true)}><Plus size={16}/> Add Recurring</button>
      </div>
      <div className="fv-card">
        {loading?<div style={{padding:20}}>{[1,2,3,4].map(i=><Skeleton key={i} height={52} borderRadius={8} className="mb-3"/>)}</div>
        :!recurring.length?<EmptyState icon="🔁" title="No recurring entries" description="Automate salary, subscriptions, rent."/>
        :(
          <div style={{overflowX:'auto'}}>
            <table className="fv-table">
              <thead><tr><th>Description</th><th>Account</th><th>Amount</th><th>Frequency</th><th>Next Due</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {recurring.map(r=>(
                  <tr key={r._id}>
                    <td><div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{width:34,height:34,borderRadius:8,background:r.categoryId?.color||'#94A3B8',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:14,flexShrink:0}}>{r.categoryId?.icon||'💰'}</div>
                      <div><div style={{fontWeight:600,fontSize:14}}>{r.description}</div><div style={{fontSize:12,color:'var(--text-3)'}}>{r.categoryId?.name}</div></div>
                    </div></td>
                    <td><span className="acc-chip">{r.accountId?.icon} {r.accountId?.name}</span></td>
                    <td><span className={`tx-amount ${r.type}`}>{r.type==='income'?'+':'−'}{formatAmount(r.amount)}</span></td>
                    <td style={{textTransform:'capitalize',fontSize:13,fontWeight:600}}>{r.frequency}</td>
                    <td style={{fontFamily:'var(--font-mono)',fontSize:13}}>{formatDate(r.nextDueDate)}</td>
                    <td><Badge type={r.isActive?'success':'warning'}>{r.isActive?'Active':'Paused'}</Badge></td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="btn-icon" onClick={()=>r.isActive?pause(r._id):resume(r._id)}>{r.isActive?<PauseCircle size={16}/>:<PlayCircle size={16}/>}</button>
                      <button className="btn-icon" style={{color:'var(--danger)'}} onClick={()=>setDeleteId(r._id)}><Trash2 size={16}/></button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <RecurringForm open={showForm} onClose={()=>setShowForm(false)} accounts={accounts} categories={categories} onSaved={create}/>
      <ConfirmModal open={!!deleteId} onClose={()=>setDeleteId(null)} danger title="Delete Recurring" message="Future auto-transactions stop. Existing ones unaffected." confirmLabel="Delete" onConfirm={async()=>{await remove(deleteId);setDeleteId(null);}}/>
    </div>
  );
}

export function Reports() {
  const now=new Date();
  const [month,setMonth]=useState(now.getMonth()+1);
  const [year,setYear]=useState(now.getFullYear());
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(false);
  const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const load=async()=>{setLoading(true);try{const{data}=await reportsApi.getMonthly({month,year});setReport(data.data);}catch{toast.error('Failed to load');}finally{setLoading(false);}};
  React.useEffect(()=>{load();},[month,year]);
  return (
    <div>
      <div style={{display:'flex',gap:12,alignItems:'flex-end',marginBottom:24,flexWrap:'wrap'}}>
        <div className="filter-group"><span className="filter-label">Month</span>
          <select className="form-select" value={month} onChange={e=>setMonth(Number(e.target.value))}>{MONTHS.map((m,i)=><option key={i} value={i+1}>{m}</option>)}</select>
        </div>
        <div className="filter-group"><span className="filter-label">Year</span>
          <select className="form-select" value={year} onChange={e=>setYear(Number(e.target.value))}>{[2023,2024,2025,2026].map(y=><option key={y}>{y}</option>)}</select>
        </div>
        <button className="btn-fv btn-outline" onClick={()=>toast.info('PDF: GET /api/v1/reports/monthly')}><Download size={15}/> PDF</button>
        <button className="btn-fv btn-outline" onClick={()=>toast.info('Excel: GET /api/v1/transactions/export?format=xlsx')}><Download size={15}/> Excel</button>
      </div>
      {loading?<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>{[1,2,3,4].map(i=><Skeleton key={i} height={90} borderRadius={12}/>)}</div>
      :report&&(
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:24}}>
            {[['Total Income',formatAmount(report.summary.income),'var(--success)'],['Total Expenses',formatAmount(report.summary.expense),'var(--danger)'],['Net Savings',formatAmount(report.summary.savings),'var(--primary)'],['Savings Rate',`${report.summary.savingsRate}%`,'var(--info)']].map(([l,v,c])=>(
              <div key={l} className="fv-card" style={{padding:18}}>
                <div style={{fontSize:11,fontWeight:700,color:'var(--text-2)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>{l}</div>
                <div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <div className="fv-card">
              <div className="fv-card-header"><h3 className="fv-card-title">Category Breakdown</h3></div>
              <div style={{overflowX:'auto'}}><table className="fv-table">
                <thead><tr><th>Category</th><th>Amount</th><th>%</th><th>Txns</th></tr></thead>
                <tbody>{report.categoryBreakdown.length?report.categoryBreakdown.map(c=>(
                  <tr key={c.name}><td>{c.icon} {c.name}</td><td style={{fontFamily:'var(--font-mono)',fontWeight:600}}>{formatAmount(c.total)}</td><td>{c.percentOfTotal}%</td><td>{c.count}</td></tr>
                )):<tr><td colSpan={4} style={{textAlign:'center',color:'var(--text-3)',padding:20}}>No data</td></tr>}</tbody>
              </table></div>
            </div>
            <div className="fv-card">
              <div className="fv-card-header"><h3 className="fv-card-title">Top 5 Expenses</h3></div>
              <div style={{padding:'0 20px'}}>
                {report.top5Expenses.length?report.top5Expenses.map((tx,i)=>(
                  <div key={tx._id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:i<4?'1px solid var(--border)':'none'}}>
                    <span style={{fontSize:20}}>{tx.categoryId?.icon||'💰'}</span>
                    <div style={{flex:1}}><div style={{fontSize:14,fontWeight:600}}>{tx.description||tx.categoryId?.name}</div><div style={{fontSize:12,color:'var(--text-3)'}}>{formatDate(tx.date)}</div></div>
                    <div style={{fontFamily:'var(--font-mono)',fontWeight:700,color:'var(--danger)'}}>−{formatAmount(tx.amount)}</div>
                  </div>
                )):<p style={{color:'var(--text-3)',fontSize:13,padding:'16px 0'}}>No expenses</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
