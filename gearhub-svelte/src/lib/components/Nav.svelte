<script lang="ts">
	import { gearList, saveToLocal } from '$lib/stores';
	import { onMount } from 'svelte';

	let { openModal } = $props<{ openModal: () => void }>();
	let isLightMode = $state(false);

	onMount(() => {
		const savedTheme = localStorage.getItem('theme');
		if (savedTheme === 'light') {
			isLightMode = true;
			document.documentElement.classList.add('light');
		}
	});

	function toggleTheme() {
		isLightMode = !isLightMode;
		if (isLightMode) {
			document.documentElement.classList.add('light');
			localStorage.setItem('theme', 'light');
		} else {
			document.documentElement.classList.remove('light');
			localStorage.setItem('theme', 'dark');
		}
	}

	function clearCache() {
		localStorage.removeItem('my_lens_db_v5');
		location.reload();
	}

	function downloadJSON() {
		const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify($gearList, null, 2));
		const downloadAnchorNode = document.createElement('a');
		downloadAnchorNode.setAttribute("href", dataStr);
		downloadAnchorNode.setAttribute("download", "lenses.json");
		document.body.appendChild(downloadAnchorNode);
		downloadAnchorNode.click();
		downloadAnchorNode.remove();
	}
</script>

<nav class="border-b border-white/10 bg-black/80 backdrop-blur-md sticky top-0 z-50">
	<div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
		<div class="flex items-center gap-3 group cursor-default">
			<div class="w-10 h-10 rounded bg-gray-900 border border-gray-700 flex items-center justify-center group-hover:border-sony-orange transition-colors shadow-lg relative overflow-hidden">
				<div class="absolute inset-0 bg-sony-orange opacity-0 group-hover:opacity-10 transition-opacity"></div>
				<iconify-icon icon="lucide:camera" class="text-sony-orange text-lg"></iconify-icon>
			</div>
			<div>
				<h1 class="text-xl font-black tracking-widest text-white font-mono leading-none">GEAR<span class="font-light text-gray-400">HUB</span></h1>
				<div class="flex items-center gap-2 mt-1">
					<div class="h-0.5 w-3 bg-sony-orange"></div>
					<span class="text-[9px] text-gray-500 font-mono tracking-[0.3em] uppercase">Database</span>
				</div>
			</div>
		</div>
		<div class="flex items-center gap-4">
			<button onclick={toggleTheme} class="text-gray-500 hover:text-white transition" title="Toggle Theme">
				<iconify-icon icon={isLightMode ? "lucide:moon" : "lucide:sun"}></iconify-icon>
			</button>
			<button onclick={clearCache} class="text-xs text-red-500 hover:text-red-400 border border-red-900/50 px-2 py-1 rounded" title="Reload File"><iconify-icon icon="lucide:rotate-cw"></iconify-icon></button>
			<button onclick={openModal} class="hover:text-sony-orange transition" aria-label="Add gear"><iconify-icon icon="lucide:plus"></iconify-icon></button>
			<button onclick={downloadJSON} class="hover:text-sony-orange transition" aria-label="Download JSON"><iconify-icon icon="lucide:download"></iconify-icon></button>
		</div>
	</div>
</nav>