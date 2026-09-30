# School Ubuntu VM deployment

The current deployment serves **only `prod`**, publicly over **HTTP**, from Ubuntu
24.04. GitHub Actions runs `pnpm verify`, packages `apps/client/dist`, uploads it
over SSH, and promotes an immutable release after checking its contents. Projects
continue to save in each browser's IndexedDB. The VM needs Nginx, Python, rsync,
and OpenSSH; Node, pnpm, Fastify, and PostgreSQL are not runtime requirements.

The workflow also verifies all pull requests and pushes to `main` and `stage`.
Those branches are not deployed. Node 24 and pnpm from `package.json` are used in CI.

Keep the Ubuntu SSH session open and use a **second local PowerShell window** for
Windows checks. After `ssh` connects, commands typed in that terminal run on the
**Ubuntu VM**, even though you launched the connection from Windows. PowerShell
windows do not share variables; repeat the three variable assignments from step 1
in your second local window. Keep the Bash variables from step 2 available in the
SSH session.

## 1. Prepare your workstation

Replace the IP, admin username, and public SSH port. Use the VM's externally
reachable IPv4 address.

```powershell
# Run on Windows PC (PowerShell), from the repository root.
$vmAddress = "YOUR_PUBLIC_IPV4"
$vmAdmin = "YOUR_EXISTING_ADMIN_USERNAME"
$vmSshPort = 22

Test-NetConnection $vmAddress -Port $vmSshPort
ssh-keygen -t ed25519 -C "fleet-prod-ci" -f "$env:USERPROFILE\.ssh\fleet-prod-ci"
```

**Leave the deployment key's passphrase empty.** At the passphrase prompt, press
Enter without typing anything, then press Enter again at the confirmation prompt.
GitHub Actions must load this key unattended; a passphrase-protected key causes
deployment to fail with `Permission denied (publickey,password)`.

This key authenticates a dedicated deployment account, separately from your admin
account. If that filename already exists, use a new filename instead of overwriting it.

Copy the deployment files and **public** key to the VM. This works before the code
has been committed or pushed, so VM provisioning can precede the first deployment.

```powershell
# Run on Windows PC (PowerShell), from the repository root.
scp -P $vmSshPort -r ./deploy "${vmAdmin}@${vmAddress}:~/fleet-deployment"
scp -P $vmSshPort "$env:USERPROFILE\.ssh\fleet-prod-ci.pub" "${vmAdmin}@${vmAddress}:~/fleet-prod-ci.pub"
# This opens your Ubuntu VM SSH session.
ssh -p $vmSshPort "${vmAdmin}@${vmAddress}"
```

## 2. Install VM packages and create the deployment account

Replace `YOUR_PUBLIC_IPV4` once below. `SSH_PORT` is the VM's SSH listening port;
if the school's NAT translates it, the public port configured in GitHub can differ.

```bash
# Run on Ubuntu VM (Bash), in your admin SSH session.
export SITE_HOST='YOUR_PUBLIC_IPV4'
SSH_PORT=22
VM_SETUP="$HOME/fleet-deployment"

sudo apt update
sudo apt install --yes nginx openssh-server curl rsync python3 gettext-base ufw

id fleet-deploy >/dev/null 2>&1 || sudo adduser --disabled-password --gecos '' fleet-deploy
sudo install -d -o fleet-deploy -g fleet-deploy -m 700 /home/fleet-deploy/.ssh
{ printf 'restrict '; cat "$HOME/fleet-prod-ci.pub"; } | sudo tee /home/fleet-deploy/.ssh/authorized_keys >/dev/null
sudo chown fleet-deploy:fleet-deploy /home/fleet-deploy/.ssh/authorized_keys
sudo chmod 600 /home/fleet-deploy/.ssh/authorized_keys

sudo install -d -o root -g root -m 755 /srv/fleet /srv/fleet/config /srv/fleet/prod
sudo install -d -o fleet-deploy -g fleet-deploy -m 755 \
  /srv/fleet/prod/incoming /srv/fleet/prod/releases /srv/fleet/prod/shared/assets
# The deployment account must be able to atomically replace current/previous.
sudo chown fleet-deploy:fleet-deploy /srv/fleet/prod

printf 'SITE_HOST=%s\nSITE_SCHEME=http\n' "$SITE_HOST" | sudo tee /srv/fleet/config/prod.conf >/dev/null
sudo chown root:root /srv/fleet/config/prod.conf
sudo chmod 644 /srv/fleet/config/prod.conf
sudo install -o root -g root -m 755 "$VM_SETUP/release.sh" /usr/local/bin/fleet-release
```

