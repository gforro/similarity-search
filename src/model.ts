import * as z from "zod/v4";

const Person = z.object({
  id: z.number(),
  name: z.string(),
  title: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
});

const DataFile = z.array(Person);

export type PersonType = z.infer<typeof Person>;

export { Person, DataFile };
