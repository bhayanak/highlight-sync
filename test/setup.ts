import 'fake-indexeddb/auto';
import { vi } from 'vitest';

// Mock chrome APIs
const chromeMock = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
    onInstalled: { addListener: vi.fn() },
  },
  storage: {
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
    },
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: { addListener: vi.fn() },
  },
  alarms: {
    create: vi.fn(),
    onAlarm: { addListener: vi.fn() },
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
  commands: {
    onCommand: { addListener: vi.fn() },
  },
};

vi.stubGlobal('chrome', chromeMock);
