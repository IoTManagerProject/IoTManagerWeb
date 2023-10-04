<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";
  import { onMount } from "svelte";
  import { router } from "tinro";
  import { t, locale, locales } from "../i18n";
  import Cookies from "js-cookie";
  export let show;
  export let myProfileJson;
  export let userdata;

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

  const update = async () => {
    const JWT = Cookies.get("token_iotm2");
    try {
      let res = await fetch("https://portal.iotmanager.org/compiler/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT}`,
        },
        body: JSON.stringify(myProfileJson),
      });
      const content = await res.json();
      //console.log(content);
      if (res.ok) {
        errors = [{ msg: "ok_success" }];
        console.log(content.message);
      } else {
        errors = content.message;
      }
    } catch (e) {
      console.log(e);
    }
  };

  const exit = async () => {
    Cookies.remove("token_iotm2");
    router.goto("/login");
    location.reload();
  };
</script>

{#if show}
  {#if allmodeinfo && myProfileJson}
    <div class="my-4">
      <div class="grd-1col1">
        <Card title="">
          <div class="grid grid-cols-2">
            <p class="text-center">{myProfileJson.projectProp.platformio.default_envs}</p>
            <p class="text-center">{userdata.username}</p>
          </div>
          <div class="grid my-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-12 gap-4">
            {#each myProfileJson.modules.virtual_elments as m, i}
              {#if allmodeinfo[m.path]?.usedLibs[myProfileJson.projectProp.platformio.default_envs]}
                <div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <p on:click={() => ((m.active = !m.active), (m.touched = true))} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none {m.touched ? 'border border-gray-400' : 'border border-green-100'} text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                </div>
              {/if}
            {/each}
            {#each myProfileJson.modules.sensors as m, i}
              {#if allmodeinfo[m.path]?.usedLibs[myProfileJson.projectProp.platformio.default_envs]}
                <div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <p on:click={() => ((m.active = !m.active), (m.touched = true))} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none {m.touched ? 'border border-gray-400' : 'border border-green-100'} text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                </div>
              {/if}
            {/each}
            {#each myProfileJson.modules.executive_devices as m, i}
              {#if allmodeinfo[m.path]?.usedLibs[myProfileJson.projectProp.platformio.default_envs]}
                <div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <p on:click={() => ((m.active = !m.active), (m.touched = true))} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none {m.touched ? 'border border-gray-400' : 'border border-green-100'} text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                </div>
              {/if}
            {/each}
            {#each myProfileJson.modules.screens as m, i}
              {#if allmodeinfo[m.path]?.usedLibs[myProfileJson.projectProp.platformio.default_envs]}
                <div>
                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                  <p on:click={() => ((m.active = !m.active), (m.touched = true))} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none {m.touched ? 'border border-gray-400' : 'border border-green-100'} text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                </div>
              {/if}
            {/each}
          </div>
          {#each errors as e, i}
            <p class="text-red-500 p-0 m-0 font-bold text-xs italic">{$t(e.msg)}</p>
          {/each}
          <button class="btn-lg mt-6" on:click={() => update()}>{$t("profile.update")}</button>
          <button class="btn-lg mt-6" on:click={() => exit()}>{$t("profile.exit")}</button>
        </Card>
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
