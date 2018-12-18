import { IDiffArrayResult } from '@/background/utils'
import { IRequestConfig } from '@/types/requests'
import { updateCache as updateInject } from './inject'
import { updateCache as updateReferrer } from './referrer'
import { updateCache as updateUa } from './ua'

export default function (diffResult: IDiffArrayResult<IRequestConfig>) {
  updateInject(diffResult)
  updateReferrer(diffResult)
  updateUa(diffResult)
}