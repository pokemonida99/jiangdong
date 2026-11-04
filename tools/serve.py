# 本機測試伺服器（區分檔名大小寫，和 GitHub Pages 一樣）：python3 tools/serve.py 4560
import http.server, os, sys, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.woff2': 'font/woff2'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store'); super().end_headers()
    def log_message(self, *a): pass
    def send_head(self):
        p = self.translate_path(self.path)
        rel = os.path.relpath(p, os.getcwd())
        cur = '.'
        for part in rel.split(os.sep):
            if part in ('.', ''): continue
            if not os.path.isdir(cur) or part not in os.listdir(cur):
                self.send_error(404); return None
            cur = os.path.join(cur, part)
        return super().send_head()
socketserver.ThreadingTCPServer.allow_reuse_address = True
socketserver.ThreadingTCPServer(('', int(sys.argv[1]) if len(sys.argv) > 1 else 4560), H).serve_forever()
