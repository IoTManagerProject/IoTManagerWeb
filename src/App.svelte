<script context="module">
  export function WSpush(ws, topic, value) {
    console.log(ws, topic, value);
  }
</script>

<script>
  import { onMount } from "svelte";
  //роутер ==========================================
  import { Route, router, active } from "tinro";
  router.mode.hash(); // enables hash navigation method
  //router.mode.memory(); // enables in-memory navigation method
  import Card from "./widgets/Card.svelte";
  import Input from "./Input.svelte";
  import Myinput from "./widgets/Input.svelte";

  onMount(async () => {
    console.log("mounted");
    findNewPage();
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
      type: "time",
      status: "12:00",
      page: "Corridor",
      order: "1",
      descr: "Switch on boiler time",
      topic: "/prefix/00000-00003/temp3",
    },
    {
      widget: "input",
      type: "number",
      status: "30.5",
      after: "°С",
      page: "Corridor",
      order: "2",
      descr: "Boiler temperature",
      topic: "/prefix/00000-00001/temp1",
    },
    {
      widget: "input",
      type: "text",
      status: "Hello",
      page: "Corridor",
      order: "3",
      descr: "Message to be send",
      topic: "/prefix/00000-00003/temp3",
    },
    {
      widget: "input",
      type: "date",
      status: "2021.09.15",
      page: "Corridor",
      order: "4",
      descr: "Switch on boiler date",
      topic: "/prefix/00000-00002/temp2",
    },
    {
      widget: "input",
      type: "date",
      status: "2021.09.15",
      page: "Living Room",
      order: "4",
      descr: "Switch on boiler date",
      topic: "/prefix/00000-00002/temp2",
    },
    {
      widget: "input",
      type: "date",
      status: "2021.09.15",
      page: "Bedroom",
      order: "4",
      descr: "Switch on boiler date",
      topic: "/prefix/00000-00002/temp2",
    },
  ];

  //находит в массиве с виджетами wigets все уникальные названия страниц и сортирует названия по алфавиту
  //На выходе получаем массив с названиями страниц - pages
  //[{page:"страница1"},{page:"страница2"},]

  let pages = [];
  function findNewPage() {
    pages = [];
    const newPage = Array.from(new Set(Array.from(wigets, ({ page }) => page)));
    newPage.forEach(function (item, i, arr) {
      pages = [...pages, JSON.parse(JSON.stringify({ page: item }))];
    });
    pages.sort(function (a, b) {
      if (a.page < b.page) {
        return -1;
      }
      if (a.page > b.page) {
        return 1;
      }
      return 0;
    });
  }
</script>

<main>
  <div class="fixed m-0 h-10 w-full bg-gray-100 shadow-md">
    <b class="text-center" />
  </div>

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
  </ul>

  <ul class="menu__main">
    <div class="bg-cover bg-gray-50 pt-8">
      <Route path="/">
        <div class="cards-grid">
          {#each pages as pagesName, i}
            <Card title={pagesName.page}>
              {#each wigets as widget, i}
                {#if widget.page === pagesName.page}
                  {#if widget.widget === "input"}
                    <Myinput bind:value={widget.status} widget={widget} />
                  {/if}
                {/if}
              {/each}
            </Card>
          {/each}
        </div>
      </Route>

      <Route path="/config">
        <div class="cards-grid-inline">
          <Card title="Здесь будет конфигуратор" />
        </div>
      </Route>

      <Route path="/connection">
        <div class="cards-grid">
          <Card title="Подключение к WiFi роутеру" />
          <Card title="Подключение к MQTT брокеру" />
        </div>
      </Route>
      <Route path="/utilities">
        <div class="cards-grid">
          <Card title="Редактор JSON">
            <textarea on:input={SuperDuperFunction} rows="10" class="widget-input-indigo w-full" id="text1">{syntaxHighlight(JSON.stringify(wigets))}</textarea>
          </Card>
        </div>
      </Route>
    </div>
  </ul>
</main>

<style lang="postcss" global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @layer components {
    .btn-indigo {
      @apply py-2 px-4 bg-indigo-500 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75;
    }
    .block-psn-center {
      @apply grid place-items-center mx-2 sm:my-auto;
    }
    .card2 {
      @apply w-11/12 sm:w-8/12 md:w-6/12 lg:w-5/12 2xl:w-4/12 p-2 sm:p-2 md:p-2 lg:p-2 xl:px-8 xl:py-4 2xl:px-8 2xl:py-4 my-2 bg-white rounded-lg shadow-md lg:shadow-lg;
    }
    .widget-input-indigo {
      @apply content-center pr-4 py-1 bg-gray-200 appearance-none border-2 border-gray-200 rounded w-full text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-indigo-500;
    }
    .widget-after {
      @apply pr-4 block text-gray-500 font-bold md:text-right;
    }
    .cards-grid {
      @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 justify-items-center;
    }
    .cards-grid-inline {
      @apply grid grid-cols-1 justify-items-center;
    }
    .card {
      @apply w-11/12 my-2 p-2 sm:p-2 md:p-2 lg:p-2 xl:px-8 xl:py-4 2xl:px-8 2xl:py-4 bg-white rounded-lg shadow-md lg:shadow-lg;
    }
    .card-title-gray {
      @apply text-center text-lg text-gray-500 font-bold pb-6;
    }
    .card-items {
      @apply md:items-center md:flex mb-6;
    }
    .widget-descr-gray-left {
      @apply content-center pr-4 block text-gray-500 font-bold md:text-left;
    }
  }

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

  #menu__toggle:checked ~ .menu__main {
    margin-left: 150px; /* насколько сужать правую часть */
    transition-duration: 0.25s;
  }

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

  input[type="date"]::-webkit-calendar-picker-indicator {
    margin-left: 5px;
    margin-right: -8px;
  }
  input[type="time"]::-webkit-calendar-picker-indicator {
    margin-left: 5px;
    margin-right: -8px;
  }

  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    margin-left: 7px;
    margin-right: -6px;
    width: 30px;
    height: 30px;
    opacity: 1;
  }
</style>
