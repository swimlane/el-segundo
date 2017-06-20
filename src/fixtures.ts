const leia: any = {
  role: 'General',
  name: {
    first: 'Leia',
    second: 'Organa'
  },
  siblings: [],
  $hidden: false
};

const luke: any = {
  role: 'Jedi',
  name: {
    first: 'Luke',
    second: 'Skywalker'
  },
  siblings: [leia],
  $hidden: true
};

leia.siblings.push(luke);

export { leia, luke };

export const fixture = {
  title: 'this is the title',
  string: 'this is a string',
  'nested items': {
    string: 'this is also string'
  },
  array: ['an', 1, 'array', { a: 123, b: 456 }],
  sub: {
    _id: '593d866f3be3d23990da4b4e',
    index: 0,
    guid: '3f3a38f5-48f7-4d08-ac49-24e1f6d79a4e',
    isActive: false,
    balance: '$2,818.36',
    picture: 'http://placehold.it/32x32',
    age: 31,
    eyeColor: 'green',
    name: {
      first: 'Gomez',
      last: 'Bryan'
    },
    company: 'ZOID',
    email: 'gomez.bryan@zoid.info',
    phone: '+1 (852) 549-3677',
    address: '915 Osborn Street, Clay, New York, 7776',
    about: 'Nulla commodo est aute quis. Sunt occaecat officia eu ullamco laboris adipisicing cupidatat culpa voluptate culpa exercitation magna fugiat aliqua. Nostrud Lorem irure aliqua irure in eu laborum id do minim consectetur.',
    registered: 'Thursday, April 13, 2017 2:52 PM',
    latitude: 37.197061,
    longitude: 135.771568
  },
  characters: {
    leia,
    luke
  },
  trickyValues: {
    nan: NaN,
    'null': null,
    nZero: -0,
    pZero: +0
  }
};
