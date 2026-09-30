"""Verify production routing and caching with an unprivileged real Nginx."""
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
import unittest
from urllib.error import HTTPError, URLError
from urllib.request import ProxyHandler, build_opener


NGINX = os.environ.get("NGINX_BINARY") or shutil.which("nginx")
MIME = Path(os.environ.get("NGINX_MIME_TYPES", "/etc/nginx/mime.types"))
TEMPLATE = Path(__file__).resolve().parents[1] / "nginx/prod-http.conf"


@unittest.skipUnless(NGINX and MIME.is_file(), "Nginx and its mime.types are required")
class NginxTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="fleet-nginx-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.site = self.root / "prod"
        (self.site / "releases").mkdir(parents=True)
        (self.site / "shared/assets").mkdir(parents=True)
        with socket.socket() as listener:
            listener.bind(("127.0.0.1", 0))
            self.port = listener.getsockname()[1]
        server = TEMPLATE.read_text().replace("${SITE_HOST}", "127.0.0.1")
        server = server.replace("listen 80;", f"listen 127.0.0.1:{self.port};")
        server = server.replace("listen [::]:80;", "")
        server = server.replace("/srv/fleet/prod", str(self.site))
        config = self.root / "nginx.conf"
        config.write_text(f"""
daemon off;
master_process off;
pid {self.root}/nginx.pid;
error_log {self.root}/error.log;
events {{ worker_connections 128; }}
http {{
    include {MIME};
    access_log off;
    client_body_temp_path {self.root}/body;
    proxy_temp_path {self.root}/proxy;
    fastcgi_temp_path {self.root}/fastcgi;
    uwsgi_temp_path {self.root}/uwsgi;
    scgi_temp_path {self.root}/scgi;
    {server}
}}
""")
        check = subprocess.run([NGINX, "-t", "-c", str(config), "-p", str(self.root)], capture_output=True, text=True)
        self.assertEqual(check.returncode, 0, check.stderr)
        self.process = subprocess.Popen([NGINX, "-c", str(config), "-p", str(self.root)], stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        self.addCleanup(self.stop_nginx)
        self.client = build_opener(ProxyHandler({}))
        for _ in range(100):
            if self.process.poll() is not None:
                self.fail(self.process.stderr.read().decode())
            try:
                self.get("/")
                break
            except URLError:
                time.sleep(0.02)
        else:
            self.fail("Nginx did not start listening.")

    def stop_nginx(self):
        if self.process.poll() is None:
            self.process.terminate()
        self.process.wait(timeout=5)
        self.process.stderr.close()

    def get(self, path):
        try:
            response = self.client.open(f"http://127.0.0.1:{self.port}{path}", timeout=2)
        except HTTPError as response:
            return response.code, response.headers, response.read()
        with response:
            return response.status, response.headers, response.read()

    def publish(self, release):
        target = self.site / "releases" / release
        target.mkdir()
        html = f'<html><script src="/assets/{release}.js"></script></html>'.encode()
        (target / "index.html").write_bytes(html)
        (target / "version.json").write_text(json.dumps({"release": release}))
        (target / ".env").write_text("not-public")
        (self.site / "shared/assets" / f"{release}.js").write_text(f"console.log('{release}');")
        next_link = self.site / "next"
        next_link.symlink_to(f"releases/{release}")
        next_link.replace(self.site / "current")
        return html

    def test_unprovisioned_release_returns_503(self):
        self.assertEqual(self.get("/")[0], 503)
        self.assertEqual(self.get("/version.json")[0], 503)

    def test_spa_html_and_version_have_revalidation_headers(self):
        html = self.publish("first")
        for path in ["/", "/index.html", "/projects/example"]:
            status, headers, body = self.get(path)
            self.assertEqual(status, 200)
            self.assertEqual(body, html)
            self.assertEqual(headers["Cache-Control"], "no-cache")
        status, headers, body = self.get("/version.json")
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(json.loads(body)["release"], "first")

    def test_asset_mime_cache_and_missing_asset_404(self):
        html = self.publish("first")
        status, headers, _ = self.get("/assets/first.js")
        self.assertEqual(status, 200)
        self.assertIn(headers.get_content_type(), ["application/javascript", "text/javascript"])
        self.assertIn("immutable", headers["Cache-Control"])
        self.assertEqual(headers["X-Content-Type-Options"], "nosniff")
        status, headers, body = self.get("/assets/missing.js")
        self.assertEqual(status, 404)
        self.assertNotEqual(body, html)
        self.assertNotIn("immutable", headers.get("Cache-Control", ""))

    def test_old_assets_survive_current_release_switch(self):
        self.publish("first")
        self.publish("second")
        self.assertIn(b"second", self.get("/")[2])
        self.assertEqual(self.get("/assets/first.js")[0], 200)
        self.assertEqual(self.get("/assets/second.js")[0], 200)

    def test_hidden_files_are_not_served(self):
        self.publish("first")
        self.assertEqual(self.get("/.env")[0], 404)


if __name__ == "__main__":
    unittest.main()
