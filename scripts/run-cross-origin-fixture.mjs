import http from 'node:http';

const PORT = 4185;

const appHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>My Webrequest cross-origin fixture</title>
    <style>
      body { font: 16px system-ui, sans-serif; max-width: 760px; margin: 48px auto; padding: 0 24px; }
      section { display: grid; gap: 12px; margin-block: 28px; }
      button { width: fit-content; padding: 8px 14px; }
      output { min-height: 24px; font-family: ui-monospace, monospace; overflow-wrap: anywhere; }
    </style>
  </head>
  <body>
    <h1>My Webrequest cross-origin fixture</h1>
    <p>Initiator: <code>http://localhost:${PORT}</code>; request origin: <code>http://127.0.0.1:${PORT}</code>.</p>
    <section>
      <button id="redirect" type="button">Run redirect probe</button>
      <output id="redirect-result" aria-live="polite">Not run</output>
    </section>
    <section>
      <button id="header" type="button">Run header probe</button>
      <output id="header-result" aria-live="polite">Not run</output>
    </section>
    <script>
      const run = async (name, path) => {
        const output = document.querySelector('#' + name + '-result');
        output.textContent = 'Running…';
        try {
          const response = await fetch('http://127.0.0.1:${PORT}' + path + '?nonce=' + Date.now());
          output.textContent = response.url + ' | ' + (await response.text());
        } catch (error) {
          output.textContent = 'ERROR | ' + String(error);
        }
      };
      document.querySelector('#redirect').addEventListener('click', () => run('redirect', '/redirect/captured-value'));
      document.querySelector('#header').addEventListener('click', () => run('header', '/headers'));
    </script>
  </body>
</html>`;

const server = http.createServer((request, response) => {
  response.setHeader('access-control-allow-origin', '*');
  response.setHeader('cache-control', 'no-store');

  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `localhost:${PORT}`}`);
  if (url.pathname === '/app') {
    response.setHeader('content-type', 'text/html; charset=utf-8');
    response.end(appHtml);
    return;
  }

  response.setHeader('content-type', 'text/plain; charset=utf-8');
  if (url.pathname.startsWith('/redirect/')) {
    response.end(`redirect-rule-missed:${url.pathname}`);
    return;
  }
  if (url.pathname.startsWith('/target/')) {
    response.end(`redirected:${url.pathname}`);
    return;
  }
  if (url.pathname === '/headers') {
    response.end(`header:${String(request.headers['x-mwr-cross-origin'] ?? '')}`);
    return;
  }

  response.statusCode = 404;
  response.end('not-found');
});

server.listen(PORT, () => {
  console.log(`Cross-origin fixture listening at http://localhost:${PORT}/app`);
});

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
