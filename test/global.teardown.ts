import { UtilDatabase } from './util/UtilDatabase'
import { CUSTOMER_EMAIL, LOCAL_SETTINGS } from './constants'

const globalTeardown = async () => {
    const utilDatabase = new UtilDatabase(CUSTOMER_EMAIL)
    await utilDatabase.getDatabaseSettingsFromLocalSettingsFile(LOCAL_SETTINGS)
    await utilDatabase.removeTestCustomersAndJobs()
}

export default globalTeardown