// Type definitions for Electron utilities

export interface IpcRenderer {
  invoke(channel: string, ...args: any[]): Promise<any>;
  send(channel: string, ...args: any[]): void;
  on(channel: string, listener: (...args: any[]) => void): void;
  once(channel: string, listener: (...args: any[]) => void): void;
  removeListener(channel: string, listener: (...args: any[]) => void): void;
  removeAllListeners(channel?: string): void;
}

export declare const ipcRenderer: IpcRenderer | null;

export declare function safeIpcInvoke(channel: string, ...args: any[]): Promise<any>;
export declare function safeIpcSend(channel: string, ...args: any[]): void;
export declare function safeIpcOn(channel: string, listener: (...args: any[]) => void): void;
export declare function safeIpcRemoveListener(channel: string, listener: (...args: any[]) => void): void;
