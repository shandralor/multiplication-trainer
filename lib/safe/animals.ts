export type Animal = {
  tableIndex: number
  slug: string
  nameNl: string
  pngPath: string
}

export const ANIMALS: ReadonlyArray<Animal> = [
  { tableIndex: 1,  slug: 'chick',    nameNl: 'Kuiken',   pngPath: '/animals/01-chick.png' },
  { tableIndex: 2,  slug: 'duck',     nameNl: 'Eend',     pngPath: '/animals/02-duck.png' },
  { tableIndex: 3,  slug: 'rabbit',   nameNl: 'Konijn',   pngPath: '/animals/03-rabbit.png' },
  { tableIndex: 4,  slug: 'dog',      nameNl: 'Hond',     pngPath: '/animals/04-dog.png' },
  { tableIndex: 5,  slug: 'pig',      nameNl: 'Varken',   pngPath: '/animals/05-pig.png' },
  { tableIndex: 6,  slug: 'panda',    nameNl: 'Panda',    pngPath: '/animals/06-panda.png' },
  { tableIndex: 7,  slug: 'monkey',   nameNl: 'Aap',      pngPath: '/animals/07-monkey.png' },
  { tableIndex: 8,  slug: 'bear',     nameNl: 'Beer',     pngPath: '/animals/08-bear.png' },
  { tableIndex: 9,  slug: 'giraffe',  nameNl: 'Giraffe',  pngPath: '/animals/09-giraffe.png' },
  { tableIndex: 10, slug: 'elephant', nameNl: 'Olifant',  pngPath: '/animals/10-elephant.png' },
]

export function getAnimalForTable(tableIndex: number): Animal {
  const animal = ANIMALS.find((a) => a.tableIndex === tableIndex)
  if (!animal) {
    throw new Error(`No animal mapped for tableIndex ${tableIndex}`)
  }
  return animal
}

/**
 * Emoji stand-ins for the animal PNGs, for places too small to justify
 * loading the art: the home strip, the kluiskamer row, a toast.
 */
export const ANIMAL_EMOJI: Record<number, string> = {
  1: '🐥', 2: '🦆', 3: '🐰', 4: '🐶', 5: '🐷',
  6: '🐼', 7: '🐵', 8: '🐻', 9: '🦒', 10: '🐘',
}
