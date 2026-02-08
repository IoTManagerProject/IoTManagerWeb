<script>
  export let opened = true;
  export let onCheck = () => {};
  export let userdata = null;
</script>

<nav class="flex">
  <input class="w-0 h-0" bind:checked={opened} on:change={() => onCheck()} id="menu__toggle" type="checkbox" />

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
      <a class="menu__item" href="/system">{"Системные"}</a>
    </li>
    <li>
      <a class="menu__item" href="/list">{"Устройства"}</a>
    </li>
    {#if userdata}
      <li>
        <a class="menu__item" href="/profile">{"Модули"}</a>
      </li>
    {:else}
      <li>
        <a class="menu__item" href="/login">{"Вход"}</a>
      </li>
    {/if}
    <li class="flex flex-col pl-6 pt-3 w-full h-screen"></li>
  </ul>
</nav>
