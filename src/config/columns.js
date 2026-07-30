// The fixed board columns, in order. `id` is the value stored on a task's
// `status` field; `title` is what shows in the column header.
export const COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "pending", title: "Pending" },
  { id: "qa", title: "QA" },
  { id: "uat", title: "UAT" },
];

export const COLUMN_IDS = COLUMNS.map((c) => c.id);
