// Mock data generator for x, y, z trajectory data

export const generateMockTrajectoryData = (numPoints = 200) => {
  const data = [];

  for (let i = 0; i < numPoints; i++) {
    const t = (i / numPoints) * 4 * Math.PI;

    // Generate a 3D spiral with some interesting movement
    const x = Math.cos(t) * (1 + 0.1 * t);
    const y = Math.sin(t) * (1 + 0.1 * t);
    const z = 0.1 * t + 0.2 * Math.sin(5 * t);

    data.push({
      x: x,
      y: y,
      z: z,
      timestamp: Date.now() + i * 10, // Simulate timestamps
      index: i,
    });
  }

  return data;
};

// Generate real-time streaming data (for simulating live updates)
export const generateStreamingMockData = (currentIndex) => {
  const t = (currentIndex / 50) * 4 * Math.PI;

  // Add some noise to make it more realistic
  const noise = () => (Math.random() - 0.5) * 0.05;

  const x = Math.cos(t) * (1 + 0.1 * t) + noise();
  const y = Math.sin(t) * (1 + 0.1 * t) + noise();
  const z = 0.1 * t + 0.2 * Math.sin(5 * t) + noise();

  return {
    x: x,
    y: y,
    z: z,
    timestamp: Date.now(),
    index: currentIndex,
  };
};
