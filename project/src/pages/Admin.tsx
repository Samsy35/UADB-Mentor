import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Users, Calendar, BookOpen, CheckCircle2, XCircle, Clock, Plus, Trash2, Edit3, GraduationCap, Building2, UserCheck, Search, AlertCircle } from 'lucide-react';
import { supabase, type Profile, type UFR, type Filiere, type Niveau, type Matiere } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Card, Badge, Button, Input, Spinner, EmptyState, Select } from '@/components/ui';
import { Avatar } from '@/components/Avatar';
import { fullName } from '@/lib/utils';

type AdminUser = Profile & { niveau?: { code: string; nom: string; ordre: number } | null; filiere?: { nom: string; ufr_id?: string } | null };
type Stats = { totalUsers:number; pendingUsers:number; mentors:number; mentees:number; sessions:number; completed:number };

export default function Admin() {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [users,setUsers]=useState<AdminUser[]>([]); const [ufrs,setUfrs]=useState<UFR[]>([]); const [filieres,setFilieres]=useState<Filiere[]>([]); const [niveaux,setNiveaux]=useState<Niveau[]>([]); const [matieres,setMatieres]=useState<Matiere[]>([]);
  const [stats,setStats]=useState<Stats>({totalUsers:0,pendingUsers:0,mentors:0,mentees:0,sessions:0,completed:0}); const [loading,setLoading]=useState(true); const [error,setError]=useState(''); const [query,setQuery]=useState('');
  const [catalogTab,setCatalogTab]=useState<'ufrs'|'filieres'|'matieres'|'niveaux'>('ufrs');
  const [edit,setEdit]=useState<{type:string; id?:string; nom:string; code:string; description:string; parent:string; niveau:string}>({type:'',nom:'',code:'',description:'',parent:'',niveau:''});

  const section = location.pathname.endsWith('/users') ? 'users' : location.pathname.endsWith('/catalogue') ? 'catalogue' : location.pathname.endsWith('/moderation') ? 'moderation' : 'home';
  useEffect(()=>{ if(profile?.is_admin) load(); },[profile]);
  useEffect(()=>{ if(section==='catalogue') loadCatalog(); },[section]);

  async function load(){ setLoading(true); setError('');
    const [u, s, p, m, me] = await Promise.all([
      supabase.from('profiles').select('*, niveau:niveaux(code,nom,ordre), filiere:filieres(nom,ufr_id)').order('created_at',{ascending:false}),
      supabase.from('sessions').select('id,statut'),
      supabase.from('profiles').select('id',{count:'exact',head:true}).eq('statut_validation','en_attente'),
      supabase.from('profiles').select('id',{count:'exact',head:true}).eq('is_mentor',true).eq('is_admin',false),
      supabase.from('profiles').select('id',{count:'exact',head:true}).eq('is_mentore',true).eq('is_admin',false),
    ]);
    if(u.error) setError(u.error.message); else setUsers((u.data??[]) as AdminUser[]);
    const sessions=(s.data??[]) as {id:string;statut:string}[];
    setStats({totalUsers:u.data?.length??0,pendingUsers:p.count??0,mentors:m.count??0,mentees:me.count??0,sessions:sessions.length,completed:sessions.filter(x=>x.statut==='terminee').length}); setLoading(false);
  }
  async function loadCatalog(){ const [a,b,c,d]=await Promise.all([supabase.from('ufrs').select('*').order('nom'),supabase.from('filieres').select('*').order('nom'),supabase.from('niveaux').select('*').order('ordre'),supabase.from('matieres').select('*').order('nom')]); setUfrs((a.data??[]) as UFR[]);setFilieres((b.data??[]) as Filiere[]);setNiveaux((c.data??[]) as Niveau[]);setMatieres((d.data??[]) as Matiere[]); }
  if(!profile?.is_admin) return <div className="py-20"><EmptyState icon={<AlertCircle className="w-12 h-12"/>} title="Accès refusé" description="Cette console est réservée aux administrateurs."/></div>;
  if(loading && section!=='catalogue') return <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-primary-600"/></div>;

  const pending=users.filter(u=>u.statut_validation==='en_attente');
  const filteredUsers=users.filter(u=>`${u.prenom} ${u.nom} ${u.numero_carte}`.toLowerCase().includes(query.toLowerCase()));

  const updateRole=async(u:AdminUser,field:'is_mentor'|'is_mentore',value:boolean)=>{ setError(''); const payload:any={ [field]:value }; if(u.is_admin){setError('Un administrateur ne peut pas être mentor ou mentoré.');return;} const {error:e}=await supabase.from('profiles').update(payload).eq('id',u.id); if(e)setError(e.message); else load(); };
  const validate=async(u:AdminUser,ok:boolean)=>{ if(ok && u.is_mentor && (u.niveau?.ordre??0)<2){setError('Validation refusée : un mentor doit être au minimum en L2.');return;} const {error:e}=await supabase.from('profiles').update({statut_validation:ok?'valide':'suspendu'}).eq('id',u.id); if(e)setError(e.message); else load(); };
  const deleteUser=async(u:AdminUser)=>{ if(u.id===profile.id){setError('Vous ne pouvez pas supprimer votre propre compte administrateur.');return;} if(!confirm(`Supprimer le profil de ${fullName(u)} ?`))return; const {error:e}=await supabase.rpc('admin_delete_profile',{p_profile_id:u.id}); if(e)setError(e.message); else load(); };

  async function saveCatalog(){
    setError('');
    const t=edit.type;
    if(!edit.nom.trim()) return setError('Le nom est obligatoire.');
    let e:any=null;
    if(t==='ufr') e=edit.id ? (await supabase.from('ufrs').update({nom:edit.nom,code:edit.code,description:edit.description}).eq('id',edit.id)).error : (await supabase.from('ufrs').insert({nom:edit.nom,code:edit.code,type:'ufr',description:edit.description})).error;
    if(t==='filiere') e=edit.id ? (await supabase.from('filieres').update({nom:edit.nom,code:edit.code,description:edit.description,ufr_id:edit.parent||null}).eq('id',edit.id)).error : (await supabase.from('filieres').insert({nom:edit.nom,code:edit.code,description:edit.description,ufr_id:edit.parent||null})).error;
    if(t==='matiere') e=edit.id ? (await supabase.from('matieres').update({nom:edit.nom,code:edit.code,description:edit.description,filiere_id:edit.parent||null,niveau_id:edit.niveau||null}).eq('id',edit.id)).error : (await supabase.from('matieres').insert({nom:edit.nom,code:edit.code,description:edit.description,filiere_id:edit.parent||null,niveau_id:edit.niveau||null,actif:true})).error;
    if(t==='niveau') e=edit.id ? (await supabase.from('niveaux').update({nom:edit.nom,code:edit.code,ordre:Number(edit.niveau||0)}).eq('id',edit.id)).error : (await supabase.from('niveaux').insert({nom:edit.nom,code:edit.code,ordre:Number(edit.niveau||0)})).error;
    if(e)setError(e.message); else {setEdit({type:'',nom:'',code:'',description:'',parent:'',niveau:''}); await loadCatalog();}
  }
  async function removeCatalog(type:string,id:string){ if(!confirm('Supprimer cet élément ? Les relations dépendantes peuvent également être supprimées.'))return; let e:any=null; if(type==='ufr')e=(await supabase.from('ufrs').delete().eq('id',id)).error; if(type==='filiere')e=(await supabase.from('filieres').delete().eq('id',id)).error; if(type==='matiere')e=(await supabase.from('matieres').delete().eq('id',id)).error; if(type==='niveau')e=(await supabase.from('niveaux').delete().eq('id',id)).error; if(e)setError(e.message); else loadCatalog(); }

  return <div className="space-y-6 animate-fade-in">
    <header className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between"><div><div className="inline-flex items-center gap-2 text-primary-700 text-sm font-semibold"><ShieldCheck className="w-4 h-4"/> CONSOLE ADMINISTRATEUR</div><h1 className="text-3xl font-bold text-slate-950 mt-1">Pilotage de MentorUADB</h1><p className="text-slate-500 mt-1">Gérez les comptes, le catalogue UADB et le workflow de mentorat.</p></div><div className="rounded-2xl bg-white border border-slate-200 px-4 py-3"><p className="text-xs text-slate-400">Connecté en tant que</p><p className="font-semibold text-slate-800">{profile.prenom || 'UADB'} {profile.nom}</p></div></header>
    {error&&<div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}
    {section==='home' && <><div className="grid grid-cols-2 lg:grid-cols-6 gap-3">{[[Users,'Utilisateurs',stats.totalUsers],[Clock,'En attente',stats.pendingUsers],[UserCheck,'Mentors',stats.mentors],[Users,'Mentorés',stats.mentees],[Calendar,'Sessions',stats.sessions],[CheckCircle2,'Terminées',stats.completed]].map(([I,l,v]:any)=><Card key={l} className="p-4"><I className="w-5 h-5 text-primary-600"/><p className="text-2xl font-bold mt-3">{v}</p><p className="text-xs text-slate-500">{l}</p></Card>)}</div><div className="grid lg:grid-cols-3 gap-5"><Card className="p-6 lg:col-span-2"><h2 className="text-lg font-bold">Actions prioritaires</h2><div className="grid sm:grid-cols-3 gap-3 mt-4"><Action title="Valider les comptes" text={`${pending.length} demande(s) en attente`} onClick={()=>navigate('/app/admin/users')} icon={<UserCheck/>}/><Action title="Gérer le catalogue" text={`${ufrs.length||'—'} composantes UADB`} onClick={()=>{navigate('/app/admin/catalogue');loadCatalog()}} icon={<GraduationCap/>}/><Action title="Contrôler le mentorat" text="Rôles, niveaux et capacité" onClick={()=>navigate('/app/admin/moderation')} icon={<ShieldCheck/>}/></div></Card><Card className="p-6"><h2 className="font-bold">Règles actives</h2><ul className="mt-4 space-y-3 text-sm text-slate-600"><li>✓ Admin ≠ Mentor / Mentoré</li><li>✓ Mentor minimum L2</li><li>✓ Validation admin obligatoire</li><li>✓ Recherche par filière et matière</li><li>✓ Messagerie limitée aux relations de mentorat</li></ul></Card></div></>}
    {section==='users' && <UsersPanel users={filteredUsers} pending={pending} query={query} setQuery={setQuery} validate={validate} updateRole={updateRole} deleteUser={deleteUser} />}
    {section==='moderation' && <Moderation users={users} validate={validate} updateRole={updateRole}/>} 
    {section==='catalogue' && <CatalogPanel tab={catalogTab} setTab={setCatalogTab} ufrs={ufrs} filieres={filieres} matieres={matieres} niveaux={niveaux} edit={edit} setEdit={setEdit} save={saveCatalog} remove={removeCatalog}/>} 
  </div>;
}

