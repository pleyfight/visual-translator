import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock File API for Node.js environment
global.File = class extends Blob {
  name: string;
  lastModified: number;

  constructor(chunks: any[], filename: string, options: any = {}) {
    super(chunks, options);
    this.name = filename;
    this.lastModified = options.lastModified || Date.now();
  }
};

// Mock FormData for Node.js environment
global.FormData = class {
  private data = new Map();

  append(key: string, value: any) {
    this.data.set(key, value);
  }

  get(key: string) {
    return this.data.get(key);
  }

  entries() {
    return this.data.entries();
  }
};

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});