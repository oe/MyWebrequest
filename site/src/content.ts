export const locales = ['en', 'zh-CN', 'ko', 'ja', 'fr', 'es'] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
  ko: '한국어',
  ja: '日本語',
  fr: 'Français',
  es: 'Español',
};

export const guideSlugs = [
  'quick-start',
  'matching',
  'actions',
  'permissions',
  'migration',
  'troubleshooting',
] as const;
export type GuideSlug = (typeof guideSlugs)[number];

type HomeCopy = {
  navGuides: string;
  navPrivacy: string;
  openGithub: string;
  eyebrow: string;
  title: string;
  description: string;
  quickStart: string;
  github: string;
  compatibility: string;
  workflowEyebrow: string;
  workflowTitle: string;
  workflowDescription: string;
  steps: Array<{ title: string; description: string }>;
  capabilitiesTitle: string;
  capabilities: Array<{ title: string; description: string }>;
  guidesTitle: string;
  guidesDescription: string;
  trustTitle: string;
  trustDescription: string;
  footer: string;
};

export const homeCopy: Record<Locale, HomeCopy> = {
  en: {
    navGuides: 'Guides',
    navPrivacy: 'Privacy',
    openGithub: 'GitHub',
    eyebrow: 'Local-first request rules',
    title: 'See every rule. Change only what you mean to.',
    description:
      'A clear Manifest V3 rule manager for blocking, redirecting, upgrading, and adjusting request headers—without sending your rules away.',
    quickStart: 'Read the quick start',
    github: 'View source',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: 'A safer workflow',
    workflowTitle: 'From intent to an active browser rule',
    workflowDescription:
      'Build a rule in small, inspectable steps. Examples and migrated rules stay disabled until you decide they are ready.',
    steps: [
      {
        title: 'Match precisely',
        description:
          'Choose a URL filter, wildcard, or regular expression, then narrow by resource type or initiator.',
      },
      {
        title: 'Preview locally',
        description: 'Test a URL and inspect the expected result without making a network request.',
      },
      {
        title: 'Grant only what is needed',
        description: 'Host access is requested only when the selected action actually requires it.',
      },
    ],
    capabilitiesTitle: 'Focused tools for request rules',
    capabilities: [
      { title: 'Block', description: 'Stop matching requests with no host permission.' },
      { title: 'Redirect', description: 'Send a request to a controlled HTTP or HTTPS destination.' },
      { title: 'Upgrade', description: 'Move matching HTTP traffic to HTTPS.' },
      { title: 'Headers', description: 'Remove or set allowed request headers in a bounded scope.' },
      { title: 'Backup', description: 'Export checksummed JSON and preview changes before importing.' },
      {
        title: 'Migration',
        description: 'Review supported legacy rules and preserve unsupported source data.',
      },
    ],
    guidesTitle: 'Help that explains the why',
    guidesDescription: 'Learn matching, permissions, actions, and migration with concrete examples.',
    trustTitle: 'Private by default',
    trustDescription:
      'Rules stay in browser storage. The extension has no analytics and no remote rule service.',
    footer: 'Open source · Manifest V3 · Local-first',
  },
  'zh-CN': {
    navGuides: '指南',
    navPrivacy: '隐私',
    openGithub: 'GitHub',
    eyebrow: '本地优先的请求规则',
    title: '看清每条规则，只改变你真正想改的请求。',
    description:
      '清晰的 Manifest V3 规则管理器，可阻止、重定向、升级请求及调整请求头；规则不会被发送到远端。',
    quickStart: '阅读快速开始',
    github: '查看源码',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: '更安全的工作流',
    workflowTitle: '从意图到浏览器中生效的规则',
    workflowDescription: '把规则拆成可检查的小步骤。示例和迁移规则在你确认之前始终保持停用。',
    steps: [
      {
        title: '精确匹配',
        description: '选择 URL 过滤器、通配符或正则表达式，再用资源类型和发起方缩小范围。',
      },
      { title: '本地预览', description: '无需发出网络请求，就能测试 URL 并查看预期结果。' },
      { title: '只授予必要权限', description: '只有所选操作确实需要时，扩展才会申请对应网站访问权限。' },
    ],
    capabilitiesTitle: '专注于请求规则的工具',
    capabilities: [
      { title: '阻止', description: '无需网站权限即可停止匹配的请求。' },
      { title: '重定向', description: '将请求发送到受控的 HTTP 或 HTTPS 地址。' },
      { title: '升级', description: '把匹配的 HTTP 流量升级到 HTTPS。' },
      { title: '请求头', description: '在限定范围内移除或设置浏览器允许的请求头。' },
      { title: '备份', description: '导出带校验和的 JSON，导入前先预览变更。' },
      { title: '迁移', description: '检查可支持的旧规则，并保留不支持的原始数据。' },
    ],
    guidesTitle: '不仅告诉你怎么做，也说明为什么',
    guidesDescription: '通过具体示例学习匹配、权限、操作和迁移。',
    trustTitle: '默认保护隐私',
    trustDescription: '规则保存在浏览器本地。扩展没有分析服务，也没有远端规则服务。',
    footer: '开源 · Manifest V3 · 本地优先',
  },
  ko: {
    navGuides: '가이드',
    navPrivacy: '개인정보',
    openGithub: 'GitHub',
    eyebrow: '로컬 우선 요청 규칙',
    title: '모든 규칙을 확인하고, 의도한 요청만 바꾸세요.',
    description:
      '규칙을 외부로 보내지 않고 차단, 리디렉션, HTTPS 업그레이드, 요청 헤더 수정을 관리하는 명확한 Manifest V3 도구입니다.',
    quickStart: '빠른 시작 읽기',
    github: '소스 보기',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: '더 안전한 흐름',
    workflowTitle: '의도에서 실제 브라우저 규칙까지',
    workflowDescription:
      '작고 확인 가능한 단계로 규칙을 만드세요. 예제와 이전 규칙은 직접 준비할 때까지 비활성 상태입니다.',
    steps: [
      {
        title: '정확히 일치시키기',
        description: 'URL 필터, 와일드카드, 정규식을 고르고 리소스 유형과 시작 도메인으로 범위를 좁힙니다.',
      },
      { title: '로컬 미리보기', description: '네트워크 요청 없이 URL과 예상 결과를 테스트합니다.' },
      {
        title: '필요한 권한만 허용',
        description: '선택한 작업에 실제로 필요할 때만 사이트 접근 권한을 요청합니다.',
      },
    ],
    capabilitiesTitle: '요청 규칙에 집중한 도구',
    capabilities: [
      { title: '차단', description: '사이트 권한 없이 일치하는 요청을 중지합니다.' },
      { title: '리디렉션', description: '요청을 제어된 HTTP 또는 HTTPS 대상으로 보냅니다.' },
      { title: '업그레이드', description: '일치하는 HTTP 트래픽을 HTTPS로 바꿉니다.' },
      { title: '헤더', description: '제한된 범위에서 허용된 요청 헤더를 제거하거나 설정합니다.' },
      { title: '백업', description: '체크섬 JSON을 내보내고 가져오기 전에 변경 사항을 봅니다.' },
      { title: '이전', description: '지원되는 기존 규칙을 검토하고 지원되지 않는 원본도 보존합니다.' },
    ],
    guidesTitle: '이유까지 설명하는 도움말',
    guidesDescription: '구체적인 예제로 일치, 권한, 작업, 이전을 알아보세요.',
    trustTitle: '기본적으로 비공개',
    trustDescription: '규칙은 브라우저 저장소에 남습니다. 분석 기능이나 원격 규칙 서비스가 없습니다.',
    footer: '오픈 소스 · Manifest V3 · 로컬 우선',
  },
  ja: {
    navGuides: 'ガイド',
    navPrivacy: 'プライバシー',
    openGithub: 'GitHub',
    eyebrow: 'ローカル優先のリクエストルール',
    title: 'すべてのルールを見通し、意図した通信だけを変える。',
    description:
      'ルールを外部へ送らずに、遮断、転送、HTTPS 化、リクエストヘッダーの変更を管理できる Manifest V3 ツールです。',
    quickStart: 'クイックスタート',
    github: 'ソースを見る',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: 'より安全な流れ',
    workflowTitle: '意図から実際のブラウザルールまで',
    workflowDescription:
      '小さく確認可能な手順でルールを作成します。サンプルと移行ルールは、確認するまで無効のままです。',
    steps: [
      {
        title: '正確に一致',
        description: 'URL フィルター、ワイルドカード、正規表現を選び、リソース種別や開始元で絞り込みます。',
      },
      { title: 'ローカルで確認', description: '通信を発生させずに URL と期待される結果をテストします。' },
      {
        title: '必要な権限だけ',
        description: '選択した操作に本当に必要な場合だけ、サイトアクセスを要求します。',
      },
    ],
    capabilitiesTitle: 'リクエストルールに集中した機能',
    capabilities: [
      { title: '遮断', description: 'サイト権限なしで一致するリクエストを止めます。' },
      { title: '転送', description: '制御された HTTP / HTTPS の宛先へ送ります。' },
      { title: 'HTTPS 化', description: '一致する HTTP 通信を HTTPS に変更します。' },
      { title: 'ヘッダー', description: '限定した範囲で許可されたリクエストヘッダーを操作します。' },
      {
        title: 'バックアップ',
        description: 'チェックサム付き JSON を出力し、読み込み前に変更を確認します。',
      },
      { title: '移行', description: '対応する旧ルールを確認し、未対応の元データも保存します。' },
    ],
    guidesTitle: '理由までわかるヘルプ',
    guidesDescription: '具体例から一致条件、権限、操作、移行を学べます。',
    trustTitle: '初期状態からプライベート',
    trustDescription: 'ルールはブラウザ内に保存されます。分析機能も外部ルールサービスもありません。',
    footer: 'オープンソース · Manifest V3 · ローカル優先',
  },
  fr: {
    navGuides: 'Guides',
    navPrivacy: 'Confidentialité',
    openGithub: 'GitHub',
    eyebrow: 'Règles de requête locales',
    title: 'Voyez chaque règle. Ne modifiez que ce que vous avez choisi.',
    description:
      'Un gestionnaire Manifest V3 clair pour bloquer, rediriger, sécuriser et ajuster les en-têtes, sans envoyer vos règles ailleurs.',
    quickStart: 'Lire le démarrage rapide',
    github: 'Voir le code',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: 'Un parcours plus sûr',
    workflowTitle: 'De l’intention à une règle active',
    workflowDescription:
      'Créez une règle par étapes vérifiables. Les exemples et les règles migrées restent désactivés jusqu’à votre validation.',
    steps: [
      {
        title: 'Cibler précisément',
        description:
          'Choisissez un filtre URL, un joker ou une expression régulière, puis limitez le type et l’origine.',
      },
      {
        title: 'Prévisualiser localement',
        description: 'Testez une URL et son résultat attendu sans envoyer de requête réseau.',
      },
      {
        title: 'Accorder le strict nécessaire',
        description: 'L’accès à un site est demandé uniquement si l’action choisie l’exige.',
      },
    ],
    capabilitiesTitle: 'Des outils ciblés pour vos règles',
    capabilities: [
      { title: 'Bloquer', description: 'Arrêtez les requêtes correspondantes sans autorisation de site.' },
      {
        title: 'Rediriger',
        description: 'Envoyez une requête vers une destination HTTP ou HTTPS contrôlée.',
      },
      { title: 'Sécuriser', description: 'Faites passer le trafic HTTP correspondant en HTTPS.' },
      {
        title: 'En-têtes',
        description: 'Retirez ou définissez des en-têtes autorisés dans une portée limitée.',
      },
      { title: 'Sauvegarder', description: 'Exportez un JSON vérifié et prévisualisez une importation.' },
      {
        title: 'Migrer',
        description: 'Vérifiez les anciennes règles et conservez les sources non prises en charge.',
      },
    ],
    guidesTitle: 'Une aide qui explique pourquoi',
    guidesDescription:
      'Découvrez la correspondance, les autorisations, les actions et la migration par des exemples concrets.',
    trustTitle: 'Confidentiel par défaut',
    trustDescription:
      'Les règles restent dans le stockage du navigateur. Aucun suivi ni service distant de règles.',
    footer: 'Open source · Manifest V3 · Local en priorité',
  },
  es: {
    navGuides: 'Guías',
    navPrivacy: 'Privacidad',
    openGithub: 'GitHub',
    eyebrow: 'Reglas de solicitud locales',
    title: 'Ve cada regla. Cambia solo lo que quieres cambiar.',
    description:
      'Un gestor Manifest V3 claro para bloquear, redirigir, actualizar a HTTPS y ajustar cabeceras sin enviar tus reglas fuera.',
    quickStart: 'Leer inicio rápido',
    github: 'Ver código',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: 'Un flujo más seguro',
    workflowTitle: 'De la intención a una regla activa',
    workflowDescription:
      'Crea reglas en pasos pequeños y verificables. Los ejemplos y reglas migradas permanecen desactivados hasta que los revises.',
    steps: [
      {
        title: 'Coincidir con precisión',
        description: 'Elige filtro de URL, comodín o expresión regular y limita por recurso o iniciador.',
      },
      {
        title: 'Previsualizar localmente',
        description: 'Prueba una URL y el resultado esperado sin enviar una solicitud de red.',
      },
      {
        title: 'Conceder solo lo necesario',
        description: 'El acceso al sitio se solicita únicamente cuando la acción lo necesita.',
      },
    ],
    capabilitiesTitle: 'Herramientas centradas en reglas',
    capabilities: [
      { title: 'Bloquear', description: 'Detén solicitudes coincidentes sin permiso del sitio.' },
      { title: 'Redirigir', description: 'Envía una solicitud a un destino HTTP o HTTPS controlado.' },
      { title: 'Actualizar', description: 'Cambia el tráfico HTTP coincidente a HTTPS.' },
      { title: 'Cabeceras', description: 'Quita o define cabeceras permitidas con un alcance limitado.' },
      { title: 'Copia', description: 'Exporta JSON con suma de control y previsualiza la importación.' },
      {
        title: 'Migración',
        description: 'Revisa reglas antiguas compatibles y conserva los datos no compatibles.',
      },
    ],
    guidesTitle: 'Ayuda que también explica el porqué',
    guidesDescription: 'Aprende coincidencias, permisos, acciones y migración con ejemplos concretos.',
    trustTitle: 'Privado por defecto',
    trustDescription: 'Las reglas permanecen en el navegador. No hay analítica ni servicio remoto de reglas.',
    footer: 'Código abierto · Manifest V3 · Local primero',
  },
};

