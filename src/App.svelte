<script context="module">
  export function WSpush(arg) {
    console.log(arg);
  }
</script>

<script>
  import { onMount } from "svelte";
  //роутер ==========================================
  import { Route, router, active } from "tinro";
  router.mode.hash(); // enables hash navigation method
  //router.mode.memory(); // enables in-memory navigation method
  import Card from "./Card.svelte";
  import Input from "./Input.svelte";

  onMount(async () => {
    WSpush("mounted");
  });

  const syntaxHighlight = (json) => {
    try {
      json = JSON.stringify(JSON.parse(json), null, 4);
    } catch (e) {
      return json;
    }
    json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    json = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      return match;
    });
    return json;
  };

  function SuperDuperFunction() {
    wigets = JSON.parse(document.getElementById("text1").value);
  }

  let wigets = [];

  wigets = [
    {
      widget: "input",
      status: "30",
      type: "",
      page: "",
      order: "1",
      descr: "Temperature1",
      topic: "/prefix/00000-00000/temp1",
    },
    {
      widget: "input",
      status: "31",
      type: "",
      page: "",
      order: "1",
      descr: "Temperature2",
      topic: "/prefix/00000-00000/temp2",
    },
    {
      widget: "input",
      status: "32",
      type: "",
      page: "",
      order: "1",
      descr: "Temperature3",
      topic: "/prefix/00000-00000/temp3",
    },
  ];
</script>

