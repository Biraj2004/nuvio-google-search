#!/usr/bin/env python3
"""
Build and packaging script for Nuvio for Google Search extension.
Validates assets, generates Chromium and Firefox distributions, and builds
release-ready zip archives inside the 'extensions/' directory with internal subfolders.
"""

import os
import sys
import json
import shutil
import zipfile
import re

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT_DIR, 'src')
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
CHROMIUM_DIST = os.path.join(DIST_DIR, 'chromium')
FIREFOX_DIST = os.path.join(DIST_DIR, 'firefox')
RELEASES_DIR = os.path.join(DIST_DIR, 'releases')
EXTENSIONS_DIR = os.path.join(ROOT_DIR, 'extensions')

MATCH_PATTERN_RE = re.compile(r'^(\*|https?|file|ftp)://(\*|\*\.[^/*]+|[^/*]+)(/.*)$')

def log(msg):
    print(f"[build] {msg}")

def validate_match_pattern(pattern, context):
    if pattern == '<all_urls>':
        return
    m = MATCH_PATTERN_RE.match(pattern)
    if not m:
        raise ValueError(f"Malformed match pattern in {context}: '{pattern}'")
    _, host, _ = m.groups()
    if '*' in host and host != '*':
        if not host.startswith('*.'):
            raise ValueError(f"Invalid host wildcard in {context}: '{pattern}' (wildcard must be at start, e.g. '*.domain.com')")
        if '*' in host[2:]:
            raise ValueError(f"Invalid host wildcard in {context}: '{pattern}' (multiple or trailing wildcards not allowed)")

def validate_source():
    manifest_path = os.path.join(SRC_DIR, 'manifest.json')
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Manifest not found at {manifest_path}")

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    log(f"Validating manifest: {manifest.get('name')} v{manifest.get('version')}")

    # Validate all host permissions match patterns
    for p in manifest.get('host_permissions', []):
        validate_match_pattern(p, 'host_permissions')

    # Check extension and provider icons
    for size, rel_path in manifest.get('icons', {}).items():
        full_path = os.path.join(SRC_DIR, rel_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Icon missing: {full_path}")

    for p_size in [16, 32, 48, 128, 256]:
        provider_icon_path = os.path.join(SRC_DIR, 'icons', f'nuvio-provider-{p_size}.png')
        if not os.path.exists(provider_icon_path):
            raise FileNotFoundError(f"Provider icon missing: {provider_icon_path}")

    # Check background script
    bg_worker = manifest.get('background', {}).get('service_worker')
    if bg_worker:
        full_path = os.path.join(SRC_DIR, bg_worker)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Background worker missing: {full_path}")

    # Check content scripts and match patterns
    for cs_idx, cs in enumerate(manifest.get('content_scripts', [])):
        for m_idx, pattern in enumerate(cs.get('matches', [])):
            validate_match_pattern(pattern, f"content_scripts[{cs_idx}].matches[{m_idx}]")
        for js_file in cs.get('js', []):
            full_path = os.path.join(SRC_DIR, js_file)
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"Content script missing: {full_path}")
        for css_file in cs.get('css', []):
            full_path = os.path.join(SRC_DIR, css_file)
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"Content stylesheet missing: {full_path}")

    # Check web_accessible_resources match patterns
    for war_idx, war in enumerate(manifest.get('web_accessible_resources', [])):
        for m_idx, pattern in enumerate(war.get('matches', [])):
            validate_match_pattern(pattern, f"web_accessible_resources[{war_idx}].matches[{m_idx}]")

    # Check popup and options
    popup_path = manifest.get('action', {}).get('default_popup')
    if popup_path:
        full_path = os.path.join(SRC_DIR, popup_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Popup missing: {full_path}")

    options_path = manifest.get('options_ui', {}).get('page')
    if options_path:
        full_path = os.path.join(SRC_DIR, options_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Options page missing: {full_path}")

    log("Validation successful! All referenced assets, scripts, and match patterns are valid.")
    return manifest

def build_chromium(manifest):
    log("Building Chromium distribution (Chrome, Brave, Opera, Edge)...")
    if os.path.exists(CHROMIUM_DIST):
        shutil.rmtree(CHROMIUM_DIST)
    shutil.copytree(SRC_DIR, CHROMIUM_DIST)
    log(f"Chromium dist ready at {CHROMIUM_DIST}")

def build_firefox(manifest):
    log("Building Firefox distribution (Gecko MV3)...")
    if os.path.exists(FIREFOX_DIST):
        shutil.rmtree(FIREFOX_DIST)
    shutil.copytree(SRC_DIR, FIREFOX_DIST)

    # Firefox-specific manifest adjustments
    ff_manifest_path = os.path.join(FIREFOX_DIST, 'manifest.json')
    ff_manifest = json.loads(json.dumps(manifest))

    # Add browser_specific_settings for Firefox
    ff_manifest['browser_specific_settings'] = {
        'gecko': {
            'id': 'nuvio-google-search@nuvio.tv',
            'strict_min_version': '109.0'
        }
    }

    # In Firefox MV3 background, scripts array is standard
    ff_manifest['background'] = {
        'scripts': ['background/service-worker.js']
    }

    with open(ff_manifest_path, 'w', encoding='utf-8') as f:
        json.dump(ff_manifest, f, indent=2)

    log(f"Firefox dist ready at {FIREFOX_DIST}")

def create_zip(source_dir, output_zip, subfolder_name=None):
    os.makedirs(os.path.dirname(output_zip), exist_ok=True)
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, source_dir)
                # Store inside a dedicated subfolder so extracting produces a clean self-contained directory
                arcname = os.path.join(subfolder_name, rel_path) if subfolder_name else rel_path
                # Normalize slashes for zip compatibility across operating systems
                arcname = arcname.replace('\\', '/')
                zipf.write(file_path, arcname)
    log(f"Created release archive: {output_zip} ({os.path.getsize(output_zip)} bytes)")

def main():
    log("Starting build process...")
    manifest = validate_source()

    os.makedirs(DIST_DIR, exist_ok=True)
    os.makedirs(RELEASES_DIR, exist_ok=True)
    os.makedirs(EXTENSIONS_DIR, exist_ok=True)

    build_chromium(manifest)
    build_firefox(manifest)

    version = manifest.get('version', '1.0.0')

    # Subfolder names inside zip archives
    chrome_subfolder = f"nuvio-google-search-chromium-v{version}"
    firefox_subfolder = f"nuvio-google-search-firefox-v{version}"

    # Target zip names
    chrome_zip_name = f"nuvio-google-search-chromium-v{version}.zip"
    firefox_zip_name = f"nuvio-google-search-firefox-v{version}.zip"

    # Save release archives inside extensions/ directory
    ext_chrome_zip = os.path.join(EXTENSIONS_DIR, chrome_zip_name)
    ext_firefox_zip = os.path.join(EXTENSIONS_DIR, firefox_zip_name)

    create_zip(CHROMIUM_DIST, ext_chrome_zip, subfolder_name=chrome_subfolder)
    create_zip(FIREFOX_DIST, ext_firefox_zip, subfolder_name=firefox_subfolder)

    # Also sync copy to dist/releases
    shutil.copy2(ext_chrome_zip, os.path.join(RELEASES_DIR, chrome_zip_name))
    shutil.copy2(ext_firefox_zip, os.path.join(RELEASES_DIR, firefox_zip_name))

    log(f"Release archives successfully updated in {EXTENSIONS_DIR}")
    log("Build completed successfully!")

if __name__ == '__main__':
    main()
