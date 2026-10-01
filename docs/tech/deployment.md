# School Ubuntu VM deployment

The current deployment serves **only `prod`** over public **HTTP** from Ubuntu 24.04. GitHub Actions runs `pnpm verify` and packages `apps/client/dist`. It uploads this package over SSH. It checks the contents before promotion to an immutable release. Projects save in each browser's IndexedDB.

The VM needs Nginx, Python, rsync, and OpenSSH. Runtime deployment does not require Node, pnpm, Fastify, or PostgreSQL. The workflow also verifies all pull requests and pushes to `main` and `stage`. It does not deploy these branches. CI uses Node 24 and the pnpm version from `package.json`.

Keep the Ubuntu SSH session open. Use a **second local PowerShell window** for Windows checks. After `ssh` connects, commands in that terminal run on the **Ubuntu VM**. The terminal can still have a Windows window frame. PowerShell windows do not share variables. Repeat the three variable assignments from step 1 in the second local window. Keep the step 2 Bash variables available in the SSH session.

## 1. Prepare the workstation

Replace the IP address. Replace the admin username. Replace the public SSH port. Use the VM's externally reachable IPv4 address.

```powershell
# Run on Windows PC (PowerShell), from the repository root.
$vmAddress = "YOUR_PUBLIC_IPV4"
$vmAdmin = "YOUR_EXISTING_ADMIN_USERNAME"
$vmSshPort = 22

Test-NetConnection $vmAddress -Port $vmSshPort
ssh-keygen -t ed25519 -C "fleet-prod-ci" -f "$env:USERPROFILE\.ssh\fleet-prod-ci"
```

**Leave the deployment key passphrase empty.** Press Enter at the passphrase prompt. Press Enter again at the confirmation prompt. GitHub Actions must load this key without user input. A key with a passphrase causes deployment to fail with `Permission denied (publickey,password)`.

This key authenticates a dedicated deployment account. It is separate from the admin account. Use a new filename if the key filename already exists.

Copy the deployment files to the VM. Copy the **public** key to the VM. These steps do not require a code commit or push. VM setup can occur before the first deployment.

```powershell
# Run on Windows PC (PowerShell), from the repository root.
scp -P $vmSshPort -r ./deploy "${vmAdmin}@${vmAddress}:~/fleet-deployment"
scp -P $vmSshPort "$env:USERPROFILE\.ssh\fleet-prod-ci.pub" "${vmAdmin}@${vmAddress}:~/fleet-prod-ci.pub"
# This opens your Ubuntu VM SSH session.
ssh -p $vmSshPort "${vmAdmin}@${vmAddress}"
```

## 2. Install VM packages and create the deployment account

Replace `YOUR_PUBLIC_IPV4` below. `SSH_PORT` is the VM's SSH listener port. School NAT can translate this port. The public port in GitHub can then differ from `SSH_PORT`.

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

Do not add `fleet-deploy` to sudoers. The SSH key option `restrict` disables forwarding and PTYs. It permits SCP/SFTP and release commands.

## 3. Configure HTTP and the firewall

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

The school's upstream firewall/NAT must permit public TCP **80** and the public SSH port. UFW controls only the VM. This initial HTTP deployment requires no TLS/certificate setup.

Before the first release, `/` and `/version.json` return **503**. This result shows that Nginx is reachable but no release exists.

```powershell
# Run on Windows PC (PowerShell), in a local window with the step 1 variables.
curl.exe -I "http://$vmAddress/"
ssh -i "$env:USERPROFILE\.ssh\fleet-prod-ci" -p $vmSshPort "fleet-deploy@${vmAddress}" "id"
```

The SSH test starts from Windows. It runs `id` remotely on the Ubuntu VM.

## 4. Record the VM SSH host key

Print the server key and fingerprint through the existing admin connection on the VM. Copy the matching host entry into GitHub. Do not trust an unverified key that CI discovers.

```bash
# Run on Ubuntu VM (Bash), in your admin SSH session.
sudo ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
printf '%s ' "$SITE_HOST"
sudo cat /etc/ssh/ssh_host_ed25519_key.pub
```

For public SSH port 22, the host entry has this format. This is example output for GitHub. It is not a command.

```text
YOUR_PUBLIC_IPV4 ssh-ed25519 AAAAC3... server-comment
```

For another public SSH port, use `[YOUR_PUBLIC_IPV4]:PUBLIC_SSH_PORT` as the first field. The key and fingerprint remain the same.

## 5. Configure the GitHub prod environment

Perform these steps in **GitHub in a browser on Windows**.

