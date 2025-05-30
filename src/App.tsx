import { useState } from 'react';
import SceneComponent from 'babylonjs-hook';
import './App.css';

function App() {
	const [zoom, setZoom] = useState(6);

	return (
		<div className="app-container">
			<SceneComponent
				antialias
				adaptToDeviceRatio
				id="babylon-canvas"
				onSceneReady={() => {}}
				onRender={() => {}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 10,
					left: 10,
					background: 'white',
					padding: '4px',
				}}
			>
				Zoom:
				<input
					type="range"
					min="2"
					max="15"
					step="0.1"
					value={zoom}
					onChange={(e) => setZoom(parseFloat(e.target.value))}
				/>
			</div>
		</div>
	);
}

export default App;
