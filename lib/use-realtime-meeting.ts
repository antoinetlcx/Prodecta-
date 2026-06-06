"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  LiveCoachResponse,
  LiveSessionState,
  LiveTranscriptSegment,
  MeetingContext
} from "./types";
import { loadLocalValue, saveLocalValue, STORAGE_KEYS } from "./local-store";
import {
  completeTranscriptSegment,
  estimateSellerTalkRatio,
  mergeTranscriptDelta,
  mergeUniqueCoachingEvents,
  mergeUniqueSignals,
  normalizeRealtimeTranscriptEvent,
  transcriptSegmentsToText
} from "./realtime-utils";

type ApiEnvelope<T> = {
  demoMode: boolean;
  model: string;
  data: T;
};

type RealtimeStartOptions = {
  includeTabAudio?: boolean;
};

type UseRealtimeMeetingOptions = {
  context: MeetingContext;
  currentStepId: string;
  manualSignals: string[];
};

function initialLiveState(): LiveSessionState {
  return {
    status: "idle",
    error: null,
    warning: null,
    startedAt: null,
    micActive: false,
    tabAudioActive: false,
    transcriptSegments: [],
    coachingEvents: [],
    detectedSignals: [],
    sellerTalkRatio: 50,
    nextBestAction: null
  };
}

