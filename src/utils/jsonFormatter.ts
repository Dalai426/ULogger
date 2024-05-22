import DateHelpers from "./dateHelpers"


export const jsonFormatter = function jsonFormatter(logEntry: any): any {
    const base = { timestamp: new Date() }
    const json = Object.assign(base, logEntry)
    const now = DateHelpers.now()
    if (logEntry.level === 'http') {
        json.message = JSON.stringify(logEntry.http)
    }
    const message = typeof json.message === 'object' ? JSON.stringify(json.message) : json.message


    const data=typeof logEntry?.metadata === 'string' ? logEntry?.metadata : JSON.stringify(logEntry?.metadata)
    logEntry.message = `[${now}] msg: ${message}, data: ${data}`

    return logEntry
}