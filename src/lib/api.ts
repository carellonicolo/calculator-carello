/**
 * Client tipizzato delle API dell'app (Pages Functions).
 */

import { authFetch, type ApiResult } from './auth';
import type { CalcConfig } from './config';

export interface AppUser {
  name: string;
  email: string;
  class: string | null;
  isTeacher: boolean;
}

export interface StudentState {
  user: AppUser;
  config: CalcConfig;
  stamp: string;
  session: string | null;
}

export function apiStudentState(): Promise<ApiResult<StudentState>> {
  return authFetch<StudentState>('/api/student/state');
}

export function apiStudentConfig(sid: string): Promise<ApiResult<{ config: CalcConfig; stamp: string }>> {
  return authFetch<{ config: CalcConfig; stamp: string }>(`/api/student/config?sid=${encodeURIComponent(sid)}`);
}

// ------------------------------------------------------------- Docente

export interface OverviewClass {
  class: string;
  config: CalcConfig | null;
  updatedAt: string | null;
}

export interface Preset {
  id: number;
  name: string;
  config: CalcConfig;
  updatedAt: string;
}

export interface TeacherOverview {
  defaultConfig: { config: CalcConfig; updatedAt: string | null; customized: boolean };
  classes: OverviewClass[];
  presets: Preset[];
}

export function apiTeacherOverview(): Promise<ApiResult<TeacherOverview>> {
  return authFetch<TeacherOverview>('/api/teacher/overview');
}

export function apiPutClassConfig(cls: string, config: CalcConfig): Promise<ApiResult<{ ok: boolean }>> {
  return authFetch<{ ok: boolean }>('/api/teacher/class-config', {
    method: 'PUT',
    body: JSON.stringify({ class: cls, config }),
  });
}

export function apiDeleteClassConfig(cls: string): Promise<ApiResult<{ ok: boolean }>> {
  return authFetch<{ ok: boolean }>(`/api/teacher/class-config?class=${encodeURIComponent(cls)}`, {
    method: 'DELETE',
  });
}

export function apiSavePreset(name: string, config: CalcConfig): Promise<ApiResult<{ presets: Preset[] }>> {
  return authFetch<{ presets: Preset[] }>('/api/teacher/presets', {
    method: 'POST',
    body: JSON.stringify({ name, config }),
  });
}

export function apiDeletePreset(id: number): Promise<ApiResult<{ presets: Preset[] }>> {
  return authFetch<{ presets: Preset[] }>(`/api/teacher/presets?id=${id}`, { method: 'DELETE' });
}

export function apiApplyPreset(presetId: number, classes: string[]): Promise<ApiResult<{ ok: boolean; applied: string[] }>> {
  return authFetch<{ ok: boolean; applied: string[] }>('/api/teacher/apply-preset', {
    method: 'POST',
    body: JSON.stringify({ presetId, classes }),
  });
}

export interface LiveSessionRow {
  fullName: string;
  email: string;
  class: string | null;
  openedAt: string;
  lastSeenAt: string;
  online: boolean;
}

export function apiTeacherLive(): Promise<ApiResult<{ sessions: LiveSessionRow[] }>> {
  return authFetch<{ sessions: LiveSessionRow[] }>('/api/teacher/live');
}
