import { DateTime } from 'luxon'

function now(): Date {
    return new Date(
        `${DateTime.local()
            .toISO()
            .substr(0, 23)}Z`
    )
}

export default {
    now
}
