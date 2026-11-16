#!/usr/bin/env python3
"""
Build and packaging script for Nuvio for Google Search extension.
Validates assets, generates Chromium and Firefox distributions, and builds zip archives.
"""

import os
import sys
import json
import shutil
import zipfile

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT_DIR, 'src')
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
CHROMIUM_DIST = os.path.join(DIST_DIR, 'chromium')
FIREFOX_DIST = os.path.join(DIST_DIR, 'firefox')
RELEASES_DIR = os.path.join(DIST_DIR, 'releases')

def log(msg):
    print(f"[build] {msg}")

def validate_source():
    manifest_path = os.path.join(SRC_DIR, 'manifest.json')
    if not os.path.exists(manifest_path):
        raise FileNotFoundError(f"Manifest not found at {manifest_path}")

    with open(manifest_path, 'r', encoding='utf-8') as f:
        manifest = json.load(f)

    log(f"Validating manifest: {manifest.get('name')} v{manifest.get('version')}")

    # Check icons
    for size, rel_path in manifest.get('icons', {}).items():
        full_path = os.path.join(SRC_DIR, rel_path)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Icon missing: {full_path}")

    # Check background script
    bg_worker = manifest.get('background', {}).get('service_worker')
    if bg_worker:
        full_path = os.path.join(SRC_DIR, bg_worker)
        if not os.path.exists(full_path):
            raise FileNotFoundError(f"Background worker missing: {full_path}")

    # Check content scripts
    for cs in manifest.get('content_scripts', []):
        for js_file in cs.get('js', []):
            full_path = os.path.join(SRC_DIR, js_file)
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"Content script missing: {full_path}")
        for css_file in cs.get('css', []):
            full_path = os.path.join(SRC_DIR, css_file)
            if not os.path.exists(full_path):
                raise FileNotFoundError(f"Content stylesheet missing: {full_path}")

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

    log("Validation successful! All referenced assets and scripts exist.")
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

def create_zip(source_dir, output_zip):
    os.makedirs(os.path.dirname(output_zip), exist_ok=True)
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(source_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
    log(f"Created archive: {output_zip} ({os.path.getsize(output_zip)} bytes)")

def main():
    log("Starting build process...")
    manifest = validate_source()

    os.makedirs(DIST_DIR, exist_ok=True)
    os.makedirs(RELEASES_DIR, exist_ok=True)

    build_chromium(manifest)
    build_firefox(manifest)

    version = manifest.get('version', '1.0.0')
    chrome_zip = os.path.join(RELEASES_DIR, f"nuvio-google-search-chromium-v{version}.zip")
    firefox_zip = os.path.join(RELEASES_DIR, f"nuvio-google-search-firefox-v{version}.zip")

    create_zip(CHROMIUM_DIST, chrome_zip)
    create_zip(FIREFOX_DIST, firefox_zip)

    log("Build completed successfully!")

if __name__ == '__main__':
    main()
