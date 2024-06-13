<script>
	import { browser } from '$app/environment';

	let hydrated = !!browser;
</script>

<svelte:head>
	<title>Errors</title>
	<meta name="description" content="About this app" />
</svelte:head>

<p>Hydrated: <span id="hydrated">{hydrated}</span></p>

<h3>Some Errors...</h3>

<button
	id="errBtn"
	on:click={() => {
		throw new Error('Oh no!');
	}}>Client Side error</button
>
