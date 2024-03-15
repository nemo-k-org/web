import { env } from 'node:process'
import mysql, { ResultSetHeader } from 'mysql2/promise'
import { v4 as uuidv4 } from 'uuid'

export interface customerData {
    customerId: number;
    customerCode: string;
    email: string;
}

const CUSTOMER_EMAIL = 'test@test.com'

const DB_USERNAME = env.DB_USERNAME
const DB_PASSWORD = env.DB_PASSWORD
const DB_DATABASE = env.DB_DATABASE

export class UtilDatabase {
    private connection: mysql.Connection

    async createConnection() {
        this.connection = await mysql.createConnection({
            host: 'localhost',
            user: DB_USERNAME,
            password: DB_PASSWORD,
            database: DB_DATABASE
        })
    }

    async end() {
        await this.connection.end()
    }

    async addCustomer(): Promise<customerData> {
        const customerCode = uuidv4()
    
        await this.createConnection()
    
        let customerId = 0
    
        const [results, fields] = await this.connection.query(
            'INSERT INTO `customers` SET `customerCode`=?, email=?, added=NOW()',
            [customerCode, CUSTOMER_EMAIL]) as ResultSetHeader[]
    
        customerId = results.insertId

        await this.end()
    
        return {
            customerId: customerId,
            customerCode: customerCode,
            email: CUSTOMER_EMAIL
        }
    }

    async addJob(customerId: number): Promise<string> {
        const jobId = uuidv4()

        await this.createConnection()

        await this.connection.query(
            'INSERT INTO `jobs` SET `jobId`=?, `parameters`="{\\\"TEST_CASE\\\":\\\"1\\\"}", `customerId`=?, `userAgentId`=0, `ip`="127.0.0.1"',
            [jobId, customerId]) as ResultSetHeader[]

        await this.end()

        return jobId
    }
}

