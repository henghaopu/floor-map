import React, { useState, useEffect, useRef } from 'react';
import SceneComponent from 'babylonjs-hook';
import {
	Vector3,
	UniversalCamera,
	HemisphericLight,
	Scene,
	MeshBuilder,
	Color4,
	Color3,
	PointerEventTypes,
} from '@babylonjs/core';
import { AdvancedDynamicTexture, TextBlock, Rectangle } from '@babylonjs/gui';

const UNIT = 0.3048;
const rackSize = {
	width: 4 * UNIT,
	height: 7 * UNIT, // not used in XY plane
	depth: 1.5 * UNIT,
};

const createRackOutline = (
	centerX: number,
	centerY: number,
	rotated = false
) => {
	const halfLong = rackSize.width / 2;
	const halfShort = rackSize.depth / 2;

	const halfW = rotated ? halfShort : halfLong;
	const halfD = rotated ? halfLong : halfShort;

	return [
		new Vector3(centerX - halfW, centerY - halfD, 0),
		new Vector3(centerX + halfW, centerY - halfD, 0),
		new Vector3(centerX + halfW, centerY + halfD, 0),
		new Vector3(centerX - halfW, centerY + halfD, 0),
		new Vector3(centerX - halfW, centerY - halfD, 0),
	];
};

export default function App() {
	const [zoom, setZoom] = useState(6);
	const sceneRef = useRef<Scene | null>(null);

	const onSceneReady = (scene: Scene) => {
		sceneRef.current = scene;
		scene.clearColor = new Color4(0, 0, 0, 0);

		const camera = new UniversalCamera('camera', new Vector3(0, 0, -10), scene);
		camera.setTarget(Vector3.Zero());
		camera.mode = UniversalCamera.ORTHOGRAPHIC_CAMERA;
		camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

		let isDragging = false;
		let lastX = 0;
		let lastY = 0;

		const canvas = scene.getEngine().getRenderingCanvas();
		canvas?.addEventListener('pointerdown', (evt) => {
			isDragging = true;
			lastX = evt.clientX;
			lastY = evt.clientY;
		});

		canvas?.addEventListener('pointerup', () => {
			isDragging = false;
		});

		canvas?.addEventListener('pointermove', (evt) => {
			if (!isDragging) return;
			const deltaX = evt.clientX - lastX;
			const deltaY = evt.clientY - lastY;
			camera.position.x -= deltaX / 100;
			camera.position.y += deltaY / 100;
			lastX = evt.clientX;
			lastY = evt.clientY;
		});

		const aspect =
			scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
		camera.orthoLeft = -zoom * aspect;
		camera.orthoRight = zoom * aspect;
		camera.orthoTop = zoom;
		camera.orthoBottom = -zoom;

		// rendering only wireframe outlines using MeshBuilder.CreateLineSystem on the XY plane (with z = 0) and a top-down orthographic camera, the light is technically not required.
		const light = new HemisphericLight('light', new Vector3(0, 0, -1), scene);

		const ui = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);

		// 🧱 Rack placement (XY plane, Z=0)
		const lines: Vector3[][] = [];
		let rackId = 1;
		const aisleGap = 1.2;
		const pairGap = 0.1;

		const labelCenters: { pos: Vector3; label: string }[] = [];

		// Vertical racks: 3 columns of 3 rows of double racks (side-by-side with aisle)
		const doubleRackGap = 0.1;
		const aisle = 1.2;
		const columnCount = 3;
		const rowCount = 3;

		for (let col = 0; col < columnCount; col++) {
			const centerX = (col - 1) * (rackSize.depth * 2 + doubleRackGap + aisle);

			for (let row = 0; row < rowCount; row++) {
				const y = (row - 1) * (rackSize.width + pairGap);
				lines.push(
					createRackOutline(
						centerX - (rackSize.depth + doubleRackGap) / 2,
						y,
						true
					)
				); // left rack
				labelCenters.push({
					pos: new Vector3(
						centerX - (rackSize.depth + doubleRackGap) / 2,
						y,
						0
					),
					label: `Rack ${rackId++}`,
				});
				lines.push(
					createRackOutline(
						centerX + (rackSize.depth + doubleRackGap) / 2,
						y,
						true
					)
				); // right rack
				labelCenters.push({
					pos: new Vector3(
						centerX + (rackSize.depth + doubleRackGap) / 2,
						y,
						0
					),
					label: `Rack ${rackId++}`,
				});
			}
		}

		// Horizontal racks: 2 rows of 6 racks
		const startX = -2.5 * (rackSize.width + pairGap);
		const baseY = 3.5;
		for (let i = 0; i < 6; i++) {
			const x = startX + i * (rackSize.width + pairGap);
			lines.push(createRackOutline(x, baseY));
			labelCenters.push({
				pos: new Vector3(x, baseY, 0),
				label: `Rack ${rackId++}`,
			});
			lines.push(createRackOutline(x, baseY + rackSize.depth + pairGap));
			labelCenters.push({
				pos: new Vector3(x, baseY + rackSize.depth + pairGap, 0),
				label: `Rack ${rackId++}`,
			});
		}

		const rackMesh = MeshBuilder.CreateLineSystem(
			'rackLines',
			{ lines, updatable: false },
			scene
		);
		rackMesh.color = new Color3(0, 0, 0);

		labelCenters.forEach(({ pos, label }) => {
			const labelPlane = MeshBuilder.CreatePlane(
				'labelPlane',
				{
					width: rackSize.depth,
					height: rackSize.width / 2,
				},
				scene
			);
			labelPlane.position = pos;

			const texture = AdvancedDynamicTexture.CreateForMesh(labelPlane);
			const rect = new Rectangle();
			rect.thickness = 0;
			rect.background = 'transparent';

			const text = new TextBlock();
			text.text = label;
			text.color = 'black';
			text.fontSize = 42 * zoom;
			text.textHorizontalAlignment = TextBlock.HORIZONTAL_ALIGNMENT_CENTER;
			text.textVerticalAlignment = TextBlock.VERTICAL_ALIGNMENT_CENTER;

			const rackNumber = parseInt(label.split(' ')[1], 10);
			if (rackNumber <= 18) {
				text.rotation = -Math.PI / 2;
			}

			rect.addControl(text);
			texture.addControl(rect);
		});
	};

	useEffect(() => {
		if (!sceneRef.current) return;
		const scene = sceneRef.current;
		const camera = scene.activeCamera as UniversalCamera;
		const aspect =
			scene.getEngine().getRenderWidth() / scene.getEngine().getRenderHeight();
		camera.orthoLeft = -zoom * aspect;
		camera.orthoRight = zoom * aspect;
		camera.orthoTop = zoom;
		camera.orthoBottom = -zoom;
	}, [zoom]);

	return (
		<div
			className="app-container"
			style={{
				width: '100vw',
				height: '100vh',
				position: 'relative',
				overflow: 'hidden',
			}}
		>
			<SceneComponent
				antialias
				adaptToDeviceRatio
				id="babylon-canvas"
				onSceneReady={onSceneReady}
				onRender={() => {}}
				style={{ width: '100vw', height: '100vh', display: 'block' }}
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
