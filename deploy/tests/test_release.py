"""Exercise release transactions with real tar/rsync and controlled HTTP transport."""
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "release.sh"
FIRST = "100-1-" + "a" * 40
SECOND = "101-1-" + "b" * 40


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.site = self.root / "prod"
        for directory in ["config", "bin", "prod/incoming", "prod/releases", "prod/shared/assets"]:
            (self.root / directory).mkdir(parents=True, exist_ok=True)
        (self.root / "config/prod.conf").write_text("SITE_HOST=203.0.113.10\n")
        self.env = dict(os.environ, FLEET_ROOT=str(self.root), PATH=f"{self.root / 'bin'}:{os.environ['PATH']}")
        # Simulate Nginx's current symlink, persistent assets, and MIME response.
        # Only HTTP transport is replaced; promotion/extraction/filesystem work
        # uses the production CLI and Ubuntu utilities.
        curl = self.root / "bin/curl"
        curl.write_text("""#!/usr/bin/env python3
import json, os, pathlib, sys, urllib.parse
args = sys.argv[1:]
root = pathlib.Path(os.environ['FLEET_ROOT']) / 'prod'
version = json.loads((root / 'current/version.json').read_text())
if os.environ.get('FAIL_RELEASE') == version['release']:
    sys.exit(22)
url = next(arg for arg in args if arg.startswith(('http://', 'https://')))
path = urllib.parse.urlparse(url).path
source = root / ('shared' if path.startswith('/assets/') else 'current') / (path.lstrip('/') or 'index.html')
pathlib.Path(args[args.index('-o') + 1]).write_bytes(source.read_bytes())
if '-D' in args:
    mime = 'text/html' if os.environ.get('WRONG_MIME') else 'application/javascript'
    pathlib.Path(args[args.index('-D') + 1]).write_text('HTTP/1.1 200 OK\\nContent-Type: ' + mime + '\\n')
""")
        curl.chmod(0o755)

    def package(self, release, *, asset_name=None, contents=None, metadata=None, unsafe=None):
        asset_name = asset_name or f"entry-{release[-40]}.js"
        contents = contents or f"console.log('{release}');\n"
        files = {
            "index.html": f'<html><script type="module" src="/assets/{asset_name}"></script></html>',
            "version.json": json.dumps(metadata or {"release": release, "commit": release.rsplit("-", 1)[1]}) + "\n",
            f"assets/{asset_name}": contents,
        }
        archive = self.site / "incoming" / f"{release}.tar.gz"
        with tarfile.open(archive, "w:gz") as bundle:
            for name, text in files.items():
                data = text.encode()
                member = tarfile.TarInfo(name)
                member.size = len(data)
                bundle.addfile(member, io.BytesIO(data))
            if unsafe:
                member = tarfile.TarInfo(unsafe)
                bundle.addfile(member, io.BytesIO(b""))
        return hashlib.sha256(archive.read_bytes()).hexdigest()

    def run_cli(self, *args, success=True, **extra_env):
        result = subprocess.run(["bash", str(SCRIPT), *args], env=dict(self.env, **extra_env), capture_output=True, text=True)
        if success:
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        else:
            self.assertNotEqual(result.returncode, 0, result.stdout)
        return result

    def deploy(self, release, **package_args):
        self.run_cli("deploy", "prod", release, self.package(release, **package_args))

    def current(self):
        return (self.site / "current").readlink().as_posix()

    def test_deploy_preserves_old_assets_and_supports_rollback(self):
        self.deploy(FIRST)
        self.deploy(SECOND)
        self.assertEqual(self.current(), f"releases/{SECOND}")
        self.assertEqual((self.site / "previous").readlink().as_posix(), f"releases/{FIRST}")
        self.assertTrue((self.site / "shared/assets/entry-a.js").is_file())
        self.assertTrue((self.site / "shared/assets/entry-b.js").is_file())
        self.run_cli("rollback", "prod", "previous")
        self.assertEqual(self.current(), f"releases/{FIRST}")
        self.assertEqual((self.site / "previous").readlink().as_posix(), f"releases/{SECOND}")
        self.assertFalse(list(self.site.glob(".smoke.*")))

    def test_wrong_archive_digest_keeps_current(self):
        self.deploy(FIRST)
        self.package(SECOND)
        self.run_cli("deploy", "prod", SECOND, "0" * 64, success=False)
        self.assertEqual(self.current(), f"releases/{FIRST}")
        self.assertFalse((self.site / "releases" / SECOND).exists())

    def test_metadata_mismatch_keeps_current(self):
        self.deploy(FIRST)
        digest = self.package(SECOND, metadata={"release": SECOND, "commit": "c" * 40})
        self.run_cli("deploy", "prod", SECOND, digest, success=False)
        self.assertEqual(self.current(), f"releases/{FIRST}")
        self.assertFalse(list((self.site / "releases").glob(".staging-*")))

    def test_http_failure_restores_current(self):
        self.deploy(FIRST)
        self.run_cli("deploy", "prod", SECOND, self.package(SECOND), success=False, FAIL_RELEASE=SECOND)
        self.assertEqual(self.current(), f"releases/{FIRST}")
        self.assertFalse(list(self.site.glob(".smoke.*")))

    def test_first_deployment_failure_removes_current(self):
        self.run_cli("deploy", "prod", FIRST, self.package(FIRST), success=False, FAIL_RELEASE=FIRST)
        self.assertFalse((self.site / "current").is_symlink())

    def test_wrong_javascript_mime_restores_current(self):
        self.deploy(FIRST)
        self.run_cli("deploy", "prod", SECOND, self.package(SECOND), success=False, WRONG_MIME="1")
        self.assertEqual(self.current(), f"releases/{FIRST}")

    def test_reused_asset_url_with_different_bytes_is_rejected(self):
        self.deploy(FIRST, asset_name="same.js", contents="original")
        digest = self.package(SECOND, asset_name="same.js", contents="different")
        self.run_cli("deploy", "prod", SECOND, digest, success=False)
        self.assertEqual(self.current(), f"releases/{FIRST}")
        self.assertEqual((self.site / "shared/assets/same.js").read_text(), "original")

    def test_nested_assets_are_published(self):
        self.deploy(FIRST, asset_name="nested/entry.js")
        self.assertTrue((self.site / "shared/assets/nested/entry.js").is_file())

    def test_archive_path_traversal_is_rejected(self):
        digest = self.package(FIRST, unsafe="../../escaped")
        self.run_cli("deploy", "prod", FIRST, digest, success=False)
        self.assertFalse((self.root / "escaped").exists())
        self.assertFalse((self.site / "current").is_symlink())

    def test_invalid_environment_is_rejected(self):
        self.run_cli("rollback", "../prod", FIRST, success=False)


if __name__ == "__main__":
    unittest.main()
