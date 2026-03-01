import { describe, expect, test } from "vitest";
import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import { useAwareness } from "./useAwareness.js";
import { withSetup } from "./test-utils.js";

function createAwareness(): Awareness {
  const doc = new Y.Doc();
  return new Awareness(doc);
}

describe("initial state", () => {
  test("should return initial states", () => {
    const awareness = createAwareness();
    const { result } = withSetup(() => useAwareness(awareness));
    expect(result.states.value).toBeInstanceOf(Map);
    expect(result.states.value.size).toBeGreaterThanOrEqual(1); // at least local client
  });

  test("should expose localClientId", () => {
    const awareness = createAwareness();
    const { result } = withSetup(() => useAwareness(awareness));
    expect(result.localClientId).toBe(awareness.clientID);
  });
});

describe("mutations", () => {
  test("setLocalState updates awareness and triggers reactive update", () => {
    const awareness = createAwareness();
    const { result } = withSetup(() =>
      useAwareness<{ name: string }>(awareness),
    );

    result.setLocalState({ name: "Alice" });
    const localState = result.states.value.get(awareness.clientID);
    expect(localState).toMatchObject({ name: "Alice" });
  });

  test("setLocalStateField updates a single field", () => {
    const awareness = createAwareness();
    const { result } = withSetup(() =>
      useAwareness<{ name: string; color: string }>(awareness),
    );

    result.setLocalState({ name: "Alice", color: "red" });
    result.setLocalStateField("color", "blue");

    const localState = result.states.value.get(awareness.clientID);
    expect(localState).toMatchObject({ name: "Alice", color: "blue" });
  });

  test("setLocalState(null) clears the local state", () => {
    const awareness = createAwareness();
    const { result } = withSetup(() =>
      useAwareness<{ name: string }>(awareness),
    );

    result.setLocalState({ name: "Alice" });
    expect(result.states.value.has(awareness.clientID)).toBe(true);

    result.setLocalState(null);
    expect(result.states.value.has(awareness.clientID)).toBe(false);
  });
});

describe("reactivity", () => {
  test("states ref updates when remote awareness changes", () => {
    const awareness = createAwareness();
    const { result } = withSetup(() =>
      useAwareness<{ name: string }>(awareness),
    );

    const refBefore = result.states.value;

    // Simulate a change by setting local state
    awareness.setLocalState({ name: "Bob" });

    // A new Map reference should be created
    expect(result.states.value).not.toBe(refBefore);
  });

  test("simulated remote peer appears in states map", () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();
    const awareness1 = new Awareness(doc1);
    const awareness2 = new Awareness(doc2);

    const { result } = withSetup(() =>
      useAwareness<{ name: string }>(awareness1),
    );

    // Set state on the remote peer
    awareness2.setLocalState({ name: "Remote" });

    // Sync: encode awareness2's update and apply to awareness1
    const update = encodeAwarenessUpdate(awareness2, [awareness2.clientID]);
    applyAwarenessUpdate(awareness1, update, "remote");

    expect(result.states.value.get(awareness2.clientID)).toMatchObject({
      name: "Remote",
    });
  });

  test("states map is a new reference on every change", () => {
    const awareness = createAwareness();
    const { result } = withSetup(() =>
      useAwareness<{ count: number }>(awareness),
    );

    awareness.setLocalState({ count: 1 });
    const ref1 = result.states.value;

    awareness.setLocalState({ count: 2 });
    const ref2 = result.states.value;

    expect(ref1).not.toBe(ref2);
  });
});

describe("cleanup", () => {
  test("cleans up listener on unmount", () => {
    const awareness = createAwareness();
    const { result, app } = withSetup(() =>
      useAwareness<{ name: string }>(awareness),
    );

    app.unmount();

    const refAfterUnmount = result.states.value;
    awareness.setLocalState({ name: "Charlie" });
    // No new Map should be created after unmount
    expect(result.states.value).toBe(refAfterUnmount);
  });
});