type GuideCopy = {
  title: string;
  description: string;
  sections: Array<{ title: string; paragraphs: string[]; code?: string }>;
};

const enGuides: Record<GuideSlug, GuideCopy> = {
  'quick-start': {
    title: 'Quick start',
    description: 'Create, test, and safely enable your first request rule.',
    sections: [
      {
        title: 'Start with an example',
        paragraphs: [
          'Open the rule manager and choose one of the three disabled starter rules. A starter is real, editable data—not a hidden preset.',
          'Replace every example.com value with a domain you control or intend to target. Keep the rule disabled while you review it.',
        ],
      },
      {
        title: 'Test before enabling',
        paragraphs: [
          'Use Test rule with a representative URL. The preview evaluates locally and sends no request.',
          'Save the rule, then enable it. If host access is needed, the browser shows the exact scope before its permission prompt.',
        ],
      },
    ],
  },
  matching: {
    title: 'Matching requests',
    description: 'Choose the narrowest match that describes your intent.',
    sections: [
      {
        title: 'URL filters',
        paragraphs: [
          'URL filters use the browser Declarative Net Request syntax. They are efficient for host or path matching.',
        ],
        code: '||example.com^',
      },
      {
        title: 'Wildcards and regular expressions',
        paragraphs: [
          'Use a wildcard when you need a captured value such as $1 in a redirect. Use regular expressions only when a filter or wildcard cannot express the match.',
          'Resource types, methods, and initiator domains narrow the rule further. Leaving types or methods empty means all values.',
        ],
      },
    ],
  },
  actions: {
    title: 'Rule actions',
    description: 'Understand blocking, redirecting, HTTPS upgrades, and request headers.',
    sections: [
      {
        title: 'Safe actions',
        paragraphs: [
          'Block and Upgrade to HTTPS can run without site access. Redirect and header actions need bounded access because they can change what a page receives.',
        ],
      },
      {
        title: 'Redirects and headers',
        paragraphs: [
          'Redirect destinations must use HTTP or HTTPS. Captures from wildcard or regular-expression matches can be inserted as $1 through $9.',
          'Header rules can remove or set browser-approved request headers. My Webrequest rejects forbidden names before activation.',
        ],
      },
    ],
  },
  permissions: {
    title: 'Permissions and privacy',
    description: 'Why a rule may request site access and what stays local.',
    sections: [
      {
        title: 'On-demand host access',
        paragraphs: [
          'The extension declares HTTP and HTTPS access as optional. It asks only when you enable a redirect or header rule that requires a specific origin.',
          'Rules, backups, and test inputs remain in browser storage. My Webrequest has no analytics or remote rule service.',
        ],
      },
      {
        title: 'Keep scope bounded',
        paragraphs: [
          'Prefer a concrete scheme and host. For subresource redirects or header edits, add initiator domains so the extension can limit which pages may trigger the rule.',
        ],
      },
    ],
  },
  migration: {
    title: 'Legacy migration',
    description: 'Bring forward useful rules without silently activating old behavior.',
    sections: [
      {
        title: 'Chrome only',
        paragraphs: [
          'Automatic legacy detection is available only in Chrome because the earlier extension existed there. Edge and Firefox hide this path.',
          'If an old installation used another extension ID, import its JSON backup from Settings.',
        ],
      },
      {
        title: 'Review first',
        paragraphs: [
          'Supported rules are converted into disabled candidates. Ambiguous rules are marked for review, and unsupported or removed features remain in the exportable source snapshot.',
          'Export a report before applying if you want a permanent audit trail. You can restore the pre-migration snapshot afterward.',
        ],
      },
    ],
  },
  troubleshooting: {
    title: 'Troubleshooting',
    description: 'Resolve common matching, permission, and runtime issues.',
    sections: [
      {
        title: 'A rule does not run',
        paragraphs: [
          'Check that the global pause is off, the rule is enabled, its fields are valid, and the browser granted the listed host access.',
          'Use Test rule on the exact URL, then inspect resource type and initiator domain. A matching URL alone may not satisfy every condition.',
        ],
      },
      {
        title: 'Import or runtime errors',
        paragraphs: [
          'Preview imports before applying them. Checksum failures mean the backup changed or is incomplete.',
          'If browser rules drift from saved state, reopening the manager triggers reconciliation. Export a backup before making a large change.',
        ],
      },
    ],
  },
};

