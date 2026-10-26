/**
 * WebContainer Initialization Optimizer
 * Preload and cache WebContainer API for faster boot times
 */

let webContainerBootPromise: Promise<any> | null = null;
let webContainerInstance: any = null;

/**
 * Start booting WebContainer in the background
 * Call this early (e.g., on app mount) to parallelize the boot
 */
export function prebootWebContainer(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (webContainerBootPromise) {
    return; // Already booting
  }

  // Reuse the application's single boot promise, including its workdir,
  // preview inspector and error listeners. Booting the API here separately
  // races app/lib/webcontainer and fails: only one instance is allowed.
  const bootPromise = import('../webcontainer')
    .then(({ webcontainer }) => webcontainer)
    .then((instance) => {
      console.log('[WEBCONTAINER] Booted successfully');
      webContainerInstance = instance;

      return instance;
    });
  webContainerBootPromise = bootPromise;

  // preboot is intentionally fire-and-forget, so observe failures without
  // creating an unhandled rejection. getWebContainer still gets the original
  // rejecting promise when it is awaiting this boot.
  void bootPromise.catch((error) => {
    console.error('[WEBCONTAINER] Boot failed:', error);
    if (webContainerBootPromise === bootPromise) {
      webContainerBootPromise = null;
    }
  });
}

/**
 * Get the WebContainer instance
 * If boot was started with prebootWebContainer(), this will be fast
 * Otherwise, it will start the boot now
 */
export async function getWebContainer(): Promise<any> {
  if (webContainerInstance) {
    return webContainerInstance;
  }

  if (!webContainerBootPromise) {
    prebootWebContainer();
  }

  return webContainerBootPromise!;
}

/**
 * Check if WebContainer is ready
 */
export function isWebContainerReady(): boolean {
  return webContainerInstance !== null;
}

/**
 * Reset WebContainer state (useful for testing)
 */
export function resetWebContainer(): void {
  webContainerBootPromise = null;
  webContainerInstance = null;
}

/**
 * Preconnect to WebContainer CDN
 * This should be added to the HTML head for DNS/TCP preflight
 */
export function getWebContainerPreconnect(): string {
  return 'https://unpkg.com'; // WebContainer uses unpkg for packages
}