Do not add `fleet-deploy` to sudoers. The SSH key's `restrict` option disables
forwarding and PTYs while permitting the SCP/SFTP and release commands.

## 3. Configure HTTP serving and the firewall

```bash
# Run on Ubuntu VM (Bash), in the same SSH session as step 2.
# Substitute only SITE_HOST; leave Nginx's $uri variables untouched.
envsubst '$SITE_HOST' < "$VM_SETUP/nginx/prod-http.conf" | sudo tee /etc/nginx/sites-available/fleet-prod >/dev/null
sudo ln -sfn /etc/nginx/sites-available/fleet-prod /etc/nginx/sites-enabled/fleet-prod

# Remove Ubuntu's default site symlink on a VM dedicated to this app.
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl enable --now nginx
sudo systemctl reload nginx

# Permit your actual SSH listener before enabling the firewall.
sudo ufw allow "${SSH_PORT}/tcp"
sudo ufw allow 80/tcp
sudo ufw enable
sudo ufw status
```

The school's upstream firewall/NAT must also allow public TCP **80** and your
public SSH port. UFW only controls the VM. No TLS/certificate setup is needed for
this initial HTTP deployment.

Before the first release, `/` and `/version.json` return **503**, indicating that
Nginx is reachable but nothing has been deployed.

```powershell
# Run on Windows PC (PowerShell), in a local window with the step 1 variables.
curl.exe -I "http://$vmAddress/"
ssh -i "$env:USERPROFILE\.ssh\fleet-prod-ci" -p $vmSshPort "fleet-deploy@${vmAddress}" "id"
```

The SSH test is launched from Windows and runs `id` remotely on the Ubuntu VM.

## 4. Record the VM SSH host key

On the VM, print the real server key and fingerprint through your existing admin
connection. Copy the matching host entry into GitHub, rather than trusting a new
key discovered during CI.

```bash
# Run on Ubuntu VM (Bash), in your admin SSH session.
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
printf '%s ' "$SITE_HOST"
sudo cat /etc/ssh/ssh_host_ed25519_key.pub
```

For public SSH port 22, the entry looks like this. This is an **example of the
output to copy into GitHub**, not a command to run:

```text
YOUR_PUBLIC_IPV4 ssh-ed25519 AAAAC3... server-comment
```

For a nonstandard public SSH port, use `[YOUR_PUBLIC_IPV4]:PUBLIC_SSH_PORT` as the
first field instead. The key and fingerprint are the same.

## 5. Configure GitHub's prod environment

**Do this on Windows PC — browser, in GitHub:**

