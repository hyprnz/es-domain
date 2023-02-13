import { Uuid } from '../util'

export interface Projection {
  id: Uuid.UUID

  /** Version of most recently processed event */
  version: number
}
