export type RuntimeModule = {
  name: string;
  start: () => Promise<void>;
  critical?: boolean;
};

export async function bootRuntime(
  modules: RuntimeModule[]
) {
  for (const mod of modules) {
    const started = Date.now();

    try {
      console.log(`[BOOT] ${mod.name}`);

      await Promise.race([
        mod.start(),
        timeout(mod.name, 15000),
      ]);

      console.log(
        `[READY] ${mod.name} (${Date.now() - started}ms)`
      );
    } catch (err) {
      console.error(
        `[FAILED] ${mod.name}`,
        err
      );

      if (mod.critical) {
        process.exit(1);
      }
    }
  }
}

function timeout(name: string, ms: number) {
  return new Promise<void>((_, reject) => {
    setTimeout(() => {
      reject(
        new Error(`${name} startup timeout`)
      );
    }, ms);
  });
}
