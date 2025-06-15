# Frontend for MX Ink WebXR

This project serves as the frontend for the MX Ink WebXR application, providing a user interface for interacting with the VR experience. It includes features for real-time updates and user interaction.

## Features
- Real-time data visualization
- WebSocket integration for live updates
- Mock data generation for testing
- Interactive UI components

## Technical Details
- Built with React.js
- Uses WebSockets for real-time communication
- Implements data visualization components

## Architecture
- **Key Files**:
  - `App.jsx`: Main component that manages the application state, WebSocket connections, and data handling.
  - `AudioEqualizer.jsx`: Component for audio equalization.
  - `TrajectoryPlot.jsx`: Component for plotting trajectory data.
  - `XYZTimelinePlot.jsx`: Component for visualizing XYZ coordinates over time.
  - `config.js`: Configuration settings for the application.
  - `mockDataGenerator.js`: Utility for generating mock data for testing.

- **APIs and Modules**:
  - **React.js**: Used for building the user interface and managing component state.
  - **WebSockets**: Facilitates real-time communication for data updates.

## Prerequisites
- Node.js (version 12.0 or higher recommended)

## Setup
1. Clone the repository:
```sh
git clone https://github.com/yourusername/slai.git
cd fe-mx-ink-webxr
```

2. Install dependencies:
```sh
npm install
```

## Running the Application
To run the application in development mode:
```sh
npm run dev
```

This will start a local development server. Open your browser and navigate to `http://localhost:5173` (or the port specified in your console output).

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
