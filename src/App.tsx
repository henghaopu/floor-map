import React, { useState, useEffect, useRef } from 'react';
import SceneComponent from 'babylonjs-hook';
import {
	Vector3,
	Color3,
	HemisphericLight,
	MeshBuilder,
	StandardMaterial,
	Scene,
	UniversalCamera,
	Camera,
	Color4,
} from '@babylonjs/core';
import { AdvancedDynamicTexture, TextBlock } from '@babylonjs/gui';
import './App.css';

const onSceneReady = (
	scene: Scene,
	zoom: number,
	sceneRef: React.MutableRefObject<Scene | null>
) => {
	sceneRef.current = scene;
	scene.clearColor = new Color4(0, 0, 0, 0); // transparent background

	// Create and position a UniversalCamera for orthographic top-down view
	const camera = new UniversalCamera('camera', new Vector3(0, 10, 0), scene);
	camera.setTarget(Vector3.Zero()); // Look at origin
	camera.mode = Camera.ORTHOGRAPHIC_CAMERA;

	const aspectRatio =
		scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
	camera.orthoLeft = -zoom * aspectRatio;
	camera.orthoRight = zoom * aspectRatio;
	camera.orthoTop = zoom;
	camera.orthoBottom = -zoom;

	camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

	// Light
	const light = new HemisphericLight('light', new Vector3(0, -1, 0), scene);
	light.intensity = 0.9;

	// Define rack size (Lowe's rack: 4ft wide, 7ft tall, 1.5ft deep)
	const UNIT = 0.3048; // 1 foot = 0.3048 meters
	// Rack dimensions in meters
	const rackSize = {
		width: 4 * UNIT, // 4 ft wide
		height: 7 * UNIT, // 7 ft tall
		depth: 1.5 * UNIT, // 1.5 ft deep
	};

	// Function to create a rack at a given position
	const createRack = (position: Vector3, rotationY = 0, label: string) => {
		const rack = MeshBuilder.CreateBox(
			'rack',
			{ width: rackSize.width, height: rackSize.height, depth: rackSize.depth },
			scene
		);
		rack.position = position;
		rack.rotation.y = rotationY;
		const material = new StandardMaterial('rack-mat', scene);
		material.alpha = 0; // Make the box transparent
		rack.material = material;
		rack.enableEdgesRendering();
		rack.edgesWidth = 1.0;
		rack.edgesColor = new Color4(0, 0, 0, 1); // solid black outline

		// Create a plane above the rack to host the label (visible only from top)
		const labelPlane = MeshBuilder.CreatePlane('label', { size: 0.9 }, scene);
		labelPlane.parent = rack;
		labelPlane.position.y = 0.13;
		labelPlane.rotation.x = Math.PI / 2;
		if (rotationY === 0) {
			labelPlane.rotation.y = Math.PI; // flip text for horizontal racks
		}

		const advancedTexture = AdvancedDynamicTexture.CreateForMesh(labelPlane);
		const text = new TextBlock();
		text.text = label;
		text.color = 'black';
		text.fontSize = 250; // Make it larger
		text.resizeToFit = true;
		text.textWrapping = true;
		text.rotation = 0; // always upright in orthographic top-down
		advancedTexture.addControl(text);
	};

	// Create centered clusters of vertical double racks (3 groups, each 3 pairs tall)
	let rackId = 1;
	const verticalXOffset = rackSize.depth / 2 + 0.3;
	const verticalZSpacing = rackSize.width + 0.3;
	const verticalCols = [-verticalXOffset * 3, 0, verticalXOffset * 3];
	const verticalRows = [-verticalZSpacing, 0, verticalZSpacing];

	verticalCols.forEach((colX) => {
		verticalRows.forEach((rowZ) => {
			createRack(
				new Vector3(colX - verticalXOffset, 0, rowZ),
				Math.PI / 2,
				`rack ${rackId++}`
			);
			createRack(
				new Vector3(colX + verticalXOffset, 0, rowZ),
				Math.PI / 2,
				`rack ${rackId++}`
			);
		});
	});

	// Create bottom horizontal racks (2 rows of 6), spaced by actual rack width
	const horizontalSpacing = rackSize.width + 0.1;
	for (let i = 0; i < 6; i++) {
		createRack(
			new Vector3(-horizontalSpacing * 2.5 + i * horizontalSpacing, 0, 3.5),
			0,
			`rack ${rackId++}`
		);
		createRack(
			new Vector3(
				-horizontalSpacing * 2.5 + i * horizontalSpacing,
				0,
				3.5 + rackSize.depth + 0.1
			),
			0,
			`rack ${rackId++}`
		);
	}
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onRender = (scene: Scene) => {
	// Optional: actions to perform on each frame
};

function App() {
	const [zoom, setZoom] = useState(6); // smaller = zoom in
	const sceneRef = useRef<Scene | null>(null);

	useEffect(() => {
		if (!sceneRef.current) return;
		const scene = sceneRef.current;
		const camera = scene.activeCamera as UniversalCamera;
		const aspectRatio =
			scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
		camera.orthoLeft = -zoom * aspectRatio;
		camera.orthoRight = zoom * aspectRatio;
		camera.orthoTop = zoom;
		camera.orthoBottom = -zoom;
	}, [zoom]);

	return (
		<div className="app-container">
			<SceneComponent
				antialias
				adaptToDeviceRatio
				id="babylon-canvas"
				onSceneReady={(scene) => onSceneReady(scene, zoom, sceneRef)}
				onRender={onRender}
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
