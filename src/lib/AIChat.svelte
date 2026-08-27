<script lang="ts">
	import { Chat } from '@ai-sdk/svelte'
	import { DefaultChatTransport } from 'ai'
	import { untrack } from 'svelte'

	// `api` = the URL the chat POSTs to. Defaults to the demo route, but each host
	// app can override it to wherever it mounted its own server adapter.
	let { api = '/api/ai-chat/stream' }: { api?: string } = $props()

	let input = $state('')

	// Chat is reactive, handles the collected messages for us so chat.messages is reactive
	const chat = new Chat({
		// `transport` = where to send messages. Without it, Chat POSTs to
		// `/api/chat` by default; we point it at our own route instead.
		// `untrack` reads `api` once, on purpose: it's mount-time config, not a
		// value we re-read when the parent changes it.
		transport: new DefaultChatTransport({ api: untrack(() => api) }),
	})

	function send(event: SubmitEvent) {
		event.preventDefault()
		if (input.trim() === '') return
		chat.sendMessage({ text: input })
		input = ''
	}
</script>

<div
	class="d-flex flex-column"
	style="height: 600px"
>
	<div class="flex-grow-1 overflow-auto p-3">
		{#each chat.messages as message (message.id)}
			<div class="mb-2">
				{message.role}:
				{#each message.parts as part, i (i)}
					{#if part.type === 'text'}{part.text}{/if}
				{/each}
			</div>
		{/each}
	</div>
	<form onsubmit={send}>
		<textarea
			class="form-control mb-2"
			rows="3"
			bind:value={input}
		></textarea>
		<button
			type="submit"
			class="btn btn-primary">Send</button
		>
	</form>
</div>
