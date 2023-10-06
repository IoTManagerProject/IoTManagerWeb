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
  export let updateBuild = (path) => {};
  import CrossIcon from "../svg/Cross.svelte";
  let errors = [];
  let allmodeinfo = null;
  let userBuilds = null;
  var updateInterval;

  onMount(async () => {
    await getModInfo();
    await getUserBuilds();
  });

  const st = {
    0: "",
    1: "В процессе",
    2: "Ок",
    3: "Ошибка",
  };

  function checkStatus(userBuilds) {
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

  const periodicTask = async () => {
    await getUserBuilds();
  };

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
    delete myProfileJson["_id"];
    //добавим в тело имя пользователя
    myProfileJson.username = userdata.username;
    const JWT = Cookies.get("token_iotm2");
    try {
      let res = await fetch("https://portal.iotmanager.org/compiler/order", {
        mode: "cors",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JWT}`,
        },
        body: JSON.stringify(myProfileJson),
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
  {#if allmodeinfo && myProfileJson}
    <div class="my-4">
      <div class="grd-1col1">
        <Card title="">
          <div class="grid grid-cols-2">
            <p class="text-center text-gray-500 font-bold">{myProfileJson.projectProp.platformio.default_envs}</p>
            <p class="text-center text-gray-500 font-bold">{userdata.username}</p>
          </div>
          <div class="grid my-4 grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12 2xl:grid-cols-12 gap-4">
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
          </div>
          {#each errors as e, i}
            <p class="text-red-500 p-0 m-0 font-bold text-xs italic">{$t(e.msg)}</p>
          {/each}
          <button class="btn-lg mt-4" on:click={() => placeOrder()}>{$t("profile.update")}</button>
          {#if userBuilds}
            <table class="tbl mt-6 mb-0">
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
                  {#if build.projectProp.platformio.default_envs === myProfileJson.projectProp.platformio.default_envs}
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
