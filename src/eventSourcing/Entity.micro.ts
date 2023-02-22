import { assertThat } from 'mismatched'
import { assertIsEntityConstructor, isEntityConstructor } from '.'
import { Alarm, Device } from '../deviceBoundedContext'

describe('Entity', () => {
  describe('isEntityConstructor', () => {
    describe('yes', () => {
      it('Device entity', () => {
        assertThat(isEntityConstructor(Device)).is(true)
      })
    })

    describe('No', () => {
      it('Undefined', () => {
        assertThat(isEntityConstructor(undefined)).is(false)
      })
      it('Empty object', () => {
        assertThat(isEntityConstructor({})).is(false)
      })

      it('Has toCreationParameters, but not constructor', () => {
        assertThat(isEntityConstructor({ toCreationParameters: () => true })).is(false)
      })

      it('Alarm Entity', () => {
        assertThat(isEntityConstructor(Alarm)).is(false)
      })
    })
  })
  describe('assertIsEntityConstructor', () => {
    describe('yes', () => {
      it('Device entity', () => {
        assertIsEntityConstructor(Device)
      })
    })

    describe('No', () => {
      const expectedError = new Error('Value is not a EntityConstructor')
      it('Undefined', () => {
        assertThat(() => assertIsEntityConstructor(undefined)).throws(expectedError)
      })
      it('Empty object', () => {
        assertThat(() => assertIsEntityConstructor({})).throws(expectedError)
      })

      it('Has toCreationParameters, but not constructor', () => {
        assertThat(() => assertIsEntityConstructor({ toCreationParameters: () => true })).throws(expectedError)
      })

      it('Alarm Entity', () => {
        assertThat(() => assertIsEntityConstructor(Alarm)).throws(expectedError)
      })
    })
  })
})
