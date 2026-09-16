/** Console API endpoint constants. */

export const CONSOLE_BOS_ENDPOINTS = {
  invoke: '/api/bos/invoke',
  schema: (uri: string) => `/api/bos/invoke/schema?uri=${encodeURIComponent(uri)}`,
  catalog: (domain?: string, query?: string) => {
    const params = new URLSearchParams();
    if (domain) params.set('domain', domain);
    if (query) params.set('query', query);
    const qs = params.toString();
    return `/api/bos/catalog${qs ? '?' + qs : ''}`;
  },
  history: (prefix?: string) => {
    const params = new URLSearchParams();
    if (prefix) params.set('prefix', prefix);
    const qs = params.toString();
    return `/api/bos/history${qs ? '?' + qs : ''}`;
  },
} as const;

export const CONSOLE_MOF_ENDPOINTS = {
  audit: '/api/mof/audit',
  evaluate: '/api/mof/evaluate',
  rules: '/api/mof/rules',
  dimensions: '/api/mof/dimensions',
  valueLoop: '/api/mof/value-loop',
} as const;

export const CONSOLE_HARNESS_ENDPOINTS = {
  stages: '/api/console/harness/stages',
  profiles: '/api/console/harness/profiles',
  runs: '/api/console/harness/runs',
  runDetail: (runId: string) => `/api/console/harness/runs/${runId}`,
  runEvents: (runId: string) => `/api/console/harness/runs/${runId}/events`,
  runCancel: (runId: string) => `/api/console/harness/runs/${runId}/cancel`,
  runConfirm: (runId: string) => `/api/console/harness/runs/${runId}/confirm`,
} as const;
