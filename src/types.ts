export type UserRole = 'admin' | 'staff' | 'client';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export type Category = 'Lan House' | 'Papelaria' | 'Tech' | 'Fotografia' | 'Topos de Bolo' | 'Manutenção';

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  category: Category;
  imageUrl: string;
  active: boolean;
}

export type AppointmentStatus = 'Em análise' | 'Pendente' | 'Pronto';

export interface Appointment {
  id?: string;
  customerName: string;
  phone: string;
  equipment: string;
  defectDescription: string;
  status: AppointmentStatus;
  trackingCode: string;
  createdAt: string;
}

export type ReservationDuration = '1h' | '2h' | 'Corujão';

export interface GameReservation {
  id?: string;
  customerName: string;
  machineId: string;
  startTime: string;
  duration: ReservationDuration;
  createdAt: string;
}
