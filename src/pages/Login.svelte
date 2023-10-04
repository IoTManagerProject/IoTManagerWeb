<script>
  import Card from "../components/Card.svelte";
  import Alarm from "../components/Alarm.svelte";
  import { t, locale, locales } from "../i18n";
  import { router } from "tinro";
  import Cookies from "js-cookie";
  export let show = true;

  let user = {};
  let errors = [];

  const login = async (user) => {
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
    Cookies.set("token_iotm2", token);
    console.log("token to be saved: ", token);
    router.goto("/profile");
    location.reload();
  };
</script>

{#if show}
  <div class="flex h-screen m-2 md:m-4 lg:m-8 items-start justify-center">
    <div class="w-full max-w-lg">
      <form class="bg-white shadow-2xl rounded-xl px-8 pt-6 pb-8 mb-4">
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
            {$t("login.email")}
          </label>
          <input bind:value={user.username} class="shadow appearance-none border rounded w-full h-10 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="username" type="text" placeholder={"someone@example.com"} />
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
            {$t("login.pass")}
          </label>
          <input bind:value={user.password} class="shadow appearance-none border rounded w-full h-10 px-3 text-gray-700 mb-0 leading-tight focus:outline-none focus:shadow-outline" id="password" type="password" placeholder="**********" />
        </div>
        {#each errors as e, i}
          <p class="text-red-500 p-0 m-0 font-bold text-xs italic">{$t(e.msg)}</p>
        {/each}
        <button class="btn-lg mt-6" on:click={() => login(user)}>{$t("login.login")}</button>
      </form>
    </div>
  </div>
{:else}
  <Alarm title="Загрузка..." />
{/if}