function Action({title,text,onClick,icon}:{title:string;text:string;onClick:()=>void;icon:React.ReactNode}){return <button onClick={onClick} className="text-left p-4 rounded-2xl border border-slate-200 hover:border-primary-300 hover:bg-primary-50/40 transition"><div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">{icon}</div><p className="font-semibold mt-3">{title}</p><p className="text-xs text-slate-500 mt-1">{text}</p></button>}
function UsersPanel({users,pending,query,setQuery,validate,updateRole,deleteUser}:{users:AdminUser[];pending:AdminUser[];query:string;setQuery:(s:string)=>void;validate:(u:AdminUser,o:boolean)=>void;updateRole:(u:AdminUser,f:'is_mentor'|'is_mentore',v:boolean)=>void;deleteUser:(u:AdminUser)=>void}){return <div className="space-y-5"><Card className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un utilisateur..." className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200"/></div></Card>{pending.length>0&&<Card className="p-5"><h2 className="font-bold mb-3">Demandes de validation ({pending.length})</h2><div className="space-y-2">{pending.map(u=><UserRow key={u.id} u={u} validate={validate} updateRole={updateRole} deleteUser={deleteUser}/>)}</div></Card>}<Card className="p-5"><h2 className="font-bold mb-3">Tous les comptes ({users.length})</h2><div className="space-y-2">{users.map(u=><UserRow key={u.id} u={u} validate={validate} updateRole={updateRole} deleteUser={deleteUser}/>)}</div></Card></div>}
function UserRow({u,validate,updateRole,deleteUser}:{u:AdminUser;validate:(u:AdminUser,o:boolean)=>void;updateRole:(u:AdminUser,f:'is_mentor'|'is_mentore',v:boolean)=>void;deleteUser:(u:AdminUser)=>void}){return <div className="flex flex-col lg:flex-row lg:items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white"><Avatar nom={u.nom} prenom={u.prenom} photoUrl={u.photo_url} size="sm"/><div className="flex-1 min-w-0"><p className="font-semibold text-slate-800 truncate">{fullName(u)}</p><p className="text-xs text-slate-400 truncate">{u.numero_carte} · {u.filiere?.nom||'Profil non renseigné'} · {u.niveau?.code||'—'}</p><div className="flex flex-wrap gap-1 mt-1">{u.is_admin?<Badge color="slate">Administrateur</Badge>:<><Badge color={u.is_mentor?'green':'slate'}>Mentor {u.is_mentor?'✓':'—'}</Badge><Badge color={u.is_mentore?'blue':'slate'}>Mentoré {u.is_mentore?'✓':'—'}</Badge></> }<Badge color={u.statut_validation==='valide'?'green':u.statut_validation==='en_attente'?'amber':'red'}>{u.statut_validation}</Badge></div></div>{!u.is_admin&&<div className="flex flex-wrap gap-2"><Button size="sm" variant={u.is_mentor?'secondary':'outline'} onClick={()=>updateRole(u,'is_mentor',!u.is_mentor)}>{u.is_mentor?'Retirer mentor':'Promouvoir mentor'}</Button><Button size="sm" variant={u.is_mentore?'secondary':'outline'} onClick={()=>updateRole(u,'is_mentore',!u.is_mentore)}>{u.is_mentore?'Retirer mentoré':'Promouvoir mentoré'}</Button>{u.statut_validation==='en_attente'?<><Button size="sm" variant="secondary" onClick={()=>validate(u,true)}><CheckCircle2 className="w-4 h-4"/></Button><Button size="sm" variant="outline" onClick={()=>validate(u,false)}><XCircle className="w-4 h-4"/></Button></>:<Button size="sm" variant="ghost" onClick={()=>deleteUser(u)}><Trash2 className="w-4 h-4 text-red-500"/></Button>}</div>}</div>}
function Moderation({users,validate,updateRole}:{users:AdminUser[];validate:(u:AdminUser,o:boolean)=>void;updateRole:(u:AdminUser,f:'is_mentor'|'is_mentore',v:boolean)=>void}){const mentors=users.filter(u=>u.is_mentor&&!u.is_admin);return <Card className="p-5"><h2 className="text-xl font-bold">Mentorat & validation</h2><p className="text-sm text-slate-500 mt-1">Un mentor doit être en L2 ou plus et rester validé par l’administration.</p><div className="space-y-2 mt-5">{mentors.map(u=><div key={u.id} className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-50"><Avatar nom={u.nom} prenom={u.prenom} photoUrl={u.photo_url} size="sm"/><div className="flex-1"><p className="font-semibold">{fullName(u)}</p><p className="text-xs text-slate-500">Niveau {u.niveau?.code||'inconnu'} · {u.filiere?.nom||'filière inconnue'}</p></div>{(u.niveau?.ordre??0)>=2?<Badge color="green">Éligible L2+</Badge>:<Badge color="red">Niveau insuffisant</Badge>}<Badge color={u.statut_validation==='valide'?'green':'amber'}>{u.statut_validation}</Badge>{u.statut_validation!=='valide'&&<Button size="sm" onClick={()=>validate(u,true)} disabled={(u.niveau?.ordre??0)<2}>Valider</Button>}<Button size="sm" variant="outline" onClick={()=>updateRole(u,'is_mentor',false)}>Retirer mentor</Button></div>)}</div></Card>}
function CatalogPanel({tab,setTab,ufrs,filieres,matieres,niveaux,edit,setEdit,save,remove}:any){
  const tabs=[['ufrs','UFR / Instituts'],['filieres','Filières'],['matieres','Matières'],['niveaux','Niveaux']];
  const start=(type:string)=>setEdit({type,nom:'',code:'',description:'',parent:'',niveau:''});
  const type=tab==='ufrs'?'ufr':tab==='filieres'?'filiere':tab==='matieres'?'matiere':'niveau';
  return <div className="space-y-5">
    <div className="flex gap-2 overflow-x-auto">
      {tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap ${tab===k?'bg-slate-950 text-white':'bg-white border border-slate-200 text-slate-600'}`}>{l}</button>)}
      <Button onClick={()=>start(type)}><Plus className="w-4 h-4"/> Ajouter</Button>
    </div>
    {edit.type && <Card className="p-5">
      <h3 className="font-bold mb-4">{edit.id?'Modifier':'Ajouter'} {edit.type}</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        <Input label="Nom" value={edit.nom} onChange={(e:any)=>setEdit({...edit,nom:e.target.value})}/>
        <Input label="Code" value={edit.code} onChange={(e:any)=>setEdit({...edit,code:e.target.value})}/>
        {edit.type!=='niveau' && <Input label="Description" value={edit.description} onChange={(e:any)=>setEdit({...edit,description:e.target.value})}/>} 
        {edit.type==='filiere' && <Select label="UFR" value={edit.parent} onChange={(e:any)=>setEdit({...edit,parent:e.target.value})}><option value="">Sélectionner...</option>{ufrs.map((x:UFR)=><option key={x.id} value={x.id}>{x.code} — {x.nom}</option>)}</Select>}
        {edit.type==='matiere' && <>
          <Select label="Filière" value={edit.parent} onChange={(e:any)=>setEdit({...edit,parent:e.target.value})}><option value="">Sélectionner...</option>{filieres.map((x:Filiere)=><option key={x.id} value={x.id}>{x.nom}</option>)}</Select>
          <Select label="Niveau" value={edit.niveau} onChange={(e:any)=>setEdit({...edit,niveau:e.target.value})}><option value="">Tous / non précisé</option>{niveaux.map((x:Niveau)=><option key={x.id} value={x.id}>{x.code} — {x.nom}</option>)}</Select>
        </>}
        {edit.type==='niveau' && <Input label="Ordre" type="number" value={edit.niveau} onChange={(e:any)=>setEdit({...edit,niveau:e.target.value})}/>} 
      </div>
      <div className="flex gap-2 mt-4"><Button onClick={save}>Enregistrer</Button><Button variant="outline" onClick={()=>setEdit({type:'',nom:'',code:'',description:'',parent:'',niveau:''})}>Annuler</Button></div>
    </Card>}
    {tab==='ufrs' && <CatalogList title="UFR / Instituts" items={ufrs} type="ufr" edit={setEdit} remove={remove}/>} 
    {tab==='filieres' && <CatalogList title="Filières" items={filieres} type="filiere" edit={setEdit} remove={remove} extra={(x:Filiere)=>ufrs.find((u:UFR)=>u.id===x.ufr_id)?.code}/>} 
    {tab==='matieres' && <CatalogList title="Matières" items={matieres} type="matiere" edit={setEdit} remove={remove} extra={(x:Matiere)=>filieres.find((f:Filiere)=>f.id===x.filiere_id)?.nom}/>} 
    {tab==='niveaux' && <CatalogList title="Niveaux" items={niveaux} type="niveau" edit={setEdit} remove={remove}/>} 
  </div>;
}
function CatalogList({title,items,type,edit,remove,extra}:any){return <Card className="p-5"><h2 className="font-bold mb-3">{title} ({items.length})</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{items.map((x:any)=><div key={x.id} className="rounded-xl border border-slate-200 p-3 flex items-start gap-3"><div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{x.nom}</p><p className="text-xs text-slate-400">{x.code||''}{extra&&` · ${extra(x)}`}</p></div><button onClick={()=>edit({type,id:x.id,nom:x.nom,code:x.code||'',description:x.description||'',parent:x.ufr_id||x.filiere_id||'',niveau:x.niveau_id||x.ordre||''})} className="p-1.5 hover:bg-slate-100 rounded"><Edit3 className="w-4 h-4"/></button><button onClick={()=>remove(type,x.id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4"/></button></div>)}</div></Card>}
