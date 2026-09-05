import type { AppLocale } from '@/ui/i18n';

type Copy = {
  inactive: string;
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
    inactive: 'Saved disabled. You can review and enable it in the editor.',
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
    save: 'Save and review rule',
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
    inactive: '规则会以停用状态保存，可在编辑器中确认后启用。',
    title: '创建网址跳转',
    intro: '填写两个网址，自动生成规则。你可以先测试或调整，确认后再启用。',
    from: '原网址',
    to: '目标网址',
    generated: '自动生成的规则',
    scope: '仅匹配这个完整网址（包含查询参数），只在打开页面时生效，不影响其他请求。',
    test: '用这个网址测试',
    match: '将跳转到',
    miss: '这个网址不会跳转',
    save: '保存并查看规则',
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
    inactive: '비활성 상태로 저장됩니다. 편집기에서 확인한 후 활성화하세요.',
    title: 'URL 리디렉션 만들기',
    intro: '두 주소를 입력하면 규칙이 생성됩니다. 활성화 전에 테스트하거나 조정하세요.',
    from: '원래 URL',
    to: '대상 URL',
    generated: '생성된 규칙',
    scope: '쿼리 매개변수를 포함한 정확한 주소만 일치합니다. 페이지를 열 때만 적용됩니다.',
    test: '테스트할 URL',
    match: '이동할 주소',
    miss: '이 URL은 리디렉션되지 않습니다',
    save: '저장하고 규칙 확인',
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
    inactive: '無効の状態で保存します。編集画面で確認してから有効にできます。',
    title: 'URL リダイレクトを作成',
    intro: '2 つの URL からルールを自動生成します。有効にする前にテストや調整ができます。',
    from: '元の URL',
    to: '移動先の URL',
    generated: '生成されたルール',
    scope: 'クエリを含む完全な URL のみに一致します。ページを開くときだけ適用されます。',
    test: 'テストする URL',
    match: '移動先',
    miss: 'この URL はリダイレクトされません',
    save: '保存してルールを確認',
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
    inactive: 'La règle est enregistrée désactivée. Vérifiez-la dans l’éditeur avant de l’activer.',
    title: 'Créer une redirection URL',
    intro: 'Saisissez deux adresses. La règle générée peut être testée et ajustée avant activation.',
    from: 'URL originale',
    to: 'URL de destination',
    generated: 'Règle générée',
    scope: 'Cette adresse exacte, paramètres compris, uniquement à l’ouverture d’une page.',
    test: 'URL à tester',
    match: 'Redirection vers',
    miss: 'Cette URL ne sera pas redirigée',
    save: 'Enregistrer et vérifier',
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
    inactive: 'Se guarda desactivada. Revísala en el editor antes de activarla.',
    title: 'Crear una redirección URL',
    intro: 'Introduce dos direcciones. Generamos una regla que puedes probar y ajustar antes de activarla.',
    from: 'URL original',
    to: 'URL de destino',
    generated: 'Regla generada',
    scope: 'Solo esta dirección exacta, incluidos los parámetros, al abrir una página.',
    test: 'URL para probar',
    match: 'Redirigirá a',
    miss: 'Esta URL no se redirigirá',
    save: 'Guardar y revisar regla',
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
