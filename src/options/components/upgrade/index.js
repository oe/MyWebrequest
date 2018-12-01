import collection from '@/common/collection'
import presets from './presets'
const UA_LIST_KEY = 'ua-list'

function installPresets () {
  collection.set(UA_LIST_KEY, presets.ua)
}

async function main () {
  const hasUaList = await collection.get(UA_LIST_KEY)
  if (hasUaList == null) {
    installPresets()
  }
}

main()
