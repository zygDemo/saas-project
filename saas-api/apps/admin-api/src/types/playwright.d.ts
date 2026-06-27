declare module 'playwright' {
  export interface Browser {
    newPage(): Promise<Page>
    close(): Promise<void>
  }
  export interface Page {
    goto(url: string, options?: { timeout?: number; waitUntil?: string }): Promise<void>
    content(): Promise<string>
    close(): Promise<void>
    waitForSelector(selector: string, options?: { timeout?: number }): Promise<void>
    waitForTimeout(ms: number): Promise<void>
    evaluate<T = unknown>(fn: () => T): Promise<T>
    evaluate<T = unknown>(fn: (arg: unknown) => T, arg: unknown): Promise<T>
    $eval<T = unknown>(selector: string, fn: (el: unknown) => T): Promise<T>
  }
  export const chromium: {
    launch(options?: { headless?: boolean; args?: string[] }): Promise<Browser>
  }
}
