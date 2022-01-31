declare const validUUID: unique symbol;
const nullUUID = "00000000-0000-0000-0000-000000000000"
export type UUID = string & {[validUUID]: true}


export function assertValidUUID(input: string): asserts input is UUID {
  let s = "" + input;
  const match = s.match('^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
  if (match === null) {
    throw new Error(`The string: ${input} is not a valid UUID`);
  }
}

assertValidUUID(nullUUID)
export const EmptyUUID: UUID =  nullUUID
