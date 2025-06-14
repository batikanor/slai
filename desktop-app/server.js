// server.js
const { WebSocketServer } = require("ws");
const https = require("https");
const fs = require("fs");

const server = https.createServer(
  {
    cert: fs.readFileSync("./cert.pem"),
    key: fs.readFileSync("./key.pem"),
  },
  (req, res) => {
    // Add a simple HTTP response to help with certificate acceptance
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>WebSocket Server Running</h1><p>Certificate accepted!</p>");
  }
);

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("VR app connected via WSS");

  ws.on("message", (data) => {
    console.log("From VR:", data.toString());
    try {
      const parsed = JSON.parse(data.toString());
      console.log("Parsed data:", parsed);

      // Send a proper JSON response
      ws.send(
        JSON.stringify({
          type: "response",
          message: "Server received your data",
          receivedData: parsed,
        })
      );
    } catch (e) {
      ws.send(`Server received: ${data}`);
    }
  });

  ws.on("close", () => {
    console.log("VR app disconnected");
  });
});

// Listen on all interfaces, not just localhost
server.listen(8443, "0.0.0.0", () => {
  console.log("Secure WebSocket server running on wss://0.0.0.0:8443");
  //console.log('Access via: https://192.168.26.162:8443');
});
