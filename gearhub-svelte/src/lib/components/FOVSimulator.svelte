<script lang="ts">
	import { onMount } from 'svelte';
	import { gearList, loadoutSet, activeCategory } from '$lib/stores';
	import type { GearItem } from '$lib/stores';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	const COLOR_PALETTE = ['#D44500', '#00FF99', '#FF00FF', '#FFFF00', '#00CCFF'];

	$: drawFOV($gearList, $loadoutSet, $activeCategory);

	function drawFOV(list: GearItem[], loadout: Set<number>, category: string) {
		if (!ctx) return;
		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);
		const w = rect.width;
		const h = rect.height;
		ctx.clearRect(0, 0, w, h);

		const activeIndices = Array.from(loadout);
		const hasSelection = activeIndices.length > 0;
		const itemsToDraw = hasSelection 
			? activeIndices.map((idx, i) => ({ item: list[idx], color: COLOR_PALETTE[i % COLOR_PALETTE.length] }))
			: list.map(item => ({ item, color: 'rgba(255, 255, 255, 0.15)' }));

		const baseMm = 16; 
		itemsToDraw.forEach(({ item, color }) => {
			if(item.type === 'Body') return;
			let minMm, maxMm;
			const clean = item.focalLength?.replace('mm','').trim() || '';
			if(clean.includes('-')) { [minMm, maxMm] = clean.split('-').map(Number); } 
			else { minMm = maxMm = Number(clean); }

			const drawRect = (mm: number) => {
				if(mm < baseMm) return; 
				const scale = baseMm / mm; 
				const rw = w * scale; const rh = h * scale;
				const rx = (w - rw) / 2; const ry = (h - rh) / 2;
				ctx.beginPath(); ctx.rect(rx, ry, rw, rh);
				ctx.strokeStyle = color; ctx.lineWidth = hasSelection ? 2 : 1; ctx.stroke();
				if (hasSelection) {
					ctx.fillStyle = color; ctx.font = 'bold 10px JetBrains Mono';
					ctx.fillText(`${mm}mm`, rx + 5, ry + 12);
				}
			};
			drawRect(minMm);
			if(minMm !== maxMm) drawRect(maxMm);
		});
	}

	onMount(() => {
		ctx = canvas.getContext('2d')!;
		window.addEventListener('resize', () => drawFOV($gearList, $loadoutSet, $activeCategory));
	});
</script>

<div class="bg-black/40 rounded-xl p-4 border border-gray-800 flex flex-col justify-center transition-all duration-500">
	<div class="mb-2 flex justify-between items-end px-2">
		<h3 class="text-xs font-bold text-sony-orange uppercase tracking-wider font-mono"><iconify-icon icon="lucide:layers"></iconify-icon> FOCAL FIELD SIMULATOR</h3>
		<span class="text-[10px] text-gray-500 font-mono">ASPECT [3:2] FULL FRAME</span>
	</div>
	<div class="w-full max-w-[600px] aspect-[3/2] mx-auto bg-black border border-gray-700 shadow-2xl overflow-hidden relative group">
		<div class="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,rgba(255,255,255,0.05)_20px)] pointer-events-none opacity-20"></div>
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30"><div class="w-full h-[1px] bg-white"></div></div>
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30"><div class="h-full w-[1px] bg-white"></div></div>
		<canvas bind:this={canvas} class="w-full h-full"></canvas>
	</div>
</div>