import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CodeGenerationPanel from '../CodeGenerationPanel';
import * as compute from '../useComputeQueries';
import type { StrictComputeRound } from '../computeViewTypes';

const MODEL = 'ENG-OMLX-mbp/org/model-name';
const OTHER = 'ENG-OMLX-mbp/org/another-model';
const TEST_CREDENTIAL = 'test-only-compute-credential';
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
const posts = () => vi.mocked(fetch).mock.calls.filter(([, options]) => options?.method === 'POST');
const mount = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><CodeGenerationPanel /></QueryClientProvider>);
const fill = (prompt = '第一问') => {
  fireEvent.change(screen.getByLabelText('完整模型 ID'), { target: { value: MODEL } });
  fireEvent.change(screen.getByLabelText('当前输入'), { target: { value: prompt } });
  fireEvent.change(screen.getByLabelText('本次算力凭据'), { target: { value: TEST_CREDENTIAL } });
};
const send = () => fireEvent.click(screen.getByRole('button', { name: '发送' }));

beforeEach(() => {
  vi.stubGlobal('location', { origin: 'http://127.0.0.1:8090', hostname: '127.0.0.1', port: '8090', protocol: 'http:' });
  vi.stubGlobal('localStorage', { length: 0, setItem: vi.fn(), getItem: vi.fn() });
  vi.stubGlobal('sessionStorage', { length: 0, setItem: vi.fn(), getItem: vi.fn() });
  vi.mocked(fetch).mockImplementation(async (_url, options) => options?.method === 'POST'
    ? json({ status: 'success', content: '真实测试回复', model: MODEL })
    : json({ error: 'catalog unavailable' }, 500));
});

