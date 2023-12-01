<svelte:head>
	<title>Errors</title>
	<meta name="description" content="About this app" />
</svelte:head>

<h3>Some Errors...</h3>

<button
	on:click={() => {
		throw new Error('Oh no!');
	}}>Client Side error</button
>
