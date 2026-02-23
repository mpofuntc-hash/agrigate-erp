<script lang="ts">
  let {
    columns,
    rows,
    emptyMessage = "No records found.",
  }: {
    columns: { key: string; label: string; align?: "left" | "right" | "center" }[];
    rows: Record<string, unknown>[];
    emptyMessage?: string;
  } = $props();
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        {#each columns as col}
          <th style="text-align: {col.align ?? 'left'}">{col.label}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#if rows.length === 0}
        <tr>
          <td colspan={columns.length} class="empty">{emptyMessage}</td>
        </tr>
      {:else}
        {#each rows as row}
          <tr>
            {#each columns as col}
              <td style="text-align: {col.align ?? 'left'}">{row[col.key] ?? "—"}</td>
            {/each}
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<style>
  .table-wrap {
    overflow-x: auto;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
  }
  th {
    background: #f1f8e9;
    color: #33691e;
    font-weight: 600;
    padding: 0.75rem 1rem;
    border-bottom: 2px solid #c5e1a5;
  }
  td {
    padding: 0.65rem 1rem;
    border-bottom: 1px solid #f0f0f0;
    color: #333;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f9fbe7; }
  .empty { text-align: center; color: #999; padding: 2rem; }
</style>
