<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";
  import { onMount } from "svelte";
  import { router } from "tinro";
  import { t, locale, locales } from "../i18n";
  import Cookies from "js-cookie";
  export let show;
  export let flashProfileJson;
  export let otaJson;
  export let allmodeinfo;
  export let profile;

  export let serverOnline;

  export let userdata;
  export let updateBuild = (path) => {};
  import CrossIcon from "../svg/Cross.svelte";
  let errors = [];
  let userBuilds = null;
  var updateInterval;

  onMount(async () => {
    await getUserBuilds();
  });

  const st = {
    0: "",
    1: "В процессе",
    2: "Ок",
    3: "Ошибка",
  };

  function checkStatus(userBuilds) {
    if (userBuilds.length) {
      if (userBuilds[0].processed) {
        clearInterval(updateInterval);
        console.log("no interval - all task done");
      } else {
        console.log("non completed task exist!");
        if (!updateInterval) {
          console.log("interval checking started");
          updateInterval = setInterval(periodicTask, 10000);
        }
      }
    }
  }

  const periodicTask = async () => {
    await getUserBuilds();
  };

  const getUserBuilds = async () => {
    try {
      const JWT = Cookies.get("token_iotm2");
      let res = await fetch("https://portal.iotmanager.org/compiler/userorders", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT}`,
        },
        mode: "cors",
        method: "GET",
      });
      if (res.ok) {
        userBuilds = await res.json();
        checkStatus(userBuilds);
      } else {
        console.log("error", res.statusText);
      }
    } catch (e) {
      console.log("error", e);
    }
  };

  const delBuild = async (ord) => {
    try {
      const JWT = Cookies.get("token_iotm2");
      let res = await fetch("https://portal.iotmanager.org/compiler/delete/builds/" + ord.orderId, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT}`,
        },
        mode: "cors",
        method: "GET",
      });
      if (res.ok) {
        await getUserBuilds();
      } else {
        console.log("error", res.statusText);
      }
    } catch (e) {
      console.log("error", e);
    }
  };

  const placeOrder = async () => {
    delete profile["_id"];
    //добавим в тело имя пользователя
    profile.username = userdata.username;
    const JWT = Cookies.get("token_iotm2");
    try {
      let res = await fetch("https://portal.iotmanager.org/compiler/order", {
        mode: "cors",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT}`,
        },
        body: JSON.stringify(profile),
      });
      const content = await res.json();
      if (res.ok) {
        errors = [{ msg: "ok_success" }];
        await getUserBuilds();
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

  const showLog = async (ord, file) => {};
</script>

{#if show}
  {#if serverOnline}
    {#if allmodeinfo && flashProfileJson && profile}
      <div class="my-4">
        <div class="grd-1col1">
          <Card title="">
            <div class="grid grid-cols-2">
              <p class="text-center text-gray-500 font-bold">{flashProfileJson.projectProp.platformio.default_envs}</p>
              <p class="text-center text-gray-500 font-bold">{userdata.username}</p>
            </div>
            <div class="grid my-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-12 gap-4">
              <!--{#each Object.entries(allmodeinfo) as [key, param]}
              <div>
               
                <p class="cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{key.substring(key.lastIndexOf("/") + 1, key.length)}</p>
              </div>
            {/each}-->

              {#each profile.modules.virtual_elments as m, i}
                {#if allmodeinfo[m.path]?.usedLibs[profile.projectProp.platformio.default_envs]}
                  <div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <p on:click={() => (m.active = !m.active)} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                  </div>
                {/if}
              {/each}
              {#each profile.modules.sensors as m, i}
                {#if allmodeinfo[m.path]?.usedLibs[profile.projectProp.platformio.default_envs]}
                  <div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <p on:click={() => (m.active = !m.active)} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                  </div>
                {/if}
              {/each}
              {#each profile.modules.executive_devices as m, i}
                {#if allmodeinfo[m.path]?.usedLibs[profile.projectProp.platformio.default_envs]}
                  <div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <p on:click={() => (m.active = !m.active)} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                  </div>
                {/if}
              {/each}
              {#each profile.modules.screens as m, i}
                {#if allmodeinfo[m.path]?.usedLibs[profile.projectProp.platformio.default_envs]}
                  <div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <p on:click={() => (m.active = !m.active)} class="{m.active ? 'bg-green-100' : ''} cursor-pointer select-none text-black text-xs font-medium mr-2 px-0.5 py-0.5 rounded text-center">{m.path.substring(m.path.lastIndexOf("/") + 1, m.path.length)}</p>
                  </div>
                {/if}
              {/each}
            </div>
            {#each errors as e, i}
              <p class="text-red-500 p-0 m-0 font-bold text-xs italic">{$t(e.msg)}</p>
            {/each}
            <button class="btn-lg mt-4 mb-4" on:click={() => placeOrder()}>{$t("profile.update")}</button>
            {#if Object.keys(otaJson).length !== 0}
              <div class="grid grid-cols-2 mb-4">
                <p class="text-center text-gray-500 font-bold truncate">Статус последнего обновления:</p>
                <p class="{otaJson.build === 0 && otaJson.fs === 0 ? 'text-green-500' : 'text-red-500'} text-center font-bold truncate">{otaJson.build === 0 && otaJson.fs === 0 ? "успешно" : "ошибка"}</p>
              </div>
            {/if}
            {#if userBuilds}
              <table class="tbl mb-0">
                <thead class="bg-gray-100">
                  <tr class="txt-sz txt-pad">
                    <th class="tbl-hd">Название</th>
                    <th class="tbl-hd">Версия</th>
                    <th class="tbl-hd">Время</th>

                    <th class="tbl-hd">Подготовка</th>
                    <th class="tbl-hd">Сборка build</th>
                    <th class="tbl-hd">Сборка fs</th>
                    <th class="tbl-hd" />
                    <th class="tbl-hd w-7" />
                  </tr>
                </thead>
                <tbody class="bg-white">
                  {#each userBuilds as build, i}
                    {#if build.projectProp.platformio.default_envs === flashProfileJson.projectProp.platformio.default_envs}
                      <tr class="txt-sz txt-pad">
                        <td class="tbl-bdy-lg ipt-lg w-full">{build.projectProp.platformio.default_envs}</td>
                        <td class="tbl-bdy-lg ipt-lg w-full">{build.ver}</td>
                        <td class="tbl-bdy-lg ipt-lg w-full">{new Date(build.dateAdded).toLocaleString("ru", { timeZone: "Europe/Vienna" })}</td>
                        {#if build.status.preparation === 0 && build.status.build === 0 && build.status.fs === 0}
                          <td class="tbl-bdy-lg ipt-lg w-full">
                            <p class="text-green-500 font-bold truncate">{"Ожидание очереди..."}</p>
                          </td>
                          <td class="tbl-bdy-lg ipt-lg w-full" />
                          <td class="tbl-bdy-lg ipt-lg w-full" />
                          <td class="tbl-bdy-lg ipt-lg w-full" />
                        {:else}
                          <td class="tbl-bdy-lg ipt-lg w-full">
                            <div onClick={() => showLog(build, "py.txt")}>
                              {st[build.status.preparation]}
                            </div>
                          </td>
                          <td class="tbl-bdy-lg ipt-lg w-full">
                            <div onClick={() => showLog(build, "build.txt")}>
                              {st[build.status.build]}
                            </div>
                          </td>
                          <td class="tbl-bdy-lg ipt-lg w-full">
                            <div onClick={() => showLog(build, "fs.txt")}>{st[build.status.fs]}</div>
                          </td>
                          {#if build.status.build === 2 && build.status.preparation === 2 && build.status.fs === 2}
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <td on:click={() => updateBuild("http://portal.iotmanager.org/compiler/userdata/builds/" + build.orderId)} class="tbl-bdy-lg ipt-lg w-full cursor-pointer select-none bg-green-100 hover:bg-green-200">
                              <p class="w-fill">Установить</p>
                            </td>
                          {:else}
                            <td class="tbl-bdy-lg ipt-lg w-full" />
                          {/if}

                          {#if build.processed}
                            <td class="tbl-bdy-lg ipt-lg w-full">
                              <CrossIcon click={() => delBuild(build)} />
                            </td>
                          {:else}
                            <td class="tbl-bdy-lg ipt-lg w-full" />
                          {/if}
                        {/if}
                      </tr>
                    {/if}
                  {/each}
                </tbody>
              </table>
            {/if}
            <button class="btn-lg mt-4" on:click={() => exit()}>{$t("profile.exit")}</button>
          </Card>
        </div>
      </div>
    {/if}
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
