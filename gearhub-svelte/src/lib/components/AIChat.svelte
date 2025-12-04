<script lang="ts">
	import { onMount } from 'svelte';
	import { gearList } from '$lib/stores';
	import { marked } from 'marked';

	let { show = $bindable(false), toggleAI } = $props<{ show?: boolean; toggleAI: () => void }>();

	let apiKey = $state('');
	let apiStatus = $state(false);
	let userPrompt = $state('');
	let chatHistory = $state<string[]>([]);
	let isLoading = $state(false);
	let showKeyInput = $state(false);
	let chatContainer = $state<HTMLElement>();

	const API_KEY_STORAGE = 'gemini_api_key';

	onMount(() => {
		const savedKey = localStorage.getItem(API_KEY_STORAGE);
		if (savedKey) {
			apiKey = savedKey;
			apiStatus = true;
		}
		// Expose function for inline HTML onclick
		(window as any).addGeneratedItem = addGeneratedItem;
	});

	function toggleKeyInput() {
		showKeyInput = !showKeyInput;
	}

	function saveApiKey() {
		if (apiKey) {
			localStorage.setItem(API_KEY_STORAGE, apiKey);
			apiStatus = true;
			showKeyInput = false;
		}
	}

	function triggerAction(action: string) {
		if (action === 'rate') {
			userPrompt = "Rate my current kit setup and identify any major gaps.";
			askGemini();
		} else if (action === 'recommend') {
			userPrompt = "Recommend a lens for [SCENARIO] considering my current gear.";
		} else if (action === 'add') {
			userPrompt = "Generate JSON for: [PRODUCT NAME]";
		}
	}

	async function askGemini() {
		const prompt = userPrompt;
		if (!prompt) return;
		if (!apiKey) { alert("Please enter your Gemini API Key first."); return; }

		chatHistory = [...chatHistory, `<div class="bg-sony-orange text-white p-2 rounded-lg ml-auto max-w-[80%] mb-2 text-xs shadow-md">${prompt}</div>`];
		userPrompt = '';
		isLoading = true;

		const isJsonRequest = prompt.toLowerCase().includes('generate json');
		let systemContext = `You are an expert photography assistant. My Gear: ${JSON.stringify($gearList)}.`;
		
		if(isJsonRequest) {
			systemContext += `
			TASK: Generate a JSON object for the requested camera gear matching this schema exactly:
			{
				"id": (use Date.now() placeholder),
				"name": "Full Name",
				"type": "Body" or "Prime" or "Zoom",
				"mount": "Mount Name",
				"sensorFormat": "Full Frame" or "APS-C",
				"weight": "000g",
				"filterSize": "00mm" or "N/A",
				"price": 0 (number),
				"image": "URL to a high quality product image",
				"link": "Official product page URL",
				"aperture": "f/2.8" (for lenses),
				"focalLength": "24-70mm" (for lenses),
				"minFocus": "0.xxm",
				"magnification": "0.xx"
			}
			RESPONSE FORMAT: Return ONLY the raw JSON object. No markdown formatting, no backticks.`;
		} else {
			systemContext += ` Answer concisely in markdown. Use bolding for emphasis.`;
		}

		const fullPrompt = `${systemContext} \n\nUser Question: ${prompt}`;

		try {
			const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
				method: 'POST', 
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
			});
			
			const data = await response.json();
			isLoading = false;

			if(data.error) { throw new Error(data.error.message); }

			let aiText = data.candidates[0].content.parts[0].text;

			let aiDiv = `<div class="bg-gray-800 p-3 rounded-lg mr-auto max-w-[90%] border border-gray-700 text-gray-200 shadow-md text-xs overflow-hidden">`;

			if(isJsonRequest) {
				aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
				aiDiv += `<pre class="whitespace-pre-wrap font-mono text-[10px] text-green-400 overflow-x-auto">${aiText}</pre>
				<button onclick='addGeneratedItem(${JSON.stringify(aiText).replace(/'/g, "\\'")})' class="mt-2 w-full bg-gray-700 hover:bg-green-600 text-white text-[10px] py-1 rounded font-mono transition"><iconify-icon icon="lucide:plus"></iconify-icon> ADD TO LIBRARY</button>`;
			} else {
				aiDiv += `<div class="prose prose-invert prose-sm max-w-none">${marked.parse(aiText)}</div>`;
			}

			aiDiv += `</div>`;

			chatHistory = [...chatHistory, aiDiv];

		} catch (error) {
			isLoading = false;
			chatHistory = [...chatHistory, `<div class="text-red-500 text-xs bg-red-900/20 p-2 rounded border border-red-900">Error: ${(error as Error).message}</div>`];
		}
	}

	function addGeneratedItem(itemData: string) {
		try {
			const item = JSON.parse(itemData);
			item.id = Date.now();
			$gearList.push(item);
			chatHistory = [...chatHistory, `<div class="text-green-500 text-[10px] text-center my-2">Successfully added ${item.name}</div>`];
		} catch (e) {
			console.error('Invalid JSON', e);
		}
	}
