import type { Page } from '@playwright/test';

export const visualFixtureStates = [
    'shell-loading',
    'home',
    'kanji-study',
    'lobby',
    'assessment-preparing',
] as const;

export type VisualFixtureState = (typeof visualFixtureStates)[number];

export const statusMap: Record<VisualFixtureState, string> = {
    // There is no shell-loading AppStatus; selector is the app's default route.
    'shell-loading': 'selector',
    home: 'selector',
    'kanji-study': 'kanji-study',
    lobby: 'lobby',
    'assessment-preparing': 'assessment-preparing',
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

const room = (state: VisualFixtureState) => ({
    code: roomCode,
    status: state === 'assessment-preparing' ? 'preparing' : 'waiting',
    mode: 'standard',
    deckType: 'kanji',
    selectedGroups: [kanjiGroupId],
    currentCardIndex: 0,
    cards: kanjiItems,
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

export async function openVisualFixture(page: Page, state: VisualFixtureState) {
    const fixtureRoom = room(state);
    const hasRoom = state === 'lobby' || state === 'assessment-preparing';

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

    await page.addInitScript(({ hasRoom: shouldSeedRoom, roomPayload }) => {
        (window as any).__PLAYWRIGHT_VISUAL_TEST__ = true;
        window.localStorage.setItem('ganbatte-session-key', 'visual-regression-session');

        if (shouldSeedRoom) {
            window.localStorage.setItem('ganbatte-room-session', JSON.stringify({
                roomCode: '7K4M',
                username: 'Test Learner',
                sessionKey: 'visual-regression-session',
            }));
            window.localStorage.setItem('ganbatte-active-room', JSON.stringify(roomPayload));
        } else {
            window.localStorage.removeItem('ganbatte-room-session');
            window.localStorage.removeItem('ganbatte-active-room');
        }
    }, { hasRoom, roomPayload: fixtureRoom });

    await page.goto(`/?visualState=${statusMap[state]}`, { waitUntil: 'domcontentloaded' });
    await page.locator('body').waitFor({ state: 'visible' });
    await page.waitForLoadState('networkidle');
}