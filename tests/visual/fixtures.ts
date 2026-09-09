import type { Page } from '@playwright/test';

export const visualFixtureStates = [
    'shell-loading',
    'home',
    'friends',
    'profile',
    'kana-intro',
    'kana-filter',
    'kana-study',
    'kanji-intro',
    'kanji-study',
    'vocab-intro',
    'vocab-study',
    'grammar-intro',
    'grammar-study',
    'grammar-practice',
    'lobby',
    'assessment-preparing',
    'assessment',
    'results',
    'history',
    'passport',
    'gauntlet',
] as const;

export type VisualFixtureState = (typeof visualFixtureStates)[number];

export const statusMap: Record<VisualFixtureState, string> = {
    // There is no shell-loading AppStatus; selector is the app's default route.
    'shell-loading': 'selector',
    home: 'selector',
    friends: 'friends',
    profile: 'profile',
    'kana-intro': 'kana-intro',
    'kana-filter': 'kana-filter',
    'kana-study': 'kana-study',
    'kanji-intro': 'kanji-intro',
    'kanji-study': 'kanji-study',
    'vocab-intro': 'vocab-intro',
    'vocab-study': 'vocab-study',
    'grammar-intro': 'grammar-intro',
    'grammar-study': 'grammar-study',
    'grammar-practice': 'grammar-practice',
    lobby: 'lobby',
    'assessment-preparing': 'assessment-preparing',
    assessment: 'assessment',
    results: 'results',
    history: 'history',
    passport: 'passport',
    gauntlet: 'gauntlet',
};

const sessionKey = 'visual-regression-session';
const roomCode = '7K4M';
const kanjiGroupId = 'n5-foundations';

const kanjiItems = [
    {
        id: 'kanji-1',
        kanji: '学',
        reading: 'がく / まな.ぶ',
        romaji: 'gaku / mana.bu',
        meaning: 'learn',
        groupId: kanjiGroupId,
        example: ['学校で学ぶ。', 'Learn at school.'],
        progress: null,
    },
];

const kanjiGroups = [
    {
        group_id: kanjiGroupId,
        theme: 'N5 Foundations',
        total_characters: 1,
        learned_characters: 0,
        mastered_characters: 0,
        due_characters: 0,
        quiz_passed: false,
        is_cleared: false,
        is_mastered: false,
    },
];

const kanaItems = [
    {
        id: 'kana-1',
        kana: 'あ',
        romaji: 'a',
        script: 'hiragana',
        groupName: 'Hiragana Basic',
        mnemonic: 'あめ (ame) starts with あ.',
        example: ['あさ', 'asa', 'morning'],
    },
];

const kanaMatrices = [
    {
        id: 'hiragana-basic',
        name: 'Hiragana Basic',
        script: 'hiragana',
        type: 'basic',
        columns: ['あ', 'い', 'う', 'え', 'お'],
        rows: [{ id: 'vowels', label: 'V', cells: ['あ', 'い', 'う', 'え', 'お'] }],
        extras: [],
    },
];

const grammarLessons = [
    {
        lessonNumber: 1,
        content: {
            lessonNumber: 1,
            title: 'です / ではありません',
            overview: 'Introduce yourself and identify people and things.',
            objectives: ['Use は to mark the topic.', 'Use です for polite statements.'],
            grammarPoints: [{
                pattern: 'N は N です',
                meaning: 'A is B.',
                formation: 'Noun は noun です',
                examples: [{ japanese: 'わたしは学生です。', furigana: 'わたしはがくせいです。', romaji: 'Watashi wa gakusei desu.', english: 'I am a student.' }],
            }],
            commonMistakes: ['Do not omit です in formal introductions.'],
            reviewChecklist: ['Can you introduce yourself politely?'],
        },
    },
];

const grammarQuestions = [
    {
        id: 'grammar-1',
        type: 'multiple-choice',
        lesson: 1,
        lessonNumber: 1,
        prompt: 'わたし___学生です。',
        question: 'Choose the particle that completes the sentence.',
        choices: ['は', 'を', 'に', 'で'],
        correctAnswer: 'は',
        explanation: 'は marks the topic of the sentence.',
    },
];

const results = [
    {
        userId: 'test-user-id',
        username: 'Test Learner',
        name: 'Test Learner',
        score: 90,
        correct: 9,
        total: 10,
        accuracy: 90,
        answers: ['gaku'],
        isWinner: true,
    },
    {
        userId: 'opponent-id',
        username: 'Learner 02',
        name: 'Learner 02',
        score: 80,
        correct: 8,
        total: 10,
        accuracy: 80,
        answers: ['manabu'],
        isWinner: false,
    },
];

