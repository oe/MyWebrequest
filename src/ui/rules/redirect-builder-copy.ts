import type { AppLocale } from '@/ui/i18n';

type Copy = {
  path: string;
  preserveQuery: string;
  queryHelp: string;
  hashHelp: string;
  exactHashHelp: string;
  targetQuery: string;
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
  same: string;
  placeholder: string;
  long: string;
};
export const redirectBuilderCopy: Record<AppLocale, Copy> = {
  en: {
    exactHashHelp:
      'Exact matching includes the query and #hash in the original URL. Different parameters or hashes do not match. Rules run on full page navigations; changing only #hash within an open page does not trigger a network redirect. The destination is used exactly as entered; if it has no #hash, the original hash is not retained.',
    path: 'Only this path (any query)',
    preserveQuery: 'Ignore query and #hash when matching; keep query parameters',
    queryHelp:
      'Match the same protocol, hostname, port and path, with or without ?query. Ignore any query in the original example; forward the actual incoming query without reordering or merging it. The destination must not contain a query.',
    hashHelp:
      '#hash does not participate in matching in this mode. A destination #hash replaces the incoming hash; without one, the browser keeps the incoming hash. Changing only #hash within an open page does not trigger a network redirect.',
    targetQuery:
      'Remove ?query from the destination to preserve incoming parameters. A destination #hash is allowed.',
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
      'Only this exact address, including its query parameters and #hash. Applies when opening a page; other requests are unchanged.',
    test: 'URL to test',
    match: 'Will redirect to',
    miss: 'This URL will not redirect',
    save: 'Save rule',
    advanced: 'Create an advanced rule',
    adjust: 'Adjust the generated pattern',
    reset: 'Regenerate from addresses',
    invalid: 'The adjusted pattern is invalid',
    url: 'Enter complete HTTP or HTTPS addresses without a username or password.',
    same: 'Choose a different destination to avoid a redirect loop.',
    placeholder: 'Enter a destination address without $1-style placeholders.',
    long: 'These addresses are too long for a browser rule.',
  },
  'zh-CN': {
    exactHashHelp:
      '精确匹配包含原网址的查询参数和 #hash；参数或 hash 不同就不匹配。规则仅在完整页面导航时生效，已打开页面内只改变 #hash 不会触发网络跳转。 跳转到填写的固定目标地址；目标未填写 #hash 时，不保留原 hash。',
    path: '仅此路径（任意查询参数）',
    preserveQuery: '忽略 query 和 #hash 匹配，并保留原查询参数',
    queryHelp:
      '精确匹配协议、主机名、端口和路径；带或不带 ?查询参数都匹配。来源示例中的参数会被忽略，实际访问的参数原样带到目标，不排序、不合并。目标网址不能填写查询参数。',
    hashHelp:
      '本模式匹配时忽略 #hash。目标填写 #hash 时替换原 hash；目标未填写时，浏览器保留原 hash。已打开页面内仅改变 #hash，不会触发网络跳转规则。',
    targetQuery: '请移除目标网址的 ?查询参数，才能保留实际访问的原参数。目标可以填写 #hash。',
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
    scope: '仅匹配这个完整网址（包含查询参数和 #hash），只在打开页面时生效，不影响其他请求。',
    test: '用这个网址测试',
    match: '将跳转到',
    miss: '这个网址不会跳转',
    save: '保存规则',
    advanced: '创建高级规则',
    adjust: '调整生成的匹配表达式',
    reset: '按网址重新生成',
    invalid: '调整后的表达式无效',
    url: '请填写完整的 HTTP 或 HTTPS 网址，不要包含用户名和密码。',
    same: '目标网址不能与原网址相同，以免循环跳转。',
    placeholder: '请填写实际目标网址，不要包含 $1 这类占位符。',
    long: '网址过长，无法生成浏览器规则。',
  },
  ko: {
    exactHashHelp:
      '정확한 일치는 원본 URL의 쿼리와 #hash를 포함합니다. 매개변수나 hash가 다르면 일치하지 않습니다. 전체 페이지 탐색에만 적용되며 열린 페이지에서 #hash만 변경하면 네트워크 리디렉션이 실행되지 않습니다. 입력한 대상 주소 그대로 이동하며 대상에 #hash가 없으면 원래 hash를 유지하지 않습니다.',
    path: '이 경로만 (모든 쿼리)',
    preserveQuery: '쿼리와 #hash를 무시하고 일치시키며 쿼리 매개변수 유지',
    queryHelp:
      '프로토콜, 호스트, 포트와 경로가 같으면 ?쿼리 유무에 관계없이 일치합니다. 원본 예시의 쿼리는 무시하고 실제 요청의 쿼리를 재정렬하거나 병합하지 않고 전달합니다. 대상에는 쿼리를 입력하지 마세요.',
    hashHelp:
      '이 모드에서는 #hash를 일치 조건에서 제외합니다. 대상의 #hash는 기존 hash를 대체하며, 없으면 브라우저가 기존 hash를 유지합니다. 열린 페이지에서 #hash만 변경하면 네트워크 리디렉션이 실행되지 않습니다.',
    targetQuery: '실제 요청의 매개변수를 유지하려면 대상의 ?쿼리를 제거하세요. 대상 #hash는 허용됩니다.',
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
    scope: '쿼리 매개변수와 #hash를 포함한 정확한 주소만 일치합니다. 페이지를 열 때만 적용됩니다.',
    test: '테스트할 URL',
    match: '이동할 주소',
    miss: '이 URL은 리디렉션되지 않습니다',
    save: '규칙 저장',
    advanced: '고급 규칙 만들기',
    adjust: '생성된 패턴 조정',
    reset: '주소에서 다시 생성',
    invalid: '수정한 패턴이 올바르지 않습니다',
    url: '사용자 이름이나 비밀번호 없이 완전한 HTTP 또는 HTTPS 주소를 입력하세요.',
    same: '리디렉션 반복을 피하려면 다른 대상 주소를 선택하세요.',
    placeholder: '$1 같은 자리표시자 없이 대상 주소를 입력하세요.',
    long: '브라우저 규칙으로 사용하기에 주소가 너무 깁니다.',
  },
  ja: {
    exactHashHelp:
      '完全一致では元の URL のクエリと #hash も照合します。値が異なる場合は一致しません。ページ全体の移動でのみ動作し、開いたページ内で #hash だけを変更してもネットワーク転送は発生しません。 入力した転送先へそのまま移動します。転送先に #hash がなければ、元の hash は保持しません。',
    path: 'このパスのみ（任意のクエリ）',
    preserveQuery: 'クエリと #hash を照合から除外し、クエリを引き継ぐ',
    queryHelp:
      'プロトコル、ホスト名、ポート、パスを完全一致で照合し、?クエリの有無は問いません。元の例のクエリは無視し、実際のクエリを並べ替え・結合せずに転送します。転送先にはクエリを指定しないでください。',
    hashHelp:
      'このモードでは #hash を照合に使いません。転送先に #hash があれば置き換え、なければブラウザーが元の hash を保持します。開いたページ内で #hash だけを変更してもネットワーク転送は発生しません。',
    targetQuery:
      '実際のクエリを保持するには、転送先の ?クエリを削除してください。転送先の #hash は指定できます。',
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
    scope: 'クエリと #hash を含む完全な URL のみに一致します。ページを開くときだけ適用されます。',
    test: 'テストする URL',
    match: '移動先',
    miss: 'この URL はリダイレクトされません',
    save: 'ルールを保存',
    advanced: '高度なルールを作成',
    adjust: '生成されたパターンを調整',
    reset: 'URL から再生成',
    invalid: '調整したパターンは無効です',
    url: 'ユーザー名やパスワードを含まない完全な HTTP または HTTPS URL を入力してください。',
    same: 'ループを防ぐため、別の移動先を指定してください。',
    placeholder: '$1 などのプレースホルダーを含まない移動先を入力してください。',
    long: 'ブラウザのルールとしては URL が長すぎます。',
  },
  fr: {
    exactHashHelp:
      'La correspondance exacte inclut les paramètres et le #hash de l’URL source. Des valeurs différentes ne correspondent pas. Les règles s’appliquent aux navigations complètes ; changer uniquement #hash dans une page ouverte ne déclenche pas de redirection réseau. La destination est utilisée telle quelle ; sans #hash de destination, le hash d’origine n’est pas conservé.',
    path: 'Ce chemin uniquement (toute requête)',
    preserveQuery: 'Ignorer paramètres et #hash lors du filtrage ; conserver les paramètres',
    queryHelp:
      'Le protocole, l’hôte, le port et le chemin doivent correspondre, avec ou sans ?paramètres. Ceux de l’exemple source sont ignorés ; ceux de la navigation sont transmis sans tri ni fusion. La destination ne doit pas contenir de paramètres.',
    hashHelp:
      'Dans ce mode, #hash ne participe pas au filtrage. Un #hash de destination remplace celui d’origine ; sinon, le navigateur le conserve. Changer uniquement #hash dans une page ouverte ne déclenche pas de redirection réseau.',
    targetQuery:
      'Retirez les ?paramètres de la destination pour conserver ceux de la navigation. Un #hash de destination est autorisé.',
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
    scope: 'Cette adresse exacte, paramètres et #hash compris, uniquement à l’ouverture d’une page.',
    test: 'URL à tester',
    match: 'Redirection vers',
    miss: 'Cette URL ne sera pas redirigée',
    save: 'Enregistrer la règle',
    advanced: 'Créer une règle avancée',
    adjust: 'Ajuster le motif généré',
    reset: 'Régénérer depuis les adresses',
    invalid: 'Le motif modifié est invalide',
    url: 'Saisissez des adresses HTTP ou HTTPS complètes, sans identifiant ni mot de passe.',
    same: 'Choisissez une destination différente pour éviter une boucle.',
    placeholder: 'Saisissez une destination sans référence de type $1.',
    long: 'Ces adresses sont trop longues pour une règle du navigateur.',
  },
  es: {
    exactHashHelp:
      'La coincidencia exacta incluye los parámetros y el #hash de la URL original. Si cambian, no coincide. Las reglas actúan en navegaciones completas; cambiar solo #hash en una página abierta no activa una redirección de red. Se usa el destino tal como se introduce; sin #hash de destino, no se conserva el hash original.',
    path: 'Solo esta ruta (cualquier consulta)',
    preserveQuery: 'Ignorar parámetros y #hash al comparar; conservar los parámetros',
    queryHelp:
      'Deben coincidir el protocolo, el host, el puerto y la ruta, con o sin ?parámetros. Se ignoran los del ejemplo de origen; los de la navegación se conservan sin ordenar ni combinar. El destino no debe contener parámetros.',
    hashHelp:
      'En este modo, #hash no interviene en la coincidencia. Un #hash de destino reemplaza al original; si no hay uno, el navegador conserva el original. Cambiar solo #hash dentro de una página abierta no activa una redirección de red.',
    targetQuery:
      'Elimina los ?parámetros del destino para conservar los de la navegación. Se permite un #hash de destino.',
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
    scope: 'Solo esta dirección exacta, incluidos los parámetros y #hash, al abrir una página.',
    test: 'URL para probar',
    match: 'Redirigirá a',
    miss: 'Esta URL no se redirigirá',
    save: 'Guardar regla',
    advanced: 'Crear una regla avanzada',
    adjust: 'Ajustar el patrón generado',
    reset: 'Regenerar desde las direcciones',
    invalid: 'El patrón ajustado no es válido',
    url: 'Introduce direcciones HTTP o HTTPS completas, sin usuario ni contraseña.',
    same: 'Elige otro destino para evitar un bucle.',
    placeholder: 'Introduce un destino sin referencias como $1.',
    long: 'Las direcciones son demasiado largas para una regla del navegador.',
  },
};
