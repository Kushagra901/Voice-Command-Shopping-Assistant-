import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "../hooks/useOnlineStatus.js";

describe("useOnlineStatus hook", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("initializes with navigator.onLine status", () => {
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.queuedCount).toBe(0);
  });

  it("updates isOnline when window fires offline and online events", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current.isOnline).toBe(true);
  });

  it("queues offline mutations and persists to localStorage", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      result.current.queueMutation("ADD_ITEM", { name: "Oat Milk", quantity: 2 });
    });

    expect(result.current.queuedCount).toBe(1);
    expect(result.current.queue[0]?.type).toBe("ADD_ITEM");
    expect(result.current.queue[0]?.payload).toEqual({ name: "Oat Milk", quantity: 2 });

    const stored = JSON.parse(localStorage.getItem("voice_shopping_offline_queue") || "[]");
    expect(stored.length).toBe(1);
    expect(stored[0].payload.name).toBe("Oat Milk");
  });

  it("clears mutation queue on clearQueue()", () => {
    const { result } = renderHook(() => useOnlineStatus());

    act(() => {
      result.current.queueMutation("REMOVE_ITEM", { id: "item-123" });
    });
    expect(result.current.queuedCount).toBe(1);

    act(() => {
      result.current.clearQueue();
    });

    expect(result.current.queuedCount).toBe(0);
    expect(JSON.parse(localStorage.getItem("voice_shopping_offline_queue") || "[]")).toEqual([]);
  });

  it("processes queued mutations sequentially and invokes onSyncComplete", async () => {
    const onSyncComplete = vi.fn();
    const { result } = renderHook(() => useOnlineStatus({ onSyncComplete }));

    act(() => {
      result.current.queueMutation("ADD_ITEM", { name: "Organic Apples" });
      result.current.queueMutation("UPDATE_ITEM", { id: "1", updates: { quantity: 5 } });
    });

    expect(result.current.queuedCount).toBe(2);

    const executor = vi.fn().mockResolvedValue(undefined);

    await act(async () => {
      const synced = await result.current.processQueue(executor);
      expect(synced).toBe(2);
    });

    expect(executor).toHaveBeenCalledTimes(2);
    expect(onSyncComplete).toHaveBeenCalledWith(2);
    expect(result.current.queuedCount).toBe(0);
  });

  it("retains failed mutations in queue and triggers onSyncError", async () => {
    const onSyncError = vi.fn();
    const { result } = renderHook(() => useOnlineStatus({ onSyncError }));

    act(() => {
      result.current.queueMutation("ADD_ITEM", { name: "Failure item" });
    });

    const failingExecutor = vi.fn().mockRejectedValue(new Error("Network timeout"));

    await act(async () => {
      await result.current.processQueue(failingExecutor);
    });

    expect(onSyncError).toHaveBeenCalled();
    expect(result.current.queuedCount).toBe(1);
  });
});
