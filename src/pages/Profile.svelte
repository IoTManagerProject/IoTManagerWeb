<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";
  import { onMount } from "svelte";
  import { t, locale, locales } from "../i18n";
  export let show;
  export let myProfileJson;

  let errors = [];
  let allmodeinfo = null;

  onMount(async () => {
    await getModInfo();
  });

  const getModInfo = async () => {
    try {
      let res = await fetch("https://portal.iotmanager.org/compiler/allmodinfo", {
        mode: "cors",
        method: "GET",
      });
      if (res.ok) {
        allmodeinfo = await res.json();
        allmodeinfo = allmodeinfo.message;
      } else {
        console.log("error", res.statusText);
      }
    } catch (e) {
      console.log("error", e);
    }
  };

  const post = async (user) => {
    errors = [];
    try {
      let res = await fetch("https://portal.iotmanager.org/api/auth/login", {
        mode: "cors",
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      const content = await res.json();
      //console.log(content);
      if (res.ok) {
        errors = [{ msg: "ok_success_login" }];
        saveToken(content.message);
      } else {
        errors = content.message;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const saveToken = async (token) => {
    console.log("token to be saved: ", token);
  };
</script>

{#if show}
  {#if allmodeinfo && myProfileJson}
    <div class="my-4">
      <div class="grd-1col1">
        <Card title={myProfileJson.projectProp.platformio.default_envs}>
          <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-12 gap-4">
            {#each myProfileJson.modules.virtual_elments as m, i}
              {#if allmodeinfo[m.path]?.usedLibs[myProfileJson.projectProp.platformio.default_envs]}
                <div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <p on:click={() => (m.active = !m.active)} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                </div>
              {/if}
            {/each}
            {#each myProfileJson.modules.sensors as m, i}
              {#if allmodeinfo[m.path]?.usedLibs[myProfileJson.projectProp.platformio.default_envs]}
                <div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <p on:click={() => (m.active = !m.active)} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                </div>
              {/if}
            {/each}
            {#each myProfileJson.modules.executive_devices as m, i}
              {#if allmodeinfo[m.path]?.usedLibs[myProfileJson.projectProp.platformio.default_envs]}
                <div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <p on:click={() => (m.active = !m.active)} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                </div>
              {/if}
            {/each}
            {#each myProfileJson.modules.screens as m, i}
              {#if allmodeinfo[m.path]?.usedLibs[myProfileJson.projectProp.platformio.default_envs]}
                <div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <p on:click={() => (m.active = !m.active)} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                </div>
              {/if}
            {/each}
          </div></Card>
      </div>
    </div>
  {:else}
    <div class="my-4">
      <div class="grd-1col1">
        <Card title="Сервер недоступен" />
      </div>
    </div>
  {/if}
{:else}
  <Alarm title="Загрузка..." />
{/if}
