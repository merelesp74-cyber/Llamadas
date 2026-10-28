import http from 'http';
import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';

const app = express();
const server = http.createServer(app);
const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Initial seed stores from the user's HTML
const SEED_STORES = [
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
  callDuration?: number; // seconds
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

// In-memory persistent state (with local file fallback if available)
const DATA_FILE = path.resolve(process.cwd(), '.stores_data.json');
let stores: StoreItem[] = [];
let history: CallHistoryItem[] = [];

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      if (Array.isArray(parsed.stores) && parsed.stores.length > 0) {
        stores = parsed.stores;
      }
      if (Array.isArray(parsed.history)) {
        history = parsed.history;
      }
    }
  } catch (e) {
    console.error('Error reading saved data file:', e);
  }

  if (stores.length === 0) {
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

    const seedList = SEED_STORES.map((name, i) => ({
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

    stores = [testStore, ...seedList];
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ stores, history }, null, 2), 'utf-8');
  } catch (e) {
    // Ignore file write errors if running in restricted env
  }
}

loadData();

// REST APIs
app.get('/api/stores', (_req: Request, res: Response) => {
  res.json({ stores, history });
});

app.post('/api/stores/update', (req: Request, res: Response) => {
  const updatedItem: StoreItem = req.body;
  if (!updatedItem || !updatedItem.id) {
    return res.status(400).json({ error: 'Store item with id required' });
  }

  const idx = stores.findIndex(s => s.id === updatedItem.id);
  if (idx !== -1) {
    stores[idx] = { ...stores[idx], ...updatedItem };
    
    // If call was completed, add to history if not duplicate for same date/hora
    if (updatedItem.done && updatedItem.date) {
      const existsInHistory = history.some(
        h => h.storeName === updatedItem.name && h.date === updatedItem.date && h.hora === updatedItem.hora
      );
      if (!existsInHistory) {
        history.unshift({
          id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          storeName: updatedItem.name,
          date: updatedItem.date,
          hora: updatedItem.hora || '',
          op: updatedItem.op || '',
          obs: updatedItem.obs || '',
          foto: updatedItem.foto || '',
          duration: updatedItem.callDuration || 0
        });
      }
    }
  } else {
    stores.push(updatedItem);
  }

  saveData();
  broadcast({ type: 'stores-synced', stores, history });
  res.json({ success: true, store: stores[idx] || updatedItem });
});

app.post('/api/stores/batch-reset', (_req: Request, res: Response) => {
  // Archive done calls into history before resetting
  stores.forEach(s => {
    if (s.done && s.date) {
      const exists = history.some(h => h.storeName === s.name && h.date === s.date && h.hora === s.hora);
      if (!exists) {
        history.unshift({
          id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          storeName: s.name,
          date: s.date,
          hora: s.hora || '',
          op: s.op || '',
          obs: s.obs || '',
          foto: s.foto || '',
          duration: s.callDuration || 0
        });
      }
    }
  });

  stores = stores.map(s => ({
    ...s,
    done: false,
    date: '',
    hora: '',
    op: '',
    obs: '',
    foto: '',
    callDuration: 0,
  }));

  saveData();
  broadcast({ type: 'stores-synced', stores, history });
  res.json({ success: true, stores, history });
});

