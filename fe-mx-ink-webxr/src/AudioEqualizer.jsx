import React, { useEffect, useRef, useState } from "react";
import "./AudioEqualizer.css";

const AudioEqualizer = ({ trajectoryData }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fileName, setFileName] = useState("");
  const [analyzerData, setAnalyzerData] = useState(new Uint8Array(0));

  const audioContextRef = useRef(null);
  const audioElementRef = useRef(null);
  const sourceRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationRef = useRef(null);
  const canvasRef = useRef(null);

  const specialGainRef = useRef(null);
  const specialSourceRef = useRef(null);
  const specialAudioElementRef = useRef(null);
  const [specialFileName, setSpecialFileName] = useState("");
  const [specialControl, setSpecialControl] = useState({
    value: 0, // slider position between -1 and 1
    baseGain: 0,
    mapping: "none",
    multiplier: 1.0,
  });

  // Equalizer bands - typical frequencies for a 10-band EQ
  const [bands, setBands] = useState([
    {
      frequency: 32,
      gain: 0,
      label: "32Hz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 64,
      gain: 0,
      label: "64Hz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 125,
      gain: 0,
      label: "125Hz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 250,
      gain: 0,
      label: "250Hz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 500,
      gain: 0,
      label: "500Hz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 1000,
      gain: 0,
      label: "1kHz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 2000,
      gain: 0,
      label: "2kHz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 4000,
      gain: 0,
      label: "4kHz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 8000,
      gain: 0,
      label: "8kHz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
    {
      frequency: 16000,
      gain: 0,
      label: "16kHz",
      baseGain: 0,
      mapping: "none",
      multiplier: 1.0,
    },
  ]);

  const filtersRef = useRef([]);
  const [mappingEnabled, setMappingEnabled] = useState(false);
  const [referencePoint, setReferencePoint] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Update equalizer based on trajectory data
  useEffect(() => {
    if (!mappingEnabled || !trajectoryData || trajectoryData.length === 0)
      return;

    const latestPoint = trajectoryData[trajectoryData.length - 1];

    // Calculate deltas from reference point
    const deltas = {
      x: latestPoint.x - referencePoint.x,
      y: latestPoint.y - referencePoint.y,
      z: latestPoint.z - referencePoint.z,
    };

    setBands((prevBands) => {
      return prevBands.map((band, index) => {
        if (band.mapping === "none") return band;

        const delta = deltas[band.mapping];
        const change = delta * band.multiplier;
        const newGain = Math.max(-12, Math.min(12, band.baseGain + change));

        if (filtersRef.current[index]) {
          filtersRef.current[index].gain.value = newGain;
        }

        return { ...band, gain: newGain };
      });
    });

    // Update special slider if it has mapping
    setSpecialControl((prev) => {
      if (prev.mapping === "none") return prev;
      const delta = deltas[prev.mapping];
      const change = delta * prev.multiplier;
      const newValue = Math.max(-1, Math.min(1, prev.baseGain + change));
      if (specialGainRef.current) {
        specialGainRef.current.gain.value = newValue > 0 ? newValue : 0;
      }
      return { ...prev, value: newValue };
    });
  }, [trajectoryData, mappingEnabled, referencePoint]);

  const initializeAudio = async (file) => {
    try {
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Create audio element
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audioElementRef.current = audio;

      // Wait for metadata to load
      await new Promise((resolve) => {
        audio.addEventListener("loadedmetadata", resolve, { once: true });
      });

      // Create source from audio element
      sourceRef.current =
        audioContextRef.current.createMediaElementSource(audio);

      // Create analyzer
      analyzerRef.current = audioContextRef.current.createAnalyser();
      analyzerRef.current.fftSize = 256;

      // Create filters for each band
      filtersRef.current = bands.map((band, index) => {
        const filter = audioContextRef.current.createBiquadFilter();
        filter.type =
          index === 0
            ? "lowshelf"
            : index === bands.length - 1
            ? "highshelf"
            : "peaking";
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        filter.Q.value = 1;
        return filter;
      });

      // Connect the audio graph
      let previousNode = sourceRef.current;
      filtersRef.current.forEach((filter) => {
        previousNode.connect(filter);
        previousNode = filter;
      });
      previousNode.connect(analyzerRef.current);
      analyzerRef.current.connect(audioContextRef.current.destination);

      // Set up audio event listeners
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("ended", handleEnded);

      setDuration(audio.duration);
      setFileName(file.name);

      // Start visualization
      visualize();
    } catch (error) {
      console.error("Error initializing audio:", error);
    }
  };

  const visualize = () => {
    if (!analyzerRef.current) return;

    const bufferLength = analyzerRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyzerRef.current.getByteFrequencyData(dataArray);
      setAnalyzerData(dataArray);

      // Draw on canvas
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;

        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * height;

          const r = barHeight + 25 * (i / bufferLength);
          const g = 250 * (i / bufferLength);
          const b = 50;

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
        }
      }
    };

    draw();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      initializeAudio(file);
    }
  };

  const handlePlayPause = () => {
    if (!audioElementRef.current) return;

    if (isPlaying) {
      audioElementRef.current.pause();
    } else {
      audioElementRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioElementRef.current) {
      setCurrentTime(audioElementRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (event) => {
    if (!audioElementRef.current) return;
    const newTime = (event.target.value / 100) * duration;
    audioElementRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleBandChange = (index, value) => {
    const newBands = [...bands];
    newBands[index].gain = value;
    newBands[index].baseGain = value;
    setBands(newBands);

    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = value;
    }
  };

  const handleMappingChange = (index, mapping) => {
    const newBands = [...bands];
    newBands[index].mapping = mapping;
    setBands(newBands);
  };

  const handleMultiplierChange = (index, multiplier) => {
    const newBands = [...bands];
    newBands[index].multiplier = multiplier;
    setBands(newBands);
  };

  const toggleMapping = () => {
    if (!mappingEnabled && trajectoryData && trajectoryData.length > 0) {
      // Set reference point to current position
      const latestPoint = trajectoryData[trajectoryData.length - 1];
      setReferencePoint({
        x: latestPoint.x,
        y: latestPoint.y,
        z: latestPoint.z,
      });

      // Store current gains as base gains
      const newBands = bands.map((band) => ({ ...band, baseGain: band.gain }));
      setBands(newBands);

      // Store special base value
      setSpecialControl((prev) => ({ ...prev, baseGain: prev.value }));
    }
    setMappingEnabled(!mappingEnabled);
  };

  const resetEqualizer = () => {
    const newBands = bands.map((band) => ({ ...band, gain: 0, baseGain: 0 }));
    setBands(newBands);

    filtersRef.current.forEach((filter, index) => {
      if (filter) {
        filter.gain.value = 0;
      }
    });

    // Reset special
    setSpecialControl({
      value: 0,
      baseGain: 0,
      mapping: "none",
      multiplier: 1,
    });
    if (specialGainRef.current) {
      specialGainRef.current.gain.value = 0;
    }
    if (specialAudioElementRef.current) {
      specialAudioElementRef.current.pause();
      specialAudioElementRef.current.currentTime = 0;
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const applyPreset = (preset) => {
    // Preset configurations
    const presets = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      "bass-boost": [6, 5, 4, 3, 1, 0, 0, 0, 0, 0],
      vocal: [-2, -1, 0, 2, 4, 4, 3, 2, 1, 0],
      rock: [5, 4, 3, 1, -1, -1, 0, 2, 3, 4],
      jazz: [4, 3, 1, 2, -2, -2, 0, 1, 2, 3],
      electronic: [6, 5, 1, -2, -1, 1, 2, 3, 4, 5],
    };

    const presetValues = presets[preset];
    if (presetValues) {
      const newBands = bands.map((band, index) => ({
        ...band,
        gain: presetValues[index],
        baseGain: presetValues[index],
      }));
      setBands(newBands);

      // Apply to filters
      filtersRef.current.forEach((filter, index) => {
        if (filter) {
          filter.gain.value = presetValues[index];
        }
      });
    }
  };

  /* --------------------------------------------------
   * Matching Presets — quickly map frequency bands to
   * pen-trajectory axes (x, y, z) with sensible multipliers.
   * -------------------------------------------------- */
  const applyMatchingPreset = (preset) => {
    // Define how each preset maps the 10 bands (low ➜ high)
    // Possible axis values: "x", "y", "z", or "none" (disabled)
    const mappingPresets = {
      pop: {
        mapping: [
          "z", // 32 Hz
          "z", // 64 Hz
          "x", // 125 Hz
          "x", // 250 Hz
          "x", // 500 Hz
          "y", // 1 kHz
          "y", // 2 kHz
          "y", // 4 kHz
          "y", // 8 kHz
          "y", // 16 kHz
        ],
        multiplier: 30,
      },
      yodel: {
        mapping: [
          "y", // focus mids for voice projection
          "y",
          "y",
          "z",
          "z",
          "y",
          "z",
          "z",
          "z",
          "z",
        ],
        multiplier: 50,
      },
      ambient: {
        mapping: ["x", "x", "x", "x", "y", "y", "y", "y", "z", "z"],
        multiplier: 20,
      },
    };

    const selected = mappingPresets[preset];
    if (!selected) return;

    // If we don't yet have a reference point, grab the latest trajectory
    if (trajectoryData && trajectoryData.length > 0) {
      const latestPoint = trajectoryData[trajectoryData.length - 1];
      setReferencePoint({
        x: latestPoint.x,
        y: latestPoint.y,
        z: latestPoint.z,
      });
    }

    // Apply mapping + multipliers to each band
    const newBands = bands.map((band, idx) => ({
      ...band,
      mapping: selected.mapping[idx] || "none",
      multiplier: selected.multiplier,
    }));

    setBands(newBands);

    // Ensure mapping mode is enabled so the preset takes effect
    if (!mappingEnabled) setMappingEnabled(true);
  };

  const handleSpecialFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }

      // Create / replace audio element
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.loop = true;
      specialAudioElementRef.current = audio;

      // Ensure element can play to avoid user gesture restrictions later
      await new Promise((resolve) => {
        audio.addEventListener("canplay", resolve, { once: true });
      });

      // Create media element source
      specialSourceRef.current =
        audioContextRef.current.createMediaElementSource(audio);

      // Create gain node if it doesn't exist
      if (!specialGainRef.current) {
        specialGainRef.current = audioContextRef.current.createGain();
      }
      specialGainRef.current.gain.value = 0;

      // Connect graph: source -> gain -> destination
      specialSourceRef.current.connect(specialGainRef.current);
      specialGainRef.current.connect(audioContextRef.current.destination);

      setSpecialFileName(file.name);
    } catch (error) {
      console.error("Error initializing special audio:", error);
    }
  };

  const handleSpecialSliderChange = (value) => {
    setSpecialControl((prev) => ({ ...prev, value, baseGain: value }));
    if (specialGainRef.current) {
      const vol = value > 0 ? value : 0;
      specialGainRef.current.gain.value = vol;
    }
    if (specialAudioElementRef.current) {
      if (value > 0) {
        // Resume context if needed
        if (
          audioContextRef.current &&
          audioContextRef.current.state === "suspended"
        ) {
          audioContextRef.current.resume();
        }
        specialAudioElementRef.current.play().catch(() => {});
      } else {
        specialAudioElementRef.current.pause();
        specialAudioElementRef.current.currentTime = 0;
      }
    }
  };

  const handleSpecialMappingChange = (axis) => {
    setSpecialControl((prev) => ({
      ...prev,
      mapping: axis,
      baseGain: prev.value,
    }));
  };

  const handleSpecialMultiplierChange = (multiplier) => {
    setSpecialControl((prev) => ({ ...prev, multiplier }));
  };

  return (
    <div className="audio-equalizer">
      <div className={`upload-section ${fileName ? "file-loaded" : ""}`}>
        <label htmlFor="audio-upload" className="upload-button">
          <span className="upload-icon">🎵</span>
          <span>Upload Music File</span>
          <input
            id="audio-upload"
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </label>
        {fileName && <p className="file-name">{fileName}</p>}
      </div>

      {fileName && (
        <>
          <div className="player-controls">
            <button
              className="play-pause-button"
              onClick={handlePlayPause}
              disabled={!audioElementRef.current}
            >
              {isPlaying ? "⏸️" : "▶️"}
            </button>

            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <input
              type="range"
              className="seek-bar"
              min="0"
              max="100"
              value={duration ? (currentTime / duration) * 100 : 0}
              onChange={handleSeek}
            />
          </div>

          <div className="visualizer-section">
            <canvas
              ref={canvasRef}
              width={600}
              height={150}
              className="visualizer-canvas"
            />
          </div>

          <div className="trajectory-mapping-control">
            <div className="mapping-buttons">
              <button
                className={`mapping-toggle ${mappingEnabled ? "active" : ""}`}
                onClick={toggleMapping}
                disabled={!trajectoryData || trajectoryData.length === 0}
              >
                {mappingEnabled ? "Disable" : "Enable"} Mapping
              </button>
              <button className="reset-eq-button" onClick={resetEqualizer}>
                Reset EQ
              </button>
            </div>
            {mappingEnabled && (
              <span className="mapping-status">
                Mapping active — Reference point set
              </span>
            )}
          </div>

          <div className="equalizer-section">
            <div className="equalizer-bands">
              {bands.map((band, index) => (
                <div key={band.frequency} className="eq-band">
                  <div className="eq-slider-container">
                    <span className="gain-value">
                      +{Math.max(0, band.gain.toFixed(1))}dB
                    </span>
                    <input
                      type="range"
                      className="eq-slider"
                      min="-12"
                      max="12"
                      step="0.1"
                      value={band.gain}
                      onChange={(e) =>
                        handleBandChange(index, parseFloat(e.target.value))
                      }
                      orient="vertical"
                    />
                    <span className="gain-value">
                      {Math.min(0, band.gain.toFixed(1))}dB
                    </span>
                  </div>
                  <label className="freq-label">{band.label}</label>

                  <div className="mapping-controls">
                    <select
                      className="axis-selector"
                      value={band.mapping}
                      onChange={(e) =>
                        handleMappingChange(index, e.target.value)
                      }
                    >
                      <option value="none">None</option>
                      <option value="x">X</option>
                      <option value="y">Y</option>
                      <option value="z">Z</option>
                    </select>

                    {band.mapping !== "none" && (
                      <div className="multiplier-control">
                        <label>
                          ×
                          {band.multiplier >= 10
                            ? band.multiplier.toFixed(0)
                            : band.multiplier.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          className="multiplier-slider"
                          min="1"
                          max="1000"
                          step="1"
                          value={band.multiplier}
                          onChange={(e) =>
                            handleMultiplierChange(
                              index,
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Special Slider */}
              <div className="eq-band special-band">
                <div className="eq-slider-container">
                  <span className="gain-value">
                    {specialControl.value <= 0
                      ? "Off"
                      : `×${specialControl.value.toFixed(2)}`}
                  </span>
                  <input
                    type="range"
                    className="eq-slider special-slider"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={specialControl.value}
                    onChange={(e) =>
                      handleSpecialSliderChange(parseFloat(e.target.value))
                    }
                    orient="vertical"
                  />
                  <span className="gain-value">&nbsp;</span>
                </div>
                {/* Clickable upload text positioned like a frequency label */}
                <label
                  className={`freq-label special-upload-text ${
                    specialFileName ? "uploaded" : ""
                  }`}
                >
                  Click&nbsp;Me
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleSpecialFileUpload}
                    style={{ display: "none" }}
                  />
                </label>
                {specialFileName && (
                  <span
                    className="file-name"
                    style={{ fontSize: "0.6rem", textAlign: "center" }}
                  >
                    {specialFileName}
                  </span>
                )}

                <div className="mapping-controls">
                  <select
                    className="axis-selector"
                    value={specialControl.mapping}
                    onChange={(e) => handleSpecialMappingChange(e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="x">X</option>
                    <option value="y">Y</option>
                    <option value="z">Z</option>
                  </select>

                  {specialControl.mapping !== "none" && (
                    <div className="multiplier-control">
                      <label>
                        ×
                        {specialControl.multiplier >= 10
                          ? specialControl.multiplier.toFixed(0)
                          : specialControl.multiplier.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        className="multiplier-slider"
                        min="1"
                        max="1000"
                        step="1"
                        value={specialControl.multiplier}
                        onChange={(e) =>
                          handleSpecialMultiplierChange(
                            parseFloat(e.target.value)
                          )
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Axis-matching EQ presets */}
          <div className="presets-section matching-presets-section">
            <h3>Matching Presets</h3>
            <div className="preset-buttons">
              <button onClick={() => applyMatchingPreset("pop")}>Pop</button>
              <button onClick={() => applyMatchingPreset("yodel")}>
                Yodel
              </button>
              <button onClick={() => applyMatchingPreset("ambient")}>
                Ambient
              </button>
            </div>
          </div>

          <div className="presets-section">
            <h3>Standard Equalizer Presets</h3>
            <div className="preset-buttons">
              <button onClick={() => applyPreset("flat")}>Flat</button>
              <button onClick={() => applyPreset("bass-boost")}>
                Bass Boost
              </button>
              <button onClick={() => applyPreset("vocal")}>Vocal</button>
              <button onClick={() => applyPreset("rock")}>Rock</button>
              <button onClick={() => applyPreset("jazz")}>Jazz</button>
              <button onClick={() => applyPreset("electronic")}>
                Electronic
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AudioEqualizer;
