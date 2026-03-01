import { afterEach } from "vitest";
import { createApp, type App, type InjectionKey } from "vue";

const activeApps: App[] = [];

afterEach(() => {
  activeApps.forEach((app) => app.unmount());
  activeApps.length = 0;
});

export function withSetup<T>(composable: () => T): { result: T; app: App } {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });
  app.mount(document.createElement("div"));
  activeApps.push(app);
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
  activeApps.push(app);
  return { result, app };
}
