#!/bin/bash
set -euo pipefail
python3 - <<'PY'
from pathlib import Path
p = Path("/opt/spherex/lms-client/app/courses/page.tsx")
text = p.read_text()
old = 'const [catalogTab, setCatalogTab] = useState("enrolled")'
new = 'const [catalogTab, setCatalogTab] = useState("catalog")'
if old not in text:
    raise SystemExit("default tab line not found")
p.write_text(text.replace(old, new, 1))
print("tab-updated")
PY
cd /opt/spherex/lms-client
npm run build
systemctl restart spherex-client
systemctl is-active spherex-client
