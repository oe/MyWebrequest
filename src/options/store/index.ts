import { init, RematchRootState } from '@rematch/core'
// import octkit from './octkit'

const models = {
  octkit
}
export const store = init({
  models,
})

export type IStore = typeof store
export type IDispatch = typeof store.dispatch
export type IRootState = RematchRootState<typeof models>