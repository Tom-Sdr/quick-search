export interface Selectable {
  id: { type: string; id_value: string };
  submit: () => void;
}

export function areIdsEqual(
  id1: { type: string; id_value: string },
  id2: { type: string; id_value: string },
) {
  return id1.type === id2.type && id1.id_value === id2.id_value;
}

// TODO: maybe type id
