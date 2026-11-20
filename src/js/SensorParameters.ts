import { PreferenceType } from '@nemo-k-org/littlefs-wasm-preferences';

import * as m from './lib/MQuery'
import { SENSOR_PARAMETERS } from './constants'

export type SensorParameterType = 'string' | 'int'

export interface SensorParameter {
    htmlId: string;
    key: string,
    value: string | number | null;
    type: PreferenceType;
}


export class SensorParameters {
    getParameters = (): SensorParameter[] => {
        const formParameters: SensorParameter[] = SENSOR_PARAMETERS

        for (const parameterIndex in formParameters) {
            const value = m.GetFormInputValue(formParameters[parameterIndex].htmlId)

            if (value) {
                formParameters[parameterIndex].value = value
            }
        }

        return formParameters
    }
}
