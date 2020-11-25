import { init, ModelConfig } from '@rematch/core'

interface IDataState {
  name: string
}

const ruleDetail: ModelConfig<IDataState> = {
  state: {
    name: 'aaa'
  },
  reducers: {
    increase (state, payload) {
      return state + payload
    }
  },
  effects: {
    async asyncIncrease (payload, rootState) {
      /** */
      return payload + rootState
    }
  }
}

const models = {
  ruleDetail
}

const store = init({
  models,
})

export default store