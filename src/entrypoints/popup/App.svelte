<script lang="ts">
  import SearchBox from "@/lib/components/SearchBox.svelte";
  import TabList from "@/lib/components/TabList.svelte";

  let searchQuery: string = $state("");
  // oninput={(updatedSearchQuery) => {
  //   searchQuery = updatedSearchQuery;
  //   updateList(updatedSearchQuery, "queryChange");
  // }}
</script>

<main>
  <SearchBox bind:searchQuery></SearchBox>
  <TabList {searchQuery}></TabList>
</main>

<style>
  /* TODO: fix different gap between icon and title for bookmarks and tabs */

  main {
    display: flex;
    gap: 1rem;
    flex-direction: column;
    height: 100%;
  }
</style>
