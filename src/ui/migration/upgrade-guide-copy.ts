import type { AppLocale } from '@/ui/i18n';

export const upgradeCopy = {
  en: {
    title: 'My Webrequest is now RequestOrbit',
    changes: 'What changed',
    builder: 'This version introduces a two-address redirect builder and a new rule manager.',
    rules:
      'Old rules need your review. Detected data can be backed up and migrated; imported rules stay disabled until you enable them and grant any required site access.',
    removed:
      'Global CORS overrides, User-Agent presets, programmable context menus and logs were removed. Some custom redirects require changes; the migration report explains each item.',
    review: 'Review and back up old rules',
    later: 'Later',
    guide: 'Upgrade guide',
    pending: 'Old rules need attention',
    pendingHelp: 'Review the migration report before enabling old rules.',
    error: 'Could not save your choice. Please try again.',
  },
  'zh-CN': {
    title: 'My Webrequest 现已更名为 RequestOrbit',
    changes: '这次更新有什么变化',
    builder: '新版增加了两地址跳转向导，并重新设计了规则管理器。',
    rules:
      '旧规则需要你确认。检测到的数据可以备份和迁移；导入的规则默认关闭，检查后请手动启用，并按需授予网站访问权限。',
    removed:
      '旧版全局 CORS 覆盖、User-Agent 预设、可编程右键菜单和日志功能已移除。部分自定义跳转需要调整，迁移报告会逐项说明。',
    review: '检查并备份旧规则',
    later: '稍后处理',
    guide: '升级说明',
    pending: '旧规则待处理',
    pendingHelp: '请先检查迁移报告，再启用旧规则。',
    error: '未能保存你的选择，请重试。',
  },
  ko: {
    title: 'My Webrequest가 RequestOrbit로 변경되었습니다',
    changes: '변경 사항',
    builder: '두 주소로 만드는 리디렉션 도우미와 새로운 규칙 관리자를 제공합니다.',
    rules:
      '기존 규칙을 검토하세요. 감지된 데이터는 백업하고 이전할 수 있습니다. 가져온 규칙은 직접 활성화하고 필요한 사이트 권한을 부여할 때까지 꺼져 있습니다.',
    removed:
      '전역 CORS 재정의, User-Agent 프리셋, 프로그래밍 가능한 컨텍스트 메뉴와 로그가 제거되었습니다. 일부 사용자 지정 리디렉션은 수정이 필요하며 이전 보고서에서 항목별로 설명합니다.',
    review: '기존 규칙 검토 및 백업',
    later: '나중에',
    guide: '업그레이드 안내',
    pending: '기존 규칙 확인 필요',
    pendingHelp: '기존 규칙을 활성화하기 전에 이전 보고서를 확인하세요.',
    error: '선택을 저장하지 못했습니다. 다시 시도하세요.',
  },
  ja: {
    title: 'My Webrequest は RequestOrbit になりました',
    changes: '変更点',
    builder: '2つのアドレスで作成するリダイレクトガイドと新しいルール管理画面が加わりました。',
    rules:
      '旧ルールの確認が必要です。検出されたデータはバックアップと移行ができます。取り込んだルールは無効のままです。確認後に有効化し、必要なサイト権限を許可してください。',
    removed:
      '全体への CORS 上書き、User-Agent プリセット、プログラム可能な右クリックメニュー、ログは廃止されました。一部のカスタムリダイレクトには調整が必要です。移行レポートで項目ごとに説明します。',
    review: '旧ルールを確認・バックアップ',
    later: '後で',
    guide: 'アップグレード案内',
    pending: '旧ルールの確認が必要',
    pendingHelp: '旧ルールを有効にする前に移行レポートを確認してください。',
    error: '選択を保存できませんでした。再試行してください。',
  },
  fr: {
    title: 'My Webrequest devient RequestOrbit',
    changes: 'Ce qui change',
    builder:
      'Cette version ajoute un assistant de redirection à deux adresses et un nouveau gestionnaire de règles.',
    rules:
      'Vérifiez vos anciennes règles. Les données détectées peuvent être sauvegardées et migrées. Les règles importées restent désactivées jusqu’à leur activation et à l’octroi des accès nécessaires.',
    removed:
      'Les modifications CORS globales, les préréglages User-Agent, les menus contextuels programmables et les journaux ont été retirés. Certaines redirections personnalisées nécessitent des ajustements, détaillés dans le rapport de migration.',
    review: 'Vérifier et sauvegarder les anciennes règles',
    later: 'Plus tard',
    guide: 'Guide de mise à jour',
    pending: 'Anciennes règles à vérifier',
    pendingHelp: 'Consultez le rapport de migration avant d’activer les anciennes règles.',
    error: 'Impossible d’enregistrer votre choix. Réessayez.',
  },
  es: {
    title: 'My Webrequest ahora es RequestOrbit',
    changes: 'Qué ha cambiado',
    builder:
      'Esta versión incorpora un asistente de redirección con dos direcciones y un nuevo gestor de reglas.',
    rules:
      'Revisa tus reglas anteriores. Los datos detectados se pueden respaldar y migrar. Las reglas importadas permanecen desactivadas hasta que las actives y concedas los permisos necesarios.',
    removed:
      'Se eliminaron las modificaciones CORS globales, los ajustes de User-Agent, los menús contextuales programables y los registros. Algunas redirecciones personalizadas requieren cambios, detallados en el informe de migración.',
    review: 'Revisar y respaldar reglas anteriores',
    later: 'Más tarde',
    guide: 'Guía de actualización',
    pending: 'Reglas anteriores pendientes',
    pendingHelp: 'Revisa el informe de migración antes de activar las reglas anteriores.',
    error: 'No se pudo guardar tu elección. Inténtalo de nuevo.',
  },
} satisfies Record<AppLocale, Record<string, string>>;
