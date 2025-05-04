#!/usr/bin/env python3

import http.server
import socketserver
import os
import time
from pathlib import Path

PORT = 5000

# Custom HTTP request handler with cache-busting headers
class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add cache-busting headers to prevent the browser from caching responses
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Add timestamp to log messages
        current_time = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        print(f"[{current_time}] {self.address_string()} - {format % args}")

# Set up request handler
Handler = NoCacheHTTPRequestHandler

# Make the server accessible from outside
with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"\n--- No-cache server starting ---")
    print(f"Server running at http://0.0.0.0:{PORT}/")
    print(f"Local files will not be cached by the browser")
    print(f"Press Ctrl+C to stop the server\n")
    httpd.serve_forever()
