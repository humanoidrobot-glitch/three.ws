import { prepare, layout } from '@chenglou/pretext';

const FONT_LABEL = '600 11px Inter, sans-serif';
const FONT_VALUE = '300 13px Inter, sans-serif';
const FONT_TITLE = '500 14px Inter, sans-serif';
const LINE_HEIGHT = 18;
const PADDING = 16;
const ROW_GAP = 6;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function countVertices(object) {
	let vertices = 0;
	let triangles = 0;
	let meshes = 0;
	const materialSet = new Set();
	const textureSet = new Set();

	object.traverse((node) => {
		if (node.isMesh || node.isPoints || node.isLine) {
			meshes++;
			const geo = node.geometry;
			if (geo) {
				if (geo.index) {
					triangles += geo.index.count / 3;
				} else if (geo.attributes.position) {
					triangles += geo.attributes.position.count / 3;
				}
				if (geo.attributes.position) {
					vertices += geo.attributes.position.count;
				}
			}
			const mats = Array.isArray(node.material) ? node.material : [node.material];
			mats.forEach((mat) => {
				if (mat) {
					materialSet.add(mat.uuid);
					for (const key in mat) {
						if (mat[key] && mat[key].isTexture) {
							textureSet.add(mat[key].uuid);
						}
					}
				}
			});
		}
	});

	return {
		vertices,
		triangles: Math.floor(triangles),
		meshes,
		materials: materialSet.size,
		textures: textureSet.size,
	};
}

function formatNumber(n) {
	if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
	if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
	return n.toString();
}

/**
 * Creates or updates the model info overlay.
 * @param {HTMLElement} container - The viewer container element
 * @param {THREE.Object3D} object - The loaded 3D content
 * @param {Array} clips - Animation clips
 * @returns {{ el: HTMLElement, canvas: HTMLCanvasElement, update: Function, remove: Function }}
 */
export function createModelInfo(container, object, clips) {
	const stats = countVertices(object);

	const rows = [
		{ label: 'MESHES', value: formatNumber(stats.meshes) },
		{ label: 'VERTICES', value: formatNumber(stats.vertices) },
		{ label: 'TRIANGLES', value: formatNumber(stats.triangles) },
		{ label: 'MATERIALS', value: formatNumber(stats.materials) },
		{ label: 'TEXTURES', value: formatNumber(stats.textures) },
	];

	if (clips && clips.length > 0) {
		rows.push({ label: 'ANIMATIONS', value: clips.length.toString() });
	}

	// Use pretext to measure all text precisely
	const maxWidth = 180;
	const titleText = 'Model Info';
	const titlePrepared = prepare(titleText, FONT_TITLE);
	const titleLayout = layout(titlePrepared, maxWidth, LINE_HEIGHT + 2);

	const measured = rows.map((row) => {
		const labelPrepared = prepare(row.label, FONT_LABEL);
		const labelLayout = layout(labelPrepared, maxWidth, LINE_HEIGHT);
		const valuePrepared = prepare(row.value, FONT_VALUE);
		const valueLayout = layout(valuePrepared, maxWidth, LINE_HEIGHT);
		return { ...row, labelWidth: labelLayout.width, valueWidth: valueLayout.width };
	});

	// Calculate canvas dimensions from pretext measurements
	const contentWidth = Math.max(
		titleLayout.width + PADDING * 2,
		...measured.map((r) => r.labelWidth + r.valueWidth + PADDING * 3),
	);
	const canvasWidth = Math.max(contentWidth, 160);
	const canvasHeight =
		PADDING + titleLayout.height + ROW_GAP + measured.length * (LINE_HEIGHT + ROW_GAP) + PADDING;

	// Create the canvas
	const canvas = document.createElement('canvas');
	canvas.width = canvasWidth * DPR;
	canvas.height = canvasHeight * DPR;
	canvas.style.width = canvasWidth + 'px';
	canvas.style.height = canvasHeight + 'px';

	const ctx = canvas.getContext('2d');
	ctx.scale(DPR, DPR);

	// Draw background
	ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
	roundRect(ctx, 0, 0, canvasWidth, canvasHeight, 10);
	ctx.fill();

	// Draw border
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
	ctx.lineWidth = 1;
	roundRect(ctx, 0.5, 0.5, canvasWidth - 1, canvasHeight - 1, 10);
	ctx.stroke();

	// Draw title
	let y = PADDING;
	ctx.font = FONT_TITLE;
	ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
	ctx.textBaseline = 'top';
	ctx.fillText(titleText, PADDING, y);
	y += titleLayout.height + ROW_GAP;

	// Separator
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
	ctx.beginPath();
	ctx.moveTo(PADDING, y);
	ctx.lineTo(canvasWidth - PADDING, y);
	ctx.stroke();
	y += ROW_GAP;

	// Draw rows
	measured.forEach((row) => {
		// Label (left)
		ctx.font = FONT_LABEL;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
		ctx.fillText(row.label, PADDING, y);

		// Value (right-aligned)
		ctx.font = FONT_VALUE;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
		ctx.textAlign = 'right';
		ctx.fillText(row.value, canvasWidth - PADDING, y);
		ctx.textAlign = 'left';

		y += LINE_HEIGHT + ROW_GAP;
	});

	// Wrap in a container div
	const el = document.createElement('div');
	el.classList.add('model-info');
	el.appendChild(canvas);
	container.appendChild(el);

	return {
		el,
		canvas,
		remove() {
			el.remove();
		},
	};
}

function roundRect(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}
