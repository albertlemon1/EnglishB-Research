#!/usr/bin/env python3
"""Serve the app locally for development: fresh files on every reload, auto-picks
a free port, opens the browser. No dependencies beyond the standard library.

Usage:
  python3 tools/serve.py            # http://localhost:8000 (or next free port)
  python3 tools/serve.py --port 5500
  python3 tools/serve.py --no-open  # don't launch a browser tab
"""
from __future__ import annotations

import argparse
import contextlib
import socket
import sys
import threading
import webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class DevHandler(SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler sends no Cache-Control at all, which lets browsers
    apply their own heuristics and occasionally serve a stale script or lesson
    JSON during development. Disable caching explicitly instead."""

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):  # quieter, keep only the status line
        sys.stderr.write(f"{self.address_string()} - {fmt % args}\n")


def free_port(preferred: int) -> int:
    for port in range(preferred, preferred + 20):
        with contextlib.suppress(OSError), socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", port))
            return port
    raise SystemExit(f"No free port found near {preferred}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--no-open", action="store_true", help="don't open a browser tab")
    args = ap.parse_args()

    port = free_port(args.port)
    handler = lambda *a, **kw: DevHandler(*a, directory=str(ROOT), **kw)  # noqa: E731
    httpd = ThreadingHTTPServer(("127.0.0.1", port), handler)
    url = f"http://localhost:{port}/"

    print(f"Banda B · sirviendo {ROOT} en {url}")
    print("Ctrl+C para detener.")
    if not args.no_open:
        threading.Timer(0.4, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDetenido.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
