import { useEffect } from 'react';
import { Scene, Vector3, MeshBuilder, Color3 } from '@babylonjs/core';

// Draws a red outline grouping racks 20, 22, and 24
export function GroupOverlay({ scene }: { scene: Scene | null }) {
	useEffect(() => {
		if (!scene) return;

		const UNIT = 0.3048;
		const rackWidth = 4 * UNIT;
		const rackDepth = 1.5 * UNIT;
		const gap = 0.1;
		// Assuming rack 20, 22, 24 are at indexes 0, 1, 2 in order
		const rackIndexes = [0, 1, 2];
		const startX = -2.5 * (rackWidth + gap);
		const baseY = 3.5 + rackDepth + gap;

		const margin = 0.05;
		const left =
			startX + rackIndexes[0] * (rackWidth + gap) - rackWidth / 2 - margin;
		const right =
			startX + rackIndexes[2] * (rackWidth + gap) + rackWidth / 2 + margin;
		const top = baseY + rackDepth / 2 + margin;
		const bottom = baseY - rackDepth / 2 - margin;

		const outline = [
			new Vector3(left, bottom, 0.01),
			new Vector3(right, bottom, 0.01),
			new Vector3(right, top, 0.01),
			new Vector3(left, top, 0.01),
			new Vector3(left, bottom, 0.01),
		];

		const mesh = MeshBuilder.CreateLines(
			'group-outline',
			{ points: outline },
			scene
		);
		mesh.color = new Color3(1, 0, 0);

		return () => mesh.dispose();
	}, [scene]);

	return null;
}
