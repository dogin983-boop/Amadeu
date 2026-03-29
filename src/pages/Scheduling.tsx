import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Appointment, AppointmentStatus } from '../types';
import { toast } from 'sonner';
import { Wrench, CheckCircle2, Copy, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Scheduling() {
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    equipment: '',
    defectDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [trackingCode, setTrackingCode] = useState<string | null>(null);

  const generateTrackingCode = () => {
    return 'AM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const path = 'appointments';

    const code = generateTrackingCode();
    const appointment: Omit<Appointment, 'id'> = {
      ...formData,
      status: 'Em análise' as AppointmentStatus,
      trackingCode: code,
      createdAt: new Date().toISOString()
    };

    try {
      await addDoc(collection(db, path), {
        ...appointment,
        createdAt: serverTimestamp()
      });
      setTrackingCode(code);
      toast.success('Agendamento realizado com sucesso!');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Código copiado!');
  };

  if (trackingCode) {
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Agendamento Confirmado!</h2>
          <p className="text-gray-600 mb-6">Seu equipamento está em boas mãos. Guarde seu código de acompanhamento:</p>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300 flex items-center justify-between mb-6">
            <span className="text-2xl font-mono font-bold text-royal-blue tracking-widest">{trackingCode}</span>
            <button onClick={() => copyToClipboard(trackingCode)} className="text-gray-400 hover:text-royal-blue transition-colors">
              <Copy className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/acompanhar'}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <span>Acompanhar Status</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTrackingCode(null)}
              className="text-gray-500 hover:text-royal-blue text-sm font-semibold"
            >
              Fazer outro agendamento
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 bg-blue-50 text-royal-blue px-4 py-1 rounded-full text-sm font-bold">
          <Wrench className="w-4 h-4" />
          <span>Manutenção Especializada</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">Agende sua Manutenção</h1>
        <p className="text-gray-600">Preencha os dados abaixo para solicitar o reparo de seu computador ou console.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Nome Completo</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all"
                placeholder="Ex: João Silva"
                value={formData.customerName}
                onChange={e => setFormData({...formData, customerName: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Telefone / WhatsApp</label>
              <input
                required
                type="tel"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all"
                placeholder="Ex: (11) 99999-9999"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Equipamento</label>
              <input
                required
                type="text"
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all"
                placeholder="Ex: Notebook Dell G15 / PS5"
                value={formData.equipment}
                onChange={e => setFormData({...formData, equipment: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Descrição do Defeito</label>
              <textarea
                required
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-royal-blue focus:border-transparent outline-none transition-all resize-none"
                placeholder="Descreva o que está acontecendo..."
                value={formData.defectDescription}
                onChange={e => setFormData({...formData, defectDescription: e.target.value})}
              />
            </div>
            <button
              disabled={loading}
              type="submit"
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processando...' : 'Confirmar Agendamento'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-royal-blue text-white p-6 rounded-xl shadow-lg space-y-4">
            <h3 className="text-xl font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-6 h-6 text-gold-beige" />
              <span>Por que escolher a Amadeu?</span>
            </h3>
            <ul className="space-y-3 text-blue-100">
              <li className="flex items-start space-x-2">
                <span className="text-gold-beige font-bold">•</span>
                <span>Técnicos certificados com mais de 10 anos de experiência.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-gold-beige font-bold">•</span>
                <span>Orçamento transparente e sem compromisso.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-gold-beige font-bold">•</span>
                <span>Garantia de 90 dias em todos os serviços.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-gold-beige font-bold">•</span>
                <span>Acompanhamento em tempo real via código único.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gold-beige border-opacity-30 space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Localização & Contato</h3>
            <div className="space-y-2 text-gray-600 text-sm">
              <p>📍 Rua da Informática, 123 - Centro</p>
              <p>📞 (11) 99999-9999</p>
              <p>⏰ Seg a Sex: 09h às 18h | Sáb: 09h às 13h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
