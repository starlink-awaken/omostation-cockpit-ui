/**
 * LocalModelPanel — 模型目录与有证据的驻留状态.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Server } from 'lucide-react';
import { apiFetch, apiPost } from '../../api/client';
import type { LocalModel } from '../../components/computeViewTypes';

interface ResidencyEvidence {
  models: LocalModel[];
  loadedByNode: Record<string, string[]>;
  residency?: unknown;
}

function modelResidency(model: LocalModel | undefined, evidence: ResidencyEvidence): NonNullable<LocalModel['residency']> {
  if (!model) return 'unknown';
  const observedLoaded = Object.values(evidence.loadedByNode).some(list =>
    Array.isArray(list) && list.some(id => typeof id === 'string'
      && (id === model.model_id || id.startsWith(model.model_id + ' '))));
  if (model.residency === 'unknown') return 'unknown';
  if (model.residency === 'loaded') return 'loaded';
  if (model.residency === 'unloaded') return observedLoaded ? 'unknown' : 'unloaded';
  if (model.residency !== undefined || evidence.residency !== undefined) return 'unknown';
  return observedLoaded ? 'loaded' : 'unknown';
}

function nodeColor(runsOn?: string): string {
  if (!runsOn) return '#78716c';
  if (runsOn.startsWith('multi')) return '#7c3aed';
  if (runsOn.includes('mac-mini')) return '#0891b2';
  if (runsOn.includes('Y7000P')) return '#ca8a04';
  return '#16a34a';
}

export default function LocalModelPanel() {
  const [models, setModels] = useState<LocalModel[]>([]);
  const [loadedByNode, setLoadedByNode] = useState<Record<string, string[]>>({});
  const [catalogResidency, setCatalogResidency] = useState<unknown>('unknown');
  const latestEvidence = useRef<ResidencyEvidence>({ models: [], loadedByNode: {}, residency: 'unknown' });
  const [modelsBusy, setModelsBusy] = useState<string>('');
  const [modelsMsg, setModelsMsg] = useState<string>('');

  const fetchModels = async () => {
    try {
      const res = await apiFetch<{ status: string; models?: LocalModel[]; loaded_by_node?: Record<string, string[]>; residency?: unknown }>('/api/governance/compute/models');
      if (res.ok && res.data?.status === 'success') {
        latestEvidence.current = {
          models: res.data.models || [], loadedByNode: res.data.loaded_by_node || {}, residency: res.data.residency,
        };
        setModels(res.data.models || []);
        setLoadedByNode(res.data.loaded_by_node || {});
        setCatalogResidency(res.data.residency);
      }
    } catch { /* 静默:面板非关键路径 */ }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { void fetchModels(); }, []);

  const modelAction = async (model: string, action: 'load' | 'unload') => {
    const evidence = latestEvidence.current;
    const residency = modelResidency(evidence.models.find(item => item.model_id === model), evidence);
    if (residency === 'unknown' || action !== (residency === 'loaded' ? 'unload' : 'load')) return;
    setModelsBusy(model); setModelsMsg('');
    try {
      const res = await apiPost<{ status: string; detail?: string; output?: string }>('/api/governance/compute/model-action', { model, action });
      setModelsMsg(res.ok && res.data?.status === 'success'
        ? `✅ ${action} ${model} 完成`
        : `❌ ${res.data?.detail || res.data?.output || res.error || '失败'}`);
      await fetchModels();
    } catch (e: unknown) {
      setModelsMsg('❌ ' + (e?.message || String(e)));
    } finally {
      setModelsBusy('');
    }
  };

  return (
    <div style={{ border: '1px solid var(--border, #e7e5e4)', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Server size={16} aria-hidden="true" />
          <strong style={{ fontSize: 14 }}>本地算力模型</strong>
          <span style={{ fontSize: 12, color: '#78716c' }}>
            {models.length} 个 · 来自 SSOT(omlxc ssot-sync)
          </span>
        </div>
        <button onClick={fetchModels}
          style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, cursor: 'pointer' }}>
          刷新
        </button>
      </div>

      {/* 各节点当前加载 */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {Object.entries(loadedByNode).map(([node, list]) => (
          <span key={node} style={{
            fontSize: 11, padding: '3px 8px', borderRadius: 12,
            background: 'var(--bg2, #f5f5f4)', color: '#57534e'
          }}>
            <b>{node}</b>: {list.length ? list.join(', ') : '无加载记录'}
          </span>
        ))}
      </div>

      {modelsMsg && (
        <div style={{ fontSize: 12, marginBottom: 8, color: modelsMsg.startsWith('✅') ? '#16a34a' : '#dc2626' }}>
          {modelsMsg}
        </div>
      )}

      <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {models.map(m => {
          const residency = modelResidency(m, { models, loadedByNode, residency: catalogResidency });
          const on = residency === 'loaded';
          const unknown = residency === 'unknown';
          const busy = modelsBusy === m.model_id;
          return (
            <div key={m.model_id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
              borderRadius: 6, background: on ? 'rgba(22,163,74,.07)' : 'transparent', fontSize: 12
            }}>
              <span style={{ color: on ? '#16a34a' : '#a8a29e' }}>
                <span aria-hidden="true">{unknown ? '?' : on ? '●' : '○'} </span>
                {unknown ? '驻留未知' : on ? '已加载' : '未加载'}
              </span>
              <span style={{ fontWeight: 600, minWidth: 150 }}>{m.model_id}</span>
              <span style={{ color: nodeColor(m.runs_on), minWidth: 130, fontSize: 11 }}>
                {m.runs_on || '-'}
              </span>
              <span style={{ color: '#78716c', flex: 1, fontSize: 11 }}>
                {(m.capabilities || []).join(' · ')}
              </span>
              <button disabled={busy || unknown}
                onClick={() => modelAction(m.model_id, on ? 'unload' : 'load')}
                style={{
                  fontSize: 11, padding: '2px 10px', borderRadius: 5,
                  cursor: busy ? 'wait' : unknown ? 'not-allowed' : 'pointer', opacity: busy || unknown ? 0.5 : 1
                }}>
                {busy ? '…' : unknown ? '状态未知' : on ? '卸载' : '加载'}
              </button>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: '#a8a29e', marginTop: 8 }}>
        驻留未知时不可加载或卸载 · 绿=MBP 青=mac-mini 黄=Y7000P 紫=多节点
      </div>
    </div>
  );
}
