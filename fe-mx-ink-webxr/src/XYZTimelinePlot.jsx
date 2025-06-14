import Plotly from "plotly.js-dist";
import React, { useMemo } from "react";
import createPlotlyComponent from "react-plotly.js/factory";

const Plot = createPlotlyComponent(Plotly);

/**
 * XYZTimelinePlot
 * --------------------------------------------------
 * A compact, responsive line chart that visualises the evolution of
 * X, Y and Z coordinates over time (or sample index). Designed to be
 * embedded in the side–panel under the AudioEqualizer for a quick,
 * colour-coded insight into motion dynamics that are currently
 * driving the audio engine.
 */
const XYZTimelinePlot = ({ data = [] }) => {
  // Memoise transformation to avoid unnecessary recalcs/re-renders.
  const plotConfig = useMemo(() => {
    // Prepare X-axis (sample indices) even when data is empty.
    const xAxis =
      data && data.length > 0 ? data.map((pt) => pt.index ?? 0) : [];

    const traces =
      data && data.length > 0
        ? [
            {
              x: xAxis,
              y: data.map((pt) => pt.x),
              mode: "lines",
              name: "X",
              line: { color: "#ff595e", width: 2 },
            },
            {
              x: xAxis,
              y: data.map((pt) => pt.y),
              mode: "lines",
              name: "Y",
              line: { color: "#8ac926", width: 2 },
            },
            {
              x: xAxis,
              y: data.map((pt) => pt.z),
              mode: "lines",
              name: "Z",
              line: { color: "#1982c4", width: 2 },
            },
          ]
        : [];

    const layout = {
      margin: { l: 30, r: 10, t: 10, b: 30, pad: 0 },
      autosize: true,
      showlegend: true,
      legend: {
        orientation: "h",
        y: -0.3,
        x: 0.5,
        xanchor: "center",
        font: { color: "#ffffff", size: 10 },
      },
      xaxis: {
        title: {
          text: "Sample Index",
          font: { color: "#ffffff", size: 10 },
        },
        showgrid: false,
        zeroline: false,
        tickfont: { color: "#ffffff", size: 9 },
      },
      yaxis: {
        title: {
          text: "Coordinate Value",
          font: { color: "#ffffff", size: 10 },
        },
        gridcolor: "rgba(255,255,255,0.1)",
        gridwidth: 1,
        tickfont: { color: "#ffffff", size: 9 },
      },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
    };

    const config = {
      displayModeBar: false,
      responsive: true,
    };

    return { traces, layout, config };
  }, [data]);

  return (
    <div
      className="xyz-timeline-plot"
      style={{ width: "100%", height: "260px" }}
    >
      <Plot
        data={plotConfig.traces}
        layout={plotConfig.layout}
        config={plotConfig.config}
        useResizeHandler
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

export default XYZTimelinePlot;
