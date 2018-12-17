import { IDiffArrayResult } from '@/background/utils'
import { IRuleConfig } from '@/types/web-rule'
import { updateCache as updateInject } from './inject'
import { updateCache as updateReferrer } from './referrer'
import { updateCache as updateUa } from './ua'

export default function (diffResult: IDiffArrayResult<IRuleConfig>) {
  const diff = Object.assign({}, diffResult.added, diffResult.updated)
  updateInject(diff)
  updateReferrer(diff)
  updateUa(diff)
}