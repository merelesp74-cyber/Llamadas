export interface StoreItem {
  id: string;
  name: string;
  phone?: string;
  done: boolean;
  date: string;
  hora: string;
  op: string;
  obs: string;
  foto?: string;
  callDuration?: number;
}

export interface CallHistoryItem {
  id: string;
  storeName: string;
  phone?: string;
  date: string;
  hora: string;
  op: string;
  obs: string;
  foto?: string;
  duration?: number;
}

export interface PresenceInfo {
  branchesOnline: { [storeId: string]: { clientId: string; storeName: string; onlineSince: number } };
  operatorsOnline: { clientId: string; operatorName: string }[];
}

export interface ChatMessage {
  id: string;
  fromClientId: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface CallSession {
  room: string;
  storeId?: string;
  storeName: string;
  targetClientId?: string;
  isInitiator: boolean;
  status: 'calling' | 'ringing' | 'connected' | 'ended';
  operatorName: string;
  startTime?: number;
  duration: number;
}

export const SEED_STORES = [
  "10 DE JULIO", "21 PROYECTADAS", "ACOSTA ÑU", "AMERICO PICCO", "AVDA. FERNANDO",
  "AVDA. PARAGUAY", "AVENIDA ESPAÑA", "BERNARDINO CABALLERO", "BOQUERON", "BRASILIA",
  "BRITEZ BORGES", "CAMPO JORDAN", "CAMPO VIA", "FIGUEROA", "GRAL SANTOS 2",
  "GUATAMBU", "LA VICTORIA", "LAS MERCEDES", "LAS RESIDENTAS", "MOLAS LOPEZ",
  "MOMPOX", "NANAWA", "PA’I ÑU", "PALMA LOMA", "PANCHITO LOPEZ", "PATRICIO ESCOBAR",
  "PERU", "PINEDO", "PIQUETE CUE", "PITIANTUTA", "PRATT GILL", "RCA. DE COLOMBIA",
  "S6 EXPRESS 1ER. PRESIDENTE", "S6 EXPRESS MOEITY", "S6 EXPRESS OVIEDO",
  "S6 EXPRESS R.I. 6 BOQUERON", "S6 EXPRESS SAN MARTIN", "S6 MOLAS LOPEZ",
  "S6 EXPRESS SAN BERNARDINO", "S6 SAN BER 2", "S6 EXPRESS YACHT", "SACRAMENTO",
  "SAJONIA 1", "SAJONIA 2", "SAN ISIDRO", "SAN LORENZO", "SOLDADO OVELAR",
  "STOCK EXPRESS 1ER. PRESIDENTE", "STOCK EXPRESS OVIEDO", "TOBATI", "TTE MOLAS",
  "VILLA HAYES", "ZEBALLOS"
];

export function getDefaultStores(): StoreItem[] {
  const testStore: StoreItem = {
    id: 'store-0-jefatura-prueba',
    name: 'JEFATURA (LOCAL DE PRUEBA)',
    phone: '+595 982 701750',
    done: false,
    date: '',
    hora: '',
    op: 'Jefatura de Prevención',
    obs: 'Línea de prueba de Jefatura de Prevención para pruebas de videollamadas WebRTC y enlace directo.',
    foto: '',
    callDuration: 0,
  };

  const seedStores = SEED_STORES.map((name, i) => ({
    id: `store-${i + 1}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
    name,
    phone: '',
    done: false,
    date: '',
    hora: '',
    op: '',
    obs: '',
    foto: '',
    callDuration: 0,
  }));

  return [testStore, ...seedStores];
}

