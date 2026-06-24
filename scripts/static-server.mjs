// Minimal static server for previewing docs/ (Node, since python http.server is sandboxed).
import http from "http";
import fs from "fs";
import path from "path";

const root = path.resolve("docs");
const port = Number(process.env.PORT) || 8099;
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    const file = path.join(root, p);
    if (!file.startsWith(root)) { res.writeHead(403); return res.end("forbidden"); }
    fs.readFile(file, (err, data) => {
      if (err) { res.writeHead(404); return res.end("404"); }
      res.writeHead(200, { "content-type": types[path.extname(file)] || "application/octet-stream" });
      res.end(data);
    });
  })
  .listen(port, () => console.log(`serving docs/ on http://127.0.0.1:${port}`));
