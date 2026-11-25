import 'bootstrap/dist/css/bootstrap.min.css'

import DebugTerminal from './DebugTerminal'
import ProgramUploader from './ProgramUploader'

const debugTerminal = new DebugTerminal()

import { FIRMWARES } from './constants'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const programUploader = new ProgramUploader(
  FIRMWARES,
  debugTerminal
)
