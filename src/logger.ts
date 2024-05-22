import winston from 'winston'
import { AbstractConfigSet } from 'winston/lib/winston/config'
import { jsonFormatter } from './utils/jsonFormatter'
import 'winston-daily-rotate-file'
import 'dotenv/config'

const { printf, combine, colorize } = winston.format

const logLevels: AbstractConfigSet = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        http: 'blue',
        debug: 'gray'
    }
}
winston.addColors(logLevels.colors)

export class ULogger {
    /** Winston Logger */
    private logger: winston.Logger

    public constructor() {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'silly',
            exitOnError: function globalPipe(ex: Error) {
                winston.error('error', ex.message, {
                    metadata: 'GLOBAL-PIPE-ERROR'
                })
                return false
            },
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: './logs/error-%DATE%.log',
                    level: 'error',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxFiles: '14d'
                }),
                new winston.transports.DailyRotateFile({
                    filename: './logs/combined-%DATE%.log',
                    level: process.env.LOG_LEVEL || 'silly',
                    datePattern: 'YYYY-MM-DD',
                    zippedArchive: true,
                    maxFiles: '14d'
                })
            ]
        })
        if (process.env.NODE_ENV === 'development') {
            this.logger.add(
                new winston.transports.Console({
                    format: combine(
                        colorize(),
                        winston.format(jsonFormatter)(),
                        printf((info: any) => `${info.level}: ${info.message}`)
                    )
                })
            )
        }


        this.logger.on('error', (err: Error) => {
            // eslint-disable-next-line no-console
            const errorStack = err.stack ?? err.message;
            this.logger.error(errorStack, {
                metadata: 'WINSTON-LOGGER-ERROR'
            })
        })
    }



    error = async (err: string | Error, ...args: any[]): Promise<void> => {
    
        const metadata = args[0] ? { metadata: args[0] } : undefined;
        if (err instanceof Error) {
            let logMessage = ''
            if (typeof err.message !== 'string') {
                logMessage = JSON.stringify(err.message)
            }
            logMessage += ` ${err.stack?.split('\n')
                .map((line: any) => {
                    if (
                        line.indexOf('node_modules') === -1 &&
                        line.indexOf('at Generator.next (<anonymous>)') === -1 &&
                        line.indexOf('internal/') === -1
                    ) {
                        return line
                    }
                    return null
                })
                .filter((val: any) => val !== null)
                .join('\n')}`
            this.logger.error(logMessage, metadata)
            return
        }
        this.logger.error(err, metadata)
    }


    debug = async (...args: string[]): Promise<void> => {
        const metadata = args[1] ? { metadata: args[1] } : undefined;
        this.logger.debug(args[0], metadata)
    }


    info = async (message:string, data?:any ): Promise<void> => {
        const metadata = data ? { metadata: data } : undefined;
        this.logger.info(message, metadata)
    }

    warn = async (...args: string[]): Promise<void> => {
        const metadata = args[1] ? { metadata: args[1] } : undefined;
        this.logger.warn(args[0], metadata)
    }

}