const localizedGuideMeta: Record<Exclude<Locale, 'en'>, Record<GuideSlug, [string, string]>> = {
  'zh-CN': {
    'quick-start': ['快速开始', '创建、测试并安全启用你的第一条请求规则。'],
    matching: ['匹配请求', '用尽可能精确的条件表达你的意图。'],
    actions: ['规则操作', '理解阻止、重定向、HTTPS 升级和请求头修改。'],
    permissions: ['权限与隐私', '了解规则为何申请网站访问，以及哪些数据始终留在本地。'],
    migration: ['旧版迁移', '在不静默启用旧行为的前提下保留有用规则。'],
    troubleshooting: ['问题排查', '处理常见的匹配、权限和运行时问题。'],
  },
  ko: {
    'quick-start': ['빠른 시작', '첫 요청 규칙을 만들고 테스트한 뒤 안전하게 활성화합니다.'],
    matching: ['요청 일치', '의도를 표현하는 가장 좁은 조건을 선택합니다.'],
    actions: ['규칙 작업', '차단, 리디렉션, HTTPS 업그레이드와 요청 헤더를 이해합니다.'],
    permissions: ['권한과 개인정보', '사이트 접근이 필요한 이유와 로컬에 남는 데이터를 알아봅니다.'],
    migration: ['기존 규칙 이전', '오래된 동작을 자동 활성화하지 않고 유용한 규칙을 옮깁니다.'],
    troubleshooting: ['문제 해결', '일치, 권한, 런타임의 일반적인 문제를 해결합니다.'],
  },
  ja: {
    'quick-start': ['クイックスタート', '最初のリクエストルールを作成、テストし、安全に有効化します。'],
    matching: ['リクエストの一致', '目的を表す最も狭い条件を選びます。'],
    actions: ['ルール操作', '遮断、転送、HTTPS 化、リクエストヘッダーを理解します。'],
    permissions: ['権限とプライバシー', 'サイトアクセスが必要な理由と、ローカルに残るデータを説明します。'],
    migration: ['旧版からの移行', '古い動作を勝手に有効化せず、有用なルールを引き継ぎます。'],
    troubleshooting: ['トラブルシューティング', '一致、権限、実行時の一般的な問題を解決します。'],
  },
  fr: {
    'quick-start': ['Démarrage rapide', 'Créez, testez et activez votre première règle en toute sécurité.'],
    matching: ['Correspondance', 'Choisissez le critère le plus précis pour votre intention.'],
    actions: ['Actions de règle', 'Comprenez le blocage, la redirection, HTTPS et les en-têtes.'],
    permissions: [
      'Autorisations et confidentialité',
      'Comprenez pourquoi un accès est demandé et ce qui reste local.',
    ],
    migration: [
      'Migration héritée',
      'Conservez les règles utiles sans activer silencieusement les anciens comportements.',
    ],
    troubleshooting: [
      'Dépannage',
      'Résolvez les problèmes courants de correspondance, d’autorisation et d’exécution.',
    ],
  },
  es: {
    'quick-start': ['Inicio rápido', 'Crea, prueba y activa con seguridad tu primera regla.'],
    matching: ['Coincidencia de solicitudes', 'Elige la condición más específica que exprese tu intención.'],
    actions: ['Acciones de regla', 'Entiende bloqueo, redirección, HTTPS y cabeceras.'],
    permissions: ['Permisos y privacidad', 'Por qué se solicita acceso y qué permanece local.'],
    migration: [
      'Migración anterior',
      'Conserva reglas útiles sin activar silenciosamente comportamientos antiguos.',
    ],
    troubleshooting: [
      'Solución de problemas',
      'Resuelve problemas comunes de coincidencia, permisos y ejecución.',
    ],
  },
};

