class UpdateManager {
  constructor(parameters) {
    this._updateList = []
  }

  addUpdate(list) {
    this._updateList.push(...list)
  }

  deleteUpdate(list) {
    this._updateList = this._updateList.filter((item) => !list.includes(item))
  }

  _updateFile() {}
}
