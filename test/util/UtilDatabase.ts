import { env } from 'node:process'
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import readline from 'readline'

export interface customerData {
    customerId: number;
    customerCode: string;
    email: string;
}

const DEFAULT_CUSTOMER_EMAIL = 'test@test.com'

const DB_USERNAME = env.DB_USERNAME
const DB_PASSWORD = env.DB_PASSWORD
const DB_DATABASE = env.DB_DATABASE

export type JobStatus = 'created' | 'submitted' | 'received'

export class UtilDatabase {
    private pool: mysql.Pool
    private customerEmail: string

    private dbUsername: string
    private dbPassword: string
    private dbDatabase: string

    constructor(customerEmail?: string) {
        if (customerEmail) {
            this.customerEmail = customerEmail
        }
        else {
            this.customerEmail = DEFAULT_CUSTOMER_EMAIL
        }

        if (env.DB_USERNAME) {
            this.dbUsername = env.DB_USERNAME
        }
        if (env.DB_PASSWORD) {
            this.dbPassword = env.DB_PASSWORD
        }
        if (env.DB_DATABASE) {
            this.dbDatabase = env.DB_DATABASE
        }
    }

    async getDatabaseSettingsFromLocalSettingsFile(localSettingsFilename: string) {
        this.dbUsername = ''
        this.dbPassword = ''
        this.dbDatabase = ''

        let adminSettingsStarted = false
        const reAdminSettings = /'DB_ADMIN'/
        const reUsername = /['"]user['"].+['"](.*?)['"]/
        const rePassword = /['"]password['"].+['"](.*?)['"]/
        const reDatabase = /['"]dbname['"].+['"](.*?)['"]/

        const fileStream = fs.createReadStream(localSettingsFilename)
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        })

        for await (const line of rl) {
            if (line.match(reAdminSettings)) {
                adminSettingsStarted = true
            }

            if (adminSettingsStarted && !this.dbUsername) {
                const match = line.match(reUsername)
                if (match) {
                    this.dbUsername = match[1]
                }
            }

            if (adminSettingsStarted && !this.dbPassword) {
                const match = line.match(rePassword)
                if (match) {
                    this.dbPassword = match[1]
                }
            }

            if (adminSettingsStarted && !this.dbDatabase) {
                const match = line.match(reDatabase)
                if (match) {
                    this.dbDatabase = match[1]
                }
            }
        }
    }


    async createConnection() {
        if (this.pool) {
            return
        }

        this.pool = mysql.createPool({
            host: 'localhost',
            user: this.dbUsername,
            password: this.dbPassword,
            database: this.dbDatabase,
            waitForConnections: true,
            connectionLimit: 10,
            maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
            idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        })
    }

    async end() {
        await this.pool.end()
    }

    async addCustomer(): Promise<customerData> {
        const customerCode = uuidv4()
    
        await this.createConnection()
    
        let customerId = 0
    
        const [results, fields] = await this.pool.query(
            'INSERT INTO `customers` SET `customerCode`=?, email=?, added=NOW()',
            [customerCode, this.customerEmail]) as ResultSetHeader[]
    
        customerId = results.insertId

        return {
            customerId: customerId,
            customerCode: customerCode,
            email: this.customerEmail
        }
    }

    async removeCustomer(customerId: number): Promise<any> {
        return this.pool.query(
            'DELETE FROM `customers` WHERE `customerId`=?', [customerId]
        )
    }

    async addJob(customerId: number): Promise<string> {
        const jobId = uuidv4()

        await this.createConnection()

        await this.pool.query(
            'INSERT INTO `jobs` SET `jobId`=?, `parameters`="{\\\"TEST_CASE\\\":\\\"1\\\"}", `customerId`=?, `userAgentId`=0, `ip`="127.0.0.1"',
            [jobId, customerId]) as ResultSetHeader[]

        return jobId
    }

    async getJobs(customerId: number): Promise<RowDataPacket> {
        await this.createConnection()

        const [ jobIds ] = await this.pool.query(
            'SELECT `jobId` FROM `jobs` WHERE `customerId`=?', [customerId]
        ) as RowDataPacket[]

        return jobIds
    }

    async removeJob(jobId: string): Promise<any> {
        return this.pool.query(
            'DELETE FROM `jobs` WHERE `jobId`=?', [jobId]
        )
    }

    async addStatus(jobId: string, status: JobStatus) {
        await this.createConnection()

        await this.pool.query(
            'INSERT INTO `status` SET `jobId`=?, `jobStatus`=?',
            [jobId, status]) as ResultSetHeader[]
    }

    async removeStatus(jobId: string): Promise<any> {
        return this.pool.query(
            'DELETE FROM `status` WHERE `jobId`=?', [jobId]
        )
    }

    async removeTestCustomersAndJobs(): Promise<number> {
        await this.createConnection()

        const [ customers ] = await this.pool.query(
            'SELECT `customerId` FROM `customers` WHERE `email`=?',
            [this.customerEmail]) as RowDataPacket[]

        let customerCount = 0

        await Promise.all(
            customers.map(async (customer) => {
                customerCount =+ 1

                const jobIds = await this.getJobs(customer.customerId)

                await Promise.all(
                    jobIds.map(async (jobId) => {
                        await this.removeJob(jobId.jobId)
                        await this.removeStatus(jobId.jobId)
                    })
                )

                await this.removeCustomer(customer.customerId)
            })
        )

        return customerCount
    }
}
