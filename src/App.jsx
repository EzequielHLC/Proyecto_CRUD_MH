import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  query, 
  addDoc,
  setDoc,
  getDoc,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  Search, 
  Swords, 
  X,
  Calendar,
  Loader2,
  Medal,
  Clock,
  Settings,
  AlertTriangle,
  Save,
  RefreshCw,
  Edit2,
  CalendarClock,
  LogOut,
  UserCheck
} from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
// Usa variables de entorno Vite (.env.local) en lugar de claves hardcodeadas
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Avisar si faltan variables importantes
const requiredVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];
const missing = requiredVars.filter(k => !import.meta.env[k]);
if (missing.length) {
  console.warn('Faltan variables de entorno de Firebase: ', missing.join(', '), '\nCrea .env.local con las VITE_FIREBASE_* correspondientes.');
}

const app = initializeApp(firebaseConfig);

// Inicializar Analytics solo si measurementId existe y hay entorno de navegador
let analytics;
if (firebaseConfig.measurementId && typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn('Firebase Analytics no se pudo inicializar:', e);
  }
}

const auth = getAuth(app);
const db = getFirestore(app);

// --- CONSTANTES ---
const RAW_ASSETS_URL = "https://raw.githubusercontent.com/RoboMechE/MHW-Database/gh-pages/monster/assets/icons";
const GITHUB_API_URL = "https://api.github.com/repos/RoboMechE/MHW-Database/contents/monster/assets/icons?ref=gh-pages";
const GUILD_MOTTO = "Quien caza pasito a pasito, caza lo que no está escrito";

// Títulos de Rango
const getRankTitle = (rank) => {
  if (rank < 2) return "Novato";
  if (rank < 5) return "Cazador de Rango Bajo";
  if (rank < 10) return "Cazador de Rango Alto";
  if (rank < 20) return "Cazador Clase G";
  if (rank < 50) return "Maestro Cazador";
  return "Estrella Zafiro";
};

