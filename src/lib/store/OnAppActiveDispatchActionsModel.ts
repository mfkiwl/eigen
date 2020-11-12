import { Action, action } from "easy-peasy"
import { pullAt } from "lodash"

export interface OnAppActiveDispatchActionsModel {
  pathsToDelete: string[]

  deleteAtPath: Action<OnAppActiveDispatchActionsModel, string>
  clearPathsAtIndexes: Action<OnAppActiveDispatchActionsModel, number[]>
}

export const OnAppActiveDispatchActionsModel: OnAppActiveDispatchActionsModel = {
  pathsToDelete: [],

  deleteAtPath: action((state, path) => {
    state.pathsToDelete.push(path)
  }),
  clearPathsAtIndexes: action((state, indexes) => {
    pullAt(state.pathsToDelete, indexes)
  }),
}