export function useRealtimeMeeting({
  context,
  currentStepId,
  manualSignals
}: UseRealtimeMeetingOptions) {
  const [state, setState] = useState<LiveSessionState>(() => initialLiveState());
  const [storageReady, setStorageReady] = useState(false);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const tabStreamRef = useRef<MediaStream | null>(null);
  const loadedLocalRef = useRef(false);
  const lastCoachedLengthRef = useRef(0);

  const transcriptText = useMemo(
    () => transcriptSegmentsToText(state.transcriptSegments),
    [state.transcriptSegments]
  );

  const stopMedia = useCallback(() => {
    dataChannelRef.current?.close();
    dataChannelRef.current = null;
    peerRef.current?.getSenders().forEach((sender) => sender.track?.stop());
    peerRef.current?.close();
    peerRef.current = null;
    micStreamRef.current?.getTracks().forEach((track) => track.stop());
    tabStreamRef.current?.getTracks().forEach((track) => track.stop());
    micStreamRef.current = null;
    tabStreamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    setState((previous) => ({ ...previous, status: "stopping" }));
    stopMedia();
    setState((previous) => ({
      ...previous,
      status: "idle",
      micActive: false,
      tabAudioActive: false
    }));
  }, [stopMedia]);

  const clearTranscript = useCallback(() => {
    setState((previous) => ({
      ...previous,
      transcriptSegments: [],
      coachingEvents: [],
      detectedSignals: [],
      sellerTalkRatio: 50,
      nextBestAction: null
    }));
    saveLocalValue(STORAGE_KEYS.liveTranscript, []);
    saveLocalValue(STORAGE_KEYS.liveCoaching, []);
  }, []);

  const handleRealtimeMessage = useCallback((message: MessageEvent<string>) => {
    let payload: unknown;
    try {
      payload = JSON.parse(message.data);
    } catch {
      return;
    }

    const normalized = normalizeRealtimeTranscriptEvent(payload);
    if (!normalized) return;

    if (normalized.kind === "error") {
      setState((previous) => ({
        ...previous,
        status: "error",
        error: normalized.text || "Erreur Realtime"
      }));
      return;
    }

    setState((previous) => {
      const nextSegments =
        normalized.kind === "delta"
          ? mergeTranscriptDelta(previous.transcriptSegments, normalized.itemId, normalized.text)
          : completeTranscriptSegment(
              previous.transcriptSegments,
              normalized.itemId,
              normalized.text
            );

      return {
        ...previous,
        transcriptSegments: nextSegments,
        sellerTalkRatio: estimateSellerTalkRatio(nextSegments)
      };
    });
  }, []);

  const requestCoaching = useCallback(async () => {
    const transcript = transcriptSegmentsToText(state.transcriptSegments);
    if (!transcript.trim() && manualSignals.length === 0) {
      setState((previous) => ({
        ...previous,
        error: "Il faut au moins un morceau de transcript ou un signal manuel pour coacher."
      }));
      return;
    }

    const previousStatus = state.status;
    setState((previous) => ({ ...previous, status: "coaching", error: null }));

    try {
      const response = await fetch("/api/live-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          transcript,
          segments: state.transcriptSegments,
          manualSignals,
          currentStepId
        })
      });

      if (!response.ok) {
        throw new Error(await readApiError(response));
      }

      const envelope = (await response.json()) as ApiEnvelope<LiveCoachResponse>;
      setState((previous) => ({
        ...previous,
        status: peerRef.current ? "connected" : previousStatus === "coaching" ? "idle" : previousStatus,
        coachingEvents: mergeUniqueCoachingEvents(previous.coachingEvents, envelope.data.events),
        detectedSignals: mergeUniqueSignals(previous.detectedSignals, envelope.data.detectedSignals),
        sellerTalkRatio: envelope.data.sellerTalkRatio,
        nextBestAction: envelope.data.nextBestAction,
        warning: envelope.demoMode
          ? "Coaching live en mode demo local : ajoutez OPENAI_API_KEY pour l'analyse IA."
          : previous.warning
      }));
    } catch (error) {
      setState((previous) => ({
        ...previous,
        status: peerRef.current ? "connected" : "error",
        error: error instanceof Error ? error.message : "Coaching live impossible"
      }));
    }
  }, [context, currentStepId, manualSignals, state.status, state.transcriptSegments]);

  const start = useCallback(
    async ({ includeTabAudio = true }: RealtimeStartOptions = {}) => {
      if (state.status === "connected" || state.status === "connecting" || state.status === "permission") {
        return;
      }

      if (!context.consentObtained) {
        setState((previous) => ({
          ...previous,
          status: "error",
          error:
            "Consentement non confirme. Informez les interlocuteurs puis cochez le consentement dans la preparation RDV."
        }));
        return;
      }

      if (
        typeof window === "undefined" ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof RTCPeerConnection === "undefined"
      ) {
        setState((previous) => ({
          ...previous,
          status: "unsupported",
          error: "Votre navigateur ne supporte pas l'ecoute active WebRTC. Utilisez Chrome ou le mode manuel."
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        status: "permission",
        error: null,
        warning: null
      }));

      let warning: string | null = null;

      try {
        const readiness = await fetch("/api/realtime/session");
        const readinessText = await readiness.text();
        if (!readiness.ok) {
          const message = parseApiErrorText(readinessText, readiness.status);
          setState((previous) => ({
            ...previous,
            status: readiness.status === 401 ? "missing-key" : "error",
            error: message
          }));
          return;
        }
        const readinessJson = safeJson(readinessText) as { configured?: boolean; error?: string };
        if (readinessJson.configured === false) {
          setState((previous) => ({
            ...previous,
            status: "missing-key",
            error: readinessJson.error ?? "OPENAI_API_KEY manquante."
          }));
          return;
        }

        const micStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        micStreamRef.current = micStream;

        let tabStream: MediaStream | null = null;
        if (includeTabAudio && navigator.mediaDevices.getDisplayMedia) {
          try {
            tabStream = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true
            });
            tabStreamRef.current = tabStream;
            if (tabStream.getAudioTracks().length === 0) {
              warning =
                "Audio d'onglet non partage. Le live fonctionne au micro, mais le prospect peut etre moins bien capte.";
            }
          } catch {
            warning =
              "Audio d'onglet non autorise. Le live continue au micro ; vous pouvez relancer avec partage onglet plus tard.";
          }
        }

        const peer = new RTCPeerConnection();
        peerRef.current = peer;

        const dataChannel = peer.createDataChannel("oai-events");
        dataChannelRef.current = dataChannel;
        dataChannel.addEventListener("message", handleRealtimeMessage);
        dataChannel.addEventListener("open", () => {
          setState((previous) => ({ ...previous, status: "connected" }));
        });
        dataChannel.addEventListener("close", () => {
          setState((previous) =>
            previous.status === "connected" ? { ...previous, status: "idle" } : previous
          );
        });

        const addAudioTracks = (stream: MediaStream | null) => {
          stream?.getAudioTracks().forEach((track) => peer.addTrack(track, stream));
        };

        addAudioTracks(micStream);
        addAudioTracks(tabStream);

        const hasTabAudio = Boolean(tabStream?.getAudioTracks().length);
        setState((previous) => ({
          ...previous,
          status: "connecting",
          startedAt: new Date().toISOString(),
          micActive: micStream.getAudioTracks().some((track) => track.readyState === "live"),
          tabAudioActive: hasTabAudio,
          warning
        }));

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        const response = await fetch("/api/realtime/session", {
          method: "POST",
          body: offer.sdp ?? "",
          headers: { "Content-Type": "application/sdp" }
        });

        if (!response.ok) {
          const message = await readApiError(response);
          if (response.status === 401) {
            setState((previous) => ({
              ...previous,
              status: "missing-key",
              error: message
            }));
            stopMedia();
            return;
          }
          throw new Error(message);
        }

        const answerSdp = await response.text();
        await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
      } catch (error) {
        stopMedia();
        setState((previous) => ({
          ...previous,
          status: "error",
          micActive: false,
          tabAudioActive: false,
          error: error instanceof Error ? error.message : "Ecoute active impossible"
        }));
      }
    },
    [context.consentObtained, handleRealtimeMessage, state.status, stopMedia]
  );

  useEffect(() => {
    if (loadedLocalRef.current) return;
    loadedLocalRef.current = true;
    const transcript = loadLocalValue<LiveTranscriptSegment[]>(STORAGE_KEYS.liveTranscript, []);
    const coaching = loadLocalValue<LiveCoachResponse["events"]>(STORAGE_KEYS.liveCoaching, []);
    if (transcript.length || coaching.length) {
      setState((previous) => ({
        ...previous,
        transcriptSegments: transcript,
        coachingEvents: coaching,
        sellerTalkRatio: estimateSellerTalkRatio(transcript)
      }));
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    saveLocalValue(STORAGE_KEYS.liveTranscript, state.transcriptSegments);
  }, [state.transcriptSegments, storageReady]);

  useEffect(() => {
    if (!storageReady) return;
    saveLocalValue(STORAGE_KEYS.liveCoaching, state.coachingEvents);
  }, [state.coachingEvents, storageReady]);

  useEffect(() => {
    if (state.status !== "connected") return undefined;
    if (transcriptText.length - lastCoachedLengthRef.current < 140) return undefined;

    const timer = window.setTimeout(() => {
      lastCoachedLengthRef.current = transcriptText.length;
      void requestCoaching();
    }, 12000);

    return () => window.clearTimeout(timer);
  }, [requestCoaching, state.status, transcriptText]);

  useEffect(() => stop, [stop]);

  return {
    ...state,
    transcriptText,
    isRunning: state.status === "connected" || state.status === "connecting" || state.status === "permission",
    start,
    stop,
    requestCoaching,
    clearTranscript
  };
}

async function readApiError(response: Response): Promise<string> {
  const text = await response.text();
  return parseApiErrorText(text, response.status);
}

function parseApiErrorText(text: string, status: number): string {
  if (!text) return `Erreur API ${status}`;

  try {
    const json = JSON.parse(text) as { error?: string; message?: string };
    return json.error ?? json.message ?? text;
  } catch {
    return text;
  }
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
