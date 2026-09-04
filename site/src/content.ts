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

export const guideGroups = ['start', 'tasks', 'upgrade', 'support'] as const;
export type GuideGroup = (typeof guideGroups)[number];

export const guideGroupSlugs: Record<GuideGroup, readonly GuideSlug[]> = {
  start: ['quick-start', 'matching', 'actions'],
  tasks: ['advanced-examples'],
  upgrade: ['migration', 'breaking-changes'],
  support: ['troubleshooting', 'permissions'],
};

type GuideGroupCopy = { title: string; description: string };

export const guideGroupCopy: Record<Locale, Record<GuideGroup, GuideGroupCopy>> = {
  en: {
    start: { title: 'Get started', description: 'Create and test your first rule.' },
    tasks: { title: 'Everyday recipes', description: 'Put redirects to work in real scenarios.' },
    upgrade: { title: 'Move from the old version', description: 'Bring your Chrome rules across safely.' },
    support: { title: 'Privacy & troubleshooting', description: 'Review permissions and fix common issues.' },
  },
  'zh-CN': {
    start: { title: '快速上手', description: '从创建第一条规则开始。' },
    tasks: { title: '实用示例', description: '看看重定向能解决哪些实际问题。' },
    upgrade: { title: '从旧版升级', description: '稳妥地迁移原有 Chrome 规则。' },
    support: { title: '隐私与故障排查', description: '了解权限，并解决常见问题。' },
  },
  ko: {
    start: { title: '빠르게 시작하기', description: '첫 규칙을 만들고 테스트해 보세요.' },
    tasks: { title: '활용 예제', description: '리디렉션으로 해결할 수 있는 작업을 살펴보세요.' },
    upgrade: { title: '이전 버전에서 옮기기', description: '기존 Chrome 규칙을 안전하게 가져오세요.' },
    support: {
      title: '개인정보 및 문제 해결',
      description: '권한을 확인하고 자주 생기는 문제를 해결하세요.',
    },
  },
  ja: {
    start: { title: 'まず使ってみる', description: '最初のルールを作成してテストします。' },
    tasks: { title: '活用例', description: 'リダイレクトが役立つ場面を紹介します。' },
    upgrade: { title: '旧バージョンから移行', description: '以前の Chrome ルールを安全に引き継ぎます。' },
    support: { title: 'プライバシーとトラブル解決', description: '権限を確認し、よくある問題を解決します。' },
  },
  fr: {
    start: { title: 'Bien démarrer', description: 'Créez et testez votre première règle.' },
    tasks: { title: 'Exemples pratiques', description: 'Découvrez des usages concrets de la redirection.' },
    upgrade: {
      title: 'Passer de l’ancienne version',
      description: 'Importez vos anciennes règles Chrome sans risque.',
    },
    support: {
      title: 'Confidentialité et dépannage',
      description: 'Vérifiez les autorisations et résolvez les problèmes courants.',
    },
  },
  es: {
    start: { title: 'Primeros pasos', description: 'Crea y prueba tu primera regla.' },
    tasks: { title: 'Ejemplos prácticos', description: 'Descubre usos reales de las redirecciones.' },
    upgrade: {
      title: 'Pasar desde la versión anterior',
      description: 'Importa tus reglas antiguas de Chrome de forma segura.',
    },
    support: {
      title: 'Privacidad y ayuda',
      description: 'Revisa los permisos y resuelve los problemas más comunes.',
    },
  },
};

