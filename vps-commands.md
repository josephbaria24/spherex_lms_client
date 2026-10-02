# VPS commands

Server: `root@148.230.102.22`  
Site: https://spherex.petrosphere.co

Run these in PowerShell on this PC. The key file is `%TEMP%\spherex-vps`. Windows can delete the Temp folder. If login fails, use Hostinger **Web console** instead.

## Log in

```powershell
ssh -i "$env:TEMP\spherex-vps" root@148.230.102.22
```

Leave the server with `exit`.

## Copy a file to the server

```powershell
scp -i "$env:TEMP\spherex-vps" C:\path\to\file root@148.230.102.22:/opt/spherex/
```

## Where the app lives

```bash
ls /opt/spherex/lms-client
ls /opt/spherex/lms-server/src
ls /opt/spherex/lms-server/uploads
```

- `/opt/spherex/lms-client` is the website
- `/opt/spherex/lms-server` is the API
- `/opt/spherex/lms-server/src` is the API source
- `/opt/spherex/lms-server/uploads` is lesson files

## Restart after a code change

```bash
systemctl restart spherex-api spherex-client
systemctl status spherex-api spherex-client
```

`spherex-client` is the website. `spherex-api` is the API.

## Logs

```bash
journalctl -u spherex-api -n 50 --no-pager
journalctl -u spherex-client -n 50 --no-pager
```

## Nginx

Config file: `/etc/nginx/sites-available/spherex`

```bash
nginx -t && systemctl reload nginx
```

Reload Nginx only after a change to that config. Certificate renewal is already scheduled.
