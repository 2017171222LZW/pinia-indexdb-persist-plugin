import { ref, computed } from 'vue'
/**
 * 插件将每一个应用对应到一个数据库，每一个piniaStore对象对应到数据库中一个数据表。
 * @param {对应pinia状态名称} storeName
 * @param {对应当前应用名称或独立页面名称} appName
 * @param {设置存储库版本} version
 * @param {操作成功事件回调，可以接收一个事件参数} onSuccess
 * @param {操作失败事件回调，可以接收事件参数和存储对象} onError
 * @param {更新事件回调，可以接收一个事件参数} onUpgradeNeeded
 * @returns
 */
export const useIndexedStore = (
  appName,
  storeName,
  version = 1,
  onSuccess = null,
  onError = null,
  onUpgradeNeeded = null,
  log = false
) => {
  let _db = ref(null)
  let _request = null
  let _promise = null
  let _objectStore = null
  let _version = version
  let _store = ref(null)
  // 不建议使用
  const db = computed(() => () => _db)
  // 不建议使用
  const store = computed(() => _store)

  const _afterPromise = (callBack) => {
    _promise.then(callBack)
    return _request
  }

  const _onSuccess =
    (prefix = '', onSuccess = null, resolve = null) =>
    (event) => {
      if (!_db.value) {
        _db.value = event.target.result
      }
      resolve && resolve(event.target.result)
      // 代理事件，直接提取value
      let _proxyEvent = { target: { result: event.target?.result?.value } }
      _proxyEvent = Object.setPrototypeOf(event, _proxyEvent)
      onSuccess && onSuccess(_proxyEvent)
      log && console.log(prefix + ' 操作成功')
    }

  const _onError =
    (prefix = '', onError = null, reject = null) =>
    (event) => {
      _db.value = event.target.result
      reject && reject(prefix + ' 操作失败')
      onError && onError(event)
      log && console.log(prefix + ' 操作失败')
    }

  const _onUpgradeneeded =
    (prefix = '', onUpgradeNeeded = null) =>
    (event) => {
      _db.value = event.target.result
      if (!_db.value.objectStoreNames.contains(storeName)) {
        _objectStore = _db.value.createObjectStore(storeName, { keyPath: 'id' })
      }
      onUpgradeNeeded && onUpgradeNeeded(event, _objectStore)
      log && console.log(prefix + ' 更新成功')
    }

  // 前置操作，获得objectStore
  const _preProcess = (mode = 'readonly') => {
    _store.value = _db.value
      .transaction([storeName], mode)
      .objectStore(storeName)
    return _store.value
  }

  // 后置操作，处理事件
  const _postProcess = (
    request,
    prefix = '',
    onSuccess = null,
    onError = null,
    onUpgradeneeded = null,
    resolve = null,
    reject = null
  ) => {
    request.onsuccess = _onSuccess(prefix, onSuccess, resolve)
    request.onerror = _onError(prefix, onError, reject)
    request.onupgradeneeded = _onUpgradeneeded(prefix, onUpgradeneeded)
    _request = request
    return request
  }

  const open = () => {
    return new Promise((resolve, reject) => {
      _open(resolve, reject)
    })
  }

  const _addData = (
    data,
    onsuccess = null,
    onerror = null,
    onupgradeneeded = null
  ) => {
    return _afterPromise(() => {
      _request = _preProcess('readwrite').add(data)
      return _postProcess(
        _request,
        '_addData',
        onsuccess,
        onerror,
        onupgradeneeded
      )
    })
  }

  const setItem = (
    key,
    value,
    onsuccess = null,
    onerror = null,
    onupgradeneeded = null
  ) => {
    return _addData(
      { id: key, value: value },
      onsuccess,
      onerror,
      onupgradeneeded
    )
  }

  const _getDataById = (
    id,
    onsuccess = null,
    onerror = null,
    onupgradeneeded = null
  ) => {
    return _afterPromise(() => {
      _request = _preProcess().get(id)
      return _postProcess(
        _request,
        '_getData',
        onsuccess,
        onerror,
        onupgradeneeded
      )
    })
  }

  const getItem = (
    key,
    onsuccess = null,
    onerror = null,
    onupgradeneeded = null
  ) => {
    let _value = ref(null)
    const _proxyOnSuccess = (e) => {
      onsuccess(e.target.result)
      _value.value = e.target.result
    }
    _getDataById(key, _proxyOnSuccess, onerror, onupgradeneeded)
    return _value
  }

  const _updateById = (
    data,
    onsuccess = null,
    onerror = null,
    onupgradeneeded = null
  ) => {
    return _afterPromise(() => {
      _request = _preProcess('readwrite').put(data)
      return _postProcess(
        _request,
        '_update',
        onsuccess,
        onerror,
        onupgradeneeded
      )
    })
  }

  const updateItem = (
    key,
    value,
    onsuccess = null,
    onerror = null,
    onupgradeneeded = null
  ) => {
    return _updateById(
      { id: key, value: value },
      onsuccess,
      onerror,
      onupgradeneeded
    )
  }

  const _deleteById = (
    id,
    onsuccess = null,
    onerror = null,
    onupgradeneeded = null
  ) => {
    return _afterPromise(() => {
      _request = _preProcess('readwrite').delete(id)
      return _postProcess(
        _request,
        '_delete',
        onsuccess,
        onerror,
        onupgradeneeded
      )
    })
  }

  const deleteItem = (
    key,
    onsuccess = null,
    onerror = null,
    onupgradeneeded = null
  ) => {
    return _deleteById(key, onsuccess, onerror, onupgradeneeded)
  }

  const _open = (resolve, reject) => {
    _request = indexedDB.open(appName, _version)
    return _postProcess(
      _request,
      '_open',
      onSuccess,
      onError,
      onUpgradeNeeded,
      resolve,
      reject
    )
  }

  _promise = open()

  const addEventHandler = (eventName, callback) => {
    _afterPromise(() => {
      console.log(_store.value)
      _request.onsuccess(callback)
    })
  }

  return {
    db,
    store,
    getItem,
    setItem,
    updateItem,
    deleteItem,
    addEventHandler,
  }
}
