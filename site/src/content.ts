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
  'advanced-examples',
  'permissions',
  'migration',
  'breaking-changes',
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
  sections: Array<{ title: string; paragraphs: string[]; points?: string[]; code?: string }>;
};

const redirectExamples = {
  localApi: `Match type    Wildcard
Match         https://api.staging.example.com/v1/*
Resources     XMLHttpRequest
Methods       GET, POST, PUT, PATCH, DELETE
Initiator     app.example.com
Action        Redirect
Destination   http://localhost:3000/v1/$1

https://api.staging.example.com/v1/users/42
→ http://localhost:3000/v1/users/42`,
  cdnMigration: `Match type    Wildcard
Match         https://static.legacy.example.com/*
Resources     Script, Stylesheet, Image, Font
Initiator     www.example.com
Action        Redirect
Destination   https://cdn.example.com/$1

https://static.legacy.example.com/assets/app.css
→ https://cdn.example.com/assets/app.css`,
  apiBridge: `Match type    Regular expression
Match         ^https://api\\.example\\.com/v1/(users|projects)/([^?]+)$
Resources     XMLHttpRequest
Methods       GET
Initiator     app.example.com
Action        Redirect
Destination   https://api.example.com/v2/$1/$2

https://api.example.com/v1/projects/alpha
→ https://api.example.com/v2/projects/alpha`,
  localScript: `Match type    URL filter
Match         https://app.example.com/assets/checkout.js
Resources     Script
Initiator     app.example.com
Action        Redirect
Destination   http://localhost:5173/checkout.js`,
} as const;

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
  'advanced-examples': {
    title: 'Advanced rule examples',
    description: 'Practical redirect recipes for development, migrations, and controlled debugging.',
    sections: [
      {
        title: 'Read this before copying a recipe',
        paragraphs: [
          'Every example uses reserved example.com names. Replace them with origins you control, create the rule disabled, and use Test rule on representative URLs before enabling it.',
          'Redirect and request-header rules change what a page receives. Keep resource types and initiator domains narrow so an unrelated page cannot trigger the rule.',
        ],
      },
      {
        title: 'Send a staging API to a local server',
        paragraphs: [
          'This keeps everything after /v1/ as capture $1. It is useful when a real frontend should talk to a local API or reverse proxy without changing the application build.',
          'Include only the methods your local server handles. The initiator limits the rule to requests started by app.example.com.',
        ],
        code: redirectExamples.localApi,
      },
      {
        title: 'Move a controlled site from an old CDN',
        paragraphs: [
          'This preserves the complete asset path while moving scripts, styles, images, and fonts to a new host. Use it as a temporary compatibility bridge while updating the site itself.',
          'This is an unconditional redirect, not a failover: the browser will not try the old CDN when the new one fails.',
        ],
        code: redirectExamples.cdnMigration,
      },
      {
        title: 'Bridge a read-only API version with regex captures',
        paragraphs: [
          'Two capture groups preserve the resource family and identifier while changing /v1/ to /v2/. Restricting the method to GET avoids silently changing write semantics.',
          'Regular-expression support is checked by the active browser when you save. Prefer a wildcard when one capture is enough.',
        ],
        code: redirectExamples.apiBridge,
      },
      {
        title: 'Replace one production bundle during regression work',
        paragraphs: [
          'An exact URL filter can replace a single script with a local debugging build. This is useful for controlled regression testing without redirecting every asset on the site.',
          'Use this only on an application you control. A local HTTPS server avoids mixed-content restrictions when the page itself uses HTTPS.',
        ],
        code: redirectExamples.localScript,
      },
      {
        title: 'What Redirect does not do',
        paragraphs: [
          'A redirect runs whenever all match conditions pass. It cannot wait for a 404, inspect a response body, choose a destination after a network failure, or run JavaScript to compute a URL.',
        ],
        points: [
          'Targets must use HTTP or HTTPS.',
          'Wildcard and regular-expression captures are referenced as $1 through $9.',
          'Query-string order, decoding, and repeated keys are not automatically normalized.',
          'Avoid redirect cycles; My Webrequest blocks obvious self-redirects and detected cycles.',
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
  'breaking-changes': {
    title: 'Breaking changes from 0.12.11',
    description: 'What changed in the Manifest V3 rebuild, why it changed, and what to use instead.',
    sections: [
      {
        title: 'The compatibility promise',
        paragraphs: [
          'The current extension keeps the useful request-rule core, but it is not a drop-in runtime copy of the old Manifest V2 extension. Chrome can detect or import old data; Edge and Firefox have no automatic migration because no legacy version was published there.',
          'Nothing old is silently enabled. Each item becomes automatic, review required, unsupported, removed, or invalid, and the original source remains available in the migration snapshot.',
        ],
      },
      {
        title: 'Rule behavior that has a supported replacement',
        paragraphs: [
          'These old capabilities have a direct or bounded modern path. Review every converted rule before enabling it.',
        ],
        points: [
          'Block lists become modern Block rules when their filters are valid.',
          'Standalone HSTS rules become Upgrade to HTTPS rules; the browser’s native HSTS behavior remains separate.',
          'Custom URL redirects convert only when their match and substitution can be represented safely; changed encoding or scope requires review.',
          'Hotlink protection can be recreated as a narrowly scoped request-header rule with explicit asset hosts and initiator domains.',
          'Old category switches become per-rule enabled intent, but migrated candidates remain disabled until review and permission approval.',
        ],
      },
      {
        title: 'Removed features and practical alternatives',
        paragraphs: [
          'The rebuild deliberately does not restore broad, obsolete, or unrelated browser behavior.',
        ],
        points: [
          'Request logging: use the browser Network panel or export a HAR during a focused debugging session. My Webrequest does not retain browsing history.',
          'Global CORS override: configure the server, use a development reverse proxy, or run a dedicated local test environment. There is no safe global equivalent here.',
          'User-Agent override and presets: use browser developer tools for temporary testing or server-side feature flags.',
          'Programmable context-menu actions: use browser bookmarks for static destinations or a separately reviewed automation tool for scripted behavior.',
          'Google search redirect: configure the browser’s search engine, or create a narrow Redirect rule only when a fixed URL shape is sufficient.',
          'Google-to-useso CDN rewriting: remove the old rule and use a maintained CDN or self-hosted assets; the historical endpoint is obsolete.',
          'QR generation: use browser or operating-system sharing tools where available.',
          'Icon styles, donation UI, telemetry, and remote services have no replacement inside My Webrequest.',
        ],
      },
      {
        title: 'Custom URL rules may not be equivalent',
        paragraphs: [
          'The old engine could execute JavaScript-era placeholder logic for host, path, and query values. Manifest V3 redirects use a narrower regular-expression substitution model.',
          'Order-independent query extraction, computed placeholders, unsupported regular-expression syntax, more than nine captures, and non-HTTP(S) destinations stay disabled and exportable. Recreate them only after simplifying the URL contract.',
        ],
      },
      {
        title: 'Recommended upgrade checklist',
        paragraphs: ['Treat migration as a review, not as a one-click activation.'],
        points: [
          'Export the migration report and raw snapshot before applying anything.',
          'Start with automatic Block and HTTPS-upgrade candidates.',
          'Test every Redirect with representative paths, query strings, resource types, and initiators.',
          'Replace broad hotlink or header behavior with explicit initiator domains.',
          'Keep removed and unsupported records only as long as you need the audit trail.',
          'Export a current-format backup after the final rule set is stable.',
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
    'advanced-examples': ['高级规则示例', '用于开发、迁移和可控调试的实用重定向方案。'],
    permissions: ['权限与隐私', '了解规则为何申请网站访问，以及哪些数据始终留在本地。'],
    migration: ['旧版迁移', '在不静默启用旧行为的前提下保留有用规则。'],
    'breaking-changes': ['从 0.12.11 升级', '了解 Manifest V3 重构中的重大变更与替代方案。'],
    troubleshooting: ['问题排查', '处理常见的匹配、权限和运行时问题。'],
  },
  ko: {
    'quick-start': ['빠른 시작', '첫 요청 규칙을 만들고 테스트한 뒤 안전하게 활성화합니다.'],
    matching: ['요청 일치', '의도를 표현하는 가장 좁은 조건을 선택합니다.'],
    actions: ['규칙 작업', '차단, 리디렉션, HTTPS 업그레이드와 요청 헤더를 이해합니다.'],
    'advanced-examples': ['고급 규칙 예제', '개발, 마이그레이션, 제한된 디버깅을 위한 리디렉션 예제입니다.'],
    permissions: ['권한과 개인정보', '사이트 접근이 필요한 이유와 로컬에 남는 데이터를 알아봅니다.'],
    migration: ['기존 규칙 이전', '오래된 동작을 자동 활성화하지 않고 유용한 규칙을 옮깁니다.'],
    'breaking-changes': ['0.12.11에서 업그레이드', 'Manifest V3 재구축의 주요 변경점과 대안을 설명합니다.'],
    troubleshooting: ['문제 해결', '일치, 권한, 런타임의 일반적인 문제를 해결합니다.'],
  },
  ja: {
    'quick-start': ['クイックスタート', '最初のリクエストルールを作成、テストし、安全に有効化します。'],
    matching: ['リクエストの一致', '目的を表す最も狭い条件を選びます。'],
    actions: ['ルール操作', '遮断、転送、HTTPS 化、リクエストヘッダーを理解します。'],
    'advanced-examples': ['高度なルール例', '開発、移行、限定的なデバッグに使える転送レシピです。'],
    permissions: ['権限とプライバシー', 'サイトアクセスが必要な理由と、ローカルに残るデータを説明します。'],
    migration: ['旧版からの移行', '古い動作を勝手に有効化せず、有用なルールを引き継ぎます。'],
    'breaking-changes': [
      '0.12.11 からのアップグレード',
      'Manifest V3 再構築の破壊的変更と代替手段を説明します。',
    ],
    troubleshooting: ['トラブルシューティング', '一致、権限、実行時の一般的な問題を解決します。'],
  },
  fr: {
    'quick-start': ['Démarrage rapide', 'Créez, testez et activez votre première règle en toute sécurité.'],
    matching: ['Correspondance', 'Choisissez le critère le plus précis pour votre intention.'],
    actions: ['Actions de règle', 'Comprenez le blocage, la redirection, HTTPS et les en-têtes.'],
    'advanced-examples': [
      'Exemples de règles avancées',
      'Des redirections pratiques pour le développement, les migrations et le débogage contrôlé.',
    ],
    permissions: [
      'Autorisations et confidentialité',
      'Comprenez pourquoi un accès est demandé et ce qui reste local.',
    ],
    migration: [
      'Migration héritée',
      'Conservez les règles utiles sans activer silencieusement les anciens comportements.',
    ],
    'breaking-changes': [
      'Mise à niveau depuis 0.12.11',
      'Les changements incompatibles de la refonte Manifest V3 et leurs alternatives.',
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
    'advanced-examples': [
      'Ejemplos de reglas avanzadas',
      'Redirecciones prácticas para desarrollo, migraciones y depuración controlada.',
    ],
    permissions: ['Permisos y privacidad', 'Por qué se solicita acceso y qué permanece local.'],
    migration: [
      'Migración anterior',
      'Conserva reglas útiles sin activar silenciosamente comportamientos antiguos.',
    ],
    'breaking-changes': [
      'Actualizar desde 0.12.11',
      'Cambios incompatibles de la reconstrucción Manifest V3 y sus alternativas.',
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
    'advanced-examples': [
      {
        title: '复制示例前先看这里',
        paragraphs: [
          '所有示例都使用保留的 example.com 域名。请替换为你控制的来源，先以停用状态创建规则，再用代表性 URL 执行“测试规则”。',
          '重定向和请求头会改变页面收到的内容。应同时限制资源类型和发起方域名，避免无关页面触发规则。',
        ],
      },
      {
        title: '把测试环境 API 转到本地服务',
        paragraphs: [
          '该规则把 /v1/ 后的全部路径保存在捕获组 $1 中，适合让真实前端连接本地 API 或反向代理，而无需修改应用构建。',
          '只选择本地服务确实处理的方法；发起方会把规则限制在 app.example.com 启动的请求。',
        ],
        code: redirectExamples.localApi,
      },
      {
        title: '把自有站点从旧 CDN 迁到新 CDN',
        paragraphs: [
          '该规则保留完整资源路径，把脚本、样式、图片和字体迁到新主机，可作为更新站点代码期间的临时兼容桥。',
          '它是无条件重定向，不是故障转移；新 CDN 失败时浏览器不会自动回退旧 CDN。',
        ],
        code: redirectExamples.cdnMigration,
      },
      {
        title: '用正则捕获桥接只读 API 版本',
        paragraphs: [
          '两个捕获组会保留资源类型和标识符，同时把 /v1/ 改为 /v2/。仅允许 GET，可避免意外改变写入语义。',
          '保存时会由当前浏览器检查正则支持；如果一个通配符就够用，请优先使用通配符。',
        ],
        code: redirectExamples.apiBridge,
      },
      {
        title: '回归测试时只替换一个线上脚本',
        paragraphs: [
          '精确 URL 过滤器可以把单个脚本替换为本地调试版本，不会把站点的全部资源都重定向。',
          '仅用于你控制的应用；如果页面使用 HTTPS，本地 HTTPS 服务可以避免混合内容限制。',
        ],
        code: redirectExamples.localScript,
      },
      {
        title: 'Redirect 做不到什么',
        paragraphs: [
          '所有匹配条件通过后就会执行重定向。它不能等待 404、检查响应正文、在网络失败后选择目标，也不能运行 JavaScript 动态计算 URL。',
        ],
        points: [
          '目标只能使用 HTTP 或 HTTPS。',
          '通配符和正则捕获通过 $1 到 $9 引用。',
          '查询参数顺序、解码方式和重复键不会被自动归一化。',
          '避免重定向环；明显的自重定向和检测到的循环会被阻止。',
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
    'breaking-changes': [
      {
        title: '兼容性承诺',
        paragraphs: [
          '当前版本保留了有价值的请求规则核心，但不是旧 Manifest V2 扩展的原样运行时副本。Chrome 可以检测或导入旧数据；Edge 和 Firefox 从未发布旧版，因此没有自动迁移。',
          '旧数据不会被静默启用。每一项都会标为自动、需要检查、不支持、已移除或无效，原始内容保留在迁移快照中。',
        ],
      },
      {
        title: '有正式替代方案的旧规则',
        paragraphs: ['以下能力有直接或范围更明确的现代替代方案；启用前仍应逐条检查。'],
        points: [
          '有效的 block 列表会转换为现代“阻止”规则。',
          '独立 HSTS 规则会转换为“升级到 HTTPS”；浏览器自身的 HSTS 机制仍独立工作。',
          'Custom URL 仅在匹配和替换语义可安全表达时转换；编码或范围变化必须人工检查。',
          '防盗链可改为范围明确的请求头规则，并显式填写资源主机与发起方域名。',
          '旧分类开关只保留为每条规则的启用意图，候选规则仍保持停用，等待检查和授权。',
        ],
      },
      {
        title: '已移除功能与实际替代方案',
        paragraphs: ['重构不会恢复范围过宽、已经过时或与请求规则无关的浏览器行为。'],
        points: [
          '请求日志：使用浏览器 Network 面板，或在一次明确的调试会话中导出 HAR；本扩展不会保存浏览历史。',
          '全局 CORS 覆盖：配置服务端、使用开发反向代理或独立测试环境；这里不提供不安全的全局等价功能。',
          'User-Agent 覆盖与预设：临时测试可使用浏览器开发者工具，长期差异应使用服务端特性开关。',
          '可编程右键菜单：固定目标使用浏览器书签；脚本化行为应交给单独评估过的自动化工具。',
          'Google 搜索重定向：优先修改浏览器搜索引擎；只有固定 URL 结构足够时才创建范围明确的 Redirect 规则。',
          'Google 到 useso 的 CDN 改写：删除旧规则，改用仍在维护的 CDN 或自托管资源；历史端点已过时。',
          '二维码：在可用时使用浏览器或操作系统的分享、二维码工具。',
          '图标样式、捐赠界面、遥测和远端服务在 My Webrequest 内没有替代项。',
        ],
      },
      {
        title: 'Custom URL 可能无法等价迁移',
        paragraphs: [
          '旧引擎可以用 JavaScript 时代的占位逻辑处理主机、路径和查询参数；Manifest V3 只提供更窄的正则替换模型。',
          '任意顺序查询参数提取、动态占位符、不支持的正则语法、超过九个捕获组及非 HTTP(S) 目标会保持停用并可导出。只有简化 URL 约定后才应手工重建。',
        ],
      },
      {
        title: '推荐升级检查清单',
        paragraphs: ['把迁移当成一次审查，而不是一键激活。'],
        points: [
          '应用任何内容前，先导出迁移报告和原始快照。',
          '先处理自动转换的阻止与 HTTPS 升级候选。',
          '用代表性路径、查询参数、资源类型和发起方测试每条 Redirect。',
          '把范围过宽的防盗链或请求头行为改为明确的发起方域名。',
          '仅在仍需要审计记录时保留已移除和不支持项目。',
          '最终规则稳定后，再导出一份当前格式的备份。',
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
    'advanced-examples': [
      {
        title: '예제를 복사하기 전에',
        paragraphs: [
          '모든 예제는 예약된 example.com 도메인을 사용합니다. 직접 관리하는 출처로 바꾸고 비활성 상태로 만든 뒤 대표 URL로 규칙 테스트를 실행하세요.',
          '리디렉션과 요청 헤더는 페이지가 받는 내용을 바꿉니다. 리소스 유형과 시작 도메인을 좁혀 관련 없는 페이지가 규칙을 실행하지 못하게 하세요.',
        ],
      },
      {
        title: '스테이징 API를 로컬 서버로 보내기',
        paragraphs: [
          '/v1/ 뒤의 경로를 캡처 $1로 유지합니다. 애플리케이션 빌드를 바꾸지 않고 실제 프런트엔드를 로컬 API나 역방향 프록시에 연결할 때 유용합니다.',
          '로컬 서버가 처리하는 메서드만 선택하고 시작 도메인을 app.example.com으로 제한하세요.',
        ],
        code: redirectExamples.localApi,
      },
      {
        title: '관리하는 사이트를 새 CDN으로 이동하기',
        paragraphs: [
          '스크립트, 스타일, 이미지, 글꼴의 전체 경로를 유지한 채 새 호스트로 이동합니다. 사이트 코드를 수정하는 동안 임시 호환 브리지로 사용할 수 있습니다.',
          '이 규칙은 항상 리디렉션하며 장애 조치가 아닙니다. 새 CDN이 실패해도 이전 CDN으로 돌아가지 않습니다.',
        ],
        code: redirectExamples.cdnMigration,
      },
      {
        title: '정규식 캡처로 읽기 전용 API 버전 연결하기',
        paragraphs: [
          '두 캡처 그룹이 리소스 종류와 식별자를 유지하면서 /v1/을 /v2/로 바꿉니다. GET만 허용해 쓰기 의미가 바뀌는 일을 피합니다.',
          '저장할 때 현재 브라우저가 정규식 지원을 확인합니다. 캡처 하나면 충분할 때는 와일드카드를 우선하세요.',
        ],
        code: redirectExamples.apiBridge,
      },
      {
        title: '회귀 테스트에서 프로덕션 번들 하나만 교체하기',
        paragraphs: [
          '정확한 URL 필터로 단일 스크립트만 로컬 디버그 빌드로 바꿀 수 있습니다.',
          '직접 관리하는 앱에서만 사용하세요. HTTPS 페이지라면 로컬 HTTPS 서버가 혼합 콘텐츠 제한을 피하는 데 도움이 됩니다.',
        ],
        code: redirectExamples.localScript,
      },
      {
        title: 'Redirect가 하지 못하는 일',
        paragraphs: [
          '모든 조건이 맞으면 즉시 리디렉션합니다. 404를 기다리거나 응답 본문을 검사하거나 네트워크 실패 뒤 대상을 고르거나 JavaScript로 URL을 계산할 수 없습니다.',
        ],
        points: [
          '대상은 HTTP 또는 HTTPS여야 합니다.',
          '와일드카드와 정규식 캡처는 $1부터 $9까지 참조합니다.',
          '쿼리 순서, 디코딩, 반복 키는 자동 정규화되지 않습니다.',
          '자기 자신으로의 리디렉션과 감지된 순환은 차단됩니다.',
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
    'breaking-changes': [
      {
        title: '호환성 약속',
        paragraphs: [
          '현재 확장 프로그램은 유용한 요청 규칙 핵심을 유지하지만 기존 Manifest V2 런타임의 복사본은 아닙니다. Chrome은 이전 데이터를 감지하거나 가져올 수 있고, Edge와 Firefox에는 과거 배포본이 없어 자동 이전이 없습니다.',
          '이전 항목은 자동으로 활성화되지 않습니다. 자동, 검토 필요, 미지원, 제거됨, 유효하지 않음으로 분류되고 원본은 이전 스냅샷에 남습니다.',
        ],
      },
      {
        title: '지원되는 대체 경로가 있는 규칙',
        paragraphs: [
          '다음 기능은 직접적이거나 범위가 더 명확한 현대식 대안이 있습니다. 활성화 전 각 규칙을 검토하세요.',
        ],
        points: [
          '유효한 block 목록은 현대식 차단 규칙이 됩니다.',
          '독립 HSTS 규칙은 HTTPS 업그레이드 규칙이 되며 브라우저 자체 HSTS는 별도로 동작합니다.',
          'Custom URL은 일치와 치환을 안전하게 표현할 수 있을 때만 변환됩니다.',
          '핫링크 보호는 명시적인 자산 호스트와 시작 도메인을 가진 제한된 요청 헤더 규칙으로 다시 만들 수 있습니다.',
          '이전 범주 스위치는 규칙별 활성화 의도로만 보존되며 후보는 검토와 권한 승인 전까지 비활성입니다.',
        ],
      },
      {
        title: '제거된 기능과 실용적인 대안',
        paragraphs: ['범위가 넓거나 오래되었거나 요청 규칙과 무관한 브라우저 동작은 복원하지 않습니다.'],
        points: [
          '요청 로그: 브라우저 Network 패널을 사용하거나 한정된 디버깅 세션에서 HAR을 내보내세요.',
          '전역 CORS 우회: 서버를 설정하거나 개발용 역방향 프록시 또는 별도 테스트 환경을 사용하세요.',
          'User-Agent 변경: 임시 테스트는 브라우저 개발자 도구, 장기 분기는 서버 기능 플래그를 사용하세요.',
          '프로그래밍 가능한 컨텍스트 메뉴: 고정 대상은 북마크를, 스크립트는 별도로 검토한 자동화 도구를 사용하세요.',
          'Google 검색 리디렉션: 브라우저 검색 엔진을 설정하거나 고정 URL 형식에만 제한된 Redirect 규칙을 사용하세요.',
          'Google-to-useso CDN 변경: 오래된 규칙을 제거하고 유지되는 CDN이나 자체 호스팅 자산을 사용하세요.',
          'QR 생성: 지원되는 브라우저 또는 운영체제 공유 도구를 사용하세요.',
          '아이콘 스타일, 기부 UI, 원격 서비스와 분석 기능은 My Webrequest에서 대체하지 않습니다.',
        ],
      },
      {
        title: 'Custom URL은 동일하게 이전되지 않을 수 있음',
        paragraphs: [
          '이전 엔진은 호스트, 경로, 쿼리에 JavaScript식 자리표시자 로직을 사용했지만 Manifest V3는 더 제한된 정규식 치환만 제공합니다.',
          '순서와 무관한 쿼리 추출, 계산형 자리표시자, 미지원 정규식, 아홉 개를 넘는 캡처, HTTP(S)가 아닌 대상은 비활성 상태로 보존됩니다.',
        ],
      },
      {
        title: '권장 업그레이드 체크리스트',
        paragraphs: ['이전을 한 번의 활성화가 아니라 검토 과정으로 다루세요.'],
        points: [
          '적용 전 이전 보고서와 원본 스냅샷을 내보냅니다.',
          '자동 차단 및 HTTPS 업그레이드 후보부터 처리합니다.',
          '각 Redirect를 대표 경로, 쿼리, 리소스 유형, 시작 도메인으로 테스트합니다.',
          '광범위한 핫링크와 헤더 동작을 명시적 시작 도메인으로 제한합니다.',
          '감사 기록이 필요할 때만 제거되거나 미지원인 항목을 보관합니다.',
          '최종 규칙이 안정되면 현재 형식 백업을 내보냅니다.',
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
    'advanced-examples': [
      {
        title: '例をコピーする前に',
        paragraphs: [
          'すべての例は予約済みの example.com ドメインを使います。管理している接続元へ置き換え、無効のまま作成し、代表的な URL で「ルールをテスト」を実行してください。',
          '転送とリクエストヘッダーはページが受け取る内容を変えます。リソース種別と開始元ドメインを絞り、無関係なページから発動しないようにします。',
        ],
      },
      {
        title: 'ステージング API をローカルサーバーへ送る',
        paragraphs: [
          '/v1/ 以降のパスを捕捉 $1 として保持します。アプリのビルドを変えずに実際のフロントエンドをローカル API やリバースプロキシへ接続できます。',
          'ローカルサーバーが扱うメソッドだけを選び、開始元を app.example.com に限定します。',
        ],
        code: redirectExamples.localApi,
      },
      {
        title: '管理しているサイトを新しい CDN へ移す',
        paragraphs: [
          'スクリプト、スタイル、画像、フォントの完全なパスを保ったまま新しいホストへ移します。サイト本体の更新中に一時的な互換ブリッジとして使えます。',
          'これは常時転送でありフェイルオーバーではありません。新しい CDN が失敗しても旧 CDN へ戻りません。',
        ],
        code: redirectExamples.cdnMigration,
      },
      {
        title: '正規表現の捕捉で読み取り専用 API を橋渡しする',
        paragraphs: [
          '二つの捕捉グループでリソース種別と ID を保持しつつ /v1/ を /v2/ に変えます。GET のみにして書き込みの意味が変わるのを防ぎます。',
          '保存時に現在のブラウザが正規表現の対応可否を確認します。一つの捕捉で足りるならワイルドカードを優先してください。',
        ],
        code: redirectExamples.apiBridge,
      },
      {
        title: '回帰テストで本番バンドルを一つだけ置き換える',
        paragraphs: [
          '正確な URL フィルターで、一つのスクリプトだけをローカルのデバッグビルドへ置き換えられます。',
          '自分で管理するアプリだけに使用してください。HTTPS ページではローカル HTTPS サーバーが混在コンテンツ制限を避けやすくします。',
        ],
        code: redirectExamples.localScript,
      },
      {
        title: 'Redirect ではできないこと',
        paragraphs: [
          'すべての条件が一致すると直ちに転送します。404 を待つ、レスポンス本文を調べる、通信失敗後に宛先を選ぶ、JavaScript で URL を計算するといった処理はできません。',
        ],
        points: [
          '宛先は HTTP または HTTPS に限られます。',
          'ワイルドカードと正規表現の捕捉は $1〜$9 で参照します。',
          'クエリ順序、デコード、重複キーは自動で正規化されません。',
          '自己転送や検出された循環は遮断されます。',
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
    'breaking-changes': [
      {
        title: '互換性についての約束',
        paragraphs: [
          '現行版は有用なリクエストルールの中核を維持しますが、旧 Manifest V2 ランタイムの複製ではありません。Chrome は旧データを検出または読み込めますが、旧版が公開されていない Edge と Firefox に自動移行はありません。',
          '旧項目は勝手に有効化されません。自動、要確認、未対応、削除済み、無効に分類され、原本は移行スナップショットへ残ります。',
        ],
      },
      {
        title: '対応する代替手段があるルール',
        paragraphs: [
          '次の機能には直接的、または範囲を限定した現代的な代替があります。有効化前に一件ずつ確認してください。',
        ],
        points: [
          '有効な block リストは新しい遮断ルールになります。',
          '独立した HSTS ルールは HTTPS 化ルールになり、ブラウザ本来の HSTS は別に動作します。',
          'Custom URL は一致と置換を安全に表現できる場合だけ変換されます。',
          '直リンク防止は、資産ホストと開始元ドメインを明示した限定的なリクエストヘッダールールで再作成できます。',
          '旧カテゴリスイッチはルールごとの有効化意図としてのみ保持され、確認と権限承認までは無効です。',
        ],
      },
      {
        title: '削除された機能と実用的な代替案',
        paragraphs: ['範囲が広すぎる、古い、またはリクエストルールと無関係なブラウザ動作は復元しません。'],
        points: [
          'リクエストログ：ブラウザの Network パネルを使うか、限定したデバッグ中に HAR を書き出します。',
          '全体 CORS 上書き：サーバーを設定するか、開発用リバースプロキシまたは専用テスト環境を使います。',
          'User-Agent 変更：一時テストは開発者ツール、長期的な分岐はサーバー側の機能フラグを使います。',
          'プログラム可能なコンテキストメニュー：固定先はブックマーク、スクリプト処理は別途検証した自動化ツールを使います。',
          'Google 検索転送：ブラウザの検索エンジンを設定するか、固定 URL 形状で十分な場合だけ限定的な Redirect を作ります。',
          'Google-to-useso CDN 書き換え：旧ルールを削除し、保守中の CDN または自己ホスト資産へ移行します。',
          'QR 生成：利用可能なブラウザまたは OS の共有機能を使います。',
          'アイコンスタイル、寄付 UI、テレメトリ、リモートサービスは My Webrequest 内で代替しません。',
        ],
      },
      {
        title: 'Custom URL は同等に移行できない場合がある',
        paragraphs: [
          '旧エンジンはホスト、パス、クエリに JavaScript 時代のプレースホルダー処理を使えましたが、Manifest V3 はより限定的な正規表現置換だけを提供します。',
          '順序に依存しないクエリ抽出、計算型プレースホルダー、未対応正規表現、九個を超える捕捉、HTTP(S) 以外の宛先は無効のまま保存されます。',
        ],
      },
      {
        title: '推奨アップグレード手順',
        paragraphs: ['移行を一括有効化ではなく、確認作業として扱ってください。'],
        points: [
          '適用前に移行レポートと原本スナップショットを書き出します。',
          '自動変換された遮断と HTTPS 化の候補から始めます。',
          '各 Redirect を代表的なパス、クエリ、リソース種別、開始元でテストします。',
          '広すぎる直リンク防止やヘッダー処理を明示的な開始元へ限定します。',
          '監査に必要な間だけ削除済み・未対応項目を保持します。',
          '最終ルールが安定したら現行形式のバックアップを書き出します。',
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
    'advanced-examples': [
      {
        title: 'Avant de copier un exemple',
        paragraphs: [
          'Tous les exemples utilisent les domaines réservés example.com. Remplacez-les par des origines que vous contrôlez, créez la règle désactivée, puis utilisez Tester la règle avec des URL représentatives.',
          'Les redirections et en-têtes changent ce que reçoit une page. Limitez les types de ressources et les domaines initiateurs.',
        ],
      },
      {
        title: 'Envoyer une API de préproduction vers un serveur local',
        paragraphs: [
          'Tout ce qui suit /v1/ est conservé dans la capture $1. Un véritable front-end peut ainsi utiliser une API locale ou un proxy inverse sans modifier son build.',
          'Ne sélectionnez que les méthodes gérées localement et limitez l’initiateur à app.example.com.',
        ],
        code: redirectExamples.localApi,
      },
      {
        title: 'Migrer un site contrôlé vers un nouveau CDN',
        paragraphs: [
          'Le chemin complet des scripts, styles, images et polices est conservé sur le nouvel hôte. Cette règle peut servir de pont temporaire pendant la mise à jour du site.',
          'La redirection est systématique, pas conditionnelle : elle ne revient pas à l’ancien CDN si le nouveau échoue.',
        ],
        code: redirectExamples.cdnMigration,
      },
      {
        title: 'Relier une API en lecture seule avec des captures regex',
        paragraphs: [
          'Deux captures conservent la famille de ressource et son identifiant tout en remplaçant /v1/ par /v2/. La méthode GET évite de modifier la sémantique des écritures.',
          'Le navigateur actif vérifie la compatibilité de l’expression lors de l’enregistrement. Préférez un joker si une seule capture suffit.',
        ],
        code: redirectExamples.apiBridge,
      },
      {
        title: 'Remplacer un seul bundle pendant un test de régression',
        paragraphs: [
          'Un filtre URL exact remplace un script précis par un build local sans rediriger tous les fichiers du site.',
          'Utilisez cette technique uniquement sur une application que vous contrôlez. Un serveur HTTPS local évite les restrictions de contenu mixte.',
        ],
        code: redirectExamples.localScript,
      },
      {
        title: 'Ce que Redirect ne fait pas',
        paragraphs: [
          'La redirection s’exécute dès que toutes les conditions correspondent. Elle ne peut pas attendre une 404, lire le corps d’une réponse, choisir après une panne réseau ni calculer une URL en JavaScript.',
        ],
        points: [
          'La cible doit utiliser HTTP ou HTTPS.',
          'Les captures joker ou regex sont référencées de $1 à $9.',
          'L’ordre, le décodage et les clés répétées d’une requête ne sont pas normalisés.',
          'Les auto-redirections et cycles détectés sont bloqués.',
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
    'breaking-changes': [
      {
        title: 'Promesse de compatibilité',
        paragraphs: [
          'La version actuelle conserve le cœur utile des règles réseau, mais ne reproduit pas à l’identique l’ancien runtime Manifest V2. Chrome peut détecter ou importer les anciennes données ; Edge et Firefox n’ont pas de migration automatique car aucune ancienne version n’y a été publiée.',
          'Aucun élément n’est activé silencieusement. Chaque entrée est classée automatique, à vérifier, non prise en charge, supprimée ou invalide, et la source reste dans l’instantané.',
        ],
      },
      {
        title: 'Règles disposant d’un remplacement pris en charge',
        paragraphs: [
          'Ces fonctions ont une alternative directe ou mieux délimitée. Vérifiez chaque règle avant de l’activer.',
        ],
        points: [
          'Les listes block valides deviennent des règles de blocage modernes.',
          'Les règles HSTS autonomes deviennent des règles de passage à HTTPS ; le HSTS natif du navigateur reste indépendant.',
          'Custom URL n’est converti que si la correspondance et la substitution peuvent être représentées sans risque.',
          'La protection anti-hotlink peut être recréée avec une règle d’en-tête limitée à des hôtes et initiateurs explicites.',
          'Les anciens interrupteurs deviennent une intention par règle, mais les candidates restent désactivées avant examen et autorisation.',
        ],
      },
      {
        title: 'Fonctions supprimées et alternatives pratiques',
        paragraphs: [
          'Les comportements trop globaux, obsolètes ou étrangers aux règles réseau ne sont pas rétablis.',
        ],
        points: [
          'Journal des requêtes : utilisez le panneau Réseau ou exportez un HAR pendant une session de débogage ciblée.',
          'Contournement CORS global : configurez le serveur, un proxy inverse de développement ou un environnement de test séparé.',
          'User-Agent : utilisez les outils de développement pour un test temporaire ou des feature flags côté serveur.',
          'Menu contextuel programmable : utilisez des favoris pour les destinations fixes ou un outil d’automatisation évalué séparément.',
          'Redirection de recherche Google : configurez le moteur du navigateur ou une règle Redirect limitée à une forme d’URL fixe.',
          'Réécriture Google-to-useso : supprimez l’ancienne règle et choisissez un CDN maintenu ou des ressources auto-hébergées.',
          'QR : utilisez les outils de partage du navigateur ou du système lorsqu’ils existent.',
          'Styles d’icône, dons, télémétrie et services distants n’ont pas de remplacement dans My Webrequest.',
        ],
      },
      {
        title: 'Custom URL peut ne pas être équivalent',
        paragraphs: [
          'L’ancien moteur pouvait appliquer une logique de variables JavaScript aux hôtes, chemins et paramètres. Manifest V3 ne fournit qu’une substitution regex plus restreinte.',
          'Extraction de paramètres sans ordre, variables calculées, regex incompatibles, plus de neuf captures et cibles non HTTP(S) restent désactivées et exportables.',
        ],
      },
      {
        title: 'Liste de contrôle recommandée',
        paragraphs: ['Traitez la migration comme une revue, pas comme une activation en un clic.'],
        points: [
          'Exportez le rapport et l’instantané brut avant toute application.',
          'Commencez par les candidates automatiques de blocage et HTTPS.',
          'Testez chaque Redirect avec des chemins, requêtes, types et initiateurs représentatifs.',
          'Remplacez les règles d’en-tête trop larges par des initiateurs explicites.',
          'Ne gardez les éléments supprimés ou non pris en charge que pour les besoins d’audit.',
          'Exportez une sauvegarde au format actuel lorsque l’ensemble final est stable.',
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
    'advanced-examples': [
      {
        title: 'Antes de copiar un ejemplo',
        paragraphs: [
          'Todos los ejemplos usan dominios reservados de example.com. Sustitúyelos por orígenes bajo tu control, crea la regla desactivada y prueba URL representativas antes de activarla.',
          'Las redirecciones y cabeceras cambian lo que recibe una página. Limita los tipos de recurso y los dominios iniciadores.',
        ],
      },
      {
        title: 'Enviar una API de pruebas a un servidor local',
        paragraphs: [
          'Todo lo que sigue a /v1/ se conserva en la captura $1. Así un frontend real puede usar una API local o un proxy inverso sin cambiar su compilación.',
          'Selecciona solo los métodos admitidos localmente y limita el iniciador a app.example.com.',
        ],
        code: redirectExamples.localApi,
      },
      {
        title: 'Mover un sitio controlado a un CDN nuevo',
        paragraphs: [
          'Conserva la ruta completa de scripts, estilos, imágenes y fuentes al cambiar de host. Puede ser un puente temporal mientras se actualiza el sitio.',
          'Es una redirección incondicional, no una conmutación por error: no vuelve al CDN anterior si falla el nuevo.',
        ],
        code: redirectExamples.cdnMigration,
      },
      {
        title: 'Conectar una API de solo lectura con capturas regex',
        paragraphs: [
          'Dos capturas conservan la familia de recurso y el identificador mientras cambian /v1/ por /v2/. Limitar a GET evita alterar operaciones de escritura.',
          'El navegador activo comprueba la expresión al guardar. Prefiere un comodín si basta una captura.',
        ],
        code: redirectExamples.apiBridge,
      },
      {
        title: 'Sustituir un solo bundle durante una regresión',
        paragraphs: [
          'Un filtro URL exacto sustituye un script concreto por una compilación local sin redirigir todos los recursos.',
          'Úsalo solo en una aplicación bajo tu control. Un servidor HTTPS local evita restricciones de contenido mixto.',
        ],
        code: redirectExamples.localScript,
      },
      {
        title: 'Lo que Redirect no puede hacer',
        paragraphs: [
          'La redirección se ejecuta cuando coinciden todas las condiciones. No puede esperar un 404, leer la respuesta, elegir después de un fallo de red ni calcular una URL con JavaScript.',
        ],
        points: [
          'El destino debe usar HTTP o HTTPS.',
          'Las capturas de comodín o regex se referencian de $1 a $9.',
          'El orden, decodificación y claves repetidas de la consulta no se normalizan.',
          'Las autorredirecciones y ciclos detectados se bloquean.',
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
    'breaking-changes': [
      {
        title: 'Promesa de compatibilidad',
        paragraphs: [
          'La versión actual conserva el núcleo útil de reglas de red, pero no copia el runtime Manifest V2 anterior. Chrome puede detectar o importar datos antiguos; Edge y Firefox no tienen migración automática porque allí nunca hubo una versión anterior.',
          'Nada se activa silenciosamente. Cada elemento se clasifica como automático, para revisar, no compatible, eliminado o inválido, y el original permanece en la instantánea.',
        ],
      },
      {
        title: 'Reglas con una alternativa compatible',
        paragraphs: [
          'Estas funciones tienen una vía moderna directa o mejor delimitada. Revisa cada regla antes de activarla.',
        ],
        points: [
          'Las listas block válidas se convierten en reglas de bloqueo modernas.',
          'Las reglas HSTS independientes pasan a Actualizar a HTTPS; el HSTS nativo del navegador sigue separado.',
          'Custom URL solo se convierte si la coincidencia y sustitución pueden representarse de forma segura.',
          'La protección contra hotlink puede recrearse como una regla de cabecera limitada a hosts e iniciadores explícitos.',
          'Los interruptores de categoría pasan a ser intención por regla, pero las candidatas siguen desactivadas hasta su revisión y permiso.',
        ],
      },
      {
        title: 'Funciones eliminadas y alternativas prácticas',
        paragraphs: ['No se restauran comportamientos globales, obsoletos o ajenos a las reglas de red.'],
        points: [
          'Registro de solicitudes: usa el panel Red o exporta un HAR durante una sesión de depuración concreta.',
          'CORS global: configura el servidor, un proxy inverso de desarrollo o un entorno de prueba separado.',
          'User-Agent: usa las herramientas de desarrollo para pruebas temporales o feature flags del servidor.',
          'Menú contextual programable: usa marcadores para destinos fijos o una herramienta de automatización evaluada aparte.',
          'Redirección de búsqueda de Google: configura el buscador o una regla Redirect limitada a una forma de URL fija.',
          'Reescritura Google-to-useso: elimina la regla y usa un CDN mantenido o recursos autoalojados.',
          'QR: usa herramientas de compartir del navegador o sistema cuando estén disponibles.',
          'Estilos de icono, donaciones, telemetría y servicios remotos no tienen sustituto dentro de My Webrequest.',
        ],
      },
      {
        title: 'Custom URL puede no ser equivalente',
        paragraphs: [
          'El motor anterior podía aplicar variables de estilo JavaScript a host, ruta y consulta. Manifest V3 solo ofrece una sustitución regex más limitada.',
          'Extracción de parámetros sin orden, variables calculadas, regex incompatibles, más de nueve capturas y destinos no HTTP(S) permanecen desactivados y exportables.',
        ],
      },
      {
        title: 'Lista de comprobación recomendada',
        paragraphs: ['Trata la migración como una revisión, no como una activación en un clic.'],
        points: [
          'Exporta el informe y la instantánea original antes de aplicar nada.',
          'Empieza por las candidatas automáticas de bloqueo y HTTPS.',
          'Prueba cada Redirect con rutas, consultas, tipos e iniciadores representativos.',
          'Sustituye reglas de cabecera amplias por iniciadores explícitos.',
          'Conserva elementos eliminados o incompatibles solo mientras necesites la auditoría.',
          'Exporta una copia en el formato actual cuando el conjunto final sea estable.',
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
