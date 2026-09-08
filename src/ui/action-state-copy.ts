import type { AppLocale } from '@/ui/i18n/core';

export const actionStateCopy: Record<AppLocale, { paused: string; error: string }> = {
  en: { paused: 'All rules paused', error: 'Could not apply rules — open to review' },
  'zh-CN': { paused: '所有规则已暂停', error: '规则应用失败，请打开查看' },
  ko: { paused: '모든 규칙 일시 중지됨', error: '규칙 적용 실패 — 열어서 확인하세요' },
  ja: { paused: 'すべてのルールを一時停止中', error: 'ルールを適用できません — 開いて確認' },
  fr: {
    paused: 'Toutes les règles en pause',
    error: 'Échec de l’application des règles — ouvrir pour vérifier',
  },
  es: { paused: 'Todas las reglas en pausa', error: 'No se pudieron aplicar las reglas — abre para revisar' },
};
