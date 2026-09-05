import type { AppLocale } from '@/ui/i18n';

type Copy = {
  caseSensitive: string;
  edit: string;
  exact: string;
  host: string;
  hostHelp: string;
  hostUnavailable: string;
  apply: string;
  assisted: string;
  replacement: string;
  before: string;
  after: string;
  matchRule: string;
  redirectRule: string;
  examples: string;
  advancedEdit: string;
  hostTarget: string;

  title: string;
  intro: string;
  from: string;
  to: string;
  generated: string;
  scope: string;
  test: string;
  match: string;
  miss: string;
  save: string;
  advanced: string;
  adjust: string;
  reset: string;
  invalid: string;
  url: string;
  fragment: string;
  same: string;
  placeholder: string;
  long: string;
};
export const redirectBuilderCopy: Record<AppLocale, Copy> = {
  en: {
    caseSensitive: 'Match path and parameters case-sensitively',
    edit: 'Edit URL redirect',
    exact: 'Only this URL',
    host: 'All pages on this host',
    hostHelp:
      'Replace the hostname; keep the path and query parameters. Only the original protocol, hostname and port apply; subdomains are excluded. Query parameters are sent to the destination host.',
    hostUnavailable:
      'A host-wide rule needs two URLs that differ only in hostname. Choose exact matching or adjust the URLs.',
    apply: 'Apply to draft',
    assisted: 'Edit with URL examples',
    replacement:
      'This replaces the matching and redirect settings with a page-only rule. Review the before and after, then apply to your draft. Nothing is saved yet.',
    before: 'Current rule',
    after: 'Proposed rule',
    matchRule: 'Which URLs match',
    redirectRule: 'How to redirect',
    examples: 'More test URLs',
    advancedEdit: 'Advanced editor',
    hostTarget: 'Destination hostname',

    title: 'Create a URL redirect',
    intro: 'Enter two addresses. We generate a rule you can test and adjust before enabling.',
    from: 'Original URL',
    to: 'Destination URL',
    generated: 'Generated rule',
    scope:
      'Only this exact address, including its query parameters. Applies when opening a page; other requests are unchanged.',
    test: 'URL to test',
    match: 'Will redirect to',
    miss: 'This URL will not redirect',
    save: 'Save rule',
    advanced: 'Create an advanced rule',
    adjust: 'Adjust the generated pattern',
    reset: 'Regenerate from addresses',
    invalid: 'The adjusted pattern is invalid',
    url: 'Enter complete HTTP or HTTPS addresses without a username or password.',
    fragment: 'Remove the # fragment from the original address; page fragments cannot be matched.',
    same: 'Choose a different destination to avoid a redirect loop.',
    placeholder: 'Enter a destination address without $1-style placeholders.',
    long: 'These addresses are too long for a browser rule.',
  },
  'zh-CN': {
    caseSensitive: '路径和参数区分大小写',
    edit: '编辑网址跳转',
    exact: '仅这个网址',
    host: '这个网站的所有页面',
    hostHelp:
      '替换域名，保留路径和查询参数。仅限原网址的协议、主机名和端口，不包含子域名；查询参数也会发送到目标网站。',
    hostUnavailable: '只有两网址仅主机名不同时，才能使用整站替换。请选择精确匹配或调整网址。',
    apply: '应用到草稿',
    assisted: '用网址示例编辑',
    replacement: '这会将匹配和跳转设置替换为仅页面生效的规则。请比较修改前后，再应用到草稿；此时尚未保存。',
    before: '当前规则',
    after: '修改后的规则',
    matchRule: '哪些网址生效',
    redirectRule: '怎样跳转',
    examples: '更多测试网址',
    advancedEdit: '高级编辑器',
    hostTarget: '目标主机名',

    title: '创建网址跳转',
    intro: '填写两个网址，自动生成规则。你可以先测试或调整，确认后再启用。',
    from: '原网址',
    to: '目标网址',
    generated: '自动生成的规则',
    scope: '仅匹配这个完整网址（包含查询参数），只在打开页面时生效，不影响其他请求。',
    test: '用这个网址测试',
    match: '将跳转到',
    miss: '这个网址不会跳转',
    save: '保存规则',
    advanced: '创建高级规则',
    adjust: '调整生成的匹配表达式',
    reset: '按网址重新生成',
    invalid: '调整后的表达式无效',
    url: '请填写完整的 HTTP 或 HTTPS 网址，不要包含用户名和密码。',
    fragment: '请去掉原网址的 # 锚点；浏览器无法按页面锚点匹配。',
    same: '目标网址不能与原网址相同，以免循环跳转。',
    placeholder: '请填写实际目标网址，不要包含 $1 这类占位符。',
    long: '网址过长，无法生成浏览器规则。',
  },
  ko: {
    caseSensitive: '경로와 매개변수 대소문자 구분',
    edit: 'URL 리디렉션 편집',
    exact: '이 URL만',
    host: '이 호스트의 모든 페이지',
    hostHelp:
      '호스트 이름을 바꾸고 경로와 쿼리를 유지합니다. 원래 프로토콜과 포트만 적용하며 하위 도메인은 제외합니다. 쿼리는 대상 호스트로 전송됩니다.',
    hostUnavailable: '호스트 이름만 다른 두 URL이 필요합니다. 정확한 일치를 선택하거나 URL을 수정하세요.',
    apply: '초안에 적용',
    assisted: 'URL 예제로 편집',
    replacement:
      '페이지 전용 규칙으로 대체합니다. 변경 전후를 확인하고 초안에 적용하세요. 아직 저장되지 않습니다.',
    before: '현재 규칙',
    after: '변경할 규칙',
    matchRule: '일치하는 URL',
    redirectRule: '리디렉션 방식',
    examples: '추가 테스트 URL',
    advancedEdit: '고급 편집기',
    hostTarget: '대상 호스트 이름',

    title: 'URL 리디렉션 만들기',
    intro: '두 주소를 입력하면 규칙이 생성됩니다. 활성화 전에 테스트하거나 조정하세요.',
    from: '원래 URL',
    to: '대상 URL',
    generated: '생성된 규칙',
    scope: '쿼리 매개변수를 포함한 정확한 주소만 일치합니다. 페이지를 열 때만 적용됩니다.',
    test: '테스트할 URL',
    match: '이동할 주소',
    miss: '이 URL은 리디렉션되지 않습니다',
    save: '규칙 저장',
    advanced: '고급 규칙 만들기',
    adjust: '생성된 패턴 조정',
    reset: '주소에서 다시 생성',
    invalid: '수정한 패턴이 올바르지 않습니다',
    url: '사용자 이름이나 비밀번호 없이 완전한 HTTP 또는 HTTPS 주소를 입력하세요.',
    fragment: '원래 주소에서 # 조각을 제거하세요. 페이지 조각은 일치시킬 수 없습니다.',
    same: '리디렉션 반복을 피하려면 다른 대상 주소를 선택하세요.',
    placeholder: '$1 같은 자리표시자 없이 대상 주소를 입력하세요.',
    long: '브라우저 규칙으로 사용하기에 주소가 너무 깁니다.',
  },
  ja: {
    caseSensitive: 'パスとパラメータの大文字と小文字を区別',
    edit: 'URL リダイレクトを編集',
    exact: 'この URL のみ',
    host: 'このホストの全ページ',
    hostHelp:
      'ホスト名を置換し、パスとクエリを保持します。元のプロトコルとポートのみ。サブドメインは含みません。クエリは移動先に送信されます。',
    hostUnavailable: 'ホスト名だけが異なる URL が必要です。完全一致を選ぶか URL を修正してください。',
    apply: '下書きに適用',
    assisted: 'URL の例で編集',
    replacement:
      'ページのみのルールに置き換えます。変更前後を確認して下書きに適用してください。まだ保存されません。',
    before: '現在のルール',
    after: '変更後のルール',
    matchRule: '一致する URL',
    redirectRule: 'リダイレクト方法',
    examples: '追加のテスト URL',
    advancedEdit: '高度な編集',
    hostTarget: '移動先ホスト名',

    title: 'URL リダイレクトを作成',
    intro: '2 つの URL からルールを自動生成します。有効にする前にテストや調整ができます。',
    from: '元の URL',
    to: '移動先の URL',
    generated: '生成されたルール',
    scope: 'クエリを含む完全な URL のみに一致します。ページを開くときだけ適用されます。',
    test: 'テストする URL',
    match: '移動先',
    miss: 'この URL はリダイレクトされません',
    save: 'ルールを保存',
    advanced: '高度なルールを作成',
    adjust: '生成されたパターンを調整',
    reset: 'URL から再生成',
    invalid: '調整したパターンは無効です',
    url: 'ユーザー名やパスワードを含まない完全な HTTP または HTTPS URL を入力してください。',
    fragment: '元の URL から # フラグメントを削除してください。フラグメントでは照合できません。',
    same: 'ループを防ぐため、別の移動先を指定してください。',
    placeholder: '$1 などのプレースホルダーを含まない移動先を入力してください。',
    long: 'ブラウザのルールとしては URL が長すぎます。',
  },
  fr: {
    caseSensitive: 'Respecter la casse du chemin et des paramètres',
    edit: 'Modifier la redirection',
    exact: 'Cette URL uniquement',
    host: 'Toutes les pages de cet hôte',
    hostHelp:
      'Remplace l’hôte et conserve chemin et paramètres. Protocole et port d’origine uniquement, sans sous-domaines. Les paramètres sont transmis à la destination.',
    hostUnavailable:
      'Les URL doivent différer uniquement par leur hôte. Choisissez une correspondance exacte ou modifiez les URL.',
    apply: 'Appliquer au brouillon',
    assisted: 'Modifier avec des exemples URL',
    replacement:
      'Remplace les conditions et la redirection par une règle de navigation. Comparez avant d’appliquer au brouillon. Rien n’est encore enregistré.',
    before: 'Règle actuelle',
    after: 'Règle proposée',
    matchRule: 'URL concernées',
    redirectRule: 'Mode de redirection',
    examples: 'Autres URL de test',
    advancedEdit: 'Éditeur avancé',
    hostTarget: 'Hôte de destination',

    title: 'Créer une redirection URL',
    intro: 'Saisissez deux adresses. La règle générée peut être testée et ajustée avant activation.',
    from: 'URL originale',
    to: 'URL de destination',
    generated: 'Règle générée',
    scope: 'Cette adresse exacte, paramètres compris, uniquement à l’ouverture d’une page.',
    test: 'URL à tester',
    match: 'Redirection vers',
    miss: 'Cette URL ne sera pas redirigée',
    save: 'Enregistrer la règle',
    advanced: 'Créer une règle avancée',
    adjust: 'Ajuster le motif généré',
    reset: 'Régénérer depuis les adresses',
    invalid: 'Le motif modifié est invalide',
    url: 'Saisissez des adresses HTTP ou HTTPS complètes, sans identifiant ni mot de passe.',
    fragment: 'Retirez le fragment # de l’adresse originale ; il ne peut pas servir au filtrage.',
    same: 'Choisissez une destination différente pour éviter une boucle.',
    placeholder: 'Saisissez une destination sans référence de type $1.',
    long: 'Ces adresses sont trop longues pour une règle du navigateur.',
  },
  es: {
    caseSensitive: 'Distinguir mayúsculas en ruta y parámetros',
    edit: 'Editar redirección',
    exact: 'Solo esta URL',
    host: 'Todas las páginas de este host',
    hostHelp:
      'Sustituye el host y conserva ruta y parámetros. Solo el protocolo y puerto originales; sin subdominios. Los parámetros se envían al destino.',
    hostUnavailable: 'Las URL deben diferir solo en el host. Elige coincidencia exacta o ajusta las URL.',
    apply: 'Aplicar al borrador',
    assisted: 'Editar con ejemplos de URL',
    replacement:
      'Sustituye las condiciones y la redirección por una regla de navegación. Compara los cambios antes de aplicarlos al borrador. Aún no se guarda.',
    before: 'Regla actual',
    after: 'Regla propuesta',
    matchRule: 'URL afectadas',
    redirectRule: 'Cómo redirigir',
    examples: 'Más URL de prueba',
    advancedEdit: 'Editor avanzado',
    hostTarget: 'Host de destino',

    title: 'Crear una redirección URL',
    intro: 'Introduce dos direcciones. Generamos una regla que puedes probar y ajustar antes de activarla.',
    from: 'URL original',
    to: 'URL de destino',
    generated: 'Regla generada',
    scope: 'Solo esta dirección exacta, incluidos los parámetros, al abrir una página.',
    test: 'URL para probar',
    match: 'Redirigirá a',
    miss: 'Esta URL no se redirigirá',
    save: 'Guardar regla',
    advanced: 'Crear una regla avanzada',
    adjust: 'Ajustar el patrón generado',
    reset: 'Regenerar desde las direcciones',
    invalid: 'El patrón ajustado no es válido',
    url: 'Introduce direcciones HTTP o HTTPS completas, sin usuario ni contraseña.',
    fragment: 'Quita el fragmento # de la dirección original; no se puede usar para la coincidencia.',
    same: 'Elige otro destino para evitar un bucle.',
    placeholder: 'Introduce un destino sin referencias como $1.',
    long: 'Las direcciones son demasiado largas para una regla del navegador.',
  },
};
