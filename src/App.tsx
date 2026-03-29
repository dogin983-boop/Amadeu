import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from './types';
import { Toaster } from 'sonner';
import { Menu, X, Monitor, Gamepad2, Wrench, Search, LayoutDashboard, LogOut, User } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Scheduling from './pages/Scheduling';
import LanHouse from './pages/LanHouse';
import Tracking from './pages/Tracking';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

function Layout({ children, userProfile }: { children: React.ReactNode, userProfile: UserProfile | null }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-royal-blue text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              <Monitor className="w-8 h-8 text-gold-beige" />
              <span className="text-xl font-bold tracking-tight">Amadeu <span className="text-gold-beige">Tech</span></span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-8 items-center">
              <Link to="/" className="hover:text-gold-beige transition-colors">Vitrine</Link>
              <Link to="/agendamento" className="hover:text-gold-beige transition-colors">Manutenção</Link>
              <Link to="/lanhouse" className="hover:text-gold-beige transition-colors">Lan House</Link>
              <Link to="/acompanhar" className="hover:text-gold-beige transition-colors">Acompanhar</Link>
              {userProfile && (userProfile.role === 'admin' || userProfile.role === 'staff') && (
                <Link to="/admin/dashboard" className="flex items-center space-x-1 text-gold-beige font-semibold">
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Painel</span>
                </Link>
              )}
              {userProfile ? (
                <div className="flex items-center space-x-4">
                   <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-gold-beige uppercase tracking-wider">{userProfile.role}</span>
                      <span className="text-sm font-semibold">{userProfile.name}</span>
                   </div>
                   <button onClick={handleSignOut} className="flex items-center space-x-1 text-red-300 hover:text-red-100 transition-colors">
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                </div>
              ) : (
                <Link to="/login" className="flex items-center space-x-1 hover:text-gold-beige transition-colors">
                  <User className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-blue-800 px-2 pt-2 pb-3 space-y-1">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-blue-700">Vitrine</Link>
            <Link to="/agendamento" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-blue-700">Manutenção</Link>
            <Link to="/lanhouse" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-blue-700">Lan House</Link>
            <Link to="/acompanhar" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-blue-700">Acompanhar</Link>
            {userProfile && (userProfile.role === 'admin' || userProfile.role === 'staff') && (
              <Link to="/admin/dashboard" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md text-gold-beige font-bold">Painel do Amadeu</Link>
            )}
            {userProfile ? (
              <div className="px-3 py-2 space-y-2">
                <div className="flex items-center space-x-2 text-gold-beige">
                  <User className="w-4 h-4" />
                  <span className="font-bold">{userProfile.name}</span>
                </div>
                <button onClick={handleSignOut} className="w-full text-left block px-3 py-2 rounded-md hover:bg-red-700">Sair</button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block px-3 py-2 rounded-md hover:bg-blue-700">Login</Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Monitor className="w-6 h-6 text-gold-beige" />
            <span className="text-white text-lg font-bold">Amadeu Informática & Services</span>
          </div>
          <p className="mb-4">Qualidade e confiança em serviços tech e papelaria.</p>
          <div className="divider mx-auto w-24 opacity-20"></div>
          <p className="text-sm">© 2026 Amadeu Informática & Services. Todos os direitos reservados.</p>
        </div>
      </footer>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const path = 'users';
        try {
          const docRef = doc(db, path, user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          } else {
            // If user exists in Auth but not in Firestore, we might need to create it or handle it
            // For now, assume admin email is super admin
            if (user.email === 'dogin983@gmail.com') {
               setUserProfile({ uid: user.uid, email: user.email!, name: 'Super Admin', role: 'admin' });
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-off-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-royal-blue"></div>
      </div>
    );
  }

  return (
    <Router>
      <Layout userProfile={userProfile}>
        <Routes>
          <Route path="/" element={<Home userProfile={userProfile} />} />
          <Route path="/agendamento" element={<Scheduling />} />
          <Route path="/lanhouse" element={<LanHouse />} />
          <Route path="/acompanhar" element={<Tracking />} />
          <Route path="/login" element={<Login userProfile={userProfile} />} />
          <Route path="/admin" element={<Login userProfile={userProfile} />} />
          <Route path="/admin/dashboard/*" element={<AdminDashboard userProfile={userProfile} />} />
        </Routes>
      </Layout>
    </Router>
  );
}

