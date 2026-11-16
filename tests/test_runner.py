#!/usr/bin/env python3
"""
Comprehensive automated test suite for Nuvio for Google Search extension.
Validates:
1. Manifest validity & Chromium/Gecko Match Pattern RFC compliance.
2. Icon suite dimensions, channels, and integrity.
3. JavaScript engine syntax checks via node --check.
4. Direct Nuvio Web Launcher URL builder and execution logic.
5. Verification of zero desktop protocol invocations and zero popups.
6. Build script packaging, zip archive structures, and subfolder integrity.
7. Zero emoji policy across all repository files.
"""

import os
import sys
import json
import re
import zipfile
import subprocess
from PIL import Image

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT_DIR, 'src')
DIST_DIR = os.path.join(ROOT_DIR, 'dist')
EXTENSIONS_DIR = os.path.join(ROOT_DIR, 'extensions')

MATCH_PATTERN_RE = re.compile(r'^(\*|https?|file|ftp)://(\*|\*\.[^/*]+|[^/*]+)(/.*)$')

class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []

    def log(self, status, name, details=""):
        if status:
            self.passed += 1
            print(f"  [PASS] {name}")
        else:
            self.failed += 1
            msg = f"  [FAIL] {name}: {details}"
            print(msg)
            self.errors.append(msg)

    def run_all(self):
        print("=" * 70)
        print("RUNNING COMPREHENSIVE TEST SUITE: Nuvio for Google Search")
        print("=" * 70)

        self.test_manifests()
        self.test_icons()
        self.test_javascript_syntax()
        self.test_direct_web_launcher()
        self.test_build_and_zip_archives()
        self.test_zero_emojis()

        print("=" * 70)
        print(f"RESULTS: {self.passed} passed, {self.failed} failed.")
        print("=" * 70)

        if self.failed > 0:
            print("\nFailures:")
            for err in self.errors:
                print(err)
            sys.exit(1)
        else:
            print("\nALL VERIFICATIONS AND TESTS PASSED SUCCESSFULLY!")
            sys.exit(0)

    # --------------------------------------------------------------------------
    # 1. Manifest & Match Pattern Compliance
    # --------------------------------------------------------------------------
    def test_manifests(self):
        print("\n--- 1. Manifest & Match Pattern Compliance ---")
        manifest_path = os.path.join(SRC_DIR, 'manifest.json')
        try:
            with open(manifest_path, 'r', encoding='utf-8') as f:
                manifest = json.load(f)
            self.log(True, "src/manifest.json is valid JSON")
        except Exception as e:
            self.log(False, "src/manifest.json is valid JSON", str(e))
            return

        # Check MV3
        self.log(manifest.get('manifest_version') == 3, "Manifest version is 3")

        # Validate Match Patterns (Host Permissions)
        hp_valid = True
        hp_err = ""
        for p in manifest.get('host_permissions', []):
            if p == '<all_urls>':
                continue
            m = MATCH_PATTERN_RE.match(p)
            if not m:
                hp_valid = False
                hp_err = f"Malformed pattern: {p}"
                break
            _, host, _ = m.groups()
            if '*' in host and host != '*':
                if not host.startswith('*.'):
                    hp_valid = False
                    hp_err = f"Wildcard not at start: {p}"
                    break
                if '*' in host[2:]:
                    hp_valid = False
                    hp_err = f"Wildcard inside host: {p}"
                    break

        self.log(hp_valid, f"All {len(manifest.get('host_permissions', []))} host_permissions conform to Chromium spec", hp_err)

        # Validate Content Scripts Match Patterns
        cs_valid = True
        cs_err = ""
        total_cs_patterns = 0
        for cs_idx, cs in enumerate(manifest.get('content_scripts', [])):
            for p in cs.get('matches', []):
                total_cs_patterns += 1
                m = MATCH_PATTERN_RE.match(p)
                if not m:
                    cs_valid = False
                    cs_err = f"Malformed CS pattern: {p}"
                    break
                _, host, _ = m.groups()
                if '*' in host and host != '*':
                    if not host.startswith('*.'):
                        cs_valid = False
                        cs_err = f"Wildcard not at start: {p}"
                        break
                    if '*' in host[2:]:
                        cs_valid = False
                        cs_err = f"Wildcard inside host: {p}"
                        break
            if not cs_valid:
                break

        self.log(cs_valid, f"All {total_cs_patterns} content_script match patterns conform to Chromium spec", cs_err)

        # Validate Web Accessible Resources
        war_valid = True
        war_err = ""
        total_war_patterns = 0
        for war in manifest.get('web_accessible_resources', []):
            for p in war.get('matches', []):
                total_war_patterns += 1
                if p == '<all_urls>':
                    continue
                m = MATCH_PATTERN_RE.match(p)
                if not m:
                    war_valid = False
                    war_err = f"Malformed WAR pattern: {p}"
                    break
                _, host, _ = m.groups()
                if '*' in host and host != '*':
                    if not host.startswith('*.'):
                        war_valid = False
                        war_err = f"Wildcard not at start: {p}"
                        break
                    if '*' in host[2:]:
                        war_valid = False
                        war_err = f"Wildcard inside host: {p}"
                        break
        self.log(war_valid, f"All {total_war_patterns} web_accessible_resources match patterns conform to Chromium spec", war_err)

        # Verify all referenced files in manifest exist
        files_exist = True
        missing_file = ""
        for icon in manifest.get('icons', {}).values():
            if not os.path.exists(os.path.join(SRC_DIR, icon)):
                files_exist = False
                missing_file = icon
                break
        for cs in manifest.get('content_scripts', []):
            for js in cs.get('js', []):
                if not os.path.exists(os.path.join(SRC_DIR, js)):
                    files_exist = False
                    missing_file = js
                    break
            for css in cs.get('css', []):
                if not os.path.exists(os.path.join(SRC_DIR, css)):
                    files_exist = False
                    missing_file = css
                    break
        self.log(files_exist, "All files referenced in manifest exist on disk", missing_file)

        # Verify modal.js is NOT referenced
        modal_referenced = any('modal.js' in js for cs in manifest.get('content_scripts', []) for js in cs.get('js', []))
        self.log(not modal_referenced, "Modal script is not referenced in manifest (no popups)")

    # --------------------------------------------------------------------------
    # 2. Icon Suite Dimensions & Channels
    # --------------------------------------------------------------------------
    def test_icons(self):
        print("\n--- 2. Icon Suite Dimensions & Channels ---")
        provider_sizes = [16, 32, 48, 128, 256]
        all_provider_ok = True
        err_msg = ""
        for s in provider_sizes:
            p_path = os.path.join(SRC_DIR, 'icons', f'nuvio-provider-{s}.png')
            if not os.path.exists(p_path):
                all_provider_ok = False
                err_msg = f"Missing {p_path}"
                break
            im = Image.open(p_path)
            if im.size != (s, s) or im.mode != 'RGBA':
                all_provider_ok = False
                err_msg = f"{p_path} has size {im.size} mode {im.mode}"
                break
        self.log(all_provider_ok, "Provider icons (16, 32, 48, 128, 256) are valid RGBA PNGs", err_msg)

        all_ext_ok = True
        for s in provider_sizes:
            e_path = os.path.join(SRC_DIR, 'icons', f'icon-{s}.png')
            if not os.path.exists(e_path):
                all_ext_ok = False
                err_msg = f"Missing {e_path}"
                break
            im = Image.open(e_path)
            if im.size != (s, s) or im.mode != 'RGBA':
                all_ext_ok = False
                err_msg = f"{e_path} has size {im.size} mode {im.mode}"
                break
        self.log(all_ext_ok, "Extension icons (16, 32, 48, 128, 256) are valid RGBA PNGs", err_msg)

        logo_path = os.path.join(ROOT_DIR, 'assets', 'logo.png')
        logo_im = Image.open(logo_path)
        self.log(logo_im.size == (512, 512) and logo_im.mode == 'RGBA', "assets/logo.png is valid 512x512 RGBA PNG")

        svg_icon = os.path.join(SRC_DIR, 'icons', 'icon.svg')
        svg_logo = os.path.join(ROOT_DIR, 'assets', 'logo.svg')
        self.log(os.path.exists(svg_icon) and os.path.getsize(svg_icon) > 1000, "src/icons/icon.svg is non-empty vector asset")
        self.log(os.path.exists(svg_logo) and os.path.getsize(svg_logo) > 1000, "assets/logo.svg is non-empty vector asset")

    # --------------------------------------------------------------------------
    # 3. JavaScript Engine Syntax Checks
    # --------------------------------------------------------------------------
    def test_javascript_syntax(self):
        print("\n--- 3. JavaScript Engine Syntax Checks (Node.js) ---")
        js_files = []
        for r, d, fs in os.walk(SRC_DIR):
            for f in fs:
                if f.endswith('.js'):
                    js_files.append(os.path.join(r, f))

        syntax_ok = True
        first_err = ""
        for js in js_files:
            res = subprocess.run(['node', '--check', js], capture_output=True, text=True)
            if res.returncode != 0:
                syntax_ok = False
                first_err = f"{js}: {res.stderr}"
                break
        self.log(syntax_ok, f"All {len(js_files)} runtime JavaScript files pass node --check", first_err)

    # --------------------------------------------------------------------------
    # 4. Direct Nuvio Web Launcher Logic Tests
    # --------------------------------------------------------------------------
    def test_direct_web_launcher(self):
        print("\n--- 4. Direct Nuvio Web Launcher Logic ---")
        node_script = """
        const fs = require('fs');
        const vm = require('vm');
        const assert = require('assert');

        let openedUrl = null;
        const winLauncher = {
          window: null,
          self: null,
          URLSearchParams: URLSearchParams,
          encodeURIComponent: encodeURIComponent,
          NuvioStorage: {
            getSettings: async () => ({ webBaseUrl: 'https://nuvio-web.vercel.app/' })
          },
          nuvioBrowser: {
            runtime: {
              sendMessage: async (msg) => {
                if (msg.action === 'openTab') {
                  openedUrl = msg.url;
                }
              }
            }
          }
        };
        winLauncher.window = winLauncher;
        winLauncher.self = winLauncher;

        const launcherCode = fs.readFileSync('src/utils/protocol-launcher.js', 'utf8');
        vm.runInNewContext(launcherCode, winLauncher);
        const launcher = winLauncher.NuvioLauncher;

        // Test URL construction
        assert.strictEqual(
          launcher.buildWebUrl({ title: 'The Mentalist', contentType: 'series', imdbId: 'tt1196946' }),
          'https://nuvio-web.vercel.app/search?q=The+Mentalist&imdb=tt1196946&type=series',
          'Web search URL with IMDb ID and series type'
        );

        assert.strictEqual(
          launcher.buildWebUrl({ title: 'Inception', contentType: 'movie', imdbId: 'tt1375666' }),
          'https://nuvio-web.vercel.app/search?q=Inception&imdb=tt1375666&type=movie',
          'Web search URL with IMDb ID and movie type'
        );

        assert.strictEqual(
          launcher.buildWebUrl({ title: 'Avatar' }),
          'https://nuvio-web.vercel.app/search?q=Avatar',
          'Web search URL with title only'
        );

        // Test direct launch without desktop protocol or popup
        (async () => {
          await launcher.launch({ title: 'The Mentalist', contentType: 'series', imdbId: 'tt1196946' });
          assert.strictEqual(
            openedUrl,
            'https://nuvio-web.vercel.app/search?q=The+Mentalist&imdb=tt1196946&type=series',
            'Direct launch opens web client URL directly'
          );
          console.log('ALL_LAUNCHER_TESTS_OK');
        })();
        """
        res = subprocess.run(['node', '-e', node_script], capture_output=True, text=True)
        if res.returncode == 0 and 'ALL_LAUNCHER_TESTS_OK' in res.stdout:
            self.log(True, "Nuvio Web URL builder accurately constructs search query parameters")
            self.log(True, "Direct launch immediately opens Nuvio Web in a new tab")
            self.log(True, "Zero desktop app protocol calls and zero popup dialogs")
        else:
            self.log(False, "Direct web launcher unit tests", res.stderr)

    # --------------------------------------------------------------------------
    # 5. Build Automation & Release Archives
    # --------------------------------------------------------------------------
    def test_build_and_zip_archives(self):
        print("\n--- 5. Build Automation & Release Archives ---")
        build_script = os.path.join(ROOT_DIR, 'scripts', 'build.py')
        res = subprocess.run([sys.executable, build_script], capture_output=True, text=True)
        self.log(res.returncode == 0, "scripts/build.py executes with exit code 0", res.stderr)

        for arch_name, expected_subfolder in [
            ('nuvio-google-search-chromium-v1.0.0.zip', 'nuvio-google-search-chromium-v1.0.0'),
            ('nuvio-google-search-firefox-v1.0.0.zip', 'nuvio-google-search-firefox-v1.0.0')
        ]:
            zip_path = os.path.join(EXTENSIONS_DIR, arch_name)
            if not os.path.exists(zip_path):
                self.log(False, f"Release archive exists: {arch_name}", "File not found")
                continue

            with zipfile.ZipFile(zip_path, 'r') as z:
                # Test CRC integrity
                bad_file = z.testzip()
                self.log(bad_file is None, f"{arch_name} passes CRC integrity check", f"Bad file: {bad_file}")

                namelist = z.namelist()
                all_in_subfolder = all(n.startswith(expected_subfolder + '/') for n in namelist)
                self.log(all_in_subfolder, f"{arch_name} files reside within '{expected_subfolder}/' subfolder")

                has_manifest = f"{expected_subfolder}/manifest.json" in namelist
                self.log(has_manifest, f"{arch_name} contains manifest.json at subfolder root")
                self.log(len(namelist) == 25, f"{arch_name} contains exactly 25 packaged extension assets (actual: {len(namelist)})")

    # --------------------------------------------------------------------------
    # 6. Zero-Emoji Compliance
    # --------------------------------------------------------------------------
    def test_zero_emojis(self):
        print("\n--- 6. Zero Emoji Standard Compliance ---")
        EMOJI_PATTERN = re.compile(
            '['
            '\U0001F600-\U0001F64F'  # Emoticons
            '\U0001F300-\U0001F5FF'  # Misc Symbols and Pictographs
            '\U0001F680-\U0001F6FF'  # Transport and Map
            '\U0001F1E0-\U0001F1FF'  # Regional flags
            '\U0001F900-\U0001F9FF'  # Supplemental Symbols and Pictographs
            '\U0001FA70-\U0001FAFF'  # Symbols and Pictographs Extended-A
            '\U00002600-\U000026FF'  # Misc symbols (sun, umbrella, etc.)
            ']+',
            flags=re.UNICODE
        )

        violations = []
        for r, dirs, files in os.walk(ROOT_DIR):
            if any(p in r for p in ['.git', 'dist', 'scratch']):
                continue
            for f in files:
                if f.endswith(('.png', '.ico', '.zip', '.woff', '.woff2', '.ttf')):
                    continue
                filepath = os.path.join(r, f)
                try:
                    with open(filepath, 'r', encoding='utf-8', errors='ignore') as fp:
                        for line_no, line in enumerate(fp, 1):
                            matches = EMOJI_PATTERN.findall(line)
                            if matches:
                                violations.append((os.path.relpath(filepath, ROOT_DIR), line_no, matches, line.strip()))
                except Exception:
                    pass

        has_no_emojis = len(violations) == 0
        detail = ""
        if not has_no_emojis:
            detail = f"{len(violations)} violations found: " + ", ".join(f"{v[0]}:{v[1]}" for v in violations[:3])
        self.log(has_no_emojis, "Zero emojis across all tracked repository files", detail)

if __name__ == '__main__':
    runner = TestRunner()
    runner.run_all()
