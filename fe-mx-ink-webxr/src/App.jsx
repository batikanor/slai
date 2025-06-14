import { useEffect, useRef, useState } from "react";
import "./App.css";
import AudioEqualizer from "./AudioEqualizer";
import { MOCKING as DEFAULT_MOCKING, PEN_BACKEND_PORT } from "./config";
import {
  generateMockTrajectoryData,
  generateStreamingMockData,
} from "./mockDataGenerator";
import TrajectoryPlot from "./TrajectoryPlot";

function App() {
  const [trajectoryData, setTrajectoryData] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamIndex, setStreamIndex] = useState(0);
  const [timeWindow, setTimeWindow] = useState(30); // Default 30 seconds
  const [showAllData, setShowAllData] = useState(false);
  const [isMockMode, setIsMockMode] = useState(DEFAULT_MOCKING);
  const [wsStatus, setWsStatus] = useState("disconnected"); // 'disconnected', 'connecting', 'connected', 'error'
  const wsRef = useRef(null);
  const dataIndexRef = useRef(0);

  // Initialize data when switching to mock mode
  useEffect(() => {
    if (isMockMode) {
      // Initialize with some mock data
      const initialData = generateMockTrajectoryData(100);
      setTrajectoryData(initialData);
      setStreamIndex(initialData.length);
      dataIndexRef.current = initialData.length;
    }
  }, [isMockMode]);

  // WebSocket connection management
  useEffect(() => {
    if (!isMockMode && isStreaming) {
      // Connect to WebSocket
      const wsUrl = `ws://localhost:${PEN_BACKEND_PORT}`;
      console.log(`Connecting to WebSocket at ${wsUrl}`);
      setWsStatus("connecting");

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          setWsStatus("connected");
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Expecting data in format: { x: number, y: number, z: number }
            if (
              data.x !== undefined &&
              data.y !== undefined &&
              data.z !== undefined
            ) {
              const newPoint = {
                x: data.x,
                y: data.y,
                z: data.z,
                timestamp: Date.now(),
                index: dataIndexRef.current++,
              };

              setTrajectoryData((prev) => {
                // Keep only last 200 points for performance
                const updated = [...prev, newPoint];
                return updated.length > 200 ? updated.slice(-200) : updated;
              });
            }
          } catch (error) {
            console.error("Error parsing WebSocket data:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setWsStatus("error");
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected");
          setWsStatus("disconnected");
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        setWsStatus("error");
      }

      // Cleanup function
      return () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      };
    }
  }, [isMockMode, isStreaming]);

  // Mock data streaming
  useEffect(() => {
    if (isStreaming && isMockMode) {
      const interval = setInterval(() => {
        const newPoint = generateStreamingMockData(streamIndex);
        setTrajectoryData((prev) => {
          // Keep only last 200 points for performance
          const updated = [...prev, newPoint];
          return updated.length > 200 ? updated.slice(-200) : updated;
        });
        setStreamIndex((prev) => prev + 1);
      }, 100); // Update every 100ms

      return () => clearInterval(interval);
    }
  }, [isStreaming, streamIndex, isMockMode]);

  const handleStartStreaming = () => {
    setIsStreaming(true);
  };

  const handleStopStreaming = () => {
    setIsStreaming(false);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  };

  const handleReset = () => {
    if (isMockMode) {
      const newData = generateMockTrajectoryData(100);
      setTrajectoryData(newData);
      setStreamIndex(newData.length);
      dataIndexRef.current = newData.length;
    } else {
      setTrajectoryData([]);
      dataIndexRef.current = 0;
    }
    setIsStreaming(false);
  };

  const handleToggleMockMode = () => {
    // Stop streaming when switching modes
    if (isStreaming) {
      handleStopStreaming();
    }
    setIsMockMode(!isMockMode);
    // Clear data when switching modes
    setTrajectoryData([]);
    dataIndexRef.current = 0;
  };

  const handleTimeWindowChange = (event) => {
    const value = parseInt(event.target.value);
    if (value === 301) {
      setShowAllData(true);
    } else {
      setShowAllData(false);
      setTimeWindow(value);
    }
  };

  // Filter data based on time window
  const getFilteredData = () => {
    if (showAllData || trajectoryData.length === 0) {
      return trajectoryData;
    }

    const currentTime = Date.now();
    const windowMs = timeWindow * 1000; // Convert seconds to milliseconds

    return trajectoryData.filter((point) => {
      return currentTime - point.timestamp <= windowMs;
    });
  };

  const filteredData = getFilteredData();

  return (
    <div className="app">
      <header className="app-header">
        <h1>SLAI: Simple Adjustments with AI</h1>
        <div className="status-indicator">
          <button
            className={`mode-toggle ${isMockMode ? "mock" : "live"}`}
            onClick={handleToggleMockMode}
          >
            {isMockMode ? "MOCK MODE" : "LIVE MODE"}
          </button>
          {!isMockMode && (
            <span className={`ws-status ws-${wsStatus}`}>WS: {wsStatus}</span>
          )}
          {isStreaming && <span className="streaming-badge">STREAMING</span>}
        </div>
      </header>

      <main className="app-main">
        {/* Utility / Control bar */}
        <section className="control-bar">
          <div className="controls">
            <button
              onClick={handleStartStreaming}
              disabled={isStreaming}
              className="control-button start"
            >
              Start Streaming
            </button>
            <button
              onClick={handleStopStreaming}
              disabled={!isStreaming}
              className="control-button stop"
            >
              Stop Streaming
            </button>
            <button onClick={handleReset} className="control-button reset">
              Reset Data
            </button>
          </div>

          <div className="time-window-control">
            <label htmlFor="time-window-slider">
              Time Window: {showAllData ? "All Data" : `${timeWindow} seconds`}
            </label>
            <input
              id="time-window-slider"
              type="range"
              min="1"
              max="301"
              value={showAllData ? 301 : timeWindow}
              onChange={handleTimeWindowChange}
              className="time-slider"
            />
            <div className="time-labels">
              <span>1s</span>
              <span>30s</span>
              <span>1m</span>
              <span>2m</span>
              <span>5m</span>
              <span>All</span>
            </div>
          </div>

          {!isMockMode && (
            <div className="connection-info">
              <p>WebSocket endpoint: ws://localhost:{PEN_BACKEND_PORT}</p>
              <p>
                Expected data format: {"{ x: number, y: number, z: number }"}
              </p>
            </div>
          )}
        </section>

        {/* Main dashboard grid */}
        <section className="dashboard">
          <div className="plot-section">
            {filteredData.length > 0 ? (
              <>
                <TrajectoryPlot data={filteredData} />
                {/* Overlay for latest point & counts */}
                <div className="latest-overlay">
                  <span className="overlay-line">
                    {/* {filteredData.length}/{trajectoryData.length} Points --- Latest point:{" "} */}
                    Latest point: <> </>
                  </span>
                  <span className="overlay-line">
                    X: {filteredData[filteredData.length - 1].x.toFixed(3)} | Y:{" "}
                    {filteredData[filteredData.length - 1].y.toFixed(3)} | Z:{" "}
                    {filteredData[filteredData.length - 1].z.toFixed(3)}
                  </span>
                </div>
              </>
            ) : (
              <div className="data-info" style={{ textAlign: "center" }}>
                <h3>No trajectory data to display</h3>
              </div>
            )}
          </div>

          <div className="side-panel">
            <AudioEqualizer trajectoryData={trajectoryData} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
