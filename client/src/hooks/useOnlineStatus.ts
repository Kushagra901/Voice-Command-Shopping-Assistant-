import { useState, useEffect, useCallback } from "react";

export type OfflineMutationType = "ADD_ITEM" | "UPDATE_ITEM" | "REMOVE_ITEM" | "EXECUTE_COMMAND";

export interface QueuedMutation {
  id: string;
  type: OfflineMutationType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any; // justified: flexible schema for multiple mutation endpoints
  timestamp: number;
}

const STORAGE_KEY = "voice_shopping_offline_queue";

function loadQueueFromStorage(): QueuedMutation[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQueueToStorage(queue: QueuedMutation[]): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Storage quota exceeded or disabled
  }
}

interface UseOnlineStatusOptions {
  onSyncComplete?: (syncedCount: number) => void;
  onSyncError?: (error: Error) => void;
}

export function useOnlineStatus(options: UseOnlineStatusOptions = {}) {
  const { onSyncComplete, onSyncError } = options;

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  const [queue, setQueue] = useState<QueuedMutation[]>(() => loadQueueFromStorage());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync state with storage changes
  useEffect(() => {
    saveQueueToStorage(queue);
  }, [queue]);

  const queueMutation = useCallback((type: OfflineMutationType, payload: unknown) => {
    const item: QueuedMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      timestamp: Date.now()
    };
    setQueue((prev) => {
      const next = [...prev, item];
      saveQueueToStorage(next);
      return next;
    });
    return item;
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Process queued mutations
  const processQueue = useCallback(
    async (executor: (mut: QueuedMutation) => Promise<void>) => {
      const currentQueue = loadQueueFromStorage();
      if (currentQueue.length === 0 || isSyncing) return 0;

      setIsSyncing(true);
      let successCount = 0;
      const remaining: QueuedMutation[] = [];

      for (const mut of currentQueue) {
        try {
          await executor(mut);
          successCount++;
        } catch (err) {
          remaining.push(mut);
          if (onSyncError) {
            onSyncError(err instanceof Error ? err : new Error("Mutation sync failed"));
          }
        }
      }

      setQueue(remaining);
      saveQueueToStorage(remaining);
      setIsSyncing(false);

      if (successCount > 0 && onSyncComplete) {
        onSyncComplete(successCount);
      }

      return successCount;
    },
    [isSyncing, onSyncComplete, onSyncError]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return {
    isOnline,
    queuedCount: queue.length,
    queue,
    isSyncing,
    queueMutation,
    clearQueue,
    processQueue
  };
}
