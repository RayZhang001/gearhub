<script lang="ts">
	import { onMount } from 'svelte';
	import { gearList, loadoutSet, activeCategory } from '$lib/stores';
	import type { GearItem } from '$lib/stores';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let baseMm = $state(16); // Default base focal length (wide end)
	let hoverClipPath = $state('inset(100% 100% 100% 100%)'); // Default hidden
	let hoveredMm = $state<number | null>(null);
	
	// Cosine easing for a perfectly smooth, gradual transition
	// Starts at 3px (12mm), passes through 1.5px (206mm), eases to 0px (400mm)
	let blurAmount = $derived(1.5 * (1 + Math.cos(Math.PI * (baseMm - 12) / 388)));
	
	let hitRegions: { x: number, y: number, w: number, h: number, mm: number }[] = [];

	const COLOR_PALETTE = ['#D44500', '#00FF99', '#FF00FF', '#FFFF00', '#00CCFF'];

	// Reactive re-draw when dependencies change
	$effect(() => {
		drawFOV($gearList, $loadoutSet, $activeCategory, baseMm);
	});

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = e.deltaY > 0 ? 2 : -2;
		let newBase = baseMm + delta;
		if (newBase < 12) newBase = 12;
		if (newBase > 400) newBase = 400;
		baseMm = newBase;
	}

	function handleMouseMove(e: MouseEvent) {
		const rect = canvas.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		// Find smallest rect containing mouse
		let bestMatch = null;
		
		for (const region of hitRegions) {
			if (x >= region.x && x <= region.x + region.w && y >= region.y && y <= region.y + region.h) {
				if (!bestMatch || (region.w * region.h < bestMatch.w * bestMatch.h)) {
					bestMatch = region;
				}
			}
		}

		if (bestMatch) {
			const top = Math.max(0, bestMatch.y);
			const left = Math.max(0, bestMatch.x);
			const right = Math.max(0, rect.width - (bestMatch.x + bestMatch.w));
			const bottom = Math.max(0, rect.height - (bestMatch.y + bestMatch.h));
			hoverClipPath = `inset(${top}px ${right}px ${bottom}px ${left}px)`;
			hoveredMm = bestMatch.mm;
		} else {
			hoverClipPath = 'inset(100% 100% 100% 100%)';
			hoveredMm = null;
		}
	}

	function handleMouseLeave() {
		hoverClipPath = 'inset(100% 100% 100% 100%)';
		hoveredMm = null;
	}

	function drawFOV(list: GearItem[], loadout: Set<number>, category: string, currentBaseMm: number) {
		if (!ctx) return;
		hitRegions = []; // Clear hit regions
		
		const rect = canvas.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);
		const w = rect.width;
		const h = rect.height;
		ctx.clearRect(0, 0, w, h);

		// Always draw ALL items, but style them differently
		const activeIndices = Array.from(loadout);
		
		// Sort active items to end so they draw on top? Or just draw them thicker.
		// We want to iterate all items.
		list.forEach((item, index) => {
			if(item.type === 'Body') return;
			
			// Determine style
			const isSelected = loadout.has(index);
			let color = 'rgba(255, 255, 255, 0.15)';
			let lineWidth = 1;
			
			if (isSelected) {
				// Find index in activeIndices to assign consistent color
				const activeIdx = activeIndices.indexOf(index);
				color = COLOR_PALETTE[activeIdx % COLOR_PALETTE.length];
				lineWidth = 2;
			}

			let minMm, maxMm;
			const clean = item.focalLength?.replace('mm','').trim() || '';
			if(clean.includes('-')) { [minMm, maxMm] = clean.split('-').map(Number); } 
			else { minMm = maxMm = Number(clean); }

			const drawRect = (mm: number) => {
				const scale = currentBaseMm / mm; 
				const rw = w * scale; const rh = h * scale;
				const rx = (w - rw) / 2; const ry = (h - rh) / 2;
				
				ctx.beginPath(); ctx.rect(rx, ry, rw, rh);
				ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.stroke();
				
				// Register hit region
				hitRegions.push({ x: rx, y: ry, w: rw, h: rh, mm });

				// Draw text only for selected items or if we want to clutter
				if (isSelected && scale < 5) {
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
		window.addEventListener('resize', () => drawFOV($gearList, $loadoutSet, $activeCategory, baseMm));
	});
</script>

<div class="bg-black/40 rounded-xl p-4 border border-gray-800 flex flex-col justify-center transition-all duration-500">
	<div class="mb-2 flex justify-between items-center px-2">
		<div class="flex flex-col">
			<h3 class="text-xs font-bold text-sony-orange uppercase tracking-wider font-mono"><iconify-icon icon="lucide:layers"></iconify-icon> FOCAL FIELD SIMULATOR</h3>
			<span class="text-[10px] text-gray-500 font-mono">BASE: {baseMm}mm</span>
		</div>
		
		<div class="flex items-center gap-2 w-1/3">
			<span class="text-[10px] text-gray-500 font-mono">ZOOM</span>
			<input type="range" min="12" max="400" step="2" bind:value={baseMm} class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-sony-orange">
		</div>
	</div>
	<!-- Container with wheel listener -->
	<div class="w-full max-w-[600px] aspect-[3/2] mx-auto border border-gray-700 shadow-2xl overflow-hidden relative group"
	     onwheel={handleWheel}
	     onmousemove={handleMouseMove}
	     onmouseleave={handleMouseLeave}
	     role="img" aria-label="Focal length simulator">
		
		<!-- Blurred Background Layer -->
		<div class="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
			<img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop"
			     alt="FOV background blur"
			     style:transform={`scale(${baseMm / 16})`}
			     style:filter={`blur(${blurAmount}px) brightness(0.75)`}
			     class="w-full h-full object-cover origin-center transition-transform duration-100">
		</div>

		<!-- Sharp Background Layer (Clipped) -->
		<div class="absolute inset-0 w-full h-full overflow-hidden pointer-events-none transition-all duration-200 ease-out"
		     style:clip-path={hoverClipPath}>
			<img src="https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop"
			     alt="FOV background sharp"
			     style:transform={`scale(${baseMm / 16})`}
			     class="w-full h-full object-cover origin-center transition-transform duration-100">
		</div>
		
		<!-- Existing overlays -->
		<div class="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_19px,rgba(255,255,255,0.05)_20px)] pointer-events-none opacity-20"></div>
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30"><div class="w-full h-[1px] bg-white"></div></div>
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30"><div class="h-full w-[1px] bg-white"></div></div>
		
		<!-- Canvas for drawing FOV rectangles -->
		<canvas bind:this={canvas} class="w-full h-full relative z-10"></canvas>

		<!-- Hover Text Overlay -->
		{#if hoveredMm}
			<div class="absolute top-2 left-2 z-20 bg-black/70 backdrop-blur-md border border-sony-orange text-white px-2 py-1 rounded text-xs font-mono font-bold pointer-events-none shadow-lg">
				{hoveredMm}mm
			</div>
		{/if}
	</div>
</div>