describe('strict compute panel', () => {
  it('does not send on mount, typing, model selection or Enter; displays failed catalog honestly', async () => {
    mount(); fill();
    fireEvent.keyDown(screen.getByLabelText('当前输入'), { key: 'Enter' });
    await screen.findByText(/目录不可用/);
    expect(posts()).toHaveLength(0);
    expect(screen.queryByText(/0 个模型/)).not.toBeInTheDocument();
  });

  it('sends exactly one strict request with full namespace ID, one-use credential and explicit budgets', async () => {
    mount(); fill(); send(); send();
    await screen.findByText('真实测试回复');
    expect(posts()).toHaveLength(1);
    const [url, options] = posts()[0];
    expect(url).toBe('/api/governance/compute/generate-strict');
    expect(JSON.parse(options!.body as string)).toEqual({ prompt: JSON.stringify({ conversation: [{ role: 'user', content: '第一问' }] }), model: MODEL, max_tokens: 128, timeout: 10, strict_model: true });
    expect(options!.headers).toMatchObject({ Authorization: `Bearer ${TEST_CREDENTIAL}` });
    expect(screen.getByLabelText('本次算力凭据')).toHaveValue('');
    expect(document.body.textContent).not.toContain(TEST_CREDENTIAL);
    expect(localStorage.length).toBe(0); expect(sessionStorage.length).toBe(0);
    expect(localStorage.setItem).not.toHaveBeenCalled(); expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  it('actually transmits the full successful same-model transcript on the second click', async () => {
    mount(); fill(); send(); await screen.findByText('真实测试回复');
    fireEvent.change(screen.getByLabelText('当前输入'), { target: { value: '第二问' } });
    fireEvent.change(screen.getByLabelText('本次算力凭据'), { target: { value: TEST_CREDENTIAL } });
    send(); await waitFor(() => expect(posts()).toHaveLength(2));
    const body = JSON.parse(posts()[1][1]!.body as string);
    expect(JSON.parse(body.prompt).conversation).toEqual([{ role: 'user', content: '第一问' }, { role: 'assistant', content: '真实测试回复' }, { role: 'user', content: '第二问' }]);
  });

  it('refuses changed model context until explicit new session and then sends no old history', async () => {
    mount(); fill(); send(); await screen.findByText('真实测试回复');
    fireEvent.change(screen.getByLabelText('完整模型 ID'), { target: { value: OTHER } });
    fireEvent.change(screen.getByLabelText('本次算力凭据'), { target: { value: TEST_CREDENTIAL } });
    send(); expect(posts()).toHaveLength(1);
    expect(screen.getByRole('alert')).toHaveTextContent(/新会话/);
    fireEvent.click(screen.getByRole('button', { name: '开始新会话并清空' }));
    fireEvent.change(screen.getByLabelText('当前输入'), { target: { value: '新问题' } });
    fireEvent.change(screen.getByLabelText('本次算力凭据'), { target: { value: TEST_CREDENTIAL } });
    send(); await waitFor(() => expect(posts()).toHaveLength(2));
    expect(JSON.parse(posts()[1][1]!.body as string).prompt).not.toContain('第一问');
  });

  it('cancel blocks continuation and ignores a late successful response; clear creates an isolated session', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation((_u, opts) => opts?.method === 'POST' ? new Promise<Response>(r => { resolve = r; }) : Promise.resolve(json({}, 500)));
    mount(); fill(); send();
    fireEvent.click(screen.getByRole('button', { name: '取消本次请求' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/未知/);
    fireEvent.change(screen.getByLabelText('本次算力凭据'), { target: { value: TEST_CREDENTIAL } });
    send(); expect(posts()).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: '开始新会话并清空' }));
    await act(async () => { resolve(json({ status: 'success', content: '禁止复活旧回复' })); });
    expect(screen.queryByText('禁止复活旧回复')).not.toBeInTheDocument();
    expect(screen.getByText(/未发送，尚无对话结果/)).toBeInTheDocument();
  });

  it.each([400, 401, 403, 404, 429, 500, 504])('shows safe HTTP %i outcome without retry or provider error/credential leak', async status => {
    vi.mocked(fetch).mockImplementation(async (_u, opts) => opts?.method === 'POST' ? json({ error: TEST_CREDENTIAL }, status) : json({}, 500));
    mount(); fill(); send();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(`HTTP ${status}`));
    expect(posts()).toHaveLength(1);
    expect(document.body.textContent).not.toContain(TEST_CREDENTIAL);
    if (status >= 500) expect(screen.getByRole('alert')).toHaveTextContent(/未知/);
  });

  it('clears while pending and rejects callbacks after unmount', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(fetch).mockImplementation((_u, opts) => opts?.method === 'POST' ? new Promise<Response>(r => { resolve = r; }) : Promise.resolve(json({}, 500)));
    const view = mount(); fill(); send();
    fireEvent.click(screen.getByRole('button', { name: '开始新会话并清空' }));
    expect(screen.getByLabelText('本次算力凭据')).toHaveValue('');
    view.unmount();
    await act(async () => { resolve(json({ status: 'success', content: 'late' })); });
    expect(posts()).toHaveLength(1);
  });

  it('renders hostile output as text and never HTML', async () => {
    vi.mocked(fetch).mockImplementation(async (_u, opts) => opts?.method === 'POST' ? json({ status: 'success', content: '<img src=x onerror=alert(1)>', model: MODEL }) : json({}, 500));
    mount(); fill(); send(); await screen.findByText('<img src=x onerror=alert(1)>');
    expect(document.querySelector('img')).toBeNull();
  });

  it('refuses11th real component attempt without dropping any of10 completed turns', async () => {
    mount(); fill('问0');
    for (let index = 0; index < 10; index += 1) {
      fireEvent.change(screen.getByLabelText('当前输入'), { target: { value: `问${index}` } });
      fireEvent.change(screen.getByLabelText('本次算力凭据'), { target: { value: TEST_CREDENTIAL } });
      send();
      await waitFor(() => expect(screen.getAllByText('真实测试回复')).toHaveLength(index + 1));
    }
    fireEvent.change(screen.getByLabelText('当前输入'), { target: { value: '第11次' } });
    fireEvent.change(screen.getByLabelText('本次算力凭据'), { target: { value: TEST_CREDENTIAL } }); send();
    expect(posts()).toHaveLength(10);
    expect(screen.getByRole('alert')).toHaveTextContent(/10/);
    const last = JSON.parse(posts()[9][1]!.body as string);
    expect(JSON.parse(last.prompt).conversation[0]).toEqual({ role: 'user', content: '问0' });
  });

  it('refuses oversized component input without consuming credential or posting', () => {
    mount(); fill('😀'.repeat(4001)); send();
    expect(posts()).toHaveLength(0);
    expect(screen.getByLabelText('本次算力凭据')).toHaveValue(TEST_CREDENTIAL);
    expect(screen.getByRole('alert')).toHaveTextContent(/4000/);
  });

  it('does not trust a wrong reported model or credential echoed in a response', async () => {
    vi.mocked(fetch).mockImplementation(async (_u, opts) => opts?.method === 'POST' ? json({ status: 'success', content: TEST_CREDENTIAL, model: OTHER }) : json({}, 500));
    mount(); fill(); send();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/未知/));
    expect(document.body.textContent).not.toContain(TEST_CREDENTIAL);
    expect(posts()).toHaveLength(1);
  });

  it('requires a manual credential for each send, and never retains it in the query cache', () => {
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><CodeGenerationPanel /></QueryClientProvider>);
    fireEvent.change(screen.getByLabelText('完整模型 ID'), { target: { value: MODEL } });
    fireEvent.change(screen.getByLabelText('当前输入'), { target: { value: '没有凭据' } }); send();
    expect(posts()).toHaveLength(0);
    expect(screen.getByRole('alert')).toHaveTextContent(/凭据/);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });

  it('refuses nonlocal origins, missing credentials, aliases and invalid budgets before sending', () => {
    mount(); fill();
    fireEvent.change(screen.getByLabelText('完整模型 ID'), { target: { value: 'coder' } }); send();
    expect(posts()).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('完整模型 ID'), { target: { value: MODEL } });
    fireEvent.change(screen.getByLabelText('最大输出 Token'), { target: { value: '513' } }); send();
    expect(posts()).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('最大输出 Token'), { target: { value: '128' } });
    vi.stubGlobal('location', { origin: 'https://evil.example', hostname: 'evil.example', port: '', protocol: 'https:' }); send();
    expect(posts()).toHaveLength(0);
  });
});

