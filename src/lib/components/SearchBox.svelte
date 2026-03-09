<script lang="ts">
  let { searchQuery = $bindable() }: { searchQuery: string } = $props();

  function trapFocus(element: HTMLInputElement) {
    const setFocus = () => {
      element.focus();
    };

    setFocus();

    window.addEventListener("focus", setFocus);

    return () => {
      window.removeEventListener("focus", setFocus);
    };
  }
</script>

<input {@attach trapFocus} class="search-box" bind:value={searchQuery} />

<style>
  .search-box {
    width: 100%;
    box-sizing: border-box;
    background-color: #2b2a33;
    color: white;
    outline: none;
    border: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='24px' viewBox='0 -960 960 960' width='24px' fill='%239595a3'%3E%3Cpath d='M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    --padding: 6px;
    background-position: left var(--padding) top 50%;
    background-size: calc(24px - 4px);
    padding: var(--padding) var(--padding) var(--padding) calc(24px + 2 * 4px);
    border-radius: 4px;
  }
</style>
