const fs = require("fs"),
  http = require("http");

http
  .createServer(function(req, res) {
    fs.readFile(process.cwd() + req.url, function(err, data) {
      if (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
        return;
      }
      if (req.url.endsWith(".js")) res.setHeader("Content-Type", "text/javascript");
      if (req.url.endsWith(".css")) res.setHeader("Content-Type", "text/css");
      res.writeHead(200);
      res.end(data);
    });
  })
  .listen(8080);

console.log("localhost:8080/docs/examples/index.html");
