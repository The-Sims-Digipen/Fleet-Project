#!/usr/bin/env bash
# Runs as fleet-deploy, without sudo. Install this file as a root-owned program.
set -Eeuo pipefail
umask 022

fail() { printf '%s\n' "$*" >&2; exit 1; }
[[ $# -ge 3 ]] || fail 'Usage: fleet-release deploy ENV RELEASE SHA256 | rollback ENV RELEASE_OR_previous'
action=$1
environment=$2
release=$3
[[ "$action" == deploy || "$action" == rollback ]] || fail 'Unknown action.'
[[ "$environment" =~ ^[a-z][a-z0-9-]*$ ]] || fail 'Invalid environment.'
root=$(realpath -e "${FLEET_ROOT:-/srv/fleet}")
site="$root/$environment"
[[ -d "$site/releases" && -d "$site/incoming" && -d "$site/shared/assets" ]] || fail 'Environment is not provisioned.'
# Root owns this configuration in production. FLEET_ROOT also permits isolated
# transaction tests without writing to /srv or needing administrator privileges.
# shellcheck source=/dev/null
source "$root/config/$environment.conf"
[[ "${SITE_HOST:-}" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]] || fail 'Invalid SITE_HOST configuration.'
scheme=${SITE_SCHEME:-http}
[[ "$scheme" == http || "$scheme" == https ]] || fail 'Invalid SITE_SCHEME configuration.'
port=80
if [[ "$scheme" == https ]]; then port=443; fi
url="$scheme://$SITE_HOST"

exec 9> "$site/.deploy.lock"
flock -x 9
if [[ "$release" == previous && "$action" == rollback ]]; then
    release=$(basename "$(readlink "$site/previous")")
fi
[[ "$release" =~ ^[0-9]+-[0-9]+-[0-9a-f]{40}$ ]] || fail 'Invalid release ID.'
target="$site/releases/$release"
previous=''
if [[ -L "$site/current" ]]; then
    previous=$(readlink "$site/current")
    [[ "$previous" =~ ^releases/[0-9]+-[0-9]+-[0-9a-f]{40}$ && -d "$site/$previous" ]] || fail 'Invalid current release link.'
elif [[ -e "$site/current" ]]; then
    fail 'current must be a symlink.'
fi

staging=''
smoke=''
promoted=false
switch_current() {
    ln -sfn "$1" "$site/.current-next"
    mv -Tf "$site/.current-next" "$site/current"
}
cleanup() {
    status=$?
    trap - EXIT
    if (( status != 0 )) && [[ "$promoted" == true ]]; then
        if [[ -n "$previous" ]]; then
            switch_current "$previous"
            printf 'Smoke check failed; restored %s.\n' "$previous" >&2
        else
            rm -f -- "$site/current"
            printf 'Smoke check failed; removed first deployment.\n' >&2
        fi
    fi
    rm -f -- "$site/.current-next"
    # Both paths are mktemp directories beneath the validated site directory.
    if [[ "$staging" == "$site/releases/.staging-"* ]]; then rm -rf -- "$staging"; fi
    if [[ "$smoke" == "$site/.smoke."* ]]; then rm -rf -- "$smoke"; fi
    exit "$status"
}
trap cleanup EXIT

if [[ "$action" == deploy ]]; then
    [[ $# -eq 4 && "$4" =~ ^[0-9a-f]{64}$ ]] || fail 'Deployment requires an archive SHA256.'
    archive="$site/incoming/$release.tar.gz"
    [[ -f "$archive" && ! -L "$archive" ]] || fail 'Uploaded archive is missing.'
    [[ ! -e "$target" ]] || fail 'Release already exists; use rollback to activate an existing release.'
    printf '%s  %s\n' "$4" "$archive" | sha256sum --check --status || fail 'Archive checksum mismatch.'
    staging=$(mktemp -d "$site/releases/.staging-${release}.XXXXXX")
    python3 - "$archive" "$staging" <<'PY'
import pathlib, sys, tarfile
with tarfile.open(sys.argv[1], 'r:gz') as archive:
    for member in archive.getmembers():
        path = pathlib.PurePosixPath(member.name)
        if path.is_absolute() or '..' in path.parts or not (member.isfile() or member.isdir()):
            raise ValueError(f'Unsafe archive entry: {member.name}')
    archive.extractall(sys.argv[2], filter='data')
PY
    candidate=$staging
else
    [[ $# -eq 3 && -d "$target" && ! -L "$target" ]] || fail 'Rollback release is missing.'
    candidate=$target
fi

# Validate the actual package, its commit identity, and the entry-point assets.
asset=$(python3 - "$candidate" "$release" <<'PY'
import json, pathlib, re, sys
root = pathlib.Path(sys.argv[1])
release = sys.argv[2]
version = json.loads((root / 'version.json').read_text())
if version != {'release': release, 'commit': release.rsplit('-', 1)[1]}:
    raise ValueError('Release metadata does not match the requested release.')
html = (root / 'index.html').read_text()
assets = re.findall(r'(?:src|href)="(/assets/[^"?#]+)"', html)
if not assets or not any(asset.endswith('.js') for asset in assets):
    raise ValueError('Client HTML has no JavaScript entry point.')
for asset in assets:
    path = pathlib.PurePosixPath(asset)
    if '..' in path.parts or not (root / asset.lstrip('/')).is_file():
        raise ValueError(f'Missing or unsafe entry-point asset: {asset}')
print(next(asset for asset in assets if asset.endswith('.js')))
PY
)

if [[ "$action" == deploy ]]; then
    find "$staging" -type d -exec chmod 755 {} +
    find "$staging" -type f -exec chmod 644 {} +
    mv "$staging" "$target"
    staging=''
fi
# Vite fingerprints filenames. Refuse conflicting contents rather than serving
# different code under a URL which browsers may already cache as immutable.
python3 - "$target/assets" "$site/shared/assets" <<'PY'
import pathlib, sys
source, shared = map(pathlib.Path, sys.argv[1:])
for asset in source.rglob('*'):
    existing = shared / asset.relative_to(source)
    if asset.is_file() and existing.exists() and (not existing.is_file() or existing.read_bytes() != asset.read_bytes()):
        raise ValueError(f'Asset collision: {asset.relative_to(source)}')
PY
rsync --recursive --ignore-existing --chmod=D755,F644 "$target/assets/" "$site/shared/assets/"

switch_current "releases/$release"
promoted=true
smoke=$(mktemp -d "$site/.smoke.XXXXXX")
curl_options=(--fail --silent --show-error --noproxy '*' --connect-timeout 5 --max-time 20
    --resolve "${SITE_HOST}:${port}:127.0.0.1")
curl "${curl_options[@]}" "$url/version.json" -o "$smoke/version.json"
curl "${curl_options[@]}" "$url/" -o "$smoke/index.html"
curl "${curl_options[@]}" "$url$asset" -D "$smoke/headers" -o "$smoke/asset"
python3 - "$target" "$smoke" "$asset" <<'PY'
import pathlib, sys
target, smoke = map(pathlib.Path, sys.argv[1:3])
for served, source in [('version.json', 'version.json'), ('index.html', 'index.html'), ('asset', sys.argv[3].lstrip('/'))]:
    if (smoke / served).read_bytes() != (target / source).read_bytes():
        raise ValueError(f'Served content does not match release: {source}')
headers = (smoke / 'headers').read_text().lower()
if 'content-type: application/javascript' not in headers and 'content-type: text/javascript' not in headers:
    raise ValueError('JavaScript has an unexpected Content-Type.')
PY

if [[ -n "$previous" && "$previous" != "releases/$release" ]]; then
    ln -sfn "$previous" "$site/.previous-next"
    mv -Tf "$site/.previous-next" "$site/previous"
fi
promoted=false
if [[ "$action" == deploy ]]; then rm -f -- "$archive"; fi
printf 'Serving %s on %s.\n' "$release" "$url"