1. Open [repository settings](https://github.com/The-Sims-Digipen/Fleet-Project/settings/environments).
2. Create an environment named **`prod`**.
3. Set deployment branches to **Selected branches and tags**.
4. Add the branch rule **`prod`**.
5. Leave required reviewers unset for automatic deployment.

Add these **environment variables**:

| Variable | Value |
|---|---|
| `VM_HOST` | Externally reachable VM IPv4 address |
| `VM_SSH_PORT` | Public SSH port, usually `22` |
| `SITE_HOST` | Same IPv4 address for the initial HTTP site |
| `SITE_SCHEME` | `http` |

Add these **environment secrets**:

| Secret | Value |
|---|---|
| `VM_SSH_KEY` | Complete private key, including BEGIN/END lines |
| `VM_KNOWN_HOSTS` | Verified host-key entry from step 4 |

Read the private key locally for the GitHub secret form:

```powershell
# Run on Windows PC (PowerShell), in your local window.
Get-Content -Raw "$env:USERPROFILE\.ssh\fleet-prod-ci"
```

Paste the key directly into `VM_SSH_KEY` in GitHub. The VM receives only the public key. The workflow keeps SSH host key checks enabled.

## 6. Deploy prod

Complete VM setup first. Complete GitHub settings first. Commit the codebase changes from **PowerShell in the local Windows repository**. Merge the branch into **`prod`** through the normal review process in **GitHub**.

The push starts **CI and production deployment**. Require the **Verify** PR check in branch protection. Protection of `prod` requires reviewed code before deployment to the VM.

The pipeline typechecks, tests, and builds the complete workspace. It tests release failure recovery. It packages only the production client. Deployment uses that exact artifact and its SHA256. It does not build the client again on the VM. The workflow skips superseded `prod` commits before upload. It does not cancel production runs during promotion.

GitHub Actions performs the build and upload steps automatically. The workflow runs the release command on the Ubuntu VM as `fleet-deploy`.

Each release has the ID `RUN_ID-RUN_ATTEMPT-COMMIT_SHA`. It includes `version.json`. The directories have this structure:

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

The release command locks the site. It verifies the checksum and package. It publishes assets. It then switches `current` atomically. It checks served HTML, version, and JavaScript through Nginx on loopback with the configured Host header.

A failed VM smoke check restores the previous symlink. The final GitHub step checks the public version endpoint separately. A public-network failure marks the run as failed. It does not undo a release that passed VM checks.

```bash
# Run on Ubuntu VM (Bash), to check the deployed version.
curl --fail "http://$SITE_HOST/version.json"
readlink /srv/fleet/prod/current
```

Perform this browser check on **Windows**:

1. Open `http://YOUR_PUBLIC_IPV4/`.
2. Create a Project.
3. Add a Vehicle.
4. Save the Project.
5. Reload the page.
6. Use **Open project** to reopen the saved Project.
7. Confirm that its fleet and 3D view return.
8. Duplicate a Scenario.
9. Change the selected year on its timeline.

This check validates the VM/browser path beyond CI tests.

The UUID helper uses `crypto.getRandomValues()` over HTTP when `crypto.randomUUID()` is unavailable. See the [browser API reference](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues).

Correct VM/settings issues before another run. Run the failed `prod` workflow again. Manual `workflow_dispatch` is also available. GitHub shows **Run workflow** after the workflow file exists on the default branch `main`. Select `prod` for a manual deployment. A run on another branch verifies that branch without deployment.

## Rollback and maintenance

```bash
# Run on Ubuntu VM (Bash), to roll back immediately.
sudo -u fleet-deploy /usr/local/bin/fleet-release rollback prod previous
```

Alternatively, select an existing full release ID:

```bash
# Run on Ubuntu VM (Bash).
# Replace the release ID placeholder with an ID from the listing.
ls -1 /srv/fleet/prod/releases
sudo -u fleet-deploy /usr/local/bin/fleet-release rollback prod RUN_ID-RUN_ATTEMPT-COMMIT_SHA
```

Rollback uses the same checks for served files. The next automatic deployment can replace a manual rollback. Revert the bad commit on `prod` for a permanent rollback.

The deployment retains releases and shared assets.

```bash
# Run on Ubuntu VM (Bash), to monitor disk space.
du -sh /srv/fleet/prod
df -h /srv/fleet
```

Check the `current` link before removal of an old release. Check the `previous` link before removal of an old release. Retain shared assets while older browser tabs can reference them.

After a change to `deploy/release.sh`:

1. Copy the file from **Windows PowerShell** to the VM.
2. Reinstall it from **Ubuntu Bash** with the step 2 `sudo install` command.

After a change to the Nginx template:

1. Generate the configuration again from **Ubuntu Bash**.
2. Run `nginx -t` from **Ubuntu Bash**.
3. Reload Nginx from **Ubuntu Bash**.

The administrator installs these root-owned files. Application deployment does not overwrite them. Current deployment does not publish `stage` or `main` sites.

The current site uses HTTP. A scheme or hostname change creates a different browser origin. IndexedDB belongs to an origin. HTTP and HTTPS therefore have separate browser storage. For a change to the public scheme or hostname:

1. Export Projects from the old origin.
2. Import the exported files on the new origin.

```bash
# Run on Ubuntu VM (Bash), for deployment diagnostics.
sudo nginx -t
sudo systemctl status nginx --no-pager
sudo tail -n 50 /var/log/nginx/error.log
sudo ss -lntp
```

Confirm VM installation on the school VM. Confirm public access to the school VM. Local verification does not configure or test that machine. Default `pnpm verify` skips the two PostgreSQL migration tests when no test database is configured.
