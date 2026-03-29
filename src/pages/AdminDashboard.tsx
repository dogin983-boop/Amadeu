import { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, Appointment, Product, GameReservation, Category, AppointmentStatus, UserRole } from '../types';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { toast } from 'sonner';
import { 
  LayoutDashboard, 
  Wrench, 
  ShoppingCart, 
  Users, 
  Gamepad2, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  Search,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  DollarSign,
  Tag,
  Save,
  X,
  UserPlus,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- Sub-components ---

function AppointmentsManager() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | 'Todos'>('Todos');

  const fetchAppointments = async () => {
    setLoading(true);
    const path = 'appointments';
    try {
      const q = query(collection(db, path));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const updateStatus = async (id: string, newStatus: AppointmentStatus) => {
    const path = `appointments/${id}`;
    try {
      await updateDoc(doc(db, 'appointments', id), { status: newStatus });
      toast.success(`Status atualizado para: ${newStatus}`);
      fetchAppointments();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const filtered = filter === 'Todos' ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <Wrench className="w-6 h-6 text-royal-blue" />
          <span>Ordens de Serviço</span>
        </h2>
        <div className="flex space-x-2">
          {['Todos', 'Em análise', 'Pendente', 'Pronto'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${filter === f ? 'bg-royal-blue text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Equipamento</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nenhuma ordem encontrada.</td></tr>
              ) : filtered.map(a => (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-royal-blue">{a.trackingCode}</td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-800">{a.customerName}</p>
                    <p className="text-xs text-gray-400">{a.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.equipment}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      a.status === 'Em análise' ? 'bg-blue-100 text-blue-700' :
                      a.status === 'Pendente' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <select 
                        className="text-xs border rounded p-1"
                        value={a.status}
                        onChange={(e) => updateStatus(a.id!, e.target.value as AppointmentStatus)}
                      >
                        <option value="Em análise">Em análise</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Pronto">Pronto</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const path = 'products';
    try {
      const q = query(collection(db, path));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Item excluído!');
      fetchProducts();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      category: formData.get('category') as Category,
      imageUrl: formData.get('imageUrl') as string,
      active: formData.get('active') === 'on'
    };

    const path = editingProduct?.id ? `products/${editingProduct.id}` : 'products';
    try {
      if (editingProduct?.id) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
        toast.success('Produto atualizado!');
      } else {
        await addDoc(collection(db, 'products'), productData);
        toast.success('Produto criado!');
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      handleFirestoreError(error, editingProduct?.id ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const seedData = async () => {
    const products = [
      { name: 'Impressão Colorida A4', description: 'Papel sulfite 75g, alta qualidade.', price: 2.50, category: 'Papelaria', active: true, imageUrl: 'https://picsum.photos/seed/print/400/300' },
      { name: 'Plastificação de Documentos', description: 'Proteção duradoura para seus documentos.', price: 5.00, category: 'Papelaria', active: true, imageUrl: 'https://picsum.photos/seed/plastic/400/300' },
      { name: 'Manutenção Preventiva PC', description: 'Limpeza e troca de pasta térmica.', price: 120.00, category: 'Tech', active: true, imageUrl: 'https://picsum.photos/seed/pc/400/300' },
      { name: 'Topo de Bolo Personalizado', description: 'Temas diversos para sua festa.', price: 25.00, category: 'Topos de Bolo', active: true, imageUrl: 'https://picsum.photos/seed/cake/400/300' },
      { name: '1 Hora Lan House', description: 'Acesso a PCs Gamer de última geração.', price: 10.00, category: 'Lan House', active: true, imageUrl: 'https://picsum.photos/seed/game/400/300' },
    ];

    try {
      for (const p of products) {
        await addDoc(collection(db, 'products'), p);
      }
      toast.success('Dados iniciais carregados!');
      fetchProducts();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'products');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <ShoppingCart className="w-6 h-6 text-royal-blue" />
          <span>Gestão da Vitrine</span>
        </h2>
        <div className="flex space-x-2">
          <button onClick={seedData} className="btn-secondary text-xs py-1 px-3">Carregar Iniciais</button>
          <button 
            onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Item</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-center col-span-full text-gray-400">Carregando...</p>
        ) : products.map(p => (
          <div key={p.id} className="card p-4 flex space-x-4">
            <img src={p.imageUrl || `https://picsum.photos/seed/${p.name}/100/100`} className="w-20 h-20 rounded-lg object-cover" alt={p.name} />
            <div className="flex-grow">
              <h3 className="font-bold text-gray-800">{p.name}</h3>
              <p className="text-xs text-gray-400">{p.category}</p>
              <p className="text-royal-blue font-bold">R$ {p.price.toFixed(2)}</p>
              <div className="flex space-x-2 mt-2">
                <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-blue-500 hover:text-blue-700"><Edit className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(p.id!)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="bg-royal-blue p-4 text-white flex justify-between items-center">
                <h3 className="font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Nome</label>
                    <input name="name" defaultValue={editingProduct?.name} required className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Preço</label>
                    <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} required className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Categoria</label>
                    <select name="category" defaultValue={editingProduct?.category} className="w-full border rounded-lg p-2">
                      {["Lan House", "Papelaria", "Tech", "Fotografia", "Topos de Bolo", "Manutenção"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">URL da Imagem</label>
                    <input name="imageUrl" defaultValue={editingProduct?.imageUrl} className="w-full border rounded-lg p-2" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Descrição</label>
                    <textarea name="description" defaultValue={editingProduct?.description} className="w-full border rounded-lg p-2 resize-none" rows={3} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input name="active" type="checkbox" defaultChecked={editingProduct ? editingProduct.active : true} />
                    <label className="text-sm font-bold text-gray-700">Ativo na Vitrine</label>
                  </div>
                </div>
                <button type="submit" className="btn-primary w-full flex items-center justify-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>Salvar</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ReservationsManager() {
  const [reservations, setReservations] = useState<GameReservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    setLoading(true);
    const path = 'game_reservations';
    try {
      const q = query(collection(db, path));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameReservation));
      setReservations(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta reserva?')) return;
    const path = `game_reservations/${id}`;
    try {
      await deleteDoc(doc(db, 'game_reservations', id));
      toast.success('Reserva excluída!');
      fetchReservations();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <Gamepad2 className="w-6 h-6 text-royal-blue" />
          <span>Reservas Lan House</span>
        </h2>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Máquina</th>
                <th className="px-6 py-4">Início</th>
                <th className="px-6 py-4">Duração</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Carregando...</td></tr>
              ) : reservations.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Nenhuma reserva encontrada.</td></tr>
              ) : reservations.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-gray-800">{r.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{r.machineId}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {format(new Date(r.startTime), "dd/MM HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                      {r.duration}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDelete(r.id!)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TeamManager({ userProfile }: { userProfile: UserProfile | null }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const path = 'users';
    try {
      const q = query(collection(db, path));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
      setUsers(data);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (uid: string, newRole: UserRole) => {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      toast.success('Cargo atualizado!');
      fetchUsers();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (userProfile?.role !== 'admin') {
    return <div className="p-12 text-center text-gray-400">Apenas administradores podem gerenciar a equipe.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <Users className="w-6 h-6 text-royal-blue" />
          <span>Gestão de Equipe</span>
        </h2>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center space-x-2">
          <UserPlus className="w-4 h-4" />
          <span>Convidar Membro</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-400 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">Nome</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Cargo</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400">Carregando...</td></tr>
            ) : users.map(u => (
              <tr key={u.uid}>
                <td className="px-6 py-4 font-bold text-gray-800">{u.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    u.role === 'staff' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <select 
                    className="text-xs border rounded p-1"
                    value={u.role}
                    onChange={(e) => updateRole(u.uid, e.target.value as UserRole)}
                    disabled={u.email === 'dogin983@gmail.com'}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="client">Cliente</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Placeholder */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-2xl max-w-md w-full text-center space-y-4">
              <UserPlus className="w-12 h-12 text-royal-blue mx-auto" />
              <h3 className="text-xl font-bold">Convidar Membro</h3>
              <p className="text-gray-500 text-sm">Peça para o novo membro realizar o login com Google uma vez. Após o login, ele aparecerá na lista e você poderá promover para Staff ou Admin.</p>
              <button onClick={() => setIsModalOpen(false)} className="btn-primary w-full">Entendi</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Dashboard ---

export default function AdminDashboard({ userProfile }: { userProfile: UserProfile | null }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'staff')) {
      navigate('/admin');
    }
  }, [userProfile, navigate]);

  const menuItems = [
    { path: '/admin/dashboard/appointments', label: 'Ordens de Serviço', icon: Wrench },
    { path: '/admin/dashboard/products', label: 'Vitrine', icon: ShoppingCart },
    { path: '/admin/dashboard/reservations', label: 'Lan House', icon: Gamepad2 },
    { path: '/admin/dashboard/users', label: 'Equipe', icon: Users, adminOnly: true },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Dashboard Sidebar */}
      <aside className="w-full md:w-64 space-y-2">
        <div className="p-4 bg-royal-blue text-white rounded-xl mb-6 flex items-center space-x-3">
          <div className="bg-gold-beige p-2 rounded-lg">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs opacity-70">Painel do</p>
            <p className="font-bold">Amadeu</p>
          </div>
        </div>

        <nav className="space-y-1">
          {menuItems.map(item => {
            if (item.adminOnly && userProfile?.role !== 'admin') return null;
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-royal-blue text-white shadow-md' : 'text-gray-600 hover:bg-white hover:shadow-sm'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-gold-beige' : 'text-gray-400'}`} />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content Area */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<div className="p-12 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed">Selecione uma opção no menu lateral.</div>} />
          <Route path="/appointments" element={<AppointmentsManager />} />
          <Route path="/products" element={<ProductsManager />} />
          <Route path="/users" element={<TeamManager userProfile={userProfile} />} />
          <Route path="/reservations" element={<ReservationsManager />} />
        </Routes>
      </div>
    </div>
  );
}