In [the repository settings](https://github.com/The-Sims-Digipen/Fleet-Project/settings/environments),
create an environment named **`prod`**. Set its deployment branches to **Selected
branches and tags**, and add the branch rule **`prod`**. Leave required reviewers
unset for automatic deployment.

Add these **environment variables**:

| Variable | Value |
|---|---|
| `VM_HOST` | The externally reachable VM IPv4 address |
| `VM_SSH_PORT` | Public SSH port, usually `22` |
| `SITE_HOST` | The same IPv4 address for the initial HTTP site |
| `SITE_SCHEME` | `http` |

Add these **environment secrets**:

| Secret | Value |
|---|---|
| `VM_SSH_KEY` | Complete private key, including BEGIN/END lines |
| `VM_KNOWN_HOSTS` | The verified host-key entry from step 4 |

To read the private key locally for GitHub's secret form:

```powershell
# Run on Windows PC (PowerShell), in your local window.
Get-Content -Raw "$env:USERPROFILE\.ssh\fleet-prod-ci"
```

Paste it directly into `VM_SSH_KEY` in GitHub; the VM receives only its public key.
SSH host key checking remains enabled in the workflow.

## 6. Deploy prod

After VM setup and GitHub settings are complete, commit these codebase changes
from **Windows PC — PowerShell, in your local repository**, and merge this branch
into **`prod`** through the normal review process in **GitHub in your browser**.
That push starts **CI and production deployment**. The PR check to require in branch
protection is **Verify**; protecting `prod` ensures reviewed code reaches the VM.

The pipeline typechecks/tests/builds the whole workspace, tests release failure
handling, and packages only the production client. Deployment uses that exact
artifact and its SHA256, not a fresh build on the VM. Superseded `prod` commits
are skipped before upload. Production runs are not cancelled during promotion.
These build and upload steps run on **GitHub Actions — automatic**; the workflow
runs the release command remotely on the Ubuntu VM as `fleet-deploy`.

Each release is identified by `RUN_ID-RUN_ATTEMPT-COMMIT_SHA` and includes a
`version.json`. The directory layout is:

```text
/srv/fleet/
  config/prod.conf        # root-owned serving address/protocol
  prod/
    incoming/            # archives awaiting validation
    releases/<release>/  # complete production builds
    shared/assets/       # persistent Vite assets for existing browser tabs
    current -> releases/<release>
    previous -> releases/<previous-release>
```

The release command locks the site, verifies the checksum and package, publishes
assets, then atomically switches `current`. It checks the served HTML, version,
and JavaScript through Nginx on loopback with the configured Host header. A failed
VM smoke check restores the prior symlink. The final GitHub step separately checks
the public version endpoint; a public-network failure marks the run failed but
does not undo a release that passed the VM checks.

```bash
# Run on Ubuntu VM (Bash), to check the deployed version.
curl --fail "http://$SITE_HOST/version.json"
readlink /srv/fleet/prod/current
```

On **Windows PC — browser**, open `http://YOUR_PUBLIC_IPV4/`. Create a Project,
add a Vehicle, save, reload, then use **Open project** to reopen the saved Project and confirm that
its fleet and 3D view return. Duplicate a Scenario and move its timeline. This
validates the actual VM/browser path beyond CI tests.

The UUID helper supports HTTP's `crypto.getRandomValues()` API when
`crypto.randomUUID()` is unavailable. [Browser API reference](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues).

Re-run a failed `prod` workflow run after fixing VM/settings issues. Manual
`workflow_dispatch` is also defined; GitHub's **Run workflow** button becomes
available once this workflow file exists on the default branch (`main`). Choose
`prod` when using it. Dispatching another branch verifies it without deployment.

## Rollback, maintenance, and later environments

```bash
# Run on Ubuntu VM (Bash), to roll back immediately.
sudo -u fleet-deploy /usr/local/bin/fleet-release rollback prod previous
```

Or choose an existing full release ID:

```bash
# Run on Ubuntu VM (Bash).
# Replace the release ID placeholder with an ID from the listing.
ls -1 /srv/fleet/prod/releases
sudo -u fleet-deploy /usr/local/bin/fleet-release rollback prod RUN_ID-RUN_ATTEMPT-COMMIT_SHA
```

Rollback performs the same serving checks. The next automatic deployment can
replace a manual rollback; revert the bad commit on `prod` for a lasting rollback.

Releases and shared assets are retained.

```bash
# Run on Ubuntu VM (Bash), to monitor disk space.
du -sh /srv/fleet/prod
df -h /srv/fleet
```

Remove specific old releases only after checking the `current` and `previous`
links. Retain shared assets while
older browser tabs may still reference them.

When changing `deploy/release.sh`, copy it to the VM and reinstall it with the
`sudo install` command in step 2: copy from **Windows PC — PowerShell**, then install
from **Ubuntu VM — Bash**. Changes to the Nginx template similarly require
rendering the configuration again, `nginx -t`, and reload on **Ubuntu VM — Bash**.
These root-owned files are provisioned by the administrator, not overwritten by
application deployment.

For future `stage` or `main` sites, provision separate directories, configurations,
Nginx server blocks, hostnames, and GitHub environments. The release CLI already
takes an environment name. Extend the workflow's deployment branch condition,
environment selection, latest-branch check, and upload/command paths together.
Keep each site's origin and asset pool separate. Nothing deploys those branches today.

When the school enables HTTPS, update the serving configuration plus `SITE_SCHEME`
in both the VM configuration and GitHub environment. If TLS terminates upstream,
keep the VM's loopback smoke-check scheme matching its local Nginx listener and
set GitHub's scheme to the public one. Export Projects before changing the public
scheme/hostname: IndexedDB belongs to an origin, so HTTP and HTTPS have separate
browser storage. Import the exported files on the new origin.

```bash
# Run on Ubuntu VM (Bash), for deployment diagnostics.
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo tail -n 50 /var/log/nginx/error.log
sudo ss -lntp
```

VM installation and public reachability must be confirmed on the school VM; local
verification does not configure or test that machine. Default `pnpm verify` skips
the two PostgreSQL migration tests when no test database is configured.