const profile = {
    id: 'test-user-id',
    username: 'Test Learner',
    displayName: 'Test Learner',
    fullName: 'Test Learner',
    email: 'test@ganbatte.app',
    bio: 'Building a steady Japanese study habit.',
    avatarUrl: null,
    createdAt: '2026-01-15T00:00:00.000Z',
};

const friends = [
    {
        id: 'friend-1',
        userId: 'opponent-id',
        user_id: 'opponent-id',
        display_name: 'Learner 02',
        online: true,
    },
];

const friendRequests = [
    {
        id: 'friend-request-1',
        sender_id: 'opponent-id',
        receiver_id: 'test-user-id',
        status: 'pending',
        direction: 'incoming',
        sender: friends[0],
    },
];

const assessmentHistory = [
    {
        id: 'assessment-1',
        assessment_type: 'kanji',
        score_percentage: 90,
        correct_questions: 9,
        total_questions: 10,
        created_at: '2026-09-04T12:00:00.000Z',
        companion_user_id: 'opponent-id',
        details: { groups: [kanjiGroupId], hints_used: [0, 1] },
        profile: { display_name: 'Learner 02' },
    },
];

const grammarOverview = {
    total_lessons: 12,
    lessons: [{
        lesson_number: 1,
        is_cleared: true,
        is_mastered: false,
        best_score: 80,
        total_attempts: 2,
    }],
};

const vocabOverview = {
    level: 'N5',
    stages: [{
        stage_number: 1,
        theme: 'Daily Life',
        total_words: 10,
        learned_words: 4,
        mastered_words: 2,
        due_words: 1,
        quiz_passed: true,
        is_cleared: true,
        is_mastered: false,
    }],
};

const characterAttempts = [{
    character_id: 'kana-1',
    character: 'あ',
    correct_streak: 2,
    total_attempts: 4,
}];

const room = (state: VisualFixtureState) => ({
    code: roomCode,
    status: state === 'assessment-preparing'
        ? 'preparing'
        : state === 'results' || state === 'gauntlet'
            ? 'finished'
            : 'waiting',
    mode: 'standard',
    deckType: state === 'grammar-practice' ? 'grammar' : 'kanji',
    selectedGroups: [kanjiGroupId],
    currentCardIndex: 0,
    cards: state === 'grammar-practice' ? grammarQuestions : kanjiItems,
    winnerUserId: state === 'results' || state === 'gauntlet' ? 'test-user-id' : null,
    winnerSocketId: state === 'gauntlet' ? 'visual-host-socket' : null,
    players: [
        {
            id: 'visual-host-socket',
            userId: 'test-user-id',
            sessionKey,
            name: 'Test Learner',
            ready: true,
            connected: true,
            presence: 'in_lobby',
            status: 'ready',
            answers: [],
            hintsUsed: [],
        },
        {
            id: 'visual-opponent-socket',
            userId: 'opponent-id',
            sessionKey: 'visual-opponent-session',
            name: 'Learner 02',
            ready: true,
            connected: true,
            presence: 'in_lobby',
            status: 'ready',
            answers: [],
            hintsUsed: [],
        },
    ],
});

async function waitForLoadedContent(page: Page, state: VisualFixtureState) {
    const loadedContent = {
        'kana-filter': page.getByText('Hiragana Basic', { exact: true }),
        'kana-study': page.getByText('あ', { exact: true }).first(),
        'grammar-study': page.getByRole('button', { name: /Lesson 1/i }).first(),
        'grammar-practice': page.getByRole('heading', { name: 'Grammar Practice' }),
        friends: page.getByText('Learner 02', { exact: true }).first(),
        history: page.getByText('90%', { exact: true }),
        passport: page.getByText('01 // KANA MASTERY', { exact: true }),
        assessment: page.getByRole('heading', { name: 'Kanji Assessment' }),
        results: page.getByText('Test Learner', { exact: true }).first(),
        gauntlet: page.getByText('1v1 GAUNTLET // KANJI N5 SPRINT', { exact: true }),
    }[state];

    if (loadedContent) await loadedContent.waitFor({ state: 'visible' });
}

