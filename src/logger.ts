import winston from 'winston';
import {ElasticsearchTransport, ElasticsearchTransportOptions } from 'winston-elasticsearch';
import DateHelpers from './utils/dateHelpers';
import { AbstractConfigSet } from 'winston/lib/winston/config'

import config from '../config';

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

export const jsonFormatter = function jsonFormatter(logEntry: any): any {
    const base = { timestamp: new Date() }
    const json = Object.assign(base, logEntry)
    const now = DateHelpers.now()
    if (logEntry.level === 'http') {
        json.message = JSON.stringify(logEntry.http)
    }
    const message = typeof json.message === 'object' ? JSON.stringify(json.message) : json.message
    logEntry.message = `[${now}]: ${message}`
    return logEntry
}


class ULogger {
    
    logger: winston.Logger
    
    public constructor() {

        const esTransportOpts:ElasticsearchTransportOptions = {
            level: 'info',
            clientOpts: {
                node: 'http://localhost:9200',
                // auth:{
                //     username:'elastic',
                //     password:'vVk782-Yg4U-JN*3vpik'
                // },
            },
            index:"merchant-control-panel",
        };
        
        const elasticSearch = new ElasticsearchTransport(esTransportOpts);

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL,
            transports: [
                elasticSearch
            ],
        });

        if (config.env === 'development') {
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

    info = async (msg:string, ...args: any): Promise<void> => {
        if ( args.length > 0) {
            const metadata = { metadata: args[0] };
            this.logger.info(msg, metadata);
        } else {
            this.logger.info(msg);
        }
    }

    error = async (...args: any[]): Promise<void> => {
        
        const metadata = { metadata: args[1]}
        if (args[0] instanceof Error) {
            let logMessage = ''
            if (typeof args[0].message !== 'string') {
                logMessage = JSON.stringify(args[0].message)
            }
            logMessage += ` ${args[0].stack
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
                .filter(val => val !== null)
                .join('\n')}`
            this.logger.error(logMessage, metadata)
            return
        }
        this.logger.error(args[0], metadata)
    }
    
    debug = async (...args: string[]): Promise<void> => {
        if (args.length > 1) {
            const metadata = { metadata: args[1] };
            this.logger.debug(args[1], metadata);
        } else {
            this.logger.debug(args[0]);
        }
    }
}


export default ULogger