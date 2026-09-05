export type CardType =
  | 'metric_grid'
  | 'data_table'
  | 'action_panel'
  | 'log_stream'
  | 'dag_graph';

export interface MetricCell {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'normal' | 'warning' | 'error';
  warn_threshold?: number;
  description?: string;
}

export interface MetricGridPayload {
  cells?: MetricCell[];
  metrics?: MetricCell[];
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface DataTablePayload {
  columns?: (TableColumn | string)[];
  rows?: Record<string, any>[];
}

export interface ActionButton {
  id: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  description?: string;
  confirm?: boolean;
  payload?: Record<string, any>;
  disabled?: boolean;
  disabled_reason?: string;
}

export interface ActionPanelPayload {
  title?: string;
  description?: string;
  actions?: ActionButton[];
}

export interface LogStreamPayload {
  title?: string;
  lines?: string[];
}

export interface DagNode {
  id: string;
  label: string;
  status?: string;
}

export interface DagEdge {
  source: string;
  target: string;
  label?: string;
}

export interface DagGraphPayload {
  title?: string;
  nodes?: DagNode[];
  edges?: DagEdge[];
}

export interface DeclarativeCard {
  id: string;
  type: CardType;
  title: string;
  refresh_interval_ms?: number;
  source_uri?: string;
  static_data?: any;
  payload?: any;
}

export interface ExtensionManifestData {
  schema_version: string;
  extension_id: string;
  domain: string;
  title: string;
  description?: string;
  refresh_interval_ms?: number;
  cards: DeclarativeCard[];
}
