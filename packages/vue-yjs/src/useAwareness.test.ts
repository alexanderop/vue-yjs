// @vitest-environment happy-dom
import { expect, test } from "vitest";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { useAwareness } from "./useAwareness.js";
import { withSetup } from "./test-utils.js";

function createAwareness(): Awareness {
  const doc = new Y.Doc();
  return new Awareness(doc);
}

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

test("setLocalState updates awareness and triggers reactive update", () => {
  const awareness = createAwareness();
  const { result } = withSetup(() =>
    useAwareness<{ name: string }>(awareness)
  );

  result.setLocalState({ name: "Alice" });
  const localState = result.states.value.get(awareness.clientID);
  expect(localState).toMatchObject({ name: "Alice" });
});

test("setLocalStateField updates a single field", () => {
  const awareness = createAwareness();
  const { result } = withSetup(() =>
    useAwareness<{ name: string; color: string }>(awareness)
  );

  result.setLocalState({ name: "Alice", color: "red" });
  result.setLocalStateField("color", "blue");

  const localState = result.states.value.get(awareness.clientID);
  expect(localState).toMatchObject({ name: "Alice", color: "blue" });
});

test("states ref updates when remote awareness changes", () => {
  const awareness = createAwareness();
  const { result } = withSetup(() =>
    useAwareness<{ name: string }>(awareness)
  );

  const refBefore = result.states.value;

  // Simulate a change by setting local state
  awareness.setLocalState({ name: "Bob" });

  // A new Map reference should be created
  expect(result.states.value).not.toBe(refBefore);
});

test("cleans up listener on unmount", () => {
  const awareness = createAwareness();
  const { result, app } = withSetup(() =>
    useAwareness<{ name: string }>(awareness)
  );

  app.unmount();

  const refAfterUnmount = result.states.value;
  awareness.setLocalState({ name: "Charlie" });
  // No new Map should be created after unmount
  expect(result.states.value).toBe(refAfterUnmount);
});