app.post('/api/stores/add', (req: Request, res: Response) => {
  const { names, markDone, operator } = req.body;
  if (!Array.isArray(names)) {
    return res.status(400).json({ error: 'names array required' });
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().slice(0, 5);

  names.forEach((nameRaw: string) => {
    const name = nameRaw.trim();
    if (!name) return;
    const existing = stores.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      if (markDone) {
        existing.done = true;
        existing.date = today;
        existing.hora = now;
        if (operator) existing.op = operator;
      }
    } else {
      stores.push({
        id: `store-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name,
        done: !!markDone,
        date: markDone ? today : '',
        hora: markDone ? now : '',
        op: markDone && operator ? operator : '',
        obs: '',
        foto: '',
        callDuration: 0
      });
    }
  });

  saveData();
  broadcast({ type: 'stores-synced', stores, history });
  res.json({ success: true, stores });
});

app.post('/api/stores/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  stores = stores.filter(s => s.id !== id);
  saveData();
  broadcast({ type: 'stores-synced', stores, history });
  res.json({ success: true, stores });
});

// WebSocket Signaling for WebRTC
const wss = new WebSocketServer({ server });

interface ClientInfo {
  ws: WebSocket;
  clientId: string;
  role: 'operator' | 'branch';
  storeId?: string;
  storeName?: string;
  operatorName?: string;
  room?: string;
}

const clients = new Map<WebSocket, ClientInfo>();

function broadcast(data: object, exceptWs?: WebSocket) {
  const msg = JSON.stringify(data);
  for (const [ws, info] of clients.entries()) {
    if (ws !== exceptWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function broadcastToRoom(room: string, data: object, exceptWs?: WebSocket) {
  const msg = JSON.stringify(data);
  for (const [ws, info] of clients.entries()) {
    if (info.room === room && ws !== exceptWs && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function sendToClient(clientId: string, data: object) {
  const msg = JSON.stringify(data);
  for (const [ws, info] of clients.entries()) {
    if (info.clientId === clientId && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
      return true;
    }
  }
  return false;
}

function getOnlinePresence() {
  const presence: {
    branchesOnline: { [storeId: string]: { clientId: string; storeName: string; onlineSince: number } };
    operatorsOnline: { clientId: string; operatorName: string }[];
  } = {
    branchesOnline: {},
    operatorsOnline: []
  };

  for (const [_, info] of clients.entries()) {
    if (info.role === 'branch' && info.storeId) {
      presence.branchesOnline[info.storeId] = {
        clientId: info.clientId,
        storeName: info.storeName || '',
        onlineSince: Date.now()
      };
    } else if (info.role === 'operator') {
      presence.operatorsOnline.push({
        clientId: info.clientId,
        operatorName: info.operatorName || 'Operador'
      });
    }
  }

  return presence;
}

wss.on('connection', (ws: WebSocket) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  
  const clientInfo: ClientInfo = {
    ws,
    clientId,
    role: 'operator'
  };
  clients.set(ws, clientInfo);

  // Send welcome with clientId and presence
  ws.send(JSON.stringify({
    type: 'welcome',
    clientId,
    presence: getOnlinePresence(),
    stores,
    history
  }));

  ws.on('message', (raw: string) => {
    try {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case 'register': {
          clientInfo.role = msg.role || 'operator';
          clientInfo.storeId = msg.storeId;
          clientInfo.storeName = msg.storeName;
          clientInfo.operatorName = msg.operatorName;
          broadcast({ type: 'presence-update', presence: getOnlinePresence() });
          break;
        }

        case 'join-room': {
          const room = msg.room;
          clientInfo.room = room;

          // Find other peers in this room
          const peersInRoom: { clientId: string; role: string; name?: string }[] = [];
          for (const [otherWs, otherInfo] of clients.entries()) {
            if (otherWs !== ws && otherInfo.room === room) {
              peersInRoom.push({
                clientId: otherInfo.clientId,
                role: otherInfo.role,
                name: otherInfo.role === 'branch' ? otherInfo.storeName : otherInfo.operatorName
              });
            }
          }

          // Reply to joiner with existing peers
          ws.send(JSON.stringify({
            type: 'room-joined',
            room,
            peers: peersInRoom
          }));

          // Notify peers in room that a new peer arrived
          broadcastToRoom(room, {
            type: 'peer-joined',
            room,
            peer: {
              clientId: clientInfo.clientId,
              role: clientInfo.role,
              name: clientInfo.role === 'branch' ? clientInfo.storeName : clientInfo.operatorName
            }
          }, ws);
          break;
        }

        case 'leave-room': {
          if (clientInfo.room) {
            broadcastToRoom(clientInfo.room, {
              type: 'peer-left',
              room: clientInfo.room,
              clientId: clientInfo.clientId
            }, ws);
            clientInfo.room = undefined;
          }
          break;
        }

        case 'call-invite': {
          // Direct call invitation to a specific client or store
          const targetClientId = msg.targetClientId;
          const storeId = msg.storeId;
          let sent = false;

          if (targetClientId) {
            sent = sendToClient(targetClientId, {
              type: 'incoming-call',
              fromClientId: clientInfo.clientId,
              callerName: msg.callerName || clientInfo.operatorName || 'Jefatura de Prevención',
              room: msg.room,
              storeId: msg.storeId,
              storeName: msg.storeName
            });
          } else if (storeId) {
            // Find branch client for this store
            for (const [_, info] of clients.entries()) {
              if (info.role === 'branch' && info.storeId === storeId) {
                sendToClient(info.clientId, {
                  type: 'incoming-call',
                  fromClientId: clientInfo.clientId,
                  callerName: msg.callerName || clientInfo.operatorName || 'Jefatura de Prevención',
                  room: msg.room,
                  storeId: msg.storeId,
                  storeName: msg.storeName
                });
                sent = true;
                break;
              }
            }
          }

          ws.send(JSON.stringify({
            type: 'call-invite-sent',
            success: sent,
            room: msg.room
          }));
          break;
        }

        case 'call-accepted': {
          sendToClient(msg.targetClientId, {
            type: 'call-accepted',
            byClientId: clientInfo.clientId,
            room: msg.room
          });
          break;
        }

        case 'call-rejected': {
          sendToClient(msg.targetClientId, {
            type: 'call-rejected',
            byClientId: clientInfo.clientId,
            reason: msg.reason || 'Ocupado o cancelado',
            room: msg.room
          });
          break;
        }

        case 'signal': {
          // WebRTC signaling: offer, answer, ice-candidate
          const { targetClientId, signalData } = msg;
          if (targetClientId) {
            sendToClient(targetClientId, {
              type: 'signal',
              fromClientId: clientInfo.clientId,
              signalData
            });
          }
          break;
        }

        case 'chat-message': {
          if (clientInfo.room) {
            broadcastToRoom(clientInfo.room, {
              type: 'chat-message',
              fromClientId: clientInfo.clientId,
              senderName: msg.senderName,
              text: msg.text,
              timestamp: Date.now()
            });
          }
          break;
        }

        case 'sync-store': {
          const storeItem = msg.store;
          if (storeItem && storeItem.id) {
            const idx = stores.findIndex(s => s.id === storeItem.id);
            if (idx !== -1) {
              stores[idx] = { ...stores[idx], ...storeItem };
            }
            saveData();
            broadcast({ type: 'stores-synced', stores, history }, ws);
          }
          break;
        }
      }
    } catch (e) {
      console.error('WebSocket parse error:', e);
    }
  });

  ws.on('close', () => {
    if (clientInfo.room) {
      broadcastToRoom(clientInfo.room, {
        type: 'peer-left',
        room: clientInfo.room,
        clientId: clientInfo.clientId
      });
    }
    clients.delete(ws);
    broadcast({ type: 'presence-update', presence: getOnlinePresence() });
  });
});

// Setup Vite dev server or serve static build
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
