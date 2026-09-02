export interface AvatarOption {
    id: string;
    name: string;
    tag: string;
    url: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
    // Row 1: Yellow Neon Accents (#FFDE59)
    {
        id: 'user-01',
        name: 'Kenji',
        tag: 'RONIN',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Kenji&backgroundColor=FFDE59',
    },
    {
        id: 'user-02',
        name: 'Ami',
        tag: 'STRIKER',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ami&backgroundColor=FFDE59',
    },
    {
        id: 'user-03',
        name: 'Ren',
        tag: 'EXPLORER',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ren&backgroundColor=FFDE59',
    },

    // Row 2: Sky Blue Accents (#70CFF8)
    {
        id: 'user-04',
        name: 'Daiki',
        tag: 'SCHOLAR',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Daiki&backgroundColor=70CFF8',
    },
    {
        id: 'user-05',
        name: 'Hana',
        tag: 'SENSEI',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Hana&backgroundColor=70CFF8',
    },
    {
        id: 'user-06',
        name: 'Sora',
        tag: 'PILOT',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Sora&backgroundColor=70CFF8',
    },

    // Row 3: Neon Lime Accents (#A3E636)
    {
        id: 'user-07',
        name: 'Taro',
        tag: 'CADET',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Taro&backgroundColor=A3E636',
    },
    {
        id: 'user-08',
        name: 'Yuki',
        tag: 'TACTICIAN',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Yuki&backgroundColor=A3E636',
    },
    {
        id: 'user-09',
        name: 'Ryo',
        tag: 'VANGUARD',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Ryo&backgroundColor=A3E636',
    },

    // Row 4: Neon Purple Accents (#C084FC)
    {
        id: 'user-10',
        name: 'Kaito',
        tag: 'SHADOW',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Kaito&backgroundColor=C084FC',
    },
    {
        id: 'user-11',
        name: 'Mei',
        tag: 'KUNOICHI',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Mei&backgroundColor=C084FC',
    },
    {
        id: 'user-12',
        name: 'Shin',
        tag: 'DUELIST',
        url: 'https://api.dicebear.com/7.x/notionists/svg?seed=Shin&backgroundColor=C084FC',
    },
];

export default AVATAR_OPTIONS;