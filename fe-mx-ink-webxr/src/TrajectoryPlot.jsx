import Plotly from "plotly.js-dist";
import React from "react";
import createPlotlyComponent from "react-plotly.js/factory";

const Plot = createPlotlyComponent(Plotly);

const TrajectoryPlot = ({ data }) => {
  // Extract x, y, z arrays from the data
  const xData = data.map((point) => point.x);
  const yData = data.map((point) => point.y);
  const zData = data.map((point) => point.z);

  // Create color gradient based on time/index
  const colors = data.map((_, index) => index / data.length);

  const plotData = [
    {
      type: "scatter3d",
      mode: "markers+lines",
      x: xData,
      y: yData,
      z: zData,
      line: {
        width: 6,
        color: colors,
        colorscale: "Viridis",
      },
      marker: {
        size: 3,
        color: colors,
        colorscale: "Viridis",
        showscale: true,
        colorbar: {
          title: {
            text: "Time",
            font: { color: "#ffffff" },
            side: "right",
          },
          tickfont: { color: "#ffffff" },
          outlinecolor: "rgba(255,255,255,0.3)",
        },
      },
      name: "Trajectory",
    },
  ];

  const layout = {
    // Remove internal title to reclaim vertical space
    margin: { l: 0, r: 0, b: 0, t: 10, pad: 0 },
    autosize: true,
    // width and height will adapt to the container for responsiveness
    scene: {
      dragmode: "orbit",
      xaxis: {
        title: {
          text: "X Position",
          font: { color: "#ffffff" },
        },
        gridcolor: "rgba(200, 200, 200, 0.35)",
        gridwidth: 1,
        zerolinecolor: "rgba(200, 200, 200, 0.6)",
        tickfont: { color: "#ffffff" },
        showbackground: true,
        backgroundcolor: "rgba(0, 0, 0, 0.05)",
        showgrid: true,
        range: [-1, 1],
        autorange: false,
        fixedrange: true,
      },
      yaxis: {
        title: {
          text: "Y Position",
          font: { color: "#ffffff" },
        },
        gridcolor: "rgba(200, 200, 200, 0.35)",
        gridwidth: 1,
        zerolinecolor: "rgba(200, 200, 200, 0.6)",
        tickfont: { color: "#ffffff" },
        showbackground: true,
        backgroundcolor: "rgba(0, 0, 0, 0.05)",
        showgrid: true,
        range: [-1, 1],
        autorange: false,
        fixedrange: true,
      },
      zaxis: {
        title: {
          text: "Z Position",
          font: { color: "#ffffff" },
        },
        gridcolor: "rgba(200, 200, 200, 0.35)",
        gridwidth: 1,
        zerolinecolor: "rgba(200, 200, 200, 0.6)",
        tickfont: { color: "#ffffff" },
        showbackground: true,
        backgroundcolor: "rgba(0, 0, 0, 0.05)",
        showgrid: true,
        range: [-1, 1],
        autorange: false,
        fixedrange: true,
      },
      camera: {
        up: { x: 0, y: 1, z: 0 },
        eye: {
          x: 1.5,
          y: 1.5,
          z: 1.5,
        },
      },
      aspectmode: "manual",
      aspectratio: { x: 1, y: 1, z: 1 },
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: [],
  };

  return (
    <div className="trajectory-plot-container">
      <Plot
        data={plotData}
        layout={layout}
        config={config}
        useResizeHandler={true}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default TrajectoryPlot;