const localizedSections: Record<Exclude<Locale, 'en'>, Record<GuideSlug, GuideCopy['sections']>> = {
  'zh-CN': {
    'quick-start': [
      {
        title: '从示例开始',
        paragraphs: [
          '打开规则管理器，选择三条停用示例之一。示例就是可编辑的真实规则，不是隐藏预设。',
          '把 example.com 替换为你拥有或确实要处理的域名，检查期间保持停用。',
        ],
      },
      {
        title: '启用前先测试',
        paragraphs: [
          '用“测试规则”输入代表性 URL。预览仅在本地计算，不会发送请求。',
          '保存后再启用。需要网站访问时，浏览器提示前会先显示确切范围。',
        ],
      },
    ],
    matching: [
      {
        title: 'URL 过滤器',
        paragraphs: ['URL 过滤器使用浏览器 Declarative Net Request 语法，适合高效匹配主机或路径。'],
        code: '||example.com^',
      },
      {
        title: '通配符与正则表达式',
        paragraphs: [
          '需要在重定向中通过 $1 复用捕获内容时使用通配符；只有前两者无法表达时才使用正则。',
          '资源类型、请求方法和发起方域名会进一步缩小范围；留空表示匹配全部。',
        ],
      },
    ],
    actions: [
      {
        title: '安全操作',
        paragraphs: [
          '阻止和升级 HTTPS 无需网站访问权限。重定向和请求头会改变页面收到的内容，因此需要限定权限。',
        ],
      },
      {
        title: '重定向与请求头',
        paragraphs: [
          '目标必须使用 HTTP 或 HTTPS，通配符或正则捕获可通过 $1 到 $9 插入。',
          '请求头规则可移除或设置浏览器允许的请求头，禁止的名称会在启用前被拒绝。',
        ],
      },
    ],
    permissions: [
      {
        title: '按需申请网站访问',
        paragraphs: [
          'HTTP/HTTPS 访问被声明为可选权限，仅在启用确实需要具体来源的重定向或请求头规则时申请。',
          '规则、备份和测试输入都保存在浏览器中；没有分析或远端规则服务。',
        ],
      },
      {
        title: '保持范围明确',
        paragraphs: ['优先使用具体协议和主机。对子资源操作补充发起方域名，以限制哪些页面可以触发规则。'],
      },
    ],
    migration: [
      {
        title: '仅针对 Chrome',
        paragraphs: [
          '旧扩展只存在于 Chrome，因此自动检测只在 Chrome 提供，Edge 和 Firefox 会隐藏入口。',
          '旧安装若使用不同扩展 ID，可从设置导入 JSON 备份。',
        ],
      },
      {
        title: '先检查再应用',
        paragraphs: [
          '支持的规则会转为停用候选；有歧义的规则需要检查，不支持或已移除功能仍保留在可导出快照中。',
          '应用前可导出报告留档，之后也可以恢复迁移前快照。',
        ],
      },
    ],
    troubleshooting: [
      {
        title: '规则未运行',
        paragraphs: [
          '检查全局暂停是否关闭、规则是否启用、字段是否有效，以及浏览器是否授予列出的网站权限。',
          '用精确 URL 测试，并核对资源类型与发起方；仅 URL 匹配并不代表所有条件都满足。',
        ],
      },
      {
        title: '导入或运行时错误',
        paragraphs: [
          '应用前先预览导入。校验和失败表示备份已改变或不完整。',
          '重新打开管理器会校准浏览器规则与保存状态；大改前请先导出备份。',
        ],
      },
    ],
  },
  ko: {
    'quick-start': [
      {
        title: '예제로 시작',
        paragraphs: [
          '규칙 관리자에서 비활성 예제 세 가지 중 하나를 고릅니다. 예제는 숨겨진 프리셋이 아니라 편집 가능한 실제 규칙입니다.',
          'example.com을 직접 관리하거나 대상으로 삼을 도메인으로 바꾸고 검토 중에는 비활성 상태를 유지하세요.',
        ],
      },
      {
        title: '활성화 전 테스트',
        paragraphs: [
          '규칙 테스트에 대표 URL을 입력하세요. 네트워크 요청 없이 로컬에서만 계산합니다.',
          '저장 후 활성화하세요. 접근 권한이 필요하면 브라우저 프롬프트 전에 정확한 범위를 보여 줍니다.',
        ],
      },
    ],
    matching: [
      {
        title: 'URL 필터',
        paragraphs: ['브라우저의 Declarative Net Request 문법을 사용하며 호스트나 경로 일치에 효율적입니다.'],
        code: '||example.com^',
      },
      {
        title: '와일드카드와 정규식',
        paragraphs: [
          '$1 캡처가 필요하면 와일드카드를, 다른 방식으로 표현할 수 없을 때만 정규식을 사용하세요.',
          '리소스 유형, 메서드, 시작 도메인으로 범위를 더 좁힐 수 있습니다. 비워 두면 모두 일치합니다.',
        ],
      },
    ],
    actions: [
      {
        title: '안전한 작업',
        paragraphs: [
          '차단과 HTTPS 업그레이드는 사이트 접근 없이 동작합니다. 리디렉션과 헤더 변경은 제한된 권한이 필요합니다.',
        ],
      },
      {
        title: '리디렉션과 헤더',
        paragraphs: [
          '대상은 HTTP 또는 HTTPS여야 하며 캡처는 $1부터 $9까지 사용할 수 있습니다.',
          '허용된 요청 헤더만 제거하거나 설정할 수 있고 금지된 이름은 활성화 전에 거부됩니다.',
        ],
      },
    ],
    permissions: [
      {
        title: '필요할 때만 접근',
        paragraphs: [
          '구체적인 출처가 필요한 규칙을 활성화할 때만 선택적 사이트 접근을 요청합니다.',
          '규칙, 백업, 테스트 입력은 브라우저에 남고 분석이나 원격 규칙 서비스가 없습니다.',
        ],
      },
      {
        title: '범위를 좁게 유지',
        paragraphs: ['구체적인 스킴과 호스트를 사용하고, 하위 리소스 작업에는 시작 도메인을 추가하세요.'],
      },
    ],
    migration: [
      {
        title: 'Chrome 전용',
        paragraphs: [
          '이전 확장 프로그램은 Chrome에만 있었으므로 자동 감지도 Chrome에만 표시됩니다.',
          '확장 ID가 달랐다면 설정에서 JSON 백업을 가져오세요.',
        ],
      },
      {
        title: '먼저 검토',
        paragraphs: [
          '지원되는 규칙은 비활성 후보로 변환됩니다. 모호한 규칙은 검토 표시되고 지원되지 않는 원본은 내보낼 수 있습니다.',
        ],
      },
    ],
    troubleshooting: [
      {
        title: '규칙이 실행되지 않음',
        paragraphs: [
          '전체 일시 정지, 활성 상태, 유효성, 사이트 권한을 확인하세요.',
          '정확한 URL로 테스트한 뒤 리소스 유형과 시작 도메인을 확인하세요.',
        ],
      },
      {
        title: '가져오기와 런타임',
        paragraphs: [
          '가져오기는 적용 전에 미리 보고, 큰 변경 전에는 백업을 내보내세요.',
          '관리자를 다시 열면 저장 상태와 브라우저 규칙을 조정합니다.',
        ],
      },
    ],
  },
  ja: {
    'quick-start': [
      {
        title: 'サンプルから開始',
        paragraphs: [
          'ルール管理画面で無効なサンプルを一つ選びます。サンプルは編集できる実データです。',
          'example.com を対象ドメインへ置き換え、確認中は無効のままにします。',
        ],
      },
      {
        title: '有効化前にテスト',
        paragraphs: [
          '代表的な URL を「ルールをテスト」で確認します。通信は発生しません。',
          '保存後に有効化し、必要なら表示された範囲だけサイトアクセスを許可します。',
        ],
      },
    ],
    matching: [
      {
        title: 'URL フィルター',
        paragraphs: ['ブラウザの Declarative Net Request 構文を使い、ホストやパスを効率的に一致させます。'],
        code: '||example.com^',
      },
      {
        title: 'ワイルドカードと正規表現',
        paragraphs: [
          '$1 の捕捉が必要ならワイルドカード、他で表せない場合だけ正規表現を使います。',
          'リソース種別、メソッド、開始元ドメインでさらに絞れます。空欄はすべてを意味します。',
        ],
      },
    ],
    actions: [
      {
        title: '安全な操作',
        paragraphs: [
          '遮断と HTTPS 化はサイトアクセスなしで動作します。転送とヘッダー変更には限定した権限が必要です。',
        ],
      },
      {
        title: '転送とヘッダー',
        paragraphs: [
          '宛先は HTTP または HTTPS にし、捕捉は $1〜$9 で挿入できます。',
          'ブラウザが許可するリクエストヘッダーだけを操作できます。',
        ],
      },
    ],
    permissions: [
      {
        title: '必要時だけ要求',
        paragraphs: [
          '具体的な接続元が必要なルールを有効化する時だけ、任意のサイトアクセスを要求します。',
          'ルール、バックアップ、テスト入力はブラウザ内に残ります。',
        ],
      },
      {
        title: '範囲を限定',
        paragraphs: ['具体的なスキームとホストを使い、サブリソース操作には開始元ドメインを追加します。'],
      },
    ],
    migration: [
      {
        title: 'Chrome のみ',
        paragraphs: [
          '旧版は Chrome にだけ存在したため、自動検出も Chrome だけに表示されます。',
          'ID が異なる場合は設定から JSON バックアップを読み込みます。',
        ],
      },
      {
        title: '先に確認',
        paragraphs: [
          '対応ルールは無効な候補へ変換され、曖昧なものは要確認になります。未対応の元データも書き出せます。',
        ],
      },
    ],
    troubleshooting: [
      {
        title: 'ルールが動かない',
        paragraphs: [
          '全体停止、有効状態、入力の妥当性、サイト権限を確認します。',
          '正確な URL でテストし、リソース種別と開始元も確認します。',
        ],
      },
      {
        title: '読み込みと実行時',
        paragraphs: [
          '適用前に読み込みをプレビューし、大きな変更前にバックアップします。',
          '管理画面を開き直すと保存状態とブラウザルールが再調整されます。',
        ],
      },
    ],
  },
  fr: {
    'quick-start': [
      {
        title: 'Commencer par un exemple',
        paragraphs: [
          'Dans le gestionnaire, choisissez l’un des trois exemples désactivés. Il s’agit d’une vraie règle modifiable.',
          'Remplacez example.com par le domaine visé et laissez la règle désactivée pendant la vérification.',
        ],
      },
      {
        title: 'Tester avant d’activer',
        paragraphs: [
          'Testez une URL représentative. La prévisualisation reste locale et n’envoie aucune requête.',
          'Enregistrez puis activez. La portée exacte est affichée avant toute demande du navigateur.',
        ],
      },
    ],
    matching: [
      {
        title: 'Filtres URL',
        paragraphs: [
          'Ils utilisent la syntaxe Declarative Net Request du navigateur et conviennent aux hôtes ou chemins.',
        ],
        code: '||example.com^',
      },
      {
        title: 'Jokers et expressions régulières',
        paragraphs: [
          'Utilisez un joker pour réemployer une capture $1 et une expression régulière seulement en dernier recours.',
          'Les types, méthodes et domaines initiateurs réduisent encore la portée.',
        ],
      },
    ],
    actions: [
      {
        title: 'Actions sûres',
        paragraphs: [
          'Le blocage et HTTPS fonctionnent sans accès au site. Les redirections et en-têtes exigent une portée limitée.',
        ],
      },
      {
        title: 'Redirections et en-têtes',
        paragraphs: [
          'La destination doit être HTTP ou HTTPS, avec des captures $1 à $9.',
          'Seuls les en-têtes autorisés par le navigateur peuvent être retirés ou définis.',
        ],
      },
    ],
    permissions: [
      {
        title: 'Accès à la demande',
        paragraphs: [
          'L’accès facultatif n’est demandé qu’à l’activation d’une règle qui en a besoin.',
          'Règles, sauvegardes et tests restent dans le navigateur. Aucun suivi ni service distant.',
        ],
      },
      {
        title: 'Limiter la portée',
        paragraphs: [
          'Préférez un protocole et un hôte précis, puis ajoutez les domaines initiateurs pour les sous-ressources.',
        ],
      },
    ],
    migration: [
      {
        title: 'Chrome uniquement',
        paragraphs: [
          'L’ancienne extension n’existait que sur Chrome ; la détection automatique y est donc réservée.',
          'Si l’identifiant était différent, importez la sauvegarde JSON depuis les réglages.',
        ],
      },
      {
        title: 'Vérifier d’abord',
        paragraphs: [
          'Les règles prises en charge deviennent des candidates désactivées. Les données non prises en charge restent exportables.',
        ],
      },
    ],
    troubleshooting: [
      {
        title: 'La règle ne fonctionne pas',
        paragraphs: [
          'Vérifiez la pause globale, l’activation, la validité et les autorisations du site.',
          'Testez l’URL exacte puis contrôlez le type de ressource et le domaine initiateur.',
        ],
      },
      {
        title: 'Importation et exécution',
        paragraphs: [
          'Prévisualisez toute importation et sauvegardez avant une modification importante.',
          'Rouvrir le gestionnaire réconcilie les règles du navigateur avec l’état enregistré.',
        ],
      },
    ],
  },
  es: {
    'quick-start': [
      {
        title: 'Empezar con un ejemplo',
        paragraphs: [
          'En el gestor, elige uno de los tres ejemplos desactivados. Es una regla real y editable.',
          'Cambia example.com por el dominio objetivo y mantenla desactivada mientras la revisas.',
        ],
      },
      {
        title: 'Probar antes de activar',
        paragraphs: [
          'Prueba una URL representativa. La vista previa es local y no envía solicitudes.',
          'Guarda y activa. Verás el alcance exacto antes de cualquier aviso del navegador.',
        ],
      },
    ],
    matching: [
      {
        title: 'Filtros de URL',
        paragraphs: [
          'Usan la sintaxis Declarative Net Request del navegador y son eficientes para hosts o rutas.',
        ],
        code: '||example.com^',
      },
      {
        title: 'Comodines y expresiones regulares',
        paragraphs: [
          'Usa un comodín para reutilizar una captura $1 y una expresión regular solo si lo anterior no basta.',
          'Tipos, métodos y dominios iniciadores reducen aún más el alcance.',
        ],
      },
    ],
    actions: [
      {
        title: 'Acciones seguras',
        paragraphs: [
          'Bloquear y actualizar a HTTPS funcionan sin acceso al sitio. Redirecciones y cabeceras necesitan un alcance limitado.',
        ],
      },
      {
        title: 'Redirecciones y cabeceras',
        paragraphs: [
          'El destino debe usar HTTP o HTTPS y las capturas van de $1 a $9.',
          'Solo se pueden quitar o definir cabeceras permitidas por el navegador.',
        ],
      },
    ],
    permissions: [
      {
        title: 'Acceso bajo demanda',
        paragraphs: [
          'El acceso opcional solo se solicita al activar una regla que realmente lo necesita.',
          'Reglas, copias y pruebas permanecen en el navegador. No hay analítica ni servicio remoto.',
        ],
      },
      {
        title: 'Limitar el alcance',
        paragraphs: ['Prefiere un esquema y host concretos y añade dominios iniciadores para subrecursos.'],
      },
    ],
    migration: [
      {
        title: 'Solo Chrome',
        paragraphs: [
          'La extensión anterior solo existía en Chrome, por eso la detección automática solo aparece allí.',
          'Si tenía otro ID, importa la copia JSON desde Ajustes.',
        ],
      },
      {
        title: 'Revisar primero',
        paragraphs: [
          'Las reglas compatibles se convierten en candidatas desactivadas. Los datos no compatibles siguen disponibles para exportar.',
        ],
      },
    ],
    troubleshooting: [
      {
        title: 'La regla no se ejecuta',
        paragraphs: [
          'Revisa la pausa global, activación, validez y permisos del sitio.',
          'Prueba la URL exacta y verifica el tipo de recurso y el dominio iniciador.',
        ],
      },
      {
        title: 'Importación y ejecución',
        paragraphs: [
          'Previsualiza las importaciones y exporta una copia antes de cambios grandes.',
          'Volver a abrir el gestor reconcilia las reglas del navegador con el estado guardado.',
        ],
      },
    ],
  },
};

export function guideCopy(locale: Locale, slug: GuideSlug): GuideCopy {
  if (locale === 'en') return enGuides[slug];
  const [title, description] = localizedGuideMeta[locale][slug];
  return { title, description, sections: localizedSections[locale][slug] };
}
