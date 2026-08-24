<script lang="ts">
	let messages = $state<{ role: string; content: string }[]>([])
	let input = $state('')

	function send(event: SubmitEvent) {
		// push message into messages and reset input
		event?.preventDefault()
		if (input.trim() === '') return
		messages.push({ role: 'user', content: input })
		input = ''
	}
</script>

<div
	class="d-flex flex-column"
	style="height: 600px"
>
	<div class="flex-grow-1 overflow-auto p-3">
		{#each messages as message}
			<div class="mb-2">{message.role}: {message.content}</div>
		{/each}
	</div>
	<form onsubmit={send}>
		<textarea
			class="form-control mb-2"
			rows="3"
			bind:value={input}
		>
		</textarea>
		<button
			type="submit"
			class="btn btn-primary">Send</button
		>
	</form>
</div>
