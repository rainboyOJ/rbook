#!/usr/bin/env python3
"""Refresh the pinned, OFL-licensed Noto Serif SC WOFF2 assets (stdlib only)."""

import base64
import hashlib
import io
import json
from pathlib import Path
import re
import tarfile
import urllib.request

VERSION = "5.3.1"
SOURCE = f"https://registry.npmjs.org/@fontsource/noto-serif-sc/-/noto-serif-sc-{VERSION}.tgz"
INTEGRITY = "sha512-nIK2HyNGcUi2TGwIfrk2MItkh0O3Y5+TI8iPfPSzoNY6uyXYfQ9qqch8czk3aa1VhV4EU52uwCYCe1UDKJELpg=="
DESTINATION = Path(__file__).resolve().parents[1] / "src/public/fonts/noto-serif-sc"


def main():
    with urllib.request.urlopen(SOURCE, timeout=120) as response:
        data = response.read()
    actual = "sha512-" + base64.b64encode(hashlib.sha512(data).digest()).decode()
    if actual != INTEGRITY:
        raise ValueError("Font archive checksum mismatch; no assets written.")

    # Read only the requested members; never extract archive paths to disk.
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as archive:
        css = archive.extractfile("package/400.css").read().decode()
        # Drop legacy WOFF fallbacks; keep the full upstream Unicode coverage.
        css = re.sub(r",\s*url\([^)]*\.woff\) format\('woff'\)", "", css)
        files = list(dict.fromkeys(re.findall(r"url\((\./files/[^)]+\.woff2)\)", css)))
        if not files:
            raise ValueError("No WOFF2 sources found; no assets written.")

        assets = {}
        manifest = []
        for ref in files:
            name = Path(ref).name
            content = archive.extractfile("package/" + ref.removeprefix("./")).read()
            assets[name] = content
            manifest.append({
                "file": name,
                "bytes": len(content),
                "sha256": hashlib.sha256(content).hexdigest(),
            })
            css = css.replace(ref, "./" + name)
        license_text = archive.extractfile("package/LICENSE").read()

    DESTINATION.mkdir(parents=True, exist_ok=True)
    for name, content in assets.items():
        (DESTINATION / name).write_bytes(content)
    (DESTINATION / "400.css").write_text(css, encoding="utf-8")
    (DESTINATION / "LICENSE").write_bytes(license_text)
    (DESTINATION / "manifest.json").write_text(json.dumps({
        "package": "@fontsource/noto-serif-sc",
        "version": VERSION,
        "source": SOURCE,
        "integrity": INTEGRITY,
        "weight": 400,
        "style": "normal",
        "format": "woff2",
        "files": manifest,
    }, indent=2) + "\n", encoding="utf-8")
    size = sum(file["bytes"] for file in manifest)
    print(f"Verified npm integrity; extracted {len(files)} WOFF2 slices, {size:,} bytes.")


if __name__ == "__main__":
    main()