type HomeCopy = {
  metaTitle: string;
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
    metaTitle: 'Local request rules for Chrome, Edge, and Firefox',
    navGuides: 'Guides',
    navPrivacy: 'Privacy',
    openGithub: 'GitHub',
    eyebrow: 'Request rules that stay on your device',
    title: 'Know exactly which requests you are changing.',
    description:
      'Block, redirect, upgrade to HTTPS, or adjust request headers with a clear Manifest V3 rule manager. Your rules never leave the browser.',
    quickStart: 'Get started',
    github: 'View on GitHub',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: 'A safer way to work',
    workflowTitle: 'Build a rule, check it, then turn it on',
    workflowDescription:
      'Every step stays visible. Examples and imported rules remain off until you have reviewed them.',
    steps: [
      {
        title: 'Choose what to match',
        description:
          'Use a URL filter for everyday rules, a simple wildcard for easy captures, or a regular expression for advanced logic.',
      },
      {
        title: 'Test before enabling',
        description: 'Try a URL and see the expected result without sending a network request.',
      },
      {
        title: 'Approve only what is needed',
        description: 'The browser asks for site access only when the rule really needs it.',
      },
    ],
    capabilitiesTitle: 'Everything you need for focused request rules',
    capabilities: [
      { title: 'Block', description: 'Stop matching requests with no host permission.' },
      { title: 'Redirect', description: 'Send matching requests to another HTTP or HTTPS address.' },
      { title: 'Upgrade', description: 'Move matching HTTP traffic to HTTPS.' },
      { title: 'Headers', description: 'Remove or set supported request headers within a defined scope.' },
      { title: 'Backup', description: 'Export verified JSON and preview every change before importing.' },
      {
        title: 'Migration',
        description: 'Review rules from the old version while keeping the original data available.',
      },
    ],
    guidesTitle: 'What would you like to do?',
    guidesDescription: 'Start with a short guide, then dig into the details when you need them.',
    trustTitle: 'Private by default',
    trustDescription:
      'Rules stay in your browser. There is no analytics code and no remote service handling your rules.',
    footer: 'Open source · Manifest V3 · Stored locally',
  },
  'zh-CN': {
    metaTitle: 'Chrome、Edge 与 Firefox 请求规则管理器',
    navGuides: '指南',
    navPrivacy: '隐私',
    openGithub: 'GitHub',
    eyebrow: '规则只保存在浏览器中',
    title: '规则看得清，请求改得准。',
    description:
      '用清晰易懂的 Manifest V3 规则阻止或重定向请求、升级到 HTTPS，以及调整请求头。所有规则都留在你的浏览器里。',
    quickStart: '快速上手',
    github: '在 GitHub 查看源码',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: '更稳妥的使用方式',
    workflowTitle: '先创建、再测试，确认无误后启用',
    workflowDescription: '每一步都清楚可见。示例规则和迁移来的规则会保持关闭，直到你亲自确认。',
    steps: [
      {
        title: '确定匹配范围',
        description:
          '一般规则用 URL 过滤器，简单捕获用通配符，复杂逻辑再用正则；还可按资源类型和来源网页缩小范围。',
      },
      { title: '启用前先测试', description: '输入一个 URL 就能看到预期结果，不会真的发出网络请求。' },
      { title: '只开放必要权限', description: '只有规则确实需要时，浏览器才会请求相应的网站访问权限。' },
    ],
    capabilitiesTitle: '处理请求规则所需的核心功能',
    capabilities: [
      { title: '阻止', description: '直接拦截符合条件的请求，无需网站访问权限。' },
      { title: '重定向', description: '把符合条件的请求转到另一个 HTTP 或 HTTPS 地址。' },
      { title: '升级到 HTTPS', description: '自动把符合条件的 HTTP 请求改为 HTTPS。' },
      { title: '请求头', description: '在明确的范围内移除或设置浏览器允许的请求头。' },
      { title: '备份', description: '导出经过校验的 JSON；导入前可以先查看所有变更。' },
      { title: '旧版迁移', description: '逐条检查旧版规则，同时保留无法迁移的原始数据。' },
    ],
    guidesTitle: '你想用它做什么？',
    guidesDescription: '先看简短步骤，遇到需要时再了解细节。',
    trustTitle: '隐私无需额外设置',
    trustDescription: '规则只保存在浏览器中。扩展不含数据分析，也不会把规则交给远端服务处理。',
    footer: '开源 · Manifest V3 · 本地存储',
  },
  ko: {
    metaTitle: 'Chrome, Edge 및 Firefox용 요청 규칙 관리자',
    navGuides: '가이드',
    navPrivacy: '개인정보',
    openGithub: 'GitHub',
    eyebrow: '브라우저 안에만 저장되는 규칙',
    title: '어떤 요청이 바뀌는지 한눈에 확인하세요.',
    description:
      '요청 차단, 리디렉션, HTTPS 전환, 요청 헤더 수정을 명확한 Manifest V3 규칙으로 관리하세요. 규칙은 브라우저 밖으로 전송되지 않습니다.',
    quickStart: '빠르게 시작하기',
    github: 'GitHub에서 소스 보기',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: '더 안전한 사용 흐름',
    workflowTitle: '만들고, 확인한 다음, 활성화하세요',
    workflowDescription:
      '설정 과정을 단계별로 확인할 수 있습니다. 예제와 가져온 규칙은 직접 검토하기 전까지 꺼진 상태로 유지됩니다.',
    steps: [
      {
        title: '대상 범위 정하기',
        description: '일반 규칙은 URL 필터, 간단한 캡처는 와일드카드, 고급 조건은 정규식을 사용하세요.',
      },
      {
        title: '활성화 전에 테스트',
        description: '실제 네트워크 요청을 보내지 않고 URL과 예상 결과를 확인하세요.',
      },
      {
        title: '필요한 권한만 승인',
        description: '규칙에 꼭 필요한 경우에만 브라우저가 사이트 접근 권한을 요청합니다.',
      },
    ],
    capabilitiesTitle: '요청 규칙에 필요한 핵심 기능',
    capabilities: [
      { title: '차단', description: '사이트 접근 권한 없이 조건에 맞는 요청을 차단합니다.' },
      { title: '리디렉션', description: '조건에 맞는 요청을 다른 HTTP 또는 HTTPS 주소로 보냅니다.' },
      { title: 'HTTPS로 전환', description: '조건에 맞는 HTTP 요청을 HTTPS로 바꿉니다.' },
      { title: '요청 헤더', description: '정해진 범위 안에서 지원되는 요청 헤더를 제거하거나 설정합니다.' },
      { title: '백업', description: '검증된 JSON으로 내보내고, 가져오기 전에 변경 내용을 확인합니다.' },
      {
        title: '이전 버전 가져오기',
        description: '기존 규칙을 검토하면서 변환할 수 없는 원본도 보관합니다.',
      },
    ],
    guidesTitle: '무엇을 하고 싶으신가요?',
    guidesDescription: '짧은 안내부터 시작하고, 필요할 때 세부 내용을 확인하세요.',
    trustTitle: '처음부터 개인정보를 보호합니다',
    trustDescription: '규칙은 브라우저에만 저장됩니다. 분석 도구도, 규칙을 처리하는 원격 서비스도 없습니다.',
    footer: '오픈 소스 · Manifest V3 · 브라우저에 저장',
  },
  ja: {
    metaTitle: 'Chrome・Edge・Firefox 向けリクエストルール管理',
    navGuides: 'ガイド',
    navPrivacy: 'プライバシー',
    openGithub: 'GitHub',
    eyebrow: 'ルールはブラウザ内に保存',
    title: 'どの通信を変えるのか、ひと目でわかる。',
    description:
      'わかりやすい Manifest V3 ルールで、リクエストのブロック、リダイレクト、HTTPS 化、ヘッダー変更を管理できます。ルールがブラウザの外へ送られることはありません。',
    quickStart: 'まず使ってみる',
    github: 'GitHub でソースを見る',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: '安心して使える手順',
    workflowTitle: '作成して、確かめてから、有効にする',
    workflowDescription:
      '設定内容を一つずつ確認できます。サンプルや移行したルールは、自分で確認するまで無効のままです。',
    steps: [
      {
        title: '対象を絞り込む',
        description:
          '通常は URL フィルター、簡単なキャプチャはワイルドカード、高度な条件は正規表現を使います。',
      },
      { title: '有効にする前にテスト', description: '実際に通信せず、URL と期待される結果を確認できます。' },
      {
        title: '必要な権限だけ許可',
        description: 'ルールに必要な場合だけ、ブラウザがサイトへのアクセス許可を求めます。',
      },
    ],
    capabilitiesTitle: 'リクエストルールに必要な機能をひと通り',
    capabilities: [
      { title: 'ブロック', description: 'サイトへのアクセス許可なしで、条件に合うリクエストを止めます。' },
      { title: 'リダイレクト', description: '条件に合うリクエストを別の HTTP / HTTPS URL へ送ります。' },
      { title: 'HTTPS 化', description: '条件に合う HTTP リクエストを HTTPS に切り替えます。' },
      {
        title: 'リクエストヘッダー',
        description: '指定した範囲で、対応するヘッダーを削除または設定します。',
      },
      {
        title: 'バックアップ',
        description: '検証可能な JSON を書き出し、読み込む前に変更点を確認できます。',
      },
      {
        title: '旧版からの移行',
        description: '以前のルールを確認しながら、変換できない元データも残します。',
      },
    ],
    guidesTitle: '何をしたいですか？',
    guidesDescription: 'まずは短い手順から。詳しい仕組みは必要になったときに確認できます。',
    trustTitle: '特別な設定なしでプライバシーを保護',
    trustDescription:
      'ルールはブラウザ内だけに保存されます。アクセス解析も、ルールを処理する外部サービスもありません。',
    footer: 'オープンソース · Manifest V3 · ブラウザ内に保存',
  },
  fr: {
    metaTitle: 'Règles de requêtes pour Chrome, Edge et Firefox',
    navGuides: 'Guides',
    navPrivacy: 'Confidentialité',
    openGithub: 'GitHub',
    eyebrow: 'Vos règles restent dans le navigateur',
    title: 'Sachez exactement quelles requêtes vous modifiez.',
    description:
      'Bloquez ou redirigez des requêtes, forcez le HTTPS et ajustez les en-têtes avec des règles Manifest V3 faciles à comprendre. Rien n’est envoyé hors du navigateur.',
    quickStart: 'Bien démarrer',
    github: 'Voir le code sur GitHub',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: 'Une méthode plus sûre',
    workflowTitle: 'Créez la règle, testez-la, puis activez-la',
    workflowDescription:
      'Chaque étape reste visible. Les exemples et les règles importées restent désactivés tant que vous ne les avez pas vérifiés.',
    steps: [
      {
        title: 'Définir ce qui doit correspondre',
        description:
          'Filtre d’URL au quotidien, joker simplifié pour les captures, expression régulière pour la logique avancée.',
      },
      {
        title: 'Tester avant d’activer',
        description: 'Essayez une URL et vérifiez le résultat attendu sans envoyer de requête réseau.',
      },
      {
        title: 'N’autoriser que le nécessaire',
        description: 'Le navigateur demande l’accès au site uniquement si la règle en a réellement besoin.',
      },
    ],
    capabilitiesTitle: 'L’essentiel pour gérer vos règles de requête',
    capabilities: [
      {
        title: 'Bloquer',
        description: 'Bloquez les requêtes correspondantes sans autorisation d’accès au site.',
      },
      {
        title: 'Rediriger',
        description: 'Envoyez les requêtes correspondantes vers une autre adresse HTTP ou HTTPS.',
      },
      {
        title: 'Passer en HTTPS',
        description: 'Remplacez les requêtes HTTP correspondantes par leur version HTTPS.',
      },
      {
        title: 'En-têtes',
        description: 'Supprimez ou définissez les en-têtes pris en charge dans un périmètre précis.',
      },
      {
        title: 'Sauvegarder',
        description: 'Exportez un JSON vérifié et contrôlez les changements avant de l’importer.',
      },
      {
        title: 'Migrer',
        description:
          'Vérifiez les anciennes règles tout en conservant les données qui ne peuvent pas être converties.',
      },
    ],
    guidesTitle: 'Que souhaitez-vous faire ?',
    guidesDescription: 'Commencez par un guide court, puis consultez les détails si nécessaire.',
    trustTitle: 'La confidentialité, sans réglage supplémentaire',
    trustDescription:
      'Les règles restent dans votre navigateur. Aucun outil d’analyse ni service distant ne les traite.',
    footer: 'Open source · Manifest V3 · Stockage local',
  },
  es: {
    metaTitle: 'Reglas de solicitudes para Chrome, Edge y Firefox',
    navGuides: 'Guías',
    navPrivacy: 'Privacidad',
    openGithub: 'GitHub',
    eyebrow: 'Tus reglas se quedan en el navegador',
    title: 'Ten claro qué solicitudes estás modificando.',
    description:
      'Bloquea o redirige solicitudes, fuerza HTTPS y ajusta encabezados con reglas Manifest V3 fáciles de entender. Tus reglas nunca salen del navegador.',
    quickStart: 'Primeros pasos',
    github: 'Ver el código en GitHub',
    compatibility: 'Chrome · Edge · Firefox',
    workflowEyebrow: 'Una forma más segura de trabajar',
    workflowTitle: 'Crea la regla, compruébala y luego actívala',
    workflowDescription:
      'Cada paso queda a la vista. Los ejemplos y las reglas importadas siguen desactivados hasta que los revises.',
    steps: [
      {
        title: 'Define qué debe coincidir',
        description:
          'Filtro de URL para reglas habituales, comodín simple para capturas y expresión regular para lógica avanzada.',
      },
      {
        title: 'Prueba antes de activar',
        description: 'Comprueba una URL y el resultado esperado sin enviar ninguna solicitud de red.',
      },
      {
        title: 'Concede solo lo necesario',
        description: 'El navegador solo pide acceso a un sitio cuando la regla realmente lo necesita.',
      },
    ],
    capabilitiesTitle: 'Lo esencial para gestionar reglas de solicitud',
    capabilities: [
      { title: 'Bloquear', description: 'Bloquea las solicitudes coincidentes sin acceso al sitio.' },
      {
        title: 'Redirigir',
        description: 'Envía las solicitudes coincidentes a otra dirección HTTP o HTTPS.',
      },
      { title: 'Usar HTTPS', description: 'Cambia las solicitudes HTTP coincidentes a HTTPS.' },
      {
        title: 'Encabezados',
        description: 'Elimina o define encabezados compatibles dentro de un alcance concreto.',
      },
      {
        title: 'Copia de seguridad',
        description: 'Exporta un JSON verificado y revisa los cambios antes de importarlo.',
      },
      {
        title: 'Importar la versión anterior',
        description: 'Revisa las reglas antiguas y conserva los datos que no se pueden convertir.',
      },
    ],
    guidesTitle: '¿Qué quieres hacer?',
    guidesDescription: 'Empieza con una guía breve y consulta los detalles cuando los necesites.',
    trustTitle: 'Privacidad sin configuración adicional',
    trustDescription:
      'Las reglas permanecen en tu navegador. No hay analítica ni servicios remotos que las procesen.',
    footer: 'Código abierto · Manifest V3 · Guardado local',
  },
};

