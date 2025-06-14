import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// --- Internal WSS dev-server (migrated from /desktop-app/server.js) ---
import fs from "fs";
import https from "https";
import { WebSocketServer } from "ws";

function wssDevPlugin() {
  let serverStarted = false;
  return {
    name: "wss-dev-server",
    configureServer() {
      if (serverStarted) return;
      serverStarted = true;

      try {
        const cert = fs.readFileSync("./cert.pem");
        const key = fs.readFileSync("./key.pem");

        const httpsServer = https.createServer({ cert, key }, (req, res) => {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<h1>WebSocket Server Running</h1><p>Certificate accepted!</p>"
          );
        });

        const wss = new WebSocketServer({ server: httpsServer });

        // Keep track of all connected peers
        const peers = new Set();

        wss.on("connection", (ws) => {
          peers.add(ws);
          console.log("VR app connected via WSS");

          ws.on("message", (data) => {
            console.log("From VR:", data.toString());
            try {
              const parsed = JSON.parse(data.toString());
              console.log("Parsed data:", parsed);

              // If this is a stylus data packet, fan it out to everyone
              if (
                parsed &&
                typeof parsed === "object" &&
                parsed.type === "stylus_position"
              ) {
                const payload = JSON.stringify({
                  x: parsed.x,
                  y: parsed.y,
                  z: parsed.z,
                });

                peers.forEach((peer) => {
                  if (peer.readyState === peer.OPEN) {
                    peer.send(payload);
                  }
                });
              } else {
                // Echo back generic response for non–trajectory messages (debug)
                ws.send(
                  JSON.stringify({
                    type: "response",
                    message: "Server received your data",
                    receivedData: parsed,
                  })
                );
              }
            } catch (e) {
              ws.send(`Server received: ${data}`);
            }
          });

          ws.on("close", () => {
            console.log("VR app disconnected");
            peers.delete(ws);
          });
        });

        httpsServer.listen(8443, "0.0.0.0", () => {
          console.log(
            "Secure WebSocket dev-server running on wss://0.0.0.0:8443"
          );
        });
      } catch (err) {
        console.error(
          "[wss-dev-plugin] Failed to start local WSS server (cert/key missing?)",
          err
        );
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wssDevPlugin()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    include: ["plotly.js-dist"],
  },
  resolve: {
    alias: {
      "plotly.js/dist/plotly": "plotly.js",
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
