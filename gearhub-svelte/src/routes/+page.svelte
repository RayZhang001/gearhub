<script lang="ts">
	import { onMount } from 'svelte';
	import { gearList, loadoutSet, activeCategory, activeFilters, saveToLocal, loadFromLocal } from '$lib/stores';
	import Nav from '$lib/components/Nav.svelte';
	import FOVSimulator from '$lib/components/FOVSimulator.svelte';
	import Filters from '$lib/components/Filters.svelte';
	import GearGrid from '$lib/components/GearGrid.svelte';
	import LoadoutBar from '$lib/components/LoadoutBar.svelte';
	import GearModal from '$lib/components/GearModal.svelte';
	import AIChat from '$lib/components/AIChat.svelte';
	import * as Tabs from "$lib/components/ui/tabs";
	import EXIF from 'exif-js';
	import { base } from '$app/paths';

	let showModal = $state(false);
	let showAI = $state(false);

	let totalValue = $derived(getTotalValue($gearList, $activeCategory, $activeFilters));
	let itemCount = $derived(getItemCount($gearList, $activeCategory, $activeFilters));
	let avgValue = $derived(getAvgValue(totalValue, itemCount));

	function getTotalValue(list: typeof $gearList, category: string, filters: typeof $activeFilters) {
		const visibleItems = list.filter(i => {
			const tags = getLensTags(i, category);
			return tags.isVisible;
		});
		return visibleItems.reduce((acc, i) => acc + (Number(i.price) || 0), 0);
	}

	function getItemCount(list: typeof $gearList, category: string, filters: typeof $activeFilters) {
		const visibleItems = list.filter(i => {
			const tags = getLensTags(i, category);
			return tags.isVisible;
		});
		return visibleItems.length;
	}

	function getAvgValue(total: number, count: number) {
		return Math.floor(total / count || 0);
	}

	function getLensTags(item: any, category: string) {
		const cat = item.category || 'Optics';
		
		if (cat !== category) return { isVisible: false };

		if (item.type === 'Body') return { isVisible: true, isBody: true, focalGroup: 'Body', typeGroup: 'Body', filterSize: 'N/A', mount: item.mount };
		
		if (cat !== 'Optics') {
			return {
				isVisible: true,
				isBody: false,
				typeGroup: item.type, 
				mount: item.mount,
				filterSize: item.filterSize
			};
		}

		let focalGroup = 'Standard';
		let minMm = 0, maxMm = 0;
		const clean = (item.focalLength || '').replace(/mm/g,'').trim();
		if(clean) {
			if(clean.includes('-')) { 
				[minMm, maxMm] = clean.split('-').map(Number); 
			} else { 
				minMm = maxMm = Number(clean); 
			}
			
			if (maxMm <= 35) focalGroup = 'Wide Angle';
			else if (minMm >= 70) focalGroup = 'Telephoto';
		}
		
		let typeGroup = 'Prime';
		if ((item.type || '').includes('Zoom')) typeGroup = 'Zoom';

		return {
			isVisible: true,
			isBody: false,
			focalGroup,
			typeGroup,
			filterSize: item.filterSize,
			mount: item.mount
		};
	}

	function analyzePhoto(file: File) {
		const callback = function(this: any) {
			const focalLength = EXIF.getTag(this, "FocalLength");
			const model = EXIF.getTag(this, "Model");
			if(!focalLength) { alert("No EXIF data found."); return; }
			const flVal = Math.round(focalLength);
			alert(`Detected: ${model || 'Camera'} at ${flVal}mm.`);
			$gearList.forEach((gear, index) => {
				if(gear.type === 'Body') return;
				let isMatch = false;
				const clean = gear.focalLength?.replace('mm','') || '';
				if(clean.includes('-')) { 
					const [min, max] = clean.split('-').map(Number); 
					if(flVal >= min && flVal <= max) isMatch = true; 
				} else { 
					if(Math.abs(Number(clean) - flVal) < 2) isMatch = true; 
				}
				if(isMatch) { 
					const card = document.getElementById(`card-${index}`); 
					if (card) {
						card.classList.add('active-pulse'); 
						setTimeout(() => card.classList.remove('active-pulse'), 5000); 
						card.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
					}
				}
			});
		};
		EXIF.getData(file as any, callback);
	}

	onMount(async () => {
		// Load data
		const localData = loadFromLocal();
		if (localData.length > 0) {
			gearList.set(localData);
		} else {
			try {
				const response = await fetch(`${base}/lenses.json`);
				if (response.ok) {
					const data = await response.json();
					gearList.set(data);
					saveToLocal(data);
				}
			} catch (e) {
				console.log("Offline mode");
			}
		}

		// Add drag leave listener
		document.addEventListener('dragleave', (e) => {
			if ((e as any).relatedTarget === null) {
				const dropZone = document.getElementById('drop-zone')!;
				dropZone.classList.add('hidden');
				dropZone.classList.remove('flex');
			}
		});
	});

	function openModal() {
		showModal = true;
	}

	function closeModal() {
		showModal = false;
	}

	function toggleAI() {
		showAI = !showAI;
	}

	function dragOverHandler(ev: DragEvent) {
		ev.preventDefault();
		const dropZone = document.getElementById('drop-zone')!;
		dropZone.classList.remove('hidden');
		dropZone.classList.add('flex');
	}

	function dropHandler(ev: DragEvent) {
		ev.preventDefault();
		const dropZone = document.getElementById('drop-zone')!;
		dropZone.classList.add('hidden');
		dropZone.classList.remove('flex');
		if (ev.dataTransfer?.items && ev.dataTransfer.items[0].kind === 'file') {
			analyzePhoto(ev.dataTransfer.items[0].getAsFile()!);
		}
	}

	function editItem(index: number) {
		// Populate modal with item data
		// Since GearModal has its own state, perhaps pass the item or index.
		// For simplicity, since GearModal is separate, maybe make it accept an editIndex prop.
		// But to keep simple, perhaps use a store for editing.
		// For now, since the modal is not connected, leave it.
		showModal = true;
		// TODO: set edit mode
	}