export type GuideSectionCopy = {
  title: string;
  paragraphs: string[];
  points?: string[];
  code?: string;
};

export type GuideCopy = {
  title: string;
  description: string;
  sections: GuideSectionCopy[];
};

const redirectExamples = {
  localApi: `Match type    Simple wildcard
Match         https://api.staging.example.com/v1/*
Resources     XMLHttpRequest
Methods       GET, POST, PUT, PATCH, DELETE
Initiator     app.example.com
Action        Redirect
Destination   http://localhost:3000/v1/$1

https://api.staging.example.com/v1/users/42
→ http://localhost:3000/v1/users/42`,
  cdnMigration: `Match type    Simple wildcard
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

const matchingExamples = {
  urlFilter: `||example.com^
|https://example.com/app.js|
https://example.com/assets/*`,
  captures: `Simple wildcard
Match         https://api.example.com/v1/*
Request       https://api.example.com/v1/users/42
$1 = users/42
Destination   http://localhost:3000/v1/$1

Regular expression
Match         ^https://api\\.example\\.com/v1/(users|projects)/([^?]+)$
Request       https://api.example.com/v1/projects/alpha
$1 = projects, $2 = alpha
Destination   https://api.example.com/v2/$1/$2`,
} as const;

const enGuides: Record<GuideSlug, GuideCopy> = {
  'quick-start': {
    title: 'Quick start',
    description: 'Create, test, and safely enable your first request rule.',
    sections: [
      {
        title: 'Choose an example',
        paragraphs: ['Open the rule manager and choose one of the three disabled, editable examples.'],
      },
      {
        title: 'Set the target',
        paragraphs: ['Replace example.com with the domain you intend to handle. Keep the rule disabled.'],
      },
      {
        title: 'Test and enable',
        paragraphs: [
          'Test a representative URL, save, then enable. The browser shows any required access first.',
        ],
      },
    ],
  },
  matching: {
    title: 'Matching requests',
    description: 'Choose the narrowest match that describes your intent.',
    sections: [
      {
        title: 'Choose one of three match modes',
        paragraphs: [
          'The editor has two browser rule formats and one simpler RequestOrbit format. Most rules need only the first option:',
          'New rules start with URL filter. If an entry clearly looks like a regular expression, the editor suggests switching but never changes the mode by itself.',
        ],
        points: [
          'URL filter (recommended): browser-native pattern syntax for a domain, fixed URL, or path. It cannot create $1 values.',
          'Simple wildcard: RequestOrbit turns each * into a captured part. Use it for straightforward redirects that keep part of the original URL.',
          'Regular expression: browser-checked syntax for precise captures, alternatives, and advanced logic. Support can vary by browser.',
        ],
      },
      {
        title: 'What || and ^ mean',
        paragraphs: [
          'In a URL filter, || starts matching at a domain name and includes subdomains. The ^ after the domain requires a separator or the end of the URL, so example.com does not accidentally match example.company. A single | anchors the beginning or end; * matches any number of characters.',
          'This is declarativeNetRequest URL-filter syntax, not a WebExtension host-permission match pattern. RequestOrbit derives the required permission pattern for you.',
        ],
        code: matchingExamples.urlFilter,
      },
      {
        title: 'Captures and $1 through $9',
        paragraphs: [
          'In Simple wildcard mode, the first * becomes $1, the second becomes $2, and so on. In Regular expression mode, use ^ and $ to anchor the URL, \\. for a literal dot, .* for any text, and (...) for each capture group.',
          '$1 through $9 work only in a Redirect destination. The * in URL filter mode matches text but never captures it.',
          'Finally, resource types, methods, and initiator domains can narrow the rule. Leaving types or methods empty means all values.',
        ],
        code: matchingExamples.captures,
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
          'Redirect destinations must use HTTP or HTTPS. Values captured by Simple wildcard or Regular expression can be inserted as $1 through $9.',
          'Header rules can remove or set browser-approved request headers. RequestOrbit rejects forbidden names before activation.',
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
          'Regular-expression support is checked by the active browser when you save. Prefer Simple wildcard when each * can safely stand for one captured part.',
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
          'Simple-wildcard and regular-expression captures are referenced as $1 through $9.',
          'Query-string order, decoding, and repeated keys are not automatically normalized.',
          'Avoid redirect cycles; RequestOrbit blocks obvious self-redirects and detected cycles.',
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
          'Rules, backups, and test inputs remain in browser storage. RequestOrbit has no analytics or remote rule service.',
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
          'Request logging: use the browser Network panel or export a HAR during a focused debugging session. RequestOrbit does not retain browsing history.',
          'Global CORS override: configure the server, use a development reverse proxy, or run a dedicated local test environment. There is no safe global equivalent here.',
          'User-Agent override and presets: use browser developer tools for temporary testing or server-side feature flags.',
          'Programmable context-menu actions: use browser bookmarks for static destinations or a separately reviewed automation tool for scripted behavior.',
          'Google search redirect: configure the browser’s search engine, or create a narrow Redirect rule only when a fixed URL shape is sufficient.',
          'Google-to-useso CDN rewriting: remove the old rule and use a maintained CDN or self-hosted assets; the historical endpoint is obsolete.',
          'QR generation: use browser or operating-system sharing tools where available.',
          'Icon styles, donation UI, telemetry, and remote services have no replacement inside RequestOrbit.',
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
    'quick-start': ['快速上手', '三步创建、测试并启用第一条规则。'],
    matching: ['如何匹配请求', '选择合适的匹配方式，并尽量缩小影响范围。'],
    actions: ['规则能做什么', '了解阻止、重定向、升级到 HTTPS 和修改请求头。'],
    'advanced-examples': ['实用重定向示例', '用几个实际场景掌握开发调试、API 切换和 CDN 迁移。'],
    permissions: ['权限与隐私', '了解何时需要网站权限，以及哪些数据始终留在浏览器中。'],
    migration: ['迁移旧版规则', '把仍然有用的规则带到新版，同时避免意外启用。'],
    'breaking-changes': ['从 0.12.11 升级', '旧版有哪些变化、哪些功能被移除，以及可以用什么替代。'],
    troubleshooting: ['故障排查', '解决规则不生效、权限不足和导入失败等常见问题。'],
  },
  ko: {
    'quick-start': ['빠르게 시작하기', '세 단계로 첫 규칙을 만들고 테스트한 뒤 활성화하세요.'],
    matching: ['요청을 일치시키는 방법', '알맞은 일치 방식을 고르고 영향 범위를 최대한 좁히세요.'],
    actions: ['규칙으로 할 수 있는 일', '차단, 리디렉션, HTTPS 전환, 요청 헤더 변경을 알아보세요.'],
    'advanced-examples': ['실전 리디렉션 예제', '개발, API 전환, CDN 이전에 활용할 수 있는 예제입니다.'],
    permissions: ['권한 및 개인정보', '사이트 권한이 필요한 경우와 브라우저에 남는 데이터를 확인하세요.'],
    migration: ['이전 버전 규칙 가져오기', '기존 규칙을 실수로 켜지 않고 새 버전으로 옮기세요.'],
    'breaking-changes': ['0.12.11에서 업그레이드', '달라진 점, 제거된 기능, 대신 사용할 방법을 확인하세요.'],
    troubleshooting: ['문제 해결', '규칙, 권한, 가져오기에서 자주 생기는 문제를 해결하세요.'],
  },
  ja: {
    'quick-start': ['まず使ってみる', '3 ステップで最初のルールを作成、テスト、有効化します。'],
    matching: ['リクエストの指定方法', '用途に合う指定方法を選び、影響する範囲をできるだけ絞ります。'],
    actions: ['ルールでできること', 'ブロック、リダイレクト、HTTPS 化、リクエストヘッダー変更を紹介します。'],
    'advanced-examples': ['実践的なリダイレクト例', '開発、API の切り替え、CDN 移行に役立つ設定例です。'],
    permissions: [
      '権限とプライバシー',
      'サイトへのアクセス許可が必要な場面と、ブラウザ内に残るデータを説明します。',
    ],
    migration: ['旧バージョンから移行', '以前のルールを誤って有効にせず、新しいバージョンへ引き継ぎます。'],
    'breaking-changes': [
      '0.12.11 からのアップグレード',
      '変更点、削除された機能、代わりに使える方法をまとめています。',
    ],
    troubleshooting: ['トラブルシューティング', 'ルール、権限、読み込みでよく起きる問題を解決します。'],
  },
  fr: {
    'quick-start': ['Bien démarrer', 'Créez, testez puis activez votre première règle en trois étapes.'],
    matching: ['Cibler les requêtes', 'Choisissez la méthode adaptée et limitez au maximum le périmètre.'],
    actions: [
      'Ce que les règles peuvent faire',
      'Découvrez le blocage, la redirection, le passage en HTTPS et les en-têtes.',
    ],
    'advanced-examples': [
      'Exemples pratiques de redirection',
      'Des cas concrets pour le développement, les changements d’API et les migrations de CDN.',
    ],
    permissions: [
      'Autorisations et confidentialité',
      'Découvrez quand un accès au site est nécessaire et quelles données restent dans le navigateur.',
    ],
    migration: [
      'Importer les règles de l’ancienne version',
      'Importez les règles encore utiles sans les activer par erreur.',
    ],
    'breaking-changes': [
      'Mise à niveau depuis 0.12.11',
      'Ce qui change, ce qui disparaît et les solutions à utiliser à la place.',
    ],
    troubleshooting: [
      'Dépannage',
      'Résolvez les problèmes courants de règles, d’autorisations et d’importation.',
    ],
  },
  es: {
    'quick-start': ['Primeros pasos', 'Crea, prueba y activa tu primera regla en tres pasos.'],
    matching: [
      'Cómo seleccionar solicitudes',
      'Elige el método adecuado y limita el alcance todo lo posible.',
    ],
    actions: [
      'Qué pueden hacer las reglas',
      'Descubre el bloqueo, la redirección, el uso de HTTPS y los encabezados.',
    ],
    'advanced-examples': [
      'Ejemplos prácticos de redirección',
      'Casos reales para desarrollo, cambios de API y migraciones de CDN.',
    ],
    permissions: [
      'Permisos y privacidad',
      'Cuándo hace falta acceso a un sitio y qué datos se quedan en el navegador.',
    ],
    migration: [
      'Importar reglas de la versión anterior',
      'Importa las reglas que aún sirven sin activarlas por error.',
    ],
    'breaking-changes': [
      'Actualizar desde 0.12.11',
      'Qué cambia, qué se elimina y qué puedes usar en su lugar.',
    ],
    troubleshooting: [
      'Solución de problemas',
      'Resuelve problemas habituales con reglas, permisos e importaciones.',
    ],
  },
};

const localizedSections: Record<Exclude<Locale, 'en'>, Record<GuideSlug, GuideCopy['sections']>> = {
  'zh-CN': {
    'quick-start': [
      {
        title: '选一个示例',
        paragraphs: ['打开规则管理器，从三个示例中选一个。示例默认关闭，可以放心修改。'],
      },
      {
        title: '换成你的网址',
        paragraphs: ['把 example.com 换成你要处理的域名，先不要启用规则。'],
      },
      {
        title: '测试后再启用',
        paragraphs: [
          '用一个真实 URL 测试效果，确认无误后保存并启用。需要网站权限时，浏览器会先告诉你具体范围。',
        ],
      },
    ],
    matching: [
      {
        title: '三种匹配方式，怎么选',
        paragraphs: [
          '编辑器提供两种浏览器规则格式，以及一种更容易上手的 RequestOrbit 格式。大多数情况选第一种就够了：',
          '新规则默认使用 URL 过滤器。输入内容明显像正则时，编辑器会建议切换，但不会擅自改变匹配方式。',
        ],
        points: [
          'URL 过滤器（推荐）：浏览器原生的简洁语法，适合域名、固定 URL 和路径，但不能生成 $1。',
          '简易通配符：RequestOrbit 会把每个 * 变成捕获值，适合重定向时简单保留原 URL 的一部分。',
          '正则表达式：适合精确捕获、备选项和复杂条件；支持情况由当前浏览器检查。',
        ],
      },
      {
        title: '|| 和 ^ 是什么意思',
        paragraphs: [
          '在 URL 过滤器中，|| 表示从域名开始匹配，并包含它的子域名。域名后的 ^ 要求这里是分隔符或 URL 结尾，因此 example.com 不会误匹配 example.company。单个 | 用来限定开头或结尾，* 表示任意数量的字符。',
          '这里使用的是 declarativeNetRequest 的 URL 过滤器语法，不是 WebExtension 的网站权限匹配格式；所需的权限格式会由 RequestOrbit 自动生成。',
        ],
        code: matchingExamples.urlFilter,
      },
      {
        title: '捕获与 $1 到 $9',
        paragraphs: [
          '在简易通配符模式中，第一个 * 是 $1，第二个是 $2，依此类推。在正则模式中，^ 和 $ 限定 URL 的开头与结尾，\\. 匹配普通句点，.* 匹配任意内容，(...) 是捕获组。',
          '$1 到 $9 只能写在重定向目标中。URL 过滤器里的 * 虽然能匹配任意内容，但不会捕获。',
          '最后还可以按资源类型、请求方法和来源网页缩小范围。类型或方法留空表示不限制。',
        ],
        code: matchingExamples.captures,
      },
    ],
    actions: [
      {
        title: '哪些操作不需要网站权限',
        paragraphs: [
          '阻止请求和升级到 HTTPS 不需要网站访问权限。重定向和修改请求头会改变网页收到的内容，因此浏览器会要求你授权相应的网站。',
        ],
      },
      {
        title: '重定向与请求头',
        paragraphs: [
          '重定向目标必须是 HTTP 或 HTTPS 地址。简易通配符或正则表达式捕获的内容，可以用 $1 到 $9 放进目标地址。',
          '请求头规则只能移除或设置浏览器允许修改的字段。遇到禁止修改的名称时，扩展会在启用前给出提示。',
        ],
      },
    ],
    'advanced-examples': [
      {
        title: '使用示例前，请先注意',
        paragraphs: [
          '下面的示例都使用专门用于文档的 example.com。请换成你自己管理的域名，先保持规则关闭，再用几个真实 URL 进行测试。',
          '重定向和请求头会改变网页实际收到的内容。请尽量限制资源类型和来源网页，避免规则影响无关网站。',
        ],
      },
      {
        title: '把测试环境的 API 转到本地',
        paragraphs: [
          '这条规则会把 /v1/ 后面的完整路径放进 $1。这样无需修改前端构建，就能让现有网页连接本地 API 或反向代理。',
          '只勾选本地服务支持的请求方法，并把来源网页限制为 app.example.com。',
        ],
        code: redirectExamples.localApi,
      },
      {
        title: '临时把旧 CDN 切到新 CDN',
        paragraphs: [
          '这条规则会保留脚本、样式、图片和字体的完整路径，只替换资源域名。适合在网站代码尚未全部更新时临时过渡。',
          '请注意：这是固定重定向，不是故障切换。新 CDN 无法访问时，浏览器不会自动退回旧 CDN。',
        ],
        code: redirectExamples.cdnMigration,
      },
      {
        title: '用正则把只读 API 从 v1 切到 v2',
        paragraphs: [
          '两个捕获组分别保留资源类型和 ID，只把 /v1/ 改成 /v2/。规则仅匹配 GET，避免误改写入请求。',
          '保存时，当前浏览器会检查是否支持这条正则表达式。如果每个 * 都能明确对应一段要保留的内容，使用简易通配符会更直观。',
        ],
        code: redirectExamples.apiBridge,
      },
      {
        title: '调试时只替换一个线上脚本',
        paragraphs: [
          '精确匹配一个脚本地址，就能把它换成本地调试版本，而不会影响网站的其他资源。',
          '请只在自己管理的应用上使用。如果网页本身采用 HTTPS，本地服务也最好使用 HTTPS，以免被浏览器的混合内容策略拦截。',
        ],
        code: redirectExamples.localScript,
      },
      {
        title: '重定向不适合做什么',
        paragraphs: [
          '只要所有条件匹配，浏览器就会立刻重定向。它无法等到 404 后再处理，也不能读取响应内容、在网络失败后切换地址，或运行 JavaScript 动态生成 URL。',
        ],
        points: [
          '目标地址只能使用 HTTP 或 HTTPS。',
          '简易通配符和正则表达式的捕获内容都用 $1 到 $9 引用。',
          '查询参数的顺序、编码方式和重复参数不会被自动整理。',
          '请避免循环重定向；扩展会阻止明显的自重定向和已检测到的循环。',
        ],
      },
    ],
    permissions: [
      {
        title: '只在需要时请求网站权限',
        paragraphs: [
          '网站访问属于可选权限。只有在启用重定向或请求头规则，并且规则需要访问具体网站时，浏览器才会向你确认。',
          '规则、备份和测试过的 URL 都保存在浏览器中。扩展不含数据分析，也没有远端规则服务。',
        ],
      },
      {
        title: '尽量缩小权限范围',
        paragraphs: [
          '尽量填写明确的协议和域名。修改脚本、图片等子资源时，再指定来源网页，避免其他网站触发同一条规则。',
        ],
      },
    ],
    migration: [
      {
        title: '自动迁移仅支持 Chrome',
        paragraphs: [
          '旧版扩展只在 Chrome 发布过，因此只有 Chrome 会显示自动检测入口。Edge 和 Firefox 不会显示这项功能。',
          '如果旧版使用了不同的扩展 ID，也可以在设置中手动导入 JSON 备份。',
        ],
      },
      {
        title: '迁移后先检查，不会自动启用',
        paragraphs: [
          '能够转换的规则会以关闭状态加入候选列表；含义不明确的规则会标记为“需要检查”。无法支持或已经移除的功能，仍会保留在可导出的原始快照里。',
          '应用前可以先导出迁移报告留档，之后也能恢复迁移前的快照。',
        ],
      },
    ],
    'breaking-changes': [
      {
        title: '新版会保留什么',
        paragraphs: [
          '新版保留了最实用的请求规则能力，但不会原样复制旧版 Manifest V2 的所有行为。Chrome 可以检测或导入旧数据；Edge 和 Firefox 从未发布过旧版，因此不需要自动迁移。',
          '任何旧规则都不会悄悄启用。迁移结果会清楚标为“可自动转换”“需要检查”“不支持”“已移除”或“无效”，原始数据也会留在迁移快照中。',
        ],
      },
      {
        title: '这些旧规则可以迁移',
        paragraphs: ['下面的功能都有直接替代方案，或可以用范围更明确的新规则实现。启用前仍请逐条检查。'],
        points: [
          '格式有效的 Block 列表会转换为新版“阻止”规则。',
          '独立的 HSTS 规则会转换为“升级到 HTTPS”；浏览器自带的 HSTS 仍然独立工作。',
          'Custom URL 只有在匹配和替换方式能够安全表达时才会转换；如果编码或作用范围发生变化，会要求人工检查。',
          '防盗链可以改写为范围明确的请求头规则，并指定资源域名和来源网页。',
          '旧版分类开关会转换成每条规则的启用状态，但迁移后的候选规则仍然默认关闭，等待你检查并授权。',
        ],
      },
      {
        title: '已移除的功能，以及可以怎么替代',
        paragraphs: ['新版不再保留范围过大、已经过时，或与请求规则关系不大的功能。'],
        points: [
          '请求日志：使用浏览器开发者工具的 Network 面板，或在调试时导出 HAR。RequestOrbit 不会记录你的浏览历史。',
          '全局修改 CORS：请配置服务端、使用开发反向代理，或搭建独立测试环境。新版不提供风险较高的全局开关。',
          '修改 User-Agent：临时测试可以使用浏览器开发者工具；长期差异更适合用服务端功能开关处理。',
          '可编程右键菜单：固定网址可以用书签；需要运行脚本时，请使用经过单独评估的自动化工具。',
          'Google 搜索重定向：优先修改浏览器默认搜索引擎；只有 URL 结构固定时，才适合用一条范围明确的重定向规则处理。',
          'Google 到 useso 的 CDN 改写：旧端点已经过时，请删除这类规则，改用仍在维护的 CDN 或自行托管资源。',
          '生成二维码：使用浏览器或操作系统自带的分享、二维码功能。',
          '图标样式、捐赠界面、遥测和远端服务不再属于 RequestOrbit 的功能范围。',
        ],
      },
      {
        title: 'Custom URL 规则不一定能原样迁移',
        paragraphs: [
          '旧版可以用类似 JavaScript 的占位符处理域名、路径和查询参数，而 Manifest V3 只支持更有限的正则替换。',
          '不固定顺序的查询参数、动态占位符、浏览器不支持的正则语法、超过九个捕获组，以及非 HTTP(S) 目标都不会自动转换。它们会保持关闭并可导出，建议简化 URL 规则后再手动重建。',
        ],
      },
      {
        title: '建议按这个顺序升级',
        paragraphs: ['把迁移当作一次检查，而不是一键开启所有旧规则。'],
        points: [
          '应用任何迁移结果前，先导出迁移报告和原始快照。',
          '先检查能够自动转换的阻止规则和 HTTPS 升级规则。',
          '用有代表性的路径、查询参数、资源类型和来源网页测试每条重定向规则。',
          '为范围过大的防盗链或请求头规则补充明确的来源网页。',
          '只有在需要留档时，才继续保留已移除和不支持的项目。',
          '全部规则稳定后，再导出一份新版格式的备份。',
        ],
      },
    ],
    troubleshooting: [
      {
        title: '规则没有生效',
        paragraphs: [
          '先确认扩展没有全局暂停、规则已经启用、各项输入有效，并且浏览器已经授予所需的网站权限。',
          '使用实际 URL 运行测试，再核对资源类型和来源网页。URL 匹配，并不代表其他条件也一定匹配。',
        ],
      },
      {
        title: '导入失败或浏览器规则不同步',
        paragraphs: [
          '导入前先查看变更预览。如果校验失败，通常表示备份文件被修改过，或内容不完整。',
          '重新打开规则管理器会尝试同步保存状态和浏览器中的实际规则。准备大幅修改前，请先导出备份。',
        ],
      },
    ],
  },
  ko: {
    'quick-start': [
      {
        title: '예제 하나 고르기',
        paragraphs: [
          '규칙 관리자에서 세 가지 예제 중 하나를 고르세요. 예제는 기본적으로 꺼져 있어 부담 없이 수정할 수 있습니다.',
        ],
      },
      {
        title: '내 주소로 바꾸기',
        paragraphs: ['example.com을 적용할 도메인으로 바꾸고, 아직 규칙은 켜지 마세요.'],
      },
      {
        title: '테스트한 뒤 켜기',
        paragraphs: [
          '실제 URL로 결과를 확인한 뒤 저장하고 활성화하세요. 사이트 권한이 필요하면 브라우저가 먼저 범위를 알려 줍니다.',
        ],
      },
    ],
    matching: [
      {
        title: '세 가지 일치 방식 중 선택하기',
        paragraphs: [
          '브라우저 규칙 형식 두 가지와 더 쉬운 RequestOrbit 형식 한 가지가 있습니다. 대부분은 첫 번째 방식이면 충분합니다.',
          '새 규칙은 URL 필터로 시작합니다. 입력이 정규식으로 명확하게 보이면 전환을 제안하지만, 모드를 자동으로 바꾸지는 않습니다.',
        ],
        points: [
          'URL 필터(권장): 도메인, 고정 URL, 경로에 알맞은 브라우저 기본 문법입니다. $1 값은 만들 수 없습니다.',
          '간단한 와일드카드: RequestOrbit가 각 *를 캡처 값으로 바꿉니다. 원래 URL의 일부를 간단히 보존하는 리디렉션에 알맞습니다.',
          '정규식: 정확한 캡처, 선택지, 고급 조건에 사용하며 현재 브라우저가 지원 여부를 검사합니다.',
        ],
      },
      {
        title: '||와 ^의 의미',
        paragraphs: [
          'URL 필터에서 ||는 도메인 이름부터 일치하며 하위 도메인도 포함합니다. 도메인 뒤의 ^는 구분 문자나 URL 끝을 요구하므로 example.com이 example.company와 잘못 일치하지 않습니다. | 하나는 시작이나 끝을 고정하고, *는 임의 개수의 문자와 일치합니다.',
          '이는 WebExtension 사이트 권한의 일치 패턴이 아니라 declarativeNetRequest URL 필터 문법입니다. 필요한 권한 패턴은 RequestOrbit가 자동으로 만듭니다.',
        ],
        code: matchingExamples.urlFilter,
      },
      {
        title: '캡처와 $1부터 $9',
        paragraphs: [
          '간단한 와일드카드에서는 첫 번째 *가 $1, 두 번째가 $2가 됩니다. 정규식에서는 ^와 $가 URL의 시작과 끝, \\.이 마침표 자체, .*가 임의의 문자열, (...)가 캡처 그룹을 뜻합니다.',
          '$1부터 $9는 리디렉션 대상에서만 씁니다. URL 필터의 *는 문자열과 일치하지만 캡처하지 않습니다.',
          '마지막으로 리소스 유형, 요청 메서드, 요청 출처 도메인으로 범위를 더 좁힐 수 있습니다. 유형이나 메서드를 비워 두면 제한하지 않습니다.',
        ],
        code: matchingExamples.captures,
      },
    ],
    actions: [
      {
        title: '사이트 권한 없이 쓸 수 있는 기능',
        paragraphs: [
          '차단과 HTTPS 전환은 사이트 접근 권한 없이 동작합니다. 리디렉션과 요청 헤더 변경은 페이지가 받는 내용을 바꾸므로 해당 사이트에 대한 권한이 필요합니다.',
        ],
      },
      {
        title: '리디렉션과 헤더',
        paragraphs: [
          '리디렉션 대상은 HTTP 또는 HTTPS 주소여야 합니다. 간단한 와일드카드나 정규식에서 캡처한 값은 $1부터 $9까지 사용할 수 있습니다.',
          '브라우저가 허용하는 요청 헤더만 제거하거나 설정할 수 있습니다. 바꿀 수 없는 헤더는 규칙을 켜기 전에 알려 줍니다.',
        ],
      },
    ],
    'advanced-examples': [
      {
        title: '예제를 사용하기 전에',
        paragraphs: [
          '모든 예제는 문서용 example.com 도메인을 사용합니다. 직접 관리하는 주소로 바꾸고, 규칙을 끈 상태에서 실제 URL 몇 개를 테스트하세요.',
          '리디렉션과 요청 헤더는 페이지가 실제로 받는 내용을 바꿉니다. 리소스 유형과 요청 출처를 좁혀 다른 사이트에 영향을 주지 않도록 하세요.',
        ],
      },
      {
        title: '스테이징 API를 로컬 서버로 보내기',
        paragraphs: [
          '/v1/ 뒤의 경로를 캡처 $1로 유지합니다. 애플리케이션 빌드를 바꾸지 않고 실제 프런트엔드를 로컬 API나 역방향 프록시에 연결할 때 유용합니다.',
          '로컬 서버가 처리하는 메서드만 선택하고 요청 출처를 app.example.com으로 제한하세요.',
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
          '저장할 때 현재 브라우저가 정규식 지원을 확인합니다. 각 *가 보존할 한 부분을 명확히 뜻한다면 간단한 와일드카드가 더 이해하기 쉽습니다.',
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
          '간단한 와일드카드와 정규식 캡처는 $1부터 $9까지 참조합니다.',
          '쿼리 순서, 디코딩, 반복 키는 자동 정규화되지 않습니다.',
          '자기 자신으로의 리디렉션과 감지된 순환은 차단됩니다.',
        ],
      },
    ],
    permissions: [
      {
        title: '필요할 때만 사이트 권한 요청',
        paragraphs: [
          '사이트 접근은 선택 권한입니다. 특정 사이트가 필요한 리디렉션이나 헤더 규칙을 켤 때만 브라우저가 권한을 요청합니다.',
          '규칙, 백업, 테스트한 URL은 브라우저에만 남습니다. 분석 도구나 원격 규칙 서비스는 없습니다.',
        ],
      },
      {
        title: '권한 범위 좁히기',
        paragraphs: [
          '가능하면 프로토콜과 도메인을 정확히 지정하세요. 스크립트나 이미지 같은 하위 리소스를 바꿀 때는 요청 출처 도메인도 추가하세요.',
        ],
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
          '핫링크 방지는 자산 도메인과 요청 출처 도메인을 명확히 지정한 요청 헤더 규칙으로 다시 만들 수 있습니다.',
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
          '아이콘 스타일, 기부 UI, 원격 서비스와 분석 기능은 RequestOrbit에서 대체하지 않습니다.',
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
          '각 리디렉션을 대표 경로, 쿼리, 리소스 유형, 요청 출처 도메인으로 테스트합니다.',
          '범위가 넓은 핫링크 방지와 헤더 동작은 요청 출처 도메인을 지정해 제한합니다.',
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
          '실제 URL로 테스트한 뒤 리소스 유형과 요청 출처 도메인을 확인하세요.',
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
        title: 'サンプルを一つ選ぶ',
        paragraphs: [
          'ルール管理画面で、3 つのサンプルから一つ選びます。サンプルは最初から無効なので、安心して編集できます。',
        ],
      },
      {
        title: '自分の URL に置き換える',
        paragraphs: [
          'example.com を対象のドメインに置き換えます。この時点では、まだルールを有効にしません。',
        ],
      },
      {
        title: 'テストしてから有効にする',
        paragraphs: [
          '実際の URL で結果を確認し、問題がなければ保存して有効にします。サイトへのアクセス許可が必要な場合は、先に対象範囲が表示されます。',
        ],
      },
    ],
    matching: [
      {
        title: '3 つの一致方式から選ぶ',
        paragraphs: [
          'ブラウザーのルール形式が 2 つ、より簡単な RequestOrbit 形式が 1 つあります。ほとんどの場合は最初の方式で十分です。',
          '新しいルールは URL フィルターで始まります。入力が明らかに正規表現なら切り替えを提案しますが、自動では変更しません。',
        ],
        points: [
          'URL フィルター（推奨）：ドメイン、固定 URL、パスに適したブラウザー標準の構文です。$1 は作れません。',
          '簡易ワイルドカード：RequestOrbit が * ごとにキャプチャ値へ変換します。元の URL の一部を簡単に残すリダイレクトに向いています。',
          '正規表現：厳密なキャプチャ、選択肢、高度な条件に使い、現在のブラウザーが対応状況を検証します。',
        ],
      },
      {
        title: '|| と ^ の意味',
        paragraphs: [
          'URL フィルターの || はドメイン名から一致させ、サブドメインも含めます。ドメイン直後の ^ は区切り文字または URL の末尾を必須にするため、example.com が example.company に誤って一致しません。| 一つは先頭または末尾を固定し、* は任意の数の文字に一致します。',
          'これは WebExtension のサイト権限用マッチパターンではなく、declarativeNetRequest の URL フィルター構文です。必要な権限パターンは RequestOrbit が自動で作成します。',
        ],
        code: matchingExamples.urlFilter,
      },
      {
        title: 'キャプチャと $1〜$9',
        paragraphs: [
          '簡易ワイルドカードでは最初の * が $1、次が $2 になります。正規表現では ^ と $ が URL の先頭と末尾、\\. がピリオドそのもの、.* が任意の文字列、(...) がキャプチャグループです。',
          '$1〜$9 はリダイレクト先でのみ使います。URL フィルターの * は文字列に一致しますが、キャプチャはしません。',
          '最後に、リソースの種類、リクエストメソッド、リクエスト元のドメインで範囲をさらに絞れます。種類やメソッドを空欄にすると制限なしです。',
        ],
        code: matchingExamples.captures,
      },
    ],
    actions: [
      {
        title: 'サイトへのアクセス許可が不要な操作',
        paragraphs: [
          'ブロックと HTTPS 化は、サイトへのアクセス許可なしで動作します。リダイレクトとヘッダー変更はページが受け取る内容を変えるため、対象サイトへの許可が必要です。',
        ],
      },
      {
        title: 'リダイレクトとヘッダー',
        paragraphs: [
          'リダイレクト先には HTTP または HTTPS の URL を指定します。簡易ワイルドカードや正規表現でキャプチャした値は、$1〜$9 として使えます。',
          '変更できるのは、ブラウザが許可しているリクエストヘッダーだけです。対応していない名前は、有効にする前に表示されます。',
        ],
      },
    ],
    'advanced-examples': [
      {
        title: '設定例を使う前に',
        paragraphs: [
          'すべての例では、文書用の example.com ドメインを使っています。自分で管理している URL に置き換え、無効のまま作成してから、実際の URL をいくつかテストしてください。',
          'リダイレクトとリクエストヘッダーは、ページが実際に受け取る内容を変えます。リソースの種類とリクエスト元を絞り、関係のないサイトに影響しないようにします。',
        ],
      },
      {
        title: 'ステージング API をローカルサーバーへ送る',
        paragraphs: [
          '/v1/ より後のパスを $1 として残します。アプリのビルドを変えずに、実際のフロントエンドをローカル API やリバースプロキシへ接続できます。',
          'ローカルサーバーが扱うメソッドだけを選び、リクエスト元を app.example.com に限定します。',
        ],
        code: redirectExamples.localApi,
      },
      {
        title: '管理しているサイトを新しい CDN へ移す',
        paragraphs: [
          'スクリプト、スタイル、画像、フォントの完全なパスを保ったまま新しいホストへ移します。サイト本体の更新中に一時的な互換ブリッジとして使えます。',
          'これは常に実行されるリダイレクトで、フェイルオーバーではありません。新しい CDN に接続できなくても、以前の CDN へ自動では戻りません。',
        ],
        code: redirectExamples.cdnMigration,
      },
      {
        title: '正規表現で読み取り専用 API を v1 から v2 へ切り替える',
        paragraphs: [
          '二つのキャプチャグループでリソースの種類と ID を残し、/v1/ だけを /v2/ に変えます。GET だけに限定することで、書き込みリクエストを誤って変更するのを防ぎます。',
          '保存時に、現在のブラウザーが正規表現に対応しているか確認します。* ごとに残したい一部分が明確なら、簡易ワイルドカードの方が分かりやすくなります。',
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
        title: 'リダイレクトではできないこと',
        paragraphs: [
          'すべての条件に一致すると、ブラウザはすぐにリダイレクトします。404 を待つ、レスポンス本文を読む、通信に失敗してから別の宛先を選ぶ、JavaScript で URL を生成するといった処理はできません。',
        ],
        points: [
          '宛先は HTTP または HTTPS に限られます。',
          '簡易ワイルドカードと正規表現のキャプチャは $1〜$9 で参照します。',
          'クエリ順序、デコード、重複キーは自動で正規化されません。',
          '同じ URL へのリダイレクトや、検出されたループはブロックされます。',
        ],
      },
    ],
    permissions: [
      {
        title: '必要なときだけサイトへのアクセスを許可',
        paragraphs: [
          'サイトへのアクセスは任意の権限です。特定のサイトが必要なリダイレクトやヘッダールールを有効にするときだけ、ブラウザが許可を求めます。',
          'ルール、バックアップ、テストした URL はブラウザ内に保存されます。アクセス解析も外部のルールサービスもありません。',
        ],
      },
      {
        title: 'アクセス範囲を絞る',
        paragraphs: [
          'できるだけ具体的なプロトコルとドメインを指定してください。スクリプトや画像などを変更する場合は、リクエスト元のドメインも追加します。',
        ],
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
          '有効な Block リストは新しいブロックルールになります。',
          '独立した HSTS ルールは HTTPS 化ルールになり、ブラウザ本来の HSTS は別に動作します。',
          'Custom URL は一致と置換を安全に表現できる場合だけ変換されます。',
          '直リンク防止は、対象のホストとリクエスト元ドメインを明示したリクエストヘッダールールとして作り直せます。',
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
          'Google 検索のリダイレクト：ブラウザの検索エンジンを設定するか、URL の形が固定されている場合だけ範囲を絞ったリダイレクトルールを作ります。',
          'Google-to-useso CDN 書き換え：旧ルールを削除し、保守中の CDN または自己ホスト資産へ移行します。',
          'QR 生成：利用可能なブラウザまたは OS の共有機能を使います。',
          'アイコンスタイル、寄付 UI、テレメトリ、リモートサービスは RequestOrbit 内で代替しません。',
        ],
      },
      {
        title: 'Custom URL は同等に移行できない場合がある',
        paragraphs: [
          '旧エンジンはホスト、パス、クエリに JavaScript 時代のプレースホルダー処理を使えましたが、Manifest V3 はより限定的な正規表現置換だけを提供します。',
          '順序に依存しないクエリ抽出、計算型プレースホルダー、未対応の正規表現、9 個を超えるキャプチャ、HTTP(S) 以外の宛先は、無効のまま保存されます。',
        ],
      },
      {
        title: '推奨アップグレード手順',
        paragraphs: ['移行を一括有効化ではなく、確認作業として扱ってください。'],
        points: [
          '適用前に移行レポートと原本スナップショットを書き出します。',
          '自動変換されたブロックと HTTPS 化の候補から始めます。',
          '各リダイレクトを、代表的なパス、クエリ、リソースの種類、リクエスト元でテストします。',
          '範囲が広すぎる直リンク防止やヘッダー処理は、リクエスト元を明示して絞り込みます。',
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
          '実際の URL でテストし、リソースの種類とリクエスト元も確認します。',
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
        title: 'Choisissez un exemple',
        paragraphs: [
          'Dans le gestionnaire, choisissez l’un des trois exemples. Ils sont désactivés par défaut et peuvent être modifiés sans risque.',
        ],
      },
      {
        title: 'Remplacez l’adresse',
        paragraphs: [
          'Remplacez example.com par le domaine à traiter. Laissez la règle désactivée pour le moment.',
        ],
      },
      {
        title: 'Testez avant d’activer',
        paragraphs: [
          'Vérifiez le résultat avec une URL réelle, puis enregistrez et activez la règle. Si un accès au site est nécessaire, le navigateur vous indique d’abord son périmètre.',
        ],
      },
    ],
    matching: [
      {
        title: 'Choisir entre trois modes',
        paragraphs: [
          'L’éditeur propose deux formats du navigateur et un format RequestOrbit plus simple. Le premier suffit le plus souvent :',
          'Une nouvelle règle commence en mode Filtre d’URL. Si la saisie ressemble clairement à une expression régulière, l’éditeur propose de changer de mode sans jamais le faire automatiquement.',
        ],
        points: [
          'Filtre d’URL (recommandé) : syntaxe native du navigateur pour un domaine, une URL fixe ou un chemin. Elle ne produit pas de valeur $1.',
          'Joker simplifié : RequestOrbit transforme chaque * en capture. Idéal pour une redirection simple qui conserve une partie de l’URL.',
          'Expression régulière : pour des captures précises, des alternatives et une logique avancée ; le navigateur actif vérifie sa compatibilité.',
        ],
      },
      {
        title: 'Signification de || et ^',
        paragraphs: [
          'Dans un filtre d’URL, || commence au nom de domaine et inclut les sous-domaines. Le ^ placé après le domaine exige un séparateur ou la fin de l’URL : example.com ne correspond donc pas à example.company. Un seul | fixe le début ou la fin, tandis que * correspond à un nombre quelconque de caractères.',
          'Il s’agit de la syntaxe urlFilter de declarativeNetRequest, pas du motif d’autorisation de site WebExtension. RequestOrbit génère ce dernier automatiquement.',
        ],
        code: matchingExamples.urlFilter,
      },
      {
        title: 'Captures et $1 à $9',
        paragraphs: [
          'En mode Joker simplifié, le premier * devient $1, le deuxième $2, etc. En mode Expression régulière, ^ et $ fixent le début et la fin de l’URL, \\. désigne un point littéral, .* n’importe quel texte et (...) chaque groupe capturé.',
          '$1 à $9 s’utilisent uniquement dans la destination d’une redirection. Le * du filtre d’URL correspond à du texte, mais ne le capture jamais.',
          'Enfin, limitez davantage la règle par type de ressource, méthode et domaine initiateur. Laisser les types ou méthodes vides signifie qu’ils sont tous acceptés.',
        ],
        code: matchingExamples.captures,
      },
    ],
    actions: [
      {
        title: 'Actions sans autorisation de site',
        paragraphs: [
          'Le blocage et le passage en HTTPS fonctionnent sans autorisation d’accès au site. Les redirections et les modifications d’en-têtes changent ce que reçoit la page : elles nécessitent donc une autorisation ciblée.',
        ],
      },
      {
        title: 'Redirections et en-têtes',
        paragraphs: [
          'La destination doit être une URL HTTP ou HTTPS. Les valeurs capturées par un joker simplifié ou une expression régulière peuvent être reprises avec $1 à $9.',
          'Seuls les en-têtes acceptés par le navigateur peuvent être supprimés ou définis. Les noms interdits sont signalés avant l’activation.',
        ],
      },
    ],
    'advanced-examples': [
      {
        title: 'Avant d’utiliser un exemple',
        paragraphs: [
          'Tous les exemples utilisent le domaine documentaire example.com. Remplacez-le par une adresse que vous gérez, créez la règle désactivée, puis testez-la avec plusieurs URL réelles.',
          'Les redirections et les en-têtes changent ce que reçoit réellement une page. Limitez les types de ressources et les domaines initiateurs pour ne pas affecter d’autres sites.',
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
          'Le navigateur actif vérifie la compatibilité de l’expression lors de l’enregistrement. Si chaque * désigne clairement une partie à conserver, le joker simplifié est plus lisible.',
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
          'Les captures du joker simplifié et de l’expression régulière sont référencées de $1 à $9.',
          'L’ordre, le décodage et les clés répétées d’une requête ne sont pas normalisés.',
          'Les auto-redirections et cycles détectés sont bloqués.',
        ],
      },
    ],
    permissions: [
      {
        title: 'Un accès demandé uniquement si nécessaire',
        paragraphs: [
          'L’accès aux sites est une autorisation facultative. Le navigateur ne la demande qu’à l’activation d’une redirection ou d’une règle d’en-tête qui en a réellement besoin.',
          'Les règles, les sauvegardes et les URL testées restent dans le navigateur. Aucun outil d’analyse ni service distant ne les traite.',
        ],
      },
      {
        title: 'Réduire le périmètre d’accès',
        paragraphs: [
          'Précisez autant que possible le protocole et le domaine. Pour les scripts, images et autres sous-ressources, ajoutez aussi les domaines initiateurs.',
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
          'Les règles compatibles sont importées mais restent désactivées. Les données qui ne peuvent pas être converties restent disponibles à l’export.',
        ],
      },
    ],
    'breaking-changes': [
      {
        title: 'Promesse de compatibilité',
        paragraphs: [
          'La version actuelle conserve l’essentiel des règles réseau, sans reproduire à l’identique le fonctionnement de l’ancienne extension Manifest V2. Chrome peut détecter ou importer les anciennes données. Edge et Firefox n’ont pas de migration automatique, puisqu’aucune ancienne version n’y a été publiée.',
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
          'Les anciens interrupteurs sont convertis en état individuel pour chaque règle. Les règles importées restent toutefois désactivées jusqu’à leur vérification et à l’autorisation nécessaire.',
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
          'Styles d’icône, dons, télémétrie et services distants n’ont pas de remplacement dans RequestOrbit.',
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
          'Commencez par les règles de blocage et de passage en HTTPS converties automatiquement.',
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
        title: 'Elige un ejemplo',
        paragraphs: [
          'En el gestor encontrarás tres ejemplos. Están desactivados de forma predeterminada, así que puedes editarlos sin riesgo.',
        ],
      },
      {
        title: 'Cambia la dirección',
        paragraphs: [
          'Sustituye example.com por el dominio que quieres tratar. De momento, deja la regla desactivada.',
        ],
      },
      {
        title: 'Prueba antes de activar',
        paragraphs: [
          'Comprueba el resultado con una URL real y, si todo está bien, guarda y activa la regla. Si necesita acceso al sitio, el navegador te mostrará primero el alcance.',
        ],
      },
    ],
    matching: [
      {
        title: 'Elige entre tres modos',
        paragraphs: [
          'El editor ofrece dos formatos del navegador y uno más sencillo de RequestOrbit. La primera opción basta casi siempre:',
          'Las reglas nuevas empiezan con Filtro de URL. Si el contenido parece claramente una expresión regular, el editor propone cambiar de modo, pero nunca lo hace automáticamente.',
        ],
        points: [
          'Filtro de URL (recomendado): sintaxis nativa del navegador para un dominio, una URL fija o una ruta. No genera $1.',
          'Comodín simple: RequestOrbit convierte cada * en una captura. Sirve para redirecciones sencillas que conservan parte de la URL.',
          'Expresión regular: para capturas precisas, alternativas y lógica avanzada; el navegador activo comprueba su compatibilidad.',
        ],
      },
      {
        title: 'Qué significan || y ^',
        paragraphs: [
          'En un filtro de URL, || empieza en el nombre de dominio e incluye sus subdominios. El ^ después del dominio exige un separador o el final de la URL, así example.com no coincide por error con example.company. Un solo | fija el inicio o el final; * coincide con cualquier cantidad de caracteres.',
          'Esta es la sintaxis urlFilter de declarativeNetRequest, no el patrón de permisos de sitio de WebExtension. RequestOrbit genera ese patrón automáticamente.',
        ],
        code: matchingExamples.urlFilter,
      },
      {
        title: 'Capturas y $1 a $9',
        paragraphs: [
          'En modo Comodín simple, el primer * es $1, el segundo $2, etc. En modo Expresión regular, ^ y $ fijan el inicio y el final de la URL, \\. representa un punto literal, .* cualquier texto y (...) cada grupo capturado.',
          '$1 a $9 solo se usan en el destino de una redirección. El * de un filtro de URL coincide con texto, pero nunca lo captura.',
          'Por último, puedes limitar la regla por tipo de recurso, método y dominio iniciador. Si dejas vacíos los tipos o métodos, se aceptan todos.',
        ],
        code: matchingExamples.captures,
      },
    ],
    actions: [
      {
        title: 'Acciones que no necesitan acceso al sitio',
        paragraphs: [
          'Bloquear y cambiar a HTTPS funcionan sin acceso al sitio. Las redirecciones y los cambios de encabezados modifican lo que recibe la página, por lo que necesitan un permiso limitado.',
        ],
      },
      {
        title: 'Redirecciones y encabezados',
        paragraphs: [
          'El destino debe ser una URL HTTP o HTTPS. Puedes reutilizar las capturas de un comodín simple o una expresión regular mediante $1 a $9.',
          'Solo se pueden eliminar o definir los encabezados que admite el navegador. Los nombres no permitidos se indican antes de activar la regla.',
        ],
      },
    ],
    'advanced-examples': [
      {
        title: 'Antes de usar un ejemplo',
        paragraphs: [
          'Todos los ejemplos usan el dominio documental example.com. Sustitúyelo por una dirección que controles, crea la regla desactivada y pruébala con varias URL reales.',
          'Las redirecciones y los encabezados cambian lo que recibe realmente una página. Limita los tipos de recurso y los dominios iniciadores para no afectar a otros sitios.',
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
          'El navegador activo comprueba la expresión al guardar. Si cada * representa claramente una parte que quieres conservar, el comodín simple es más fácil de leer.',
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
          'Las capturas del comodín simple y la expresión regular se referencian de $1 a $9.',
          'El orden, decodificación y claves repetidas de la consulta no se normalizan.',
          'Las autorredirecciones y ciclos detectados se bloquean.',
        ],
      },
    ],
    permissions: [
      {
        title: 'Acceso solo cuando hace falta',
        paragraphs: [
          'El acceso a sitios es un permiso opcional. El navegador solo lo solicita al activar una redirección o una regla de encabezados que realmente lo necesita.',
          'Las reglas, las copias de seguridad y las URL de prueba permanecen en el navegador. No hay analítica ni servicios remotos que las procesen.',
        ],
      },
      {
        title: 'Reduce el alcance del permiso',
        paragraphs: [
          'Especifica el protocolo y el dominio siempre que puedas. Para scripts, imágenes y otros subrecursos, añade también los dominios iniciadores.',
        ],
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
          'La versión actual conserva lo esencial de las reglas de red, pero no reproduce exactamente el funcionamiento de la antigua extensión Manifest V2. Chrome puede detectar o importar datos anteriores. Edge y Firefox no necesitan migración automática porque nunca tuvieron una versión antigua.',
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
          'La protección contra hotlink puede recrearse con una regla de encabezado limitada a dominios de recursos e iniciadores concretos.',
          'Los antiguos interruptores de categoría se convierten en el estado de cada regla, pero las reglas importadas siguen desactivadas hasta que las revises y concedas los permisos necesarios.',
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
          'Estilos de icono, donaciones, telemetría y servicios remotos no tienen sustituto dentro de RequestOrbit.',
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
          'Limita las reglas de encabezados demasiado amplias con iniciadores concretos.',
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
