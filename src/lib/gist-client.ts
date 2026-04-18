import type { Highlight, SyncConfig } from '@/shared/types';

const GIST_API = 'https://api.github.com/gists';
const GIST_FILE_NAME = 'highlight-sync-data.json';

export async function syncToGist(
  highlights: Highlight[],
  config: SyncConfig,
): Promise<{ gistId: string; syncedAt: string }> {
  if (!config.gistToken) throw new Error('GitHub PAT not configured');

  const content = JSON.stringify(highlights, null, 2);
  const headers = {
    Authorization: `Bearer ${config.gistToken}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  let gistId = config.gistId;

  if (gistId) {
    // Update existing gist
    const response = await fetch(`${GIST_API}/${gistId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        files: { [GIST_FILE_NAME]: { content } },
      }),
    });
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(`Failed to update gist: ${response.status} ${msg}`);
    }
  } else {
    // Create new private gist
    const response = await fetch(GIST_API, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        description: 'Highlight Sync backup',
        public: false,
        files: { [GIST_FILE_NAME]: { content } },
      }),
    });
    if (!response.ok) {
      const msg = await response.text();
      throw new Error(`Failed to create gist: ${response.status} ${msg}`);
    }
    const data = await response.json();
    gistId = data.id;
  }

  return { gistId: gistId!, syncedAt: new Date().toISOString() };
}

export async function fetchFromGist(config: SyncConfig): Promise<Highlight[]> {
  if (!config.gistToken || !config.gistId) {
    throw new Error('Gist not configured');
  }

  const response = await fetch(`${GIST_API}/${config.gistId}`, {
    headers: {
      Authorization: `Bearer ${config.gistToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch gist: ${response.status}`);
  }

  const data = await response.json();
  const file = data.files?.[GIST_FILE_NAME];
  if (!file?.content) return [];

  const parsed = JSON.parse(file.content);
  if (!Array.isArray(parsed)) return [];
  return parsed;
}

export async function syncToSelfHosted(
  highlights: Highlight[],
  config: SyncConfig,
): Promise<{ syncedAt: string }> {
  if (!config.selfHostedUrl) throw new Error('Self-hosted URL not configured');

  const url = new URL(config.selfHostedUrl);
  if (url.protocol !== 'https:') {
    throw new Error('Self-hosted sync requires HTTPS');
  }

  const response = await fetch(config.selfHostedUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(highlights),
  });

  if (!response.ok) {
    throw new Error(`Self-hosted sync failed: ${response.status}`);
  }

  return { syncedAt: new Date().toISOString() };
}

export async function fetchFromSelfHosted(config: SyncConfig): Promise<Highlight[]> {
  if (!config.selfHostedUrl) throw new Error('Self-hosted URL not configured');

  const response = await fetch(config.selfHostedUrl, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Self-hosted fetch failed: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data;
}
