<script>
  import Card from "../components/Card.svelte";

  export let coreMessages;
</script>

<Card title={"Лог"}>
  {#each coreMessages as message, i}
    <div class={message.msg.toString().includes("[E]") ? "text-red-500" : "text-black"}>{message.msg}</div>
  {/each}
</Card>