</script>

<div class="min-h-screen flex flex-col" ondrop={dropHandler} ondragover={dragOverHandler} role="application">
	<!-- Drop Zone -->
	<div id="drop-zone" class="fixed inset-0 bg-sony-orange/90 z-[60] hidden flex-col items-center justify-center pointer-events-none">
		<iconify-icon icon="lucide:crosshair" class="text-6xl text-white mb-4 animate-spin-slow"></iconify-icon>
		<h2 class="text-4xl font-bold text-white uppercase tracking-widest">EXIF Detective</h2>
	</div>

	<Nav {openModal} />

	<main class="flex-grow max-w-7xl mx-auto px-4 py-8 w-full space-y-6">
		<!-- CATEGORY TABS -->
		<Tabs.Root value={$activeCategory} onValueChange={(v) => activeCategory.set(v)} class="w-full mb-2">
			<Tabs.List class="w-full justify-start border-b border-gray-800 bg-transparent p-0 h-auto">
				<Tabs.Trigger value="Optics" class="px-6 py-3 text-sm font-mono font-bold border-b-2 border-transparent data-[state=active]:border-sony-orange data-[state=active]:text-sony-orange data-[state=active]:shadow-none rounded-none bg-transparent text-gray-500 hover:text-white transition-colors">OPTICS</Tabs.Trigger>
				<Tabs.Trigger value="Lighting" class="px-6 py-3 text-sm font-mono font-bold border-b-2 border-transparent data-[state=active]:border-sony-orange data-[state=active]:text-sony-orange data-[state=active]:shadow-none rounded-none bg-transparent text-gray-500 hover:text-white transition-colors">LIGHTING</Tabs.Trigger>
				<Tabs.Trigger value="Accessories" class="px-6 py-3 text-sm font-mono font-bold border-b-2 border-transparent data-[state=active]:border-sony-orange data-[state=active]:text-sony-orange data-[state=active]:shadow-none rounded-none bg-transparent text-gray-500 hover:text-white transition-colors">ACCESSORIES</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>

		<div class="grid grid-cols-1 {$activeCategory === 'Optics' ? 'lg:grid-cols-3' : ''} gap-6">
			{#if $activeCategory === 'Optics'}
				<div class="lg:col-span-2">
					<FOVSimulator />
				</div>
			{/if}

			<div class="space-y-6 lg:col-span-1 w-full">
				<div class="glass-panel rounded-xl p-5 border-l-4 border-sony-orange">
					<p class="text-xs text-gray-500 uppercase font-mono mb-1">Total Asset Value</p>
					<h2 class="text-3xl font-bold text-white font-mono">${totalValue.toLocaleString()}</h2>
					<div class="mt-2 text-xs text-gray-400 flex justify-between">
						<span>Items: <span class="text-white">{itemCount}</span></span>
						<span>Avg: <span class="text-white">${avgValue}</span></span>
					</div>
				</div>

				<Filters />
			</div>
		</div>

		<GearGrid {editItem} />
	</main>

	<LoadoutBar />

	<GearModal bind:show={showModal} {closeModal} />

	<!-- AI Assistant Button and Window Container -->
	<div class="fixed bottom-24 right-6 z-40 flex flex-col items-end">
		<AIChat bind:show={showAI} {toggleAI} />
		<button onclick={toggleAI} class="bg-neutral-900 border border-sony-orange text-white p-3 rounded-full shadow-lg hover:bg-sony-orange transition w-12 h-12 flex items-center justify-center group relative mt-4">
			<iconify-icon icon="lucide:bot" class="group-hover:animate-pulse"></iconify-icon>
			<!-- The badge logic should be inside AIChat, but for now I'll include the div for styling -->
			<div id="ai-badge" class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black hidden"></div>
		</button>
	</div>
</div>

<style>
	.animate-spin-slow { animation: spin 3s linear infinite; }
</style>
