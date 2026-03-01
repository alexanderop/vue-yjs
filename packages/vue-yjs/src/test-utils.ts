import { createApp, type App, type InjectionKey } from "vue";

export function withSetup<T>(composable: () => T): { result: T; app: App } {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  app.mount(document.createElement("div"));
  return { result, app };
}

export function withProvideSetup<T>(
  composable: () => T,
  provides: Array<[InjectionKey<unknown> | string, unknown]>
): { result: T; app: App } {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  for (const [key, value] of provides) {
    app.provide(key, value);
  }
  app.mount(document.createElement("div"));
  return { result, app };
}
