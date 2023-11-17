<script>
  function throwError() {
    throw new Error("This is an error from a svelte island");
  }

  async function fetchData() {
    const res = await fetch("/api/hello");
    const data = await res.json();
    console.log(data);
  }
</script>

<div style="border: 3px solid orange; padding: 1em">
  <h3>Hi, I'm a svelte island</h3>
  <p>
    Sint id nisi id mollit commodo. Mollit eiusmod nostrud incididunt sunt eu
    sunt aute in do commodo eiusmod cillum do aliqua. Magna non voluptate culpa
    reprehenderit enim dolor officia magna. Cupidatat ex culpa eu minim qui
    voluptate ex.
  </p>
  <button on:click={throwError}>Throw an island error</button>

  <button onclick={fetchData}>Throw a server endpoint error</button>
</div>
