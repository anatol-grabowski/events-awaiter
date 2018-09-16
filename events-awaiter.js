class EventState {
  constructor(emitter, event) {
    this.emitter = emitter
    this.event = event
    this.result = null
    this.error = null
    this.emitted = false
    this.errored = false
  }

  setAwaiter(awaiter) {
    this.emitter.on(this.event, result => {
      this.result = result
      this.emitted = true
      awaiter.tryResolve()
    })
    this.emitter.on('error', error => {
      this.error = error
      this.errored = true
      awaiter.tryResolve()
    })
  }
}

class EventsAwaiter {
  constructor() {
    this.eventStates = []
    this._resolve = null
    this._reject = null
  }

  addEvent(emitter, event) {
    const eventState = new EventState(emitter, event)
    eventState.setAwaiter(this)
    this.eventStates.push(eventState)
    return emitter
  }

  tryResolve() {
    const erroredState = this.eventStates.find(state => state.errored)
    if (erroredState && this._reject) return this._reject(erroredState.error)
    const allDone = this.eventStates.every(state => state.emitted)
    if (!allDone) return
    const results = this.eventStates.map(state => state.result)
    if (this._resolve) this._resolve(results)
  }

  async awaitEvents() {
    const waitPromise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject
    })
    this.tryResolve()
    return waitPromise
  }
}

exports.EventsAwaiter = EventsAwaiter
