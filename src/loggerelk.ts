import winston from 'winston';
import { ElasticsearchTransport, ElasticsearchTransportOptions } from 'winston-elasticsearch';
import { AbstractConfigSet } from 'winston/lib/winston/config'
import { jsonFormatter } from './utils/jsonFormatter';
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


export class ULoggerElk {

    logger: winston.Logger

    public constructor() {

        if (
            process.env.ELK_USERNAME===undefined ||
            process.env.ELK_PASSWORD===undefined||
            process.env.ELK_URL===undefined ||
            process.env.SERVICE_NAME==undefined
        ) {
            throw new Error("Elk configuration is required !!!")
        } else {
            const esTransportOpts: ElasticsearchTransportOptions = {
                level: 'silly',
                clientOpts: {
                    node: process.env.ELK_URL,
                    auth: {
                        username: process.env.ELK_USERNAME || '',
                        password: process.env.ELK_PASSWORD || ''
                    },
                },
                index: process.env.SERVICE_NAME
            };

            const elasticSearch = new ElasticsearchTransport(esTransportOpts);

            this.logger = winston.createLogger({
                level: process.env.LOG_LEVEL || 'silly',
                transports: [
                    elasticSearch
                ],
            });

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
        }
    }

    error = async (err: string | Error, ...args: any[]): Promise<void> => {
    
        const metadata = args[0] ? { metadata: JSON.stringify(args[0]) } : undefined;
        if (err instanceof Error) {
            let logMessage = ''
            if (typeof err.message !== 'string') {
                logMessage = JSON.stringify(err.message)
            }
            logMessage += ` ${err.stack
                .split('\n')
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
        const metadata = args[1] ? { metadata: JSON.stringify(args[1]) } : undefined;
        this.logger.debug(args[0], metadata)
    }


    info = async (message:string, data?:any ): Promise<void> => {
        const metadata = data ? { metadata: JSON.stringify(data) } : undefined;
        this.logger.info(message, metadata)
    }

    warn = async (...args: string[]): Promise<void> => {
        const metadata = args[1] ? { metadata: JSON.stringify(args[1]) } : undefined;
        this.logger.warn(args[0], metadata)
    }
}