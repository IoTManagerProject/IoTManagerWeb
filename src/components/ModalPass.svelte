<script>
  export let show = true;
  export let pass;
  export let checkPassword = (pass) => {};

  import Card from "../components/Card.svelte";
</script>

<div class="modal">
  {#if show}
    <!-- This example requires Tailwind CSS v2.0+ -->
    <div class="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" />
        <!-- This element is to trick the browser into centering the modal contents. -->
        <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div class="inline-block align-bottom bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <Card>
            <div class="flex items-center mb-4">
              <div class="w-1/2">
                <h2 class="pr-4 text-gray-500 font-bold text-xxl truncate">Введите пароль</h2>
              </div>
              <div class="flex justify-center w-1/2">
                <input bind:value={pass} class="ipt-rnd text-center focus:border-indigo-500" />
              </div>
            </div>
            <div class="grd-2col1">
              <button class="btn-lg">{"Закрыть"}</button>
              <button class="btn-lg" on:click={() => checkPassword(pass)}>{"Вход"}</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  {/if}
</div>
