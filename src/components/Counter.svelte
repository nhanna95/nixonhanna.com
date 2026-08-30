<!-- Example Svelte island. Mount one in any .astro page with:
       import Counter from '../components/Counter.svelte';
       <Counter client:visible />
     (client:load / client:idle / client:visible control hydration timing) -->
<script>
    let count = $state(0);
</script>

<button type="button" onclick={() => count++}>
    Clicked {count} {count === 1 ? 'time' : 'times'}
</button>
