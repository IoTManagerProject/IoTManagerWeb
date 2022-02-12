<script>
  let dataReceived;
  let awaiting = 0;

  async function awaitingData() {
    console.log("Awaiting Data start...");
    return new Promise(function (resolve, reject) {
      setTimeout(() => reject(), 10000);
      dataReceived = resolve;
    });
  }

  function startAwaiting() {
    awaiting = awaitingData();
  }

  function onReceive() {
    dataReceived();
  }
</script>

{#await awaiting}
  <p>Connecting...</p>
  <button on:click={() => onReceive()}>Resolve</button>
{:then}
  <button on:click={() => startAwaiting()}>Start</button>
{:catch}
  <p>error</p>
{/await}
