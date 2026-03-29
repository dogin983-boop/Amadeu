import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { GameReservation, ReservationDuration } from '../types';
import { toast } from 'sonner';
import { Gamepad2, Monitor, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

const MACHINES = [
  { id: 'M1', name: 'PC Gamer 01 (RTX 3060)' },
  { id: 'M2', name: 'PC Gamer 02 (RTX 3060)' },
  { id: 'M3', name: 'PC Gamer 03 (RTX 3070)' },
  { id: 'M4', name: 'PC Gamer 04 (RTX 3070)' },
  { id: 'PS5-1', name: 'PlayStation 5 - Console 01' },
  { id: 'PS5-2', name: 'PlayStation 5 - Console 02' },
];

const PACKAGES: { id: ReservationDuration, label: string, price: number }[] = [
  { id: '1h', label: '1 Hora', price: 10 },
  { id: '2h', label: '2 Horas', price: 18 },
  { id: 'Corujão', label: 'Corujão (22h - 06h)', price: 45 },
];

export default function LanHouse() {
  const [formData, setFormData] = useState({
    customerName: '',
    machineId: '',
    startTime: '',
    duration: '1h' as ReservationDuration
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const path = 'game_reservations';

    const reservation: Omit<GameReservation, 'id'> = {
      ...formData,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, path), {
        ...reservation,
        createdAt: serverTimestamp()
      });
      setSuccess(true);
      toast.success('Reserva realizada com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl border-2 border-green-100"
        >
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Reserva Confirmada!</h2>
          <p className="text-gray-600 mb-6">Sua máquina está reservada. Compareça no horário marcado para garantir seu lugar.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="btn-primary w-full"
          >
            Fazer outra reserva
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-royal-blue px-4 py-1 rounded-full text-sm font-bold">
          <Gamepad2 className="w-4 h-4" />
          <span>Arena Gamer Amadeu</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Reserve sua Máquina</h1>
        <p className="text-gray-600">Garanta seu lugar na melhor Lan House da região. Escolha seu pacote e divirta-se!</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reservation Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Seu Nome</label>
                <input
                  required
                  type="text"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Carlos Oliveira"
                  value={formData.customerName}
                  onChange={e => setFormData({...formData, customerName: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Escolha a Máquina</label>
                <select
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all"
                  value={formData.machineId}
                  onChange={e => setFormData({...formData, machineId: e.target.value})}
                >
                  <option value="">Selecione...</option>
                  {MACHINES.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Data e Hora de Início</label>
                <input
                  required
                  type="datetime-local"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all"
                  value={formData.startTime}
                  onChange={e => setFormData({...formData, startTime: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Pacote de Tempo</label>
                <select
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all"
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: e.target.value as ReservationDuration})}
                >
                  {PACKAGES.map(p => (
                    <option key={p.id} value={p.id}>{p.label} - R$ {p.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              disabled={loading}
              type="submit"
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{loading ? 'Processando...' : 'Confirmar Reserva'}</span>
            </button>
          </form>
        </div>

        {/* Info Cards */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-lg font-bold text-royal-blue flex items-center space-x-2">
              <Monitor className="w-5 h-5" />
              <span>Nossos Equipamentos</span>
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-bold text-royal-blue">PC Gamer Ultra</p>
                <p>NVIDIA RTX 3070, 32GB RAM, Monitor 144Hz</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="font-bold text-royal-blue">Consoles Next-Gen</p>
                <p>PlayStation 5 com TV 4K HDR</p>
              </div>
            </div>
          </div>

          <div className="bg-gold-beige text-white p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-lg font-bold flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Horário de Funcionamento</span>
            </h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span>Segunda a Quinta:</span> <span>09h - 22h</span></p>
              <p className="flex justify-between"><span>Sexta e Sábado:</span> <span>09h - 06h (Corujão)</span></p>
              <p className="flex justify-between"><span>Domingo:</span> <span>14h - 20h</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
