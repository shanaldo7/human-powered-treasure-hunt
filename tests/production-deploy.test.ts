import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

function get(url: string): Promise<{ statusCode: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode || 0, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function runProductionDeploymentChecks() {
  console.log('🚀 [CHECK 1] Verifying dist directory and runtime files...');
  const distDir = path.resolve('dist');
  const indexHtmlPath = path.join(distDir, 'index.html');
  const serverJsPath = path.join(distDir, 'server.js');
  const assetsDir = path.join(distDir, 'assets');

  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`FAIL: dist/index.html does not exist at ${indexHtmlPath}`);
  }
  if (!fs.existsSync(serverJsPath)) {
    throw new Error(`FAIL: dist/server.js does not exist at ${serverJsPath}`);
  }
  if (!fs.existsSync(assetsDir)) {
    throw new Error(`FAIL: dist/assets does not exist at ${assetsDir}`);
  }

  const assetFiles = fs.readdirSync(assetsDir);
  const jsAsset = assetFiles.find((f) => f.endsWith('.js'));
  const cssAsset = assetFiles.find((f) => f.endsWith('.css'));

  if (!jsAsset || !cssAsset) {
    throw new Error(`FAIL: Missing JS or CSS bundles in dist/assets: ${assetFiles.join(', ')}`);
  }
  console.log(`✅ dist/ files verified. JS: ${jsAsset}, CSS: ${cssAsset}`);

  console.log('🚀 [CHECK 2] Starting production server: node dist/server.js on PORT=3399...');
  const testPort = 3399;
  const serverProcess = spawn('node', ['dist/server.js'], {
    env: { ...process.env, PORT: String(testPort), NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (d) => process.stdout.write(`[SERVER OUT] ${d}`));
  serverProcess.stderr.on('data', (d) => process.stderr.write(`[SERVER ERR] ${d}`));

  try {
    // Wait for server to start listening
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const baseUrl = `http://localhost:${testPort}`;

    console.log('🚀 [CHECK 3] GET / (Root HTML)...');
    const rootRes = await get(`${baseUrl}/`);
    if (rootRes.statusCode !== 200) {
      throw new Error(`FAIL: GET / returned status ${rootRes.statusCode}`);
    }
    if (!rootRes.body.includes('<!doctype html>') && !rootRes.body.includes('<html')) {
      throw new Error(`FAIL: GET / did not return HTML doctype. Received: ${rootRes.body.slice(0, 100)}`);
    }
    if (!rootRes.body.includes(jsAsset)) {
      throw new Error(`FAIL: GET / does not reference built JS asset ${jsAsset}`);
    }
    console.log('✅ GET / returned 200 OK with correct HTML and asset references.');

    console.log('🚀 [CHECK 4] GET /hunt (SPA Client Route)...');
    const spaRes = await get(`${baseUrl}/hunt`);
    if (spaRes.statusCode !== 200 || !spaRes.body.includes('<!doctype html>')) {
      throw new Error(`FAIL: GET /hunt SPA fallback failed. Status: ${spaRes.statusCode}`);
    }
    console.log('✅ GET /hunt returned 200 OK with SPA index.html.');

    console.log(`🚀 [CHECK 5] GET /assets/${jsAsset} (Built JS)...`);
    const jsRes = await get(`${baseUrl}/assets/${jsAsset}`);
    if (jsRes.statusCode !== 200) {
      throw new Error(`FAIL: GET /assets/${jsAsset} returned status ${jsRes.statusCode}`);
    }
    const jsContentType = jsRes.headers['content-type'] || '';
    if (!jsContentType.includes('javascript')) {
      throw new Error(`FAIL: Expected javascript content-type, got: ${jsContentType}`);
    }
    console.log(`✅ GET /assets/${jsAsset} returned 200 with content-type: ${jsContentType}`);

    console.log(`🚀 [CHECK 6] GET /assets/${cssAsset} (Built CSS)...`);
    const cssRes = await get(`${baseUrl}/assets/${cssAsset}`);
    if (cssRes.statusCode !== 200) {
      throw new Error(`FAIL: GET /assets/${cssAsset} returned status ${cssRes.statusCode}`);
    }
    const cssContentType = cssRes.headers['content-type'] || '';
    if (!cssContentType.includes('css')) {
      throw new Error(`FAIL: Expected css content-type, got: ${cssContentType}`);
    }
    console.log(`✅ GET /assets/${cssAsset} returned 200 with content-type: ${cssContentType}`);

    console.log('🚀 [CHECK 7] GET /api/health (API Route)...');
    const apiRes = await get(`${baseUrl}/api/health`);
    if (apiRes.statusCode !== 200) {
      throw new Error(`FAIL: GET /api/health returned status ${apiRes.statusCode}`);
    }
    const healthJson = JSON.parse(apiRes.body);
    if (healthJson.status !== 'ok') {
      throw new Error(`FAIL: Unexpected health response: ${apiRes.body}`);
    }
    console.log('✅ GET /api/health returned 200 with { status: "ok" }.');

    console.log('🚀 [CHECK 8] GET /assets/missing-file.js (404 check for missing asset)...');
    const missingAssetRes = await get(`${baseUrl}/assets/missing-file.js`);
    if (missingAssetRes.statusCode !== 404) {
      throw new Error(`FAIL: Missing asset returned status ${missingAssetRes.statusCode} instead of 404!`);
    }
    console.log(`✅ Missing asset returned 404 Not Found as expected.`);

    console.log('🚀 [CHECK 9] GET /unknown.png (404 check for missing static image)...');
    const missingImgRes = await get(`${baseUrl}/unknown.png`);
    if (missingImgRes.statusCode !== 404) {
      throw new Error(`FAIL: Missing image returned status ${missingImgRes.statusCode} instead of 404!`);
    }
    console.log(`✅ Missing image returned 404 Not Found as expected.`);

    console.log('🚀 [CHECK 10] GET /api/unknown-route (404 check for missing API)...');
    const missingApiRes = await get(`${baseUrl}/api/unknown-route`);
    if (missingApiRes.statusCode !== 404) {
      throw new Error(`FAIL: Missing API returned status ${missingApiRes.statusCode} instead of 404!`);
    }
    const missingApiJson = JSON.parse(missingApiRes.body);
    if (!missingApiJson.error) {
      throw new Error(`FAIL: Expected JSON error on missing API, got: ${missingApiRes.body}`);
    }
    console.log(`✅ Missing API returned 404 JSON response as expected.`);

    // Kill root server before testing cwd=dist server
    serverProcess.kill('SIGTERM');
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log('🚀 [CHECK 11] Starting server with CWD=dist (node server.js) on PORT=3398...');
    const testPort2 = 3398;
    const serverProcess2 = spawn('node', ['server.js'], {
      cwd: distDir,
      env: { ...process.env, PORT: String(testPort2), NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res2 = await get(`http://localhost:${testPort2}/`);
      if (res2.statusCode !== 200 || !res2.body.includes('<!doctype html>')) {
        throw new Error(`FAIL: Server started with cwd=dist failed to serve root. Status: ${res2.statusCode}`);
      }
      console.log('✅ Server started with cwd=dist successfully served root 200 OK!');
    } finally {
      serverProcess2.kill('SIGTERM');
    }

    console.log('\n🎉 ALL 11 PRODUCTION DEPLOYMENT CHECKS PASSED PERFECTLY!\n');
  } finally {
    try { serverProcess.kill('SIGTERM'); } catch (_) {}
  }
}

runProductionDeploymentChecks().catch((err) => {
  console.error('❌ Check failed:', err);
  process.exit(1);
});
