/** Existing compute page: bounded, explicit same-model conversation. */
import React, { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { apiFetch } from '../api/client';
import { buildStrictPrompt, generateStrict, isFullLocalModelId } from './useComputeQueries';
import type { StrictComputeRound } from './computeViewTypes';

export default function CodeGenerationPanel() {
  const [model, setModel] = useState('');
  const [input, setInput] = useState('');
  const [maxTokens, setMaxTokens] = useState(128);
  const [timeout, setTimeoutSeconds] = useState(10);
  const [rounds, setRounds] = useState<StrictComputeRound[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [catalog, setCatalog] = useState('正在读取模型目录；尚未证明模型驻留。');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const credentialInput = useRef<HTMLInputElement>(null);
  const current = useRef<{ controller: AbortController; epoch: number } | null>(null);
  const epoch = useRef(0);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    const passwordElement = credentialInput.current;
    void apiFetch<{ models?: { model_id?: unknown }[] }>('/api/governance/compute/models', { signal: controller.signal }).then(response => {
      if (!mounted.current || controller.signal.aborted) return;
      const values = response.ok && Array.isArray(response.data?.models)
        ? response.data.models.map(item => item?.model_id).filter((id): id is string => typeof id === 'string' && isFullLocalModelId(id)) : [];
      setModels([...new Set(values)]);
      setCatalog(values.length ? '目录已读取；登记不代表模型已驻留或可用。' : '目录不可用或未提供完整模型 ID；可手动输入，登记与驻留状态尚未验证。');
    });
    return () => {
      mounted.current = false;
      epoch.current += 1;
      controller.abort();
      current.current?.controller.abort();
      current.current = null;
      if (passwordElement) passwordElement.value = '';
    };
  }, []);

  let prompt = '';
  let contextError = '';
  try { prompt = buildStrictPrompt(rounds, model, input); } catch (error) { contextError = (error as Error).message; }

  const newSession = () => {
    epoch.current += 1;
    current.current?.controller.abort();
    current.current = null;
    if (credentialInput.current) credentialInput.current.value = '';
    setRounds([]); setInput(''); setNotice(''); setBusy(false);
  };

  const cancel = () => {
    const pending = current.current;
    if (!pending) return;
    epoch.current += 1;
    pending.controller.abort(); current.current = null;
    if (credentialInput.current) credentialInput.current.value = '';
    const message = '已取消等待；模型执行结果未知，请开始新会话。取消不代表模型已停止。';
    setRounds(items => items.map(item => item.status === 'pending' ? { ...item, status: 'unknown', notice: message } : item));
    setNotice(message); setBusy(false);
  };

  const send = async () => {
    if (current.current) return;
    if (contextError) { setNotice(contextError); return; }
    if (!isFullLocalModelId(model)) { setNotice('请输入包含引擎及完整名称的模型 ID，不支持别名。'); return; }
    if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 512 || !Number.isFinite(timeout) || timeout <= 0 || timeout > 30) {
      setNotice('最大输出须为1–512，超时须大于0且不超过30秒。'); return;
    }
    const credential = credentialInput.current?.value ?? '';
    if (!credential || /[\r\n]/u.test(credential)) { setNotice('请输入本次专用算力凭据；不会读取本机私有配置。'); return; }
    const controller = new AbortController();
    const pending = { controller, epoch: epoch.current };
    current.current = pending;
    if (credentialInput.current) credentialInput.current.value = '';
    const id = rounds.length + 1;
    setRounds(items => [...items, { id, model, input, status: 'pending', notice: '正在等待本次回复。' }]);
    setNotice(''); setBusy(true);
    const result = await generateStrict({ prompt, model, max_tokens: maxTokens, timeout, strict_model: true }, credential, controller.signal);
    if (!mounted.current || current.current !== pending || epoch.current !== pending.epoch) return;
    current.current = null; setBusy(false);
    setRounds(items => items.map(item => item.id === id ? result.status === 'success'
      ? { ...item, status: 'success', output: result.content, notice: '已收到当前完整模型的回复。' }
      : { ...item, status: result.status, notice: result.notice } : item));
    if (result.status !== 'success') setNotice(result.notice);
    else setInput('');
  };

  return <section className="antd-card" aria-label="本地模型对话">
    <div className="section-header" style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 15, margin: 0 }}><Zap size={16} aria-hidden="true" /> 本地模型对话</h2>
    </div>
    <p>{catalog}</p>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <label>完整模型 ID<input className="antd-input" aria-label="完整模型 ID" list="strict-compute-models" value={model} disabled={busy} onChange={event => setModel(event.target.value)} placeholder="ENG-OMLX-节点/完整模型名称" /></label>
      <datalist id="strict-compute-models">{models.map(id => <option key={id} value={id} />)}</datalist>
      <p>更换模型后请明确开始新会话，不会混用其他模型的上下文。</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <label>最大输出 Token<input className="antd-input" aria-label="最大输出 Token" type="number" min={1} max={512} value={maxTokens} disabled={busy} onChange={event => setMaxTokens(Number(event.target.value))} /></label>
        <label>超时（秒）<input className="antd-input" aria-label="超时秒数" type="number" min={0.1} max={30} step={0.1} value={timeout} disabled={busy} onChange={event => setTimeoutSeconds(Number(event.target.value))} /></label>
      </div>
      <label>当前输入<textarea className="antd-input" aria-label="当前输入" value={input} disabled={busy} onChange={event => setInput(event.target.value)} /></label>
      <p>尝试 {rounds.length}/10 · 完整已拼装上下文 {prompt ? Array.from(prompt).length : '不可发送'}/4000 字符。保留当前模型成功回复；超限不会暗删或压缩历史。</p>
      {contextError && input.trim() && !busy && <p>{contextError}</p>}
      <label>本次算力凭据<input className="antd-input" aria-label="本次算力凭据" ref={credentialInput} type="password" autoComplete="off" disabled={busy} /></label>
      <p>仅手工提供专用 compute-generate 凭据，发送后清空输入；不使用网关、个人确认或管理员凭据。只在当前本机8090页面发送，不保存。浏览器内存与扩展仍可能读取本次凭据。</p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="antd-btn antd-btn-primary" onClick={() => { void send(); }} disabled={busy}>发送</button>
        <button className="antd-btn" onClick={cancel} disabled={!busy}>取消本次请求</button>
        <button className="antd-btn" onClick={newSession}>开始新会话并清空</button>
      </div>
      <p>仅明确点击发送一次；回车仅编辑文本。浏览器最长等待 {timeout + 4} 秒；取消或超时不代表模型已停止。</p>
      {notice && <p role="alert">{notice}</p>}
      {!rounds.length && <p>未发送，尚无对话结果。历史仅保留在本页内存，离开或清空即移除。</p>}
      <ol aria-label="当前模型对话记录">{rounds.map(round => <li key={round.id}>
        <p>第{round.id}次 · {round.model} · {round.status === 'success' ? '已回复' : round.status === 'pending' ? '等待中' : round.status === 'rejected' ? '未形成对话回复' : '结果未知'}</p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{round.input}</pre>
        {round.output !== undefined && <pre style={{ whiteSpace: 'pre-wrap' }}>{round.output}</pre>}
        <p>{round.notice}</p>
      </li>)}</ol>
    </div>
  </section>;
}
