import { watch } from 'vue'
import { useIndexedStore } from '@/indexed-store'

const createPersistencePlugin = (appName, storeName) => {
  const indexedStore = useIndexedStore(appName, storeName)
  return (pinia) => {
    indexedStore.getItem(pinia.store.$id, (state) => {
      if (state) {
        pinia.store.state = state
      } else {
        indexedStore.updateItem(pinia.store.$id, { ...pinia.store.state })
      }
    })

    watch(
      pinia.store,
      () => {
        indexedStore.updateItem(pinia.store.$id, { ...pinia.store.state })
      },
      { deep: true }
    )
  }
}

export default createPersistencePlugin