describe('complete transcript budget', () => {
  const round = (input: string, output = '答'): StrictComputeRound => ({ id: 1, model: MODEL, input, output, status: 'success', notice: '' });
  it('accepts exactly 4000 codepoints including emoji and wrapper, rejects4001 without truncation', () => {
    const overhead = Array.from(JSON.stringify({ conversation: [{ role: 'user', content: '' }] })).length;
    const input = '😀'.repeat(4000 - overhead);
    expect(Array.from(compute.buildStrictPrompt([], MODEL, input)).length).toBe(4000);
    expect(() => compute.buildStrictPrompt([], MODEL, input + '😀')).toThrow(/4000/);
  });
  it('preserves quotes, newlines and every successful turn; refuses oversized previous output', () => {
    const rounds = [round('引号"\n', '回复\\')];
    expect(JSON.parse(compute.buildStrictPrompt(rounds, MODEL, '继续')).conversation).toEqual([{ role: 'user', content: '引号"\n' }, { role: 'assistant', content: '回复\\' }, { role: 'user', content: '继续' }]);
    expect(() => compute.buildStrictPrompt([round('问', 'x'.repeat(4000))], MODEL, '继续')).toThrow(/4000/);
  });
  it('refuses11th attempt, unknown outcome and another model, but never fabricates failed replies', () => {
    expect(() => compute.buildStrictPrompt(Array.from({ length: 10 }, () => round('问')), MODEL, '继续')).toThrow(/10/);
    expect(() => compute.buildStrictPrompt([{ ...round('问'), status: 'unknown' }], MODEL, '继续')).toThrow(/新会话/);
    expect(() => compute.buildStrictPrompt([round('问')], OTHER, '继续')).toThrow(/新会话/);
    const failed = { ...round('未接收'), status: 'rejected' as const, output: undefined };
    expect(JSON.parse(compute.buildStrictPrompt([failed], MODEL, '继续')).conversation).toEqual([{ role: 'user', content: '继续' }]);
  });
});
