export type ActionType = string;

export interface Action {
  type: ActionType;
  payload?: unknown;
}