export async function openVisualFixture(page: Page, state: VisualFixtureState) {
    const fixtureRoom = room(state);
    const hasRoom = [
        'lobby',
        'assessment-preparing',
        'assessment',
        'results',
        'gauntlet',
        'grammar-practice',
    ].includes(state);

    // useAuth's visual bypass avoids the Supabase auth state machine. These
    // responses cover the session lookup if a configured client still asks for it.
    await page.route('**/auth/v1/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                access_token: 'mock-jwt-token',
                refresh_token: 'mock-refresh-token',
                expires_in: 3600,
                token_type: 'bearer',
                user: {
                    id: 'test-user-id',
                    email: 'test@ganbatte.app',
                    aud: 'authenticated',
                    role: 'authenticated',
                    user_metadata: { full_name: 'Test Learner' },
                },
            }),
        });
    });

    // KanjiStudy consumes these transformed server API responses.
    await page.route('**/api/kanji/overview**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ groups: kanjiGroups }),
        });
    });

    await page.route(`**/api/kanji/group/${kanjiGroupId}**`, async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ group_id: kanjiGroupId, items: kanjiItems }),
        });
    });

    // This is the practice-deck endpoint backed by kanji_groups and
    // kanji_characters, not a direct Supabase table request.
    await page.route('**/api/kanji-cards**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                groups: [{ id: kanjiGroupId, name: 'N5 Foundations', cards: kanjiItems }],
                cards: kanjiItems,
            }),
        });
    });

    await page.route('**/api/kana-cards**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ cards: kanaItems, groups: [], matrices: kanaMatrices }),
        });
    });
    await page.route('**/api/character-attempts**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ attempts: characterAttempts }),
        });
    });
    await page.route('**/api/vocab/overview**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(vocabOverview),
        });
    });
    await page.route('**/api/pvp-record**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ record: { totalMatches: 4, wins: 3, losses: 1, ties: 0, winRate: 75 } }),
        });
    });

    await page.route('**/api/grammar/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ questions: grammarQuestions, lessons: grammarQuestions }),
        });
    });
    await page.route('**/api/grammar-lessons**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(grammarLessons),
        });
    });
    await page.route('**/api/grammar-lessons/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ questions: grammarQuestions }),
        });
    });

    await page.route('**/api/account/**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ profile, user: profile }),
        });
    });
    await page.route('**/api/profile**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(profile),
        });
    });
    await page.route('**/api/friends**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(friends),
        });
    });
    await page.route('**/api/friend-requests**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(friendRequests),
        });
    });
    await page.route('**/api/assessments/history**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(assessmentHistory),
        });
    });
    await page.route('**/api/assessment-history**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ assessments: assessmentHistory, history: assessmentHistory }),
        });
    });
    await page.route('**/api/results**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ results }),
        });
    });

    await page.route('**/rest/v1/profiles**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([profile]),
        });
    });
    await page.route('**/rest/v1/friends**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(friends),
        });
    });
    await page.route('**/rest/v1/assessment_results**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            headers: { 'content-range': `0-${assessmentHistory.length - 1}/${assessmentHistory.length}` },
            body: JSON.stringify(assessmentHistory),
        });
    });
    await page.route('**/rest/v1/rpc/get_grammar_overview**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(grammarOverview),
        });
    });

    await page.route('**/api/assessments/active-session**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ user_in_active_match: hasRoom, room: hasRoom ? fixtureRoom : null }),
        });
    });

    // Keep the raw table contracts accurate if a future visual path uses the
    // Supabase client directly: kanji_groups, kanji_characters,
    // user_kanji_progress, and user_kanji_quiz_results.
    await page.route('**/rest/v1/kanji_groups**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: kanjiGroupId, name: 'N5 Foundations', sort_order: 0 }]),
        });
    });
    await page.route('**/rest/v1/kanji_characters**', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([{ id: 'kanji-1', group_id: kanjiGroupId, character: '学', readings: ['がく', 'まな.ぶ'], romaji: 'gaku / mana.bu', meaning: 'learn', example_japanese: '学校で学ぶ。', example_english: 'Learn at school.', sort_order: 0 }]),
        });
    });
    await page.route('**/rest/v1/user_kanji_progress**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
    await page.route('**/rest/v1/user_kanji_quiz_results**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    await page.addInitScript(({ hasRoom: shouldSeedRoom, roomPayload, resultsPayload }) => {
        (window as any).__PLAYWRIGHT_VISUAL_TEST__ = true;
        localStorage.removeItem('ganbatte-room-session');
        localStorage.removeItem('ganbatte-active-room');
        localStorage.removeItem('ganbatte-session-key');
        window.localStorage.setItem('ganbatte-session-key', 'visual-regression-session');
        (window as any).__PLAYWRIGHT_VISUAL_ROOM__ = shouldSeedRoom ? roomPayload : null;
        (window as any).__PLAYWRIGHT_VISUAL_RESULTS__ = resultsPayload;

    }, {
        hasRoom,
        roomPayload: fixtureRoom,
        resultsPayload: state === 'results' ? results : null,
    });

    await page.goto(`/?visualState=${statusMap[state]}`, { waitUntil: 'domcontentloaded' });
    await page.locator('body').waitFor({ state: 'visible' });
    await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
            Array.from(document.images).map((image) => image.decode().catch(() => undefined)),
        );
        await new Promise<void>((resolve) => {
            requestAnimationFrame(() => requestAnimationFrame(resolve));
        });
    });
    await waitForLoadedContent(page, state);
}