import type { Locale } from './content';

type ReleaseCopy = {
  installTitle: string;
  chromeInstall: string;
  availability: string;
  minimumLabel: string;
  localTitle: string;
  localDescription: string;
  chromiumSteps: string;
  firefoxSteps: string;
  sourceLabel: string;
  screenshotAlt: string;
  screenshotCaption: string;
  browseGuides: string;
  secretNotice: string;
};

export const releaseCopy: Record<Locale, ReleaseCopy> = {
  en: {
    installTitle: 'Install RequestOrbit',
    chromeInstall: 'Install from Chrome Web Store',
    availability: 'Developer preview. Chrome, Edge, and Firefox store installs are not available yet.',
    minimumLabel: 'Minimum versions',
    localTitle: 'Try a local development build',
    localDescription:
      'Requires Node.js 24 and pnpm 11. Build from source, then load the folder for your browser.',
    chromiumSteps:
      'Chrome: open chrome://extensions, enable Developer mode, and load dist/chrome as an unpacked extension. For Edge, use edge://extensions and dist/edge.',
    firefoxSteps:
      'Firefox: open about:debugging → This Firefox → Load Temporary Add-on, then select dist/firefox/manifest.json. Temporary installs are removed when Firefox restarts.',
    sourceLabel: 'View source',
    screenshotAlt:
      'RequestOrbit redirect builder with original and destination URLs, exact scope and live preview',
    screenshotCaption: 'Actual redirect builder. The URL preview does not send a request.',
    browseGuides: 'Browse guides',
    secretNotice:
      'URLs and request headers you enter may contain tokens or other private information. They are saved locally and included in unencrypted backups. Review backups before sharing them.',
  },
  'zh-CN': {
    installTitle: '安装 RequestOrbit',
    chromeInstall: '在 Chrome 商店安装',
    availability: '目前为开发预览版，Chrome、Edge 和 Firefox 的商店安装尚未开放。',
    minimumLabel: '最低版本',
    localTitle: '在本地试用开发版',
    localDescription: '需要 Node.js 24 和 pnpm 11。先从源码构建，再加载对应浏览器的产物文件夹。',
    chromiumSteps:
      'Chrome：打开 chrome://extensions，开启开发者模式，选择“加载已解压的扩展程序”并载入 dist/chrome。Edge 则使用 edge://extensions 和 dist/edge。',
    firefoxSteps:
      'Firefox：打开 about:debugging → 此 Firefox → 临时载入附加组件，选择 dist/firefox/manifest.json。重启 Firefox 后临时安装会移除。',
    sourceLabel: '查看源码',
    screenshotAlt: 'RequestOrbit 跳转向导，展示原网址、目标网址、精确范围和实时预览',
    screenshotCaption: '真实跳转向导。URL 预览不会发送请求。',
    browseGuides: '浏览指南',
    secretNotice:
      '你填写的网址或请求头可能含有令牌等隐私信息。这些内容会在本地保存，并包含在未加密的备份中。分享备份前请检查其中的内容。',
  },
  ko: {
    installTitle: 'RequestOrbit 설치',
    chromeInstall: 'Chrome 웹 스토어에서 설치',
    availability: '개발자 미리보기입니다. Chrome, Edge, Firefox 스토어 설치는 아직 제공되지 않습니다.',
    minimumLabel: '최소 버전',
    localTitle: '로컬 개발 빌드 사용해 보기',
    localDescription:
      'Node.js 24 및 pnpm 11이 필요합니다. 소스에서 빌드한 후 브라우저에 맞는 폴더를 로드하세요.',
    chromiumSteps:
      'Chrome: chrome://extensions에서 개발자 모드를 켜고 dist/chrome을 압축해제된 확장으로 로드하세요. Edge는 edge://extensions와 dist/edge를 사용합니다.',
    firefoxSteps:
      'Firefox: about:debugging → 이 Firefox → 임시 부가 기능 로드에서 dist/firefox/manifest.json을 선택하세요. Firefox를 재시작하면 임시 설치가 제거됩니다.',
    sourceLabel: '소스 보기',
    screenshotAlt: '원본 URL, 대상 URL, 정확한 범위와 미리보기를 보여 주는 RequestOrbit 리디렉션 편집기',
    screenshotCaption: '실제 리디렉션 편집기입니다. URL 미리보기는 요청을 보내지 않습니다.',
    browseGuides: '가이드 둘러보기',
    secretNotice:
      '입력한 URL이나 요청 헤더에 토큰 또는 개인정보가 포함될 수 있습니다. 이 내용은 로컬에 저장되며 암호화되지 않은 백업에 포함됩니다. 공유 전에 백업을 확인하세요.',
  },
  ja: {
    installTitle: 'RequestOrbit をインストール',
    chromeInstall: 'Chrome ウェブストアからインストール',
    availability: '開発プレビュー版です。Chrome、Edge、Firefox のストアからはまだインストールできません。',
    minimumLabel: '最低バージョン',
    localTitle: 'ローカルの開発ビルドを試す',
    localDescription:
      'Node.js 24 と pnpm 11 が必要です。ソースからビルドし、ブラウザーに対応するフォルダーを読み込んでください。',
    chromiumSteps:
      'Chrome: chrome://extensions でデベロッパーモードを有効にし、dist/chrome をパッケージ化されていない拡張機能として読み込みます。Edge は edge://extensions と dist/edge を使います。',
    firefoxSteps:
      'Firefox: about:debugging → この Firefox → 一時的なアドオンを読み込む、から dist/firefox/manifest.json を選択します。Firefox を再起動すると一時的なインストールは削除されます。',
    sourceLabel: 'ソースを見る',
    screenshotAlt: '元の URL、転送先 URL、完全一致の範囲とプレビューを示す RequestOrbit リダイレクト作成画面',
    screenshotCaption: '実際のリダイレクト作成画面です。URL プレビューはリクエストを送信しません。',
    browseGuides: 'ガイドを見る',
    secretNotice:
      '入力した URL やリクエストヘッダーにはトークンなどの個人情報が含まれる場合があります。ローカルに保存され、暗号化されていないバックアップにも含まれます。共有前に内容を確認してください。',
  },
  fr: {
    installTitle: 'Installer RequestOrbit',
    chromeInstall: 'Installer depuis le Chrome Web Store',
    availability:
      'Version de développement. L’installation depuis les boutiques Chrome, Edge et Firefox n’est pas encore disponible.',
    minimumLabel: 'Versions minimales',
    localTitle: 'Essayer une version locale',
    localDescription:
      'Nécessite Node.js 24 et pnpm 11. Compilez le code source puis chargez le dossier de votre navigateur.',
    chromiumSteps:
      'Chrome : ouvrez chrome://extensions, activez le mode développeur et chargez dist/chrome comme extension non empaquetée. Pour Edge, utilisez edge://extensions et dist/edge.',
    firefoxSteps:
      'Firefox : ouvrez about:debugging → Ce Firefox → Charger un module complémentaire temporaire, puis choisissez dist/firefox/manifest.json. L’installation temporaire disparaît au redémarrage de Firefox.',
    sourceLabel: 'Voir le code source',
    screenshotAlt:
      'Créateur de redirections RequestOrbit avec URL source, destination, portée exacte et aperçu',
    screenshotCaption: 'Le véritable créateur de redirections. L’aperçu URL n’envoie aucune requête.',
    browseGuides: 'Parcourir les guides',
    secretNotice:
      'Les URL et en-têtes saisis peuvent contenir des jetons ou des informations privées. Ils sont enregistrés localement et inclus dans les sauvegardes non chiffrées. Vérifiez les sauvegardes avant de les partager.',
  },
  es: {
    installTitle: 'Instalar RequestOrbit',
    chromeInstall: 'Instalar desde Chrome Web Store',
    availability:
      'Versión de desarrollo. La instalación desde las tiendas de Chrome, Edge y Firefox aún no está disponible.',
    minimumLabel: 'Versiones mínimas',
    localTitle: 'Probar una compilación local',
    localDescription:
      'Requiere Node.js 24 y pnpm 11. Compila el código fuente y carga la carpeta de tu navegador.',
    chromiumSteps:
      'Chrome: abre chrome://extensions, activa el modo de desarrollador y carga dist/chrome como extensión sin empaquetar. En Edge usa edge://extensions y dist/edge.',
    firefoxSteps:
      'Firefox: abre about:debugging → Este Firefox → Cargar complemento temporal y selecciona dist/firefox/manifest.json. La instalación temporal se elimina al reiniciar Firefox.',
    sourceLabel: 'Ver código fuente',
    screenshotAlt:
      'Creador de redirecciones de RequestOrbit con URL original, destino, alcance exacto y vista previa',
    screenshotCaption: 'Creador de redirecciones real. La vista previa de URL no envía solicitudes.',
    browseGuides: 'Explorar guías',
    secretNotice:
      'Las URL y los encabezados que escribas pueden contener tokens u otra información privada. Se guardan localmente y se incluyen en copias sin cifrar. Revísalas antes de compartirlas.',
  },
};