<main>
  <div class="fixed h-10 w-full bg-gray-100 shadow-md">
    <b class="text-center" />
  </div>

  <ul class="menu__ham">
    <input id="menu__toggle" type="checkbox" />
    <label class="menu__btn" for="menu__toggle">
      <span />
    </label>

    <ul class="menu__box">
      <li>
        <a class="menu__item" href="/">{"Управление"}</a>
      </li>
      <li>
        <a class="menu__item" href="/config">{"Конфигуратор"}</a>
      </li>
      <li>
        <a class="menu__item" href="/connection">{"Подключение"}</a>
      </li>
      <li>
        <a class="menu__item" href="/utilities">{"Утилиты"}</a>
      </li>
      <li>
        <a class="menu__item" href="/log">{"Лог"}</a>
      </li>
      <li>
        <a class="menu__item" href="/about">{"О проекте"}</a>
      </li>
      <li>
        <a class="menu__item" href="/test">{"Test"}</a>
      </li>
    </ul>
  </ul>

  <ul class="menu__main">
    <div class="bg-cover bg-gray-50 pt-16">
      <Route path="/">
        <Card title="Редактор JSON">
          <textarea on:input={SuperDuperFunction} rows="10" class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" id="text1">{syntaxHighlight(JSON.stringify(wigets))}</textarea>
        </Card>
        <Card title="Testing card1">
          {#each wigets as widget, i}
            {#if widget.widget === "input"}
              <Input title={widget.descr} bind:value={widget.status} />
            {/if}
          {/each}
        </Card>
      </Route>

      <Route path="/config">
        <Card title="Здесь будет конфигуратор" />
      </Route>

      <Route path="/connection">
        <Card title="Подключение к WiFi роутеру">
          <div class="md:flex md:items-center mb-6">
            <div class="md:w-1/3">
              <label class="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name"> Сеть </label>
            </div>
            <div class="md:w-2/3">
              <input class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="text" value="your SSID" />
            </div>
          </div>
          <div class="md:flex md:items-center mb-6">
            <div class="md:w-1/3">
              <label class="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" for="inline-password"> Пароль </label>
            </div>
            <div class="md:w-2/3">
              <input class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="password" placeholder="******************" />
            </div>
          </div>
          <div class="md:flex md:items-center mb-6">
            <div class="md:w-1/3" />
            <label class="md:w-2/3 block text-gray-500 font-bold">
              <input class="mr-2 leading-tight" type="checkbox" />
              <span class="text-sm"> Включить светодиод статуса подключения </span>
            </label>
          </div>
          <div class="md:flex md:items-center">
            <div class="md:w-1/3" />
            <div class="md:w-2/3">
              <button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button"> Сохранить </button>
            </div>
          </div>
        </Card>

        <Card title="Подключение к MQTT серверу">
          <div class="md:flex md:items-center mb-6">
            <div class="md:w-1/3">
              <label class="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name"> Сервер </label>
            </div>
            <div class="md:w-2/3">
              <input class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="text" value="your SSID" />
            </div>
          </div>

          <div class="md:flex md:items-center mb-6">
            <div class="md:w-1/3">
              <label class="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name"> Порт </label>
            </div>
            <div class="md:w-2/3">
              <input class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="text" value="your SSID" />
            </div>
          </div>

          <div class="md:flex md:items-center mb-6">
            <div class="md:w-1/3">
              <label class="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name"> Префикс </label>
            </div>
            <div class="md:w-2/3">
              <input class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="text" value="your SSID" />
            </div>
          </div>

          <div class="md:flex md:items-center mb-6">
            <div class="md:w-1/3">
              <label class="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" for="inline-full-name"> Пользователь </label>
            </div>
            <div class="md:w-2/3">
              <input class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="text" value="your SSID" />
            </div>
          </div>

          <div class="md:flex md:items-center mb-6">
            <div class="md:w-1/3">
              <label class="block text-gray-500 font-bold md:text-right mb-1 md:mb-0 pr-4" for="inline-password"> Пароль </label>
            </div>
            <div class="md:w-2/3">
              <input class="bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full py-2 px-4 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-purple-500" type="password" placeholder="******************" />
            </div>
          </div>

          <div class="md:flex md:items-center">
            <div class="md:w-1/3" />
            <div class="md:w-2/3">
              <button class="shadow bg-purple-500 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded" type="button"> Сохранить </button>
            </div>
          </div>
        </Card>
      </Route>

      <Route path="/test" />
    </div>
  </ul>
</main>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  #menu__toggle {
    opacity: 0;
  }
  #menu__toggle:checked ~ .menu__btn > span {
    transform: rotate(45deg);
  }
  #menu__toggle:checked ~ .menu__btn > span::before {
    top: 0;
    transform: rotate(0);
  }
  #menu__toggle:checked ~ .menu__btn > span::after {
    top: 0;
    transform: rotate(90deg);
  }
  #menu__toggle:checked ~ .menu__box {
    visibility: visible;
    left: 0;
  }

  /*
  #menu__toggle:checked ~ .menu__main {
    margin-left: 150px; 
    transition-duration: 0.25s;
  }
  */

  .menu__btn {
    display: flex;
    align-items: center;
    position: fixed;
    z-index: 1;
    top: 10px;
    left: 20px;
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .menu__btn > span,
  .menu__btn > span::before,
  .menu__btn > span::after {
    display: block;
    position: absolute;
    width: 100%;
    height: 2px;
    background-color: #616161;
    transition-duration: 0.25s;
  }
  .menu__btn > span::before {
    content: "";
    top: -8px;
  }
  .menu__btn > span::after {
    content: "";
    top: 8px;
  }

  .menu__box {
    display: block;
    position: fixed;
    visibility: hidden;
    top: 0;
    left: -100%;
    width: 150px; /* размер выхода бокового меню */
    height: 100%;
    margin: 0;
    padding: 80px 0;
    list-style: none;
    background-color: #eceff1;
    box-shadow: 1px 0px 6px rgba(0, 0, 0, 0.2);
    transition-duration: 0.25s;
  }

  .menu__ham {
    position: fixed;
  }

  .menu__item {
    display: block;
    padding: 12px 24px;
    color: rgba(51, 51, 51, 0.788);
    font-family: "Roboto", sans-serif;
    font-size: 15px; /* размер шрифта бокового меню */
    font-weight: 600;
    text-decoration: none;
    transition-duration: 0.25s;
  }
  .menu__item:hover {
    background-color: #cfd8dc;
  }

  .upper__bar {
    background-color: rgba(51, 51, 51, 0.144);
    height: 70px;
    position: fixed;
    z-index: -1;
    top: 0px;
    left: 0;
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: 1px 0px 3px rgba(0, 0, 0, 0.2);
  }
</style>
