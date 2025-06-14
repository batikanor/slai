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
          title: "Time",
          titleside: "right",
        },
      },
      name: "Trajectory",
    },
  ];

  const layout = {
    title: {
      text: "3D Trajectory Visualization",
      font: {
        size: 24,
      },
    },
    autosize: true,
    width: 800,
    height: 600,
    scene: {
      xaxis: {
        title: "X Position",
        gridcolor: "rgb(255, 255, 255)",
        zerolinecolor: "rgb(255, 255, 255)",
        showbackground: true,
        backgroundcolor: "rgb(230, 230, 230)",
      },
      yaxis: {
        title: "Y Position",
        gridcolor: "rgb(255, 255, 255)",
        zerolinecolor: "rgb(255, 255, 255)",
        showbackground: true,
        backgroundcolor: "rgb(230, 230, 230)",
      },
      zaxis: {
        title: "Z Position",
        gridcolor: "rgb(255, 255, 255)",
        zerolinecolor: "rgb(255, 255, 255)",
        showbackground: true,
        backgroundcolor: "rgb(230, 230, 230)",
      },
      camera: {
        eye: {
          x: 1.5,
          y: 1.5,
          z: 1.5,
        },
      },
    },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
  };

  const config = {
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["pan3d"],
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
