import { useState, useEffect, useRef, useCallback } from 'react';
import { PresenceInfo, ChatMessage } from '../types';
import {
  startOutgoingRing,
  startIncomingRing,
  stopRingTones,
  playConnectedTone,
  playHangupTone,
  createAudioLevelMeter
} from '../utils/audioEffects';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export interface IncomingCallData {
  fromClientId: string;
  callerName: string;
  room: string;
  storeId?: string;
  storeName?: string;
}

export interface UseWebRTCOptions {
  role: 'operator' | 'branch';
  storeId?: string;
  storeName?: string;
  operatorName?: string;
  onStoreUpdate?: (store: any) => void;
  onStoresSynced?: (stores: any[], history: any[]) => void;
}

export function useWebRTC(options: UseWebRTCOptions) {
  const { role, storeId, storeName, operatorName, onStoresSynced } = options;

  const [connectedWs, setConnectedWs] = useState(false);
  const [clientId, setClientId] = useState<string>(() => {
    return 'client-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
  });
  const [presence, setPresence] = useState<PresenceInfo>({ branchesOnline: {}, operatorsOnline: [] });

  // Call State
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [activeRoom, setActiveRoom] = useState<string>('');
  const [activePeerName, setActivePeerName] = useState<string>('');
  const [activeStoreName, setActiveStoreName] = useState<string>('');
  const [activeStoreId, setActiveStoreId] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);
  const [isTestMode, setIsTestMode] = useState(false);

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // In-call chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Incoming call state
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const remotePeerIdRef = useRef<string | null>(null);
  const callTimerRef = useRef<number | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const cameraTrackRef = useRef<MediaStreamTrack | null>(null);

  // Unified signaling dispatcher (WebSocket + BroadcastChannel for Vercel/offline cross-tab)
  const sendSignaling = useCallback((msg: any) => {
    const payload = { ...msg, fromClientId: clientId, senderClientId: clientId };
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(payload));
      } catch (e) {}
    }
    if (bcRef.current) {
      try {
        bcRef.current.postMessage(payload);
      } catch (e) {}
    }
  }, [clientId]);

  // Setup BroadcastChannel for fallback on static hosting / Vercel
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('webrtc_signaling_stores_v1');
      bc.onmessage = (event) => {
        const msg = event.data;
        if (!msg || msg.senderClientId === clientId) return; // ignore self
        handleIncomingMessage(msg);
      };
      bcRef.current = bc;

      // Broadcast branch presence if in branch mode
      if (role === 'branch' && storeId) {
        bc.postMessage({
          type: 'branch-presence-announcement',
          storeId,
          storeName,
          clientId,
          senderClientId: clientId
        });
      }

      return () => {
        bc.close();
      };
    }
  }, [clientId, role, storeId, storeName]);

  // Initialize WebSocket connection (if available)
  const connectWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setConnectedWs(true);
        ws.send(JSON.stringify({
          type: 'register',
          role,
          storeId,
          storeName,
          operatorName
        }));
      };

      ws.onclose = () => {
        setConnectedWs(false);
      };

      ws.onerror = () => {
        setConnectedWs(false);
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          handleIncomingMessage(msg);
        } catch (e) {}
      };

      wsRef.current = ws;
    } catch (e) {
      // Static host fallback
    }
  }, [role, storeId, storeName, operatorName]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      callTimerRef.current = window.setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      if (callTimerRef.current !== null) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      if (callStatus === 'idle') {
        setCallDuration(0);
      }
    }
    return () => {
      if (callTimerRef.current !== null) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus]);

  // Audio level visualizer for local stream
  useEffect(() => {
    if (!localStream || isAudioMuted) {
      setAudioLevel(0);
      return;
    }
    const cleanup = createAudioLevelMeter(localStream, (lvl) => {
      setAudioLevel(lvl);
    });
    return cleanup;
  }, [localStream, isAudioMuted]);

  // Handle incoming messages (from either WS or BroadcastChannel)
  const handleIncomingMessage = async (msg: any) => {
    switch (msg.type) {
      case 'welcome':
        if (msg.clientId) setClientId(msg.clientId);
        if (msg.presence) setPresence(msg.presence);
        if (msg.stores && onStoresSynced) {
          onStoresSynced(msg.stores, msg.history || []);
        }
        break;

      case 'branch-presence-announcement':
        if (msg.storeId) {
          setPresence((prev) => ({
            ...prev,
            branchesOnline: {
              ...prev.branchesOnline,
              [msg.storeId]: {
                clientId: msg.clientId,
                storeName: msg.storeName || '',
                onlineSince: Date.now()
              }
            }
          }));
        }
        break;

      case 'presence-update':
        if (msg.presence) setPresence(msg.presence);
        break;

      case 'stores-synced':
        if (onStoresSynced) {
          onStoresSynced(msg.stores, msg.history || []);
        }
        break;

      case 'incoming-call':
        // Check if targeted to this branch or role
        if (role === 'branch' || (storeId && msg.storeId === storeId)) {
          startIncomingRing();
          setIncomingCall({
            fromClientId: msg.fromClientId,
            callerName: msg.callerName,
            room: msg.room,
            storeId: msg.storeId,
            storeName: msg.storeName
          });
        }
        break;

      case 'call-accepted':
        stopRingTones();
        playConnectedTone();
        setCallStatus('connected');
        break;

      case 'call-rejected':
        stopRingTones();
        playHangupTone();
        alert(msg.reason || 'Llamada no contestada o rechazada.');
        endCallClean();
        break;

      case 'join-room': {
        // Someone joined this room
        if (msg.room === activeRoom) {
          remotePeerIdRef.current = msg.fromClientId;
          // Reply with room-joined or trigger offer
          await createAndSendOffer(msg.fromClientId);
        }
        break;
      }

      case 'room-joined': {
        const peers = msg.peers || [];
        if (peers.length > 0) {
          const peer = peers[0];
          remotePeerIdRef.current = peer.clientId;
          setActivePeerName(peer.name || (peer.role === 'branch' ? 'Sucursal' : 'Operador'));
          await createAndSendOffer(peer.clientId);
        }
        break;
      }

      case 'peer-joined': {
        remotePeerIdRef.current = msg.peer.clientId;
        setActivePeerName(msg.peer.name || (msg.peer.role === 'branch' ? 'Sucursal' : 'Operador'));
        break;
      }

      case 'peer-left':
        if (msg.clientId === remotePeerIdRef.current) {
          playHangupTone();
          endCallClean();
        }
        break;

      case 'signal': {
        const { fromClientId, signalData } = msg;
        if (msg.targetClientId && msg.targetClientId !== clientId) return;
        remotePeerIdRef.current = fromClientId;
        await handleSignalData(fromClientId, signalData);
        break;
      }

      case 'chat-message':
        setChatMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            fromClientId: msg.fromClientId,
            senderName: msg.senderName,
            text: msg.text,
            timestamp: msg.timestamp || Date.now()
          }
        ]);
        break;
    }
  };

  // Setup PeerConnection
  const getOrCreatePeerConnection = (targetClientId: string): RTCPeerConnection => {
    if (pcRef.current) {
      return pcRef.current;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignaling({
          type: 'signal',
          targetClientId,
          signalData: {
            type: 'candidate',
            candidate: event.candidate
          }
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      } else {
        const inboundStream = new MediaStream([event.track]);
        setRemoteStream(inboundStream);
      }
      playConnectedTone();
      setCallStatus('connected');
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        stopRingTones();
        setCallStatus('connected');
      }
    };

    pcRef.current = pc;
    return pc;
  };

  // Process WebRTC signal data
  const handleSignalData = async (fromClientId: string, signalData: any) => {
    try {
      if (signalData.type === 'offer') {
        const pc = getOrCreatePeerConnection(fromClientId);

        if (localStream) {
          localStream.getTracks().forEach((track) => {
            pc.addTrack(track, localStream);
          });
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));

        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          if (candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        sendSignaling({
          type: 'signal',
          targetClientId: fromClientId,
          signalData: {
            type: 'answer',
            sdp: answer
          }
        });
      } else if (signalData.type === 'answer') {
        if (pcRef.current) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
          while (iceCandidatesQueue.current.length > 0) {
            const candidate = iceCandidatesQueue.current.shift();
            if (candidate) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
          }
        }
      } else if (signalData.type === 'candidate') {
        if (pcRef.current && pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        } else {
          iceCandidatesQueue.current.push(signalData.candidate);
        }
      }
    } catch (e) {
      console.error('Error handling WebRTC signal:', e);
    }
  };

  // Create & send WebRTC Offer
  const createAndSendOffer = async (targetClientId: string) => {
    try {
      const pc = getOrCreatePeerConnection(targetClientId);

      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);

      sendSignaling({
        type: 'signal',
        targetClientId,
        signalData: {
          type: 'offer',
          sdp: offer
        }
      });
    } catch (e) {
      console.error('Failed to create offer:', e);
    }
  };

  // Obtain user media
  const startUserMedia = async (preferredFacing: 'user' | 'environment' = 'user'): Promise<MediaStream | null> => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: preferredFacing
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      cameraTrackRef.current = stream.getVideoTracks()[0] || null;
      return stream;
    } catch (err) {
      console.warn('Could not access video+audio, trying audio only:', err);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setLocalStream(audioStream);
        return audioStream;
      } catch (audioErr) {
        console.error('Microphone access denied:', audioErr);
        return null;
      }
    }
  };

  // Initiate an Outbound Call
  const startCall = async (targetStore: { id: string; name: string }, targetClient?: string) => {
    setIsTestMode(false);
    setActiveStoreId(targetStore.id);
    setActiveStoreName(targetStore.name);
    const room = `call-${targetStore.id}-${Date.now()}`;
    setActiveRoom(room);
    setIsInCall(true);
    setCallStatus('calling');
    setChatMessages([]);
    startOutgoingRing();

    await startUserMedia(facingMode);

    sendSignaling({
      type: 'join-room',
      room
    });

    sendSignaling({
      type: 'call-invite',
      targetClientId: targetClient,
      storeId: targetStore.id,
      storeName: targetStore.name,
      room,
      callerName: operatorName || 'Jefatura de Prevención'
    });

    setTimeout(() => {
      if (callStatus === 'calling') {
        stopRingTones();
      }
    }, 40000);

    return room;
  };

  // Start self loopback / test mode (instant verification)
  const startSelfTestCall = async () => {
    setIsTestMode(true);
    setActiveStoreId('test-room');
    setActiveStoreName('Prueba de Sistema / Dispositivos');
    setActivePeerName('Bucle Local (Auto-Prueba WebRTC)');
    setActiveRoom('room-test-loopback');
    setIsInCall(true);
    setCallStatus('connected');
    setChatMessages([
      {
        id: 'msg-sys-1',
        fromClientId: 'system',
        senderName: 'Sistema WebRTC',
        text: 'Modo de prueba activo. Puedes probar tu cámara, micrófono y captura de evidencia fotográfica.',
        timestamp: Date.now()
      }
    ]);

    const stream = await startUserMedia(facingMode);
    if (stream) {
      setRemoteStream(stream);
    }
  };

  // Accept incoming call
  const acceptIncomingCall = async () => {
    if (!incomingCall) return;

    stopRingTones();
    const { fromClientId, room, storeId, storeName: incStoreName, callerName } = incomingCall;
    setIncomingCall(null);

    setIsTestMode(false);
    if (storeId) setActiveStoreId(storeId);
    if (incStoreName) setActiveStoreName(incStoreName);
    setActivePeerName(callerName || 'Operador');
    setActiveRoom(room);
    setIsInCall(true);
    setCallStatus('connected');
    setChatMessages([]);

    await startUserMedia(facingMode);

    sendSignaling({
      type: 'call-accepted',
      targetClientId: fromClientId,
      room
    });

    sendSignaling({
      type: 'join-room',
      room
    });
  };

  // Reject incoming call
  const rejectIncomingCall = () => {
    if (!incomingCall) return;
    stopRingTones();
    sendSignaling({
      type: 'call-rejected',
      targetClientId: incomingCall.fromClientId,
      reason: 'Llamada rechazada por el usuario',
      room: incomingCall.room
    });
    setIncomingCall(null);
  };

  // Clean end call
  const endCallClean = () => {
    stopRingTones();

    if (callTimerRef.current !== null) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      setLocalStream(null);
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (activeRoom) {
      sendSignaling({
        type: 'leave-room',
        room: activeRoom
      });
    }

    setRemoteStream(null);
    setIsInCall(false);
    setCallStatus('idle');
    setIsScreenSharing(false);
    setIsAudioMuted(false);
    setIsVideoMuted(false);
    remotePeerIdRef.current = null;
    iceCandidatesQueue.current = [];
  };

  // Media Controls
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoMuted(!videoTrack.enabled);
      }
    }
  };

  const flipCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    const newStream = await startUserMedia(nextFacing);
    if (newStream && pcRef.current) {
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (sender && newVideoTrack) {
        sender.replaceTrack(newVideoTrack);
      }
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (cameraTrackRef.current && pcRef.current) {
        const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(cameraTrackRef.current);
        }
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (cameraTrackRef.current && pcRef.current) {
            const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(cameraTrackRef.current);
          }
        };

        setIsScreenSharing(true);
      } catch (err) {
        console.warn('Screen share canceled or failed:', err);
      }
    }
  };

  // Snapshot capture directly from remote video
  const captureSnapshot = (videoElement: HTMLVideoElement | null): string | null => {
    if (!videoElement) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth || 1280;
      canvas.height = videoElement.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return dataUrl;
    } catch (e) {
      console.error('Failed to capture snapshot:', e);
      return null;
    }
  };

  // Send in-call chat message
  const sendChatMessage = (text: string) => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      fromClientId: clientId,
      senderName: operatorName || (role === 'branch' ? storeName || 'Sucursal' : 'Operador'),
      text: text.trim(),
      timestamp: Date.now()
    };

    if (isTestMode) {
      setChatMessages((prev) => [...prev, msg]);
      return;
    }

    sendSignaling({
      type: 'chat-message',
      senderName: msg.senderName,
      text: msg.text
    });
  };

  return {
    connectedWs,
    clientId,
    presence,
    // Call status
    isInCall,
    callStatus,
    activeRoom,
    activePeerName,
    activeStoreName,
    activeStoreId,
    callDuration,
    isTestMode,
    // Media
    localStream,
    remoteStream,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    audioLevel,
    facingMode,
    // Actions
    startCall,
    startSelfTestCall,
    endCall: endCallClean,
    toggleAudio,
    toggleVideo,
    flipCamera,
    toggleScreenShare,
    captureSnapshot,
    // Incoming
    incomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    // Chat
    chatMessages,
    sendChatMessage
  };
}
