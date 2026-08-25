<script lang="ts">
	import { Chat } from '@ai-sdk/svelte'
	import { DefaultChatTransport } from 'ai'

	const chat = new Chat({
		transport: new DefaultChatTransport({ api: '/api/ai-chat/stream' }),
	})
	let input = $state('')

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
