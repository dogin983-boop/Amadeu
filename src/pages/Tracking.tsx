import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Appointment } from '../types';
import { toast } from 'sonner';
import { Search, Wrench, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Tracking() {
  const [trackingCode, setTrackingCode] = useState('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) return;

    setLoading(true);
    setSearched(true);
    const path = 'appointments';
    try {
      const q = query(collection(db, path), where('trackingCode', '==', trackingCode.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data() as Appointment;
        setAppointment({ id: querySnapshot.docs[0].id, ...data });
      } else {
        setAppointment(null);
        toast.error('Código não encontrado. Verifique e tente novamente.');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Em análise': return <Search className="w-6 h-6 text-blue-500" />;
      case 'Pendente': return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'Pronto': return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      default: return <AlertCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em análise': return 'bg-blue-100 text-blue-700';
      case 'Pendente': return 'bg-yellow-100 text-yellow-700';
      case 'Pronto': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Acompanhe sua Manutenção</h1>
        <p className="text-gray-600">Insira seu código de acompanhamento para ver o status em tempo real.</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-grow relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all font-mono uppercase tracking-widest"
              placeholder="EX: AM-XXXXXX"
              value={trackingCode}
              onChange={e => setTrackingCode(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            type="submit"
            className="btn-primary py-3 px-8 disabled:opacity-50"
          >
            {loading ? 'Buscando...' : 'Consultar'}
          </button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-royal-blue"></div>
        </div>
      ) : searched && appointment ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
        >
          <div className="bg-royal-blue p-6 text-white flex justify-between items-center">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Código de Acompanhamento</p>
              <h2 className="text-2xl font-mono font-bold">{appointment.trackingCode}</h2>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 ${getStatusColor(appointment.status)}`}>
              {getStatusIcon(appointment.status)}
              <span>{appointment.status}</span>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Wrench className="w-5 h-5 text-gold-beige mt-1" />
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Equipamento</p>
                    <p className="font-bold text-gray-800">{appointment.equipment}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-gold-beige mt-1" />
                  <div>
                    <p className="text-xs text-gray-400 font-bold uppercase">Data de Entrada</p>
                    <p className="font-bold text-gray-800">
                      {appointment.createdAt ? format(new Date(appointment.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase mb-1">Descrição do Defeito</p>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                    "{appointment.defectDescription}"
                  </p>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Histórico de Status</h3>
              <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                <div className="flex items-center space-x-4 relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${appointment.status === 'Em análise' ? 'bg-royal-blue' : 'bg-green-500'}`}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-sm">Recebido & Em Análise</p>
                    <p className="text-xs text-gray-400">Técnico está avaliando o problema.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${appointment.status === 'Pendente' ? 'bg-royal-blue' : (appointment.status === 'Pronto' ? 'bg-green-500' : 'bg-gray-200')}`}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-sm">Aguardando Peças / Reparo</p>
                    <p className="text-xs text-gray-400">O reparo está sendo executado.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 relative z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${appointment.status === 'Pronto' ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-grow">
                    <p className="font-bold text-sm">Pronto para Retirada</p>
                    <p className="text-xs text-gray-400">Pode vir buscar seu equipamento!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : searched && !appointment && (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-gray-800">Código não encontrado</h2>
          <p className="text-gray-500">Verifique se digitou o código corretamente (Ex: AM-123456).</p>
        </div>
      )}
    </div>
  );
}
