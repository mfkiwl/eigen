import { Action, action } from "easy-peasy"

export interface OnAppActiveDispatchActionsModel {
  urisToDelete: string[]

  deleteAtUri: Action<OnAppActiveDispatchActionsModel, string>
  clearUris: Action<OnAppActiveDispatchActionsModel, void>
}

export const OnAppActiveDispatchActionsModel: OnAppActiveDispatchActionsModel = {
  urisToDelete: [],

  deleteAtUri: action((state, path) => {
    state.urisToDelete.push(path)
  }),
  clearUris: action((state) => {
    state.urisToDelete = []
  }),
}
