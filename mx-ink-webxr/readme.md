# MX Ink WebXR

This project is a VR application that allows users to control music settings using a Logitech MX-INK stylus. By interacting with the stylus in 3D space, users can adjust pitch, volume, and add other instruments based on the coordinates of the stylus.

## Features
- Immersive 3D painting experience using Logitech MX-INK
- Real-time music control (pitch, volume, instrument selection) based on stylus coordinates
- WebXR integration for VR headset compatibility
- WebSocket communication for real-time updates

## Technical Details
- Built with Three.js and WebXR
- Uses WebSockets for real-time communication
- Implements a TubePainter for 3D drawing
- Supports VR controllers and stylus input

## Architecture
- **Key Files**:
  - `script.js`: Main entry point for the application, handling initialization, WebSocket communication, and rendering.
  - `index.html`: HTML structure for the application.
  - `style.css`: Styling for the application.

- **APIs and Modules**:
  - **Three.js**: Used for 3D rendering and scene management.
  - **WebXR**: Enables VR functionality and controller input.
  - **WebSockets**: Facilitates real-time communication for music control.

## Prerequisites

- Node.js (version 12.0 or higher recommended)
- Logitech MX-INK Stylus
- Quest 3/3S headset 

## Setup

1. Clone the repository:
```sh
git clone https://github.com/yourusername/mx-ink-webxr.git
cd mx-ink-webxr
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

## Building for Production

To create a production build:
```sh
npm run build
```


This will generate optimized files in the `dist` directory.

## Deploying

After building, you can deploy the contents of the `dist` directory to your preferred hosting platform.

## Usage

1. Open the application in Quest browser.
2. Click the "Enter XR" button to start.
3. Use your stylus to paint in 3D space and control music settings.
4. Enjoy!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).