// --- HOOK: CARGAR ICONOS ---
const useMonsterIcons = () => {
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIcons = async () => {
      try {
        const response = await fetch(GITHUB_API_URL);
        if (!response.ok) throw new Error("GitHub API limit");
        const data = await response.json();
        const iconList = data
          .filter(item => item.name.toLowerCase().endsWith('.webp'))
          .map(item => ({
            fileName: item.name,
            displayName: item.name.replace(/_Icon\.webp$/i, '').replace(/_/g, ' ')
          }));
        setIcons(iconList);
      } catch (error) {
        setIcons([
          { fileName: 'Great_Jagras_Icon.webp', displayName: 'Great Jagras' },
          { fileName: 'Rathalos_Icon.webp', displayName: 'Rathalos' },
          { fileName: 'Nergigante_Icon.webp', displayName: 'Nergigante' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchIcons();
  }, []);

  return { icons, loading };
};

// --- MODAL DE CONFIGURACIÓN ---
const SettingsModal = ({ hunterId, profile, onClose, onUpdateProfile, onReset, onLogout, onDeleteAccount, iconList }) => {
  const [editAvatar, setEditAvatar] = useState(profile?.avatar || 'Rathalos_Icon.webp');
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    // Solo permitimos cambiar el Avatar, no el ID (porque el ID es la clave de la DB)
    await onUpdateProfile({ avatar: editAvatar });
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border border-yellow-700/50 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#252525]">
          <h2 className="text-yellow-500 font-bold uppercase tracking-widest flex items-center gap-2">
            <Settings className="w-5 h-5" /> Ajustes del Gremio
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex border-b border-gray-800">
          <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'profile' ? 'bg-[#1e1e1e] text-yellow-500 border-b-2 border-yellow-500' : 'bg-[#151515] text-gray-500 hover:text-gray-300'}`}>Perfil</button>
          <button onClick={() => setActiveTab('account')} className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'account' ? 'bg-[#1e1e1e] text-blue-400 border-b-2 border-blue-400' : 'bg-[#151515] text-gray-500 hover:text-gray-300'}`}>Cuenta</button>
          <button onClick={() => setActiveTab('danger')} className={`flex-1 py-3 text-sm font-bold uppercase transition-colors ${activeTab === 'danger' ? 'bg-[#2a1515] text-red-500 border-b-2 border-red-500' : 'bg-[#151515] text-gray-500 hover:text-gray-300'}`}>Peligro</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                 <p className="text-xs uppercase font-bold text-gray-500">ID de Cazador (Inmutable)</p>
                 <div className="text-xl text-white font-mono bg-black/30 py-2 rounded border border-gray-700">{profile?.hunterName}</div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-gray-500">Cambiar Emblema</label>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto custom-scrollbar bg-[#121212] p-2 rounded border border-gray-700">
                  {iconList.map((icon) => (
                    <button key={icon.fileName} onClick={() => setEditAvatar(icon.fileName)} className={`aspect-square p-1 rounded border transition-all ${editAvatar === icon.fileName ? 'bg-yellow-900/40 border-yellow-500 scale-110 z-10' : 'border-transparent opacity-50 hover:opacity-100'}`}>
                      <img src={`${RAW_ASSETS_URL}/${icon.fileName}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={isSaving} className="w-full bg-yellow-700 hover:bg-yellow-600 text-black font-bold py-3 rounded uppercase flex items-center justify-center gap-2">
                {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="w-4 h-4" /> Guardar Avatar</>}
              </button>
            </div>
          )}

          {activeTab === 'account' && (
             <div className="space-y-6">
                <div className="bg-blue-900/10 border border-blue-900/30 p-4 rounded-lg space-y-4">
                  <h3 className="text-blue-400 font-bold flex items-center gap-2"><LogOut className="w-4 h-4" /> Cerrar Sesión</h3>
                  <p className="text-xs text-gray-400">Desconecta este dispositivo. Podrás volver a entrar escribiendo tu ID de Cazador exactamente igual.</p>
                  <button onClick={onLogout} className="w-full bg-blue-900/20 hover:bg-blue-900/40 text-blue-400 border border-blue-900/50 py-2 rounded text-xs uppercase font-bold">
                    Salir al Menú Principal
                  </button>
                </div>
             </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-lg space-y-4">
                <h3 className="text-red-400 font-bold flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Reiniciar Misiones</h3>
                <p className="text-xs text-gray-400">Borra todas las misiones. Vuelves a Rango 1. No afecta tu perfil.</p>
                <button onClick={() => { if(window.confirm('¿Reiniciar progreso?')) onReset(); }} className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 py-2 rounded text-xs uppercase font-bold">Reiniciar</button>
              </div>
              <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-lg space-y-4">
                <h3 className="text-red-500 font-bold flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Borrar Cuenta</h3>
                <p className="text-xs text-gray-400">Elimina tu perfil y datos permanentemente. El ID quedará libre para otro usuario.</p>
                <button onClick={() => { if(window.confirm('¿BORRAR TODO PERMANENTEMENTE?')) onDeleteAccount(); }} className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-xs uppercase font-bold">Eliminar Definitivamente</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- LOGIN / REGISTRO UNIFICADO ---
const HunterLogin = ({ onLoginSuccess, iconList }) => {
  const [hunterName, setHunterName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Rathalos_Icon.webp');
  const [isChecking, setIsChecking] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);

  // Normalizar ID: "  Super Hunter  " -> "super-hunter"
  const getNormalizedId = (name) => name.trim().toLowerCase().replace(/\s+/g, '-');

  // Verificar si existe el usuario mientras escribe (Debounce simple)
  useEffect(() => {
    const checkUser = async () => {
        if (hunterName.length < 3) {
            setExistingProfile(null);
            return;
        }
        const id = getNormalizedId(hunterName);
        const docRef = doc(db, 'hunters', id, 'profile', 'data');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            setExistingProfile(docSnap.data());
        } else {
            setExistingProfile(null);
        }
    };
    
    const timeoutId = setTimeout(checkUser, 500);
    return () => clearTimeout(timeoutId);
  }, [hunterName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hunterName.trim()) return;
    setIsChecking(true);

    const normalizedId = getNormalizedId(hunterName);
    const profileRef = doc(db, 'hunters', normalizedId, 'profile', 'data');

    try {
      const docSnap = await getDoc(profileRef);

      if (docSnap.exists()) {
        // LOGIN: El perfil ya existe
        console.log("Perfil existente encontrado. Iniciando sesión...");
        // No actualizamos el avatar aquí para no sobrescribir el del usuario original
      } else {
        // REGISTRO: Crear nuevo perfil
        console.log("Creando nuevo perfil...");
        await setDoc(profileRef, {
          hunterName: hunterName.trim(), // Nombre bonito (con mayúsculas)
          avatar: selectedIcon,
          createdAt: new Date().toISOString()
        });
      }
      
      // Guardar en LocalStorage para auto-login futuro
      localStorage.setItem('mh_hunter_id', normalizedId);
      onLoginSuccess(normalizedId);

    } catch (error) {
      console.error("Error en login:", error);
      alert("Error de conexión con el Gremio.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="bg-[#1e1e1e] border-2 border-yellow-700 rounded-xl p-6 max-w-md w-full shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="text-center mb-6">
          <Medal className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-yellow-500 uppercase tracking-widest">Acceso al Gremio</h2>
          <p className="text-gray-400 text-sm mt-1">Introduce tu ID de Cazador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500 flex justify-between">
                <span>ID de Cazador</span>
                {existingProfile && <span className="text-green-500 flex items-center gap-1"><UserCheck className="w-3 h-3"/> Cuenta Encontrada</span>}
            </label>
            <input 
              type="text" required minLength={3} maxLength={20}
              className={`w-full bg-[#121212] border rounded p-3 text-white outline-none transition-colors ${existingProfile ? 'border-green-500/50 focus:border-green-500' : 'border-gray-700 focus:border-yellow-500'}`}
              placeholder="Nombre de Usuario"
              value={hunterName} onChange={(e) => setHunterName(e.target.value)}
            />
            {existingProfile && (
                <div className="text-[10px] text-gray-400 flex items-center gap-2 bg-gray-800/50 p-2 rounded">
                    <img src={`${RAW_ASSETS_URL}/${existingProfile.avatar}`} className="w-6 h-6 object-contain" />
                    <span>Continuar como <strong>{existingProfile.hunterName}</strong></span>
                </div>
            )}
          </div>

          {/* Solo mostramos selector de avatar si es un usuario NUEVO */}
          {!existingProfile && hunterName.length >= 3 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-xs uppercase font-bold text-gray-500">Elige tu Emblema (Nuevo Usuario)</label>
                <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto custom-scrollbar bg-[#121212] p-2 rounded border border-gray-700">
                  {iconList.map((icon) => (
                    <button
                      key={icon.fileName} type="button" onClick={() => setSelectedIcon(icon.fileName)}
                      className={`aspect-square p-1 rounded transition-all border ${selectedIcon === icon.fileName ? 'bg-yellow-900/40 border-yellow-500 shadow-lg scale-110 z-10' : 'border-transparent opacity-60 hover:opacity-100 hover:bg-gray-800'}`}
                    >
                      <img src={`${RAW_ASSETS_URL}/${icon.fileName}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              </div>
          )}

          <button 
            type="submit" disabled={isChecking || hunterName.length < 3}
            className="w-full bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-black font-bold py-3 rounded uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? 'Conectando...' : existingProfile ? 'Cargar Partida' : 'Crear Nuevo Cazador'}
          </button>
        </form>
        <div className="mt-6 text-center">
            <p className="text-[10px] text-gray-600 italic font-serif">"{GUILD_MOTTO}"</p>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export default function MHPlanner() {
  const [currentHunterId, setCurrentHunterId] = useState(null); // ID del Cazador (Texto)
  const [firebaseUser, setFirebaseUser] = useState(null);       // Usuario Auth Anónimo (Técnico)
  
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  
  // UI States
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editModeTask, setEditModeTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); 
  
  const { icons: availableIcons } = useMonsterIcons();

  const [formTask, setFormTask] = useState({
    name: '', details: '', stars: 1, monsterIcon: 'Great_Jagras_Icon.webp', dueDate: ''
  });

  // 1. INICIALIZACIÓN TÉCNICA (Auth Anónimo Firebase)
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error(err));
    const unsub = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
      setLoadingAuth(false);
    });
    return () => unsub();
  }, []);

  // 2. RECUPERAR SESIÓN DE CAZADOR (LocalStorage)
  useEffect(() => {
    const storedId = localStorage.getItem('mh_hunter_id');
    if (storedId) {
        setCurrentHunterId(storedId);
    }
  }, []);

  // 3. CARGAR DATOS CUANDO TENEMOS ID
  useEffect(() => {
    if (!currentHunterId || !firebaseUser) return;
    
    setLoadingData(true);

    // Escuchar Perfil: hunters/{id}/profile/data
    const unsubProfile = onSnapshot(doc(db, 'hunters', currentHunterId, 'profile', 'data'), (d) => {
      setProfile(d.exists() ? d.data() : null);
    });

    // Escuchar Tareas: hunters/{id}/tasks
    const q = query(collection(db, 'hunters', currentHunterId, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(q, (s) => {
      setTasks(s.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoadingData(false);
    });

    return () => {
      unsubProfile();
      unsubTasks();
    };
  }, [currentHunterId, firebaseUser]);

  // --- ACTIONS ---

  const handleLogout = () => {
    localStorage.removeItem('mh_hunter_id');
    setCurrentHunterId(null);
    setProfile(null);
    setTasks([]);
    setShowSettings(false);
  };

  const handleDeleteAccount = async () => {
    if (!currentHunterId) return;
    try {
        const batch = writeBatch(db);
        tasks.forEach(t => batch.delete(doc(db, 'hunters', currentHunterId, 'tasks', t.id)));
        batch.delete(doc(db, 'hunters', currentHunterId, 'profile', 'data'));
        await batch.commit();
        handleLogout();
    } catch (e) { console.error(e); }
  };

  const handleResetProgress = async () => {
    if (!currentHunterId) return;
    const batch = writeBatch(db);
    tasks.forEach(t => batch.delete(doc(db, 'hunters', currentHunterId, 'tasks', t.id)));
    await batch.commit();
    setShowSettings(false);
  };

  const handleUpdateProfile = async (data) => {
    if (!currentHunterId) return;
    await updateDoc(doc(db, 'hunters', currentHunterId, 'profile', 'data'), data);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formTask.name || !currentHunterId) return;

    try {
      const taskData = {
        name: formTask.name,
        details: formTask.details,
        stars: parseInt(formTask.stars),
        monsterIcon: formTask.monsterIcon,
        dueDate: formTask.dueDate || null,
      };

      if (editModeTask) {
        await updateDoc(doc(db, 'hunters', currentHunterId, 'tasks', editModeTask), { ...taskData, updatedAt: new Date().toISOString() });
        setEditModeTask(null);
      } else {
        await addDoc(collection(db, 'hunters', currentHunterId, 'tasks'), { ...taskData, completed: false, createdAt: new Date().toISOString() });
      }
      setFormTask({ name: '', details: '', stars: 1, monsterIcon: 'Great_Jagras_Icon.webp', dueDate: '' });
      setShowAddForm(false);
    } catch (err) { console.error(err); }
  };

  const toggleTask = async (task) => {
    const isCompleting = !task.completed;
    await updateDoc(doc(db, 'hunters', currentHunterId, 'tasks', task.id), { 
      completed: isCompleting,
      completedAt: isCompleting ? new Date().toISOString() : null
    });
  };

  const deleteTask = async (id) => {
    if (window.confirm('¿Abandonar misión?')) await deleteDoc(doc(db, 'hunters', currentHunterId, 'tasks', id));
  };

  const startEditTask = (task) => {
    setEditModeTask(task.id);
    setFormTask({
        name: task.name,
        details: task.details || '',
        stars: task.stars,
        monsterIcon: task.monsterIcon || 'Great_Jagras_Icon.webp',
        dueDate: task.dueDate || ''
    });
    setShowAddForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  // --- RENDER ---

  const stats = useMemo(() => {
    let pts = 0;
    tasks.forEach(t => { if (t.completed) pts += (t.stars || 1) * 10; });
    const rank = Math.floor(pts / 100) + 1;
    return { rank, progress: pts % 100, totalPoints: pts, title: getRankTitle(rank) };
  }, [tasks]);

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = filterTab === 'all' ? true : filterTab === 'active' ? !t.completed : t.completed;
    return matchesSearch && matchesTab;
  });

  // PANTALLAS DE CARGA O LOGIN
  if (loadingAuth) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Loader2 className="w-8 h-8 text-yellow-600 animate-spin" /></div>;
  
  if (!currentHunterId) {
    return <HunterLogin onLoginSuccess={setCurrentHunterId} iconList={availableIcons} />;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 font-sans pb-24 flex flex-col">
      {showSettings && (
        <SettingsModal 
            hunterId={currentHunterId} profile={profile} iconList={availableIcons}
            onClose={() => setShowSettings(false)}
            onUpdateProfile={handleUpdateProfile}
            onReset={handleResetProgress}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
        />
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#1f1f1f] border-b border-yellow-900/30 shadow-xl bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center gap-3">
               <div className="w-14 h-14 bg-black/40 rounded-lg border-2 border-yellow-600/60 p-1 shadow-inner relative overflow-hidden">
                 <img src={`${RAW_ASSETS_URL}/${profile?.avatar || 'Rathalos_Icon.webp'}`} alt="Avatar" className="w-full h-full object-contain drop-shadow-lg" />
               </div>
               <div>
                 <div className="flex items-center gap-2">
                   <h1 className="text-white font-bold text-lg leading-tight tracking-wide">{profile?.hunterName || 'Cazador'}</h1>
                   <span className="bg-yellow-900/40 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded border border-yellow-700/50">HR {stats.rank}</span>
                 </div>
                 <div className="text-gray-400 text-xs font-medium">{stats.title}</div>
               </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <button onClick={() => setShowSettings(true)} className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Ajustes">
                <Settings className="w-5 h-5" />
              </button>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">{stats.totalPoints} PTS</div>
            </div>
          </div>
          <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700 w-full">
            <div className="h-full bg-gradient-to-r from-yellow-800 via-yellow-600 to-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]" style={{ width: `${stats.progress}%` }} />
          </div>
        </div>
      </header>

      {/* SEARCH Y CONTROLES */}
      <div className="max-w-3xl mx-auto px-4 py-4 w-full flex flex-col gap-3">
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Buscar misión..." className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-yellow-600 transition-colors" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <button onClick={() => { setEditModeTask(null); setFormTask({ name: '', details: '', stars: 1, monsterIcon: 'Great_Jagras_Icon.webp', dueDate: '' }); setShowAddForm(!showAddForm); }} className={`px-4 rounded-lg flex items-center justify-center transition-colors border ${showAddForm ? 'bg-red-900/20 text-red-400 border-red-900/50' : 'bg-green-900/20 text-green-400 border-green-900/50 hover:bg-green-900/40'}`}>
                {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>
        </div>
        <div className="flex gap-4 border-b border-gray-800 pb-1 text-sm">
            {['all', 'active', 'completed'].map(tab => (
                <button key={tab} onClick={() => setFilterTab(tab)} className={`pb-2 px-2 capitalize ${filterTab === tab ? 'text-yellow-500 border-b-2 border-yellow-500 font-bold' : 'text-gray-500 hover:text-gray-300'}`}>
                    {tab === 'all' ? 'Todas' : tab === 'active' ? 'En Curso' : 'Completadas'}
                </button>
            ))}
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 w-full flex-1">
        {showAddForm && (
          <div className="mb-6 bg-[#1e1e1e] border border-yellow-900/30 rounded-xl p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
            <h3 className="text-yellow-500 font-bold mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
              {editModeTask ? <Edit2 className="w-4 h-4" /> : <Swords className="w-4 h-4" />} {editModeTask ? 'Editar Misión' : 'Nueva Misión'}
            </h3>
            <form onSubmit={handleSaveTask} className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <input required autoFocus className="w-full bg-[#121212] border border-gray-700 rounded p-2 text-sm focus:border-yellow-500 outline-none" value={formTask.name} onChange={e => setFormTask({...formTask, name: e.target.value})} placeholder="Título de la tarea" />
                </div>
                <div>
                   <select className="w-full bg-[#121212] border border-gray-700 rounded p-2 text-sm text-yellow-500" value={formTask.stars} onChange={e => setFormTask({...formTask, stars: e.target.value})}>
                    {[1,2,3,4,5,6,7,8,9].map(n => <option key={n} value={n}>{n} ★</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <textarea className="w-full bg-[#121212] border border-gray-700 rounded p-2 text-sm h-20 resize-none focus:border-yellow-500 outline-none" value={formTask.details} onChange={e => setFormTask({...formTask, details: e.target.value})} placeholder="Detalles de la misión..." />
                 <div className="space-y-2">
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold flex items-center gap-1"><CalendarClock className="w-3 h-3" /> Fecha Límite (Opcional)</label>
                        <input type="datetime-local" className="w-full bg-[#121212] border border-gray-700 rounded p-2 text-sm text-gray-300 focus:border-yellow-500 outline-none" value={formTask.dueDate} onChange={e => setFormTask({...formTask, dueDate: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-gray-500 uppercase font-bold">Icono</label>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar border border-gray-700 rounded p-1">
                            {availableIcons.map(icon => (
                                <button key={icon.fileName} type="button" onClick={() => setFormTask({...formTask, monsterIcon: icon.fileName})} className={`shrink-0 w-8 h-8 rounded p-0.5 ${formTask.monsterIcon === icon.fileName ? 'bg-yellow-900/50 border border-yellow-500' : 'opacity-50 hover:opacity-100'}`}>
                                    <img src={`${RAW_ASSETS_URL}/${icon.fileName}`} className="w-full h-full object-contain" />
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-sm uppercase font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] bg-yellow-700 hover:bg-yellow-600 text-black font-bold py-2 rounded text-sm uppercase">{editModeTask ? 'Guardar Cambios' : 'Añadir al Tablón'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-3 pb-8">
          {loadingData ? (
             <div className="flex justify-center py-10"><Loader2 className="animate-spin text-yellow-600" /></div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600 opacity-60">
                <Calendar className="w-16 h-16 mb-4 stroke-1" />
                <p className="text-lg font-serif mb-2">No hay misiones activas.</p>
                <p className="text-sm font-serif italic text-yellow-700/80">"{GUILD_MOTTO}"</p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} onToggle={() => toggleTask(task)} onDelete={() => deleteTask(task.id)} onEdit={() => startEditTask(task)} />
            ))
          )}
        </div>
      </main>

      <footer className="mt-auto py-6 border-t border-gray-800 text-center">
        <p className="text-gray-500 text-[10px] uppercase tracking-widest mb-1">Diario del Cazador</p>
        <p className="text-yellow-700/60 font-serif italic text-sm">"{GUILD_MOTTO}"</p>
      </footer>
    </div>
  );
}

// --- TASK CARD ---
const TaskCard = ({ task, onToggle, onDelete, onEdit }) => {
  const isCompleted = task.completed;
  const iconSrc = task.monsterIcon ? `${RAW_ASSETS_URL}/${task.monsterIcon}` : `${RAW_ASSETS_URL}/Great_Jagras_Icon.webp`;
  const completedDate = task.completedAt ? new Date(task.completedAt) : null;
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  
  const now = new Date();
  const isOverdue = dueDate && now > dueDate && !isCompleted;
  const isNearDue = dueDate && !isOverdue && !isCompleted && (dueDate - now < 24 * 60 * 60 * 1000);

  return (
    <div className={`relative flex items-stretch bg-[#1e1e1e] border-l-4 rounded-r-lg shadow-sm transition-all group overflow-hidden animate-in fade-in slide-in-from-bottom-2 ${isCompleted ? 'border-green-600 bg-[#151a15] opacity-80' : isOverdue ? 'border-red-600 bg-[#2a1515]' : 'border-yellow-600 hover:bg-[#252525]'}`}>
      <button onClick={onToggle} className="w-12 flex items-center justify-center shrink-0 border-r border-white/5 hover:bg-white/5 transition-colors">
        {isCompleted ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className={`w-6 h-6 ${isOverdue ? 'text-red-500' : 'text-gray-500 group-hover:text-yellow-500'}`} />}
      </button>

      <div className="flex-1 p-3 flex gap-3 items-center min-w-0">
        <div className="shrink-0 w-12 h-12 bg-black/30 rounded border border-white/10 p-1 flex items-center justify-center relative">
           <img src={iconSrc} className={`w-full h-full object-contain drop-shadow-md transition-all duration-500 ${isCompleted ? 'grayscale opacity-50' : ''}`} onError={(e) => { if (e.target.src !== `${RAW_ASSETS_URL}/Great_Jagras_Icon.webp`) e.target.src = `${RAW_ASSETS_URL}/Great_Jagras_Icon.webp`; }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isCompleted ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-red-900/30 text-red-400 border-red-800'}`}>★{task.stars}</span>
            <h4 className={`font-bold text-sm truncate ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-200'}`}>{task.name}</h4>
          </div>
          {task.details && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{task.details}</p>}
          <div className="flex flex-wrap gap-3 mt-1.5">
              {isCompleted && completedDate && (
                  <div className="flex items-center gap-1 text-[10px] text-green-600/70 font-mono">
                      <Clock className="w-3 h-3" /><span>{completedDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' })}</span>
                  </div>
              )}
              {!isCompleted && dueDate && (
                  <div className={`flex items-center gap-1 text-[10px] font-mono border px-1 rounded ${isOverdue ? 'text-red-400 border-red-900/50 bg-red-900/20' : isNearDue ? 'text-yellow-400 border-yellow-900/50 bg-yellow-900/20' : 'text-gray-500 border-gray-700'}`}>
                      {isOverdue ? <AlertTriangle className="w-3 h-3" /> : <CalendarClock className="w-3 h-3" />}
                      <span>{isOverdue ? 'VENCIDA: ' : 'Límite: '} {dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour:'2-digit', minute:'2-digit' })}</span>
                  </div>
              )}
          </div>
        </div>
      </div>
      <div className="flex flex-col border-l border-white/5">
        <button onClick={onEdit} className="flex-1 px-3 flex items-center justify-center text-gray-600 hover:text-blue-400 hover:bg-blue-900/20 transition-colors"><Edit2 className="w-4 h-4" /></button>
        <button onClick={onDelete} className="flex-1 px-3 flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
      {isCompleted && <div className="absolute right-14 top-1/2 -translate-y-1/2 -rotate-12 border-2 border-green-700/40 text-green-700/40 text-[10px] font-bold px-2 py-1 rounded select-none pointer-events-none uppercase tracking-widest">Cumplida</div>}
    </div>
  );
};