</script>

{#if show}
	<div class="fixed bottom-24 right-6 z-40 flex flex-col items-end">
		<div class="w-80 md:w-96 glass-panel rounded-xl shadow-2xl overflow-hidden mb-4 border border-gray-700 flex flex-col h-[500px]">
			<div class="bg-neutral-900 p-3 flex justify-between items-center border-b border-gray-700">
				<div class="flex items-center gap-2">
					<span class="font-mono text-xs text-sony-orange">AI_ASSISTANT v2.0</span>
					<div class="w-2 h-2 rounded-full {apiStatus ? 'bg-green-500' : 'bg-red-500'}" title={apiStatus ? "API Key Active" : "API Key Missing"}></div>
				</div>
				<div class="flex gap-2">
					<button onclick={toggleKeyInput} class="text-gray-400 hover:text-white text-xs" title="Settings"><iconify-icon icon="lucide:settings"></iconify-icon></button>
					<button onclick={toggleAI} class="text-gray-400 hover:text-white" aria-label="Close AI chat"><iconify-icon icon="lucide:x"></iconify-icon></button>
				</div>
			</div>
			
			{#if showKeyInput}
				<div class="p-3 bg-black border-b border-gray-800">
					<div class="flex gap-2">
						<input bind:value={apiKey} type="password" placeholder="Enter Gemini API Key..." class="flex-grow bg-neutral-900 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-sony-orange outline-none">
						<button onclick={saveApiKey} class="text-xs bg-sony-orange text-white px-2 rounded">SAVE</button>
					</div>
				</div>
			{/if}

			<div class="flex-grow overflow-y-auto p-4 space-y-3 bg-black/50 text-xs" bind:this={chatContainer}>
				{#if chatHistory.length === 0}
					<div class="text-gray-500 italic text-[10px] text-center mt-4">Ready to analyze your gear.</div>
				{/if}
				{#each chatHistory as msg}
					{@html msg}
				{/each}
				{#if isLoading}
					<div class="flex gap-1">
						<div class="w-1.5 h-1.5 bg-sony-orange rounded-full animate-bounce"></div>
						<div class="w-1.5 h-1.5 bg-sony-orange rounded-full animate-bounce delay-75"></div>
						<div class="w-1.5 h-1.5 bg-sony-orange rounded-full animate-bounce delay-150"></div>
					</div>
				{/if}
			</div>

			<div class="px-3 py-2 bg-neutral-900/50 border-t border-gray-800 flex gap-2 overflow-x-auto no-scrollbar">
				<button onclick={() => triggerAction('add')} class="whitespace-nowrap bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-2 py-1 rounded text-[10px] font-mono">
					<iconify-icon icon="lucide:plus" class="text-sony-orange"></iconify-icon> ADD GEAR
				</button>
				<button onclick={() => triggerAction('recommend')} class="whitespace-nowrap bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-2 py-1 rounded text-[10px] font-mono">
					<iconify-icon icon="lucide:lightbulb" class="text-yellow-500"></iconify-icon> RECOMMEND
				</button>
				<button onclick={() => triggerAction('rate')} class="whitespace-nowrap bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-2 py-1 rounded text-[10px] font-mono">
					<iconify-icon icon="lucide:star-half" class="text-purple-500"></iconify-icon> RATE KIT
				</button>
			</div>

			<div class="p-3 bg-neutral-900 border-t border-gray-700">
				<div class="flex gap-2">
					<input bind:value={userPrompt} type="text" placeholder="Ask about your kit..." class="flex-grow bg-black border border-gray-700 rounded px-2 py-1 text-xs text-white outline-none focus:border-sony-orange" onkeypress={(e) => { if(e.key === 'Enter') askGemini() }}>
					<button onclick={askGemini} class="text-sony-orange hover:text-white" aria-label="Send message"><iconify-icon icon="lucide:arrow-right"></iconify-icon></button>
				</div>
			</div>
		</div>
		<button onclick={toggleAI} class="bg-neutral-900 border border-sony-orange text-white p-3 rounded-full shadow-lg hover:bg-sony-orange transition w-12 h-12 flex items-center justify-center group relative" aria-label="Toggle AI chat">
			<iconify-icon icon="lucide:bot" class="group-hover:animate-pulse"></iconify-icon>
			<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-black {!apiStatus ? '' : 'hidden'}"></div>
		</button>
	</div>
{/if}