# Ganbatte 頑張って - Kana Reading Assessment

A real-time, multiplayer web app for testing Kana (Japanese hiragana and katakana) reading skills. Two players can join a room and go through flashcards together, typing the romaji for each Kana character with intelligent input validation.

## Features

✨ **Real-time Socket Connection**: Automatic WebSocket connection for live multiplayer synchronization  
🚪 **Room Management**: Create a room and share the code with friends via shareable links  
👥 **Multiplayer Gameplay**: Two players can join the same room for a synchronized shared assessment  
🃏 **Flashcard Assessment**: Interactive flashcard interface displaying Kana characters  
📝 **Smart Romaji Input**: Type romaji (Latin characters) with intelligent tokenization and normalization  
✅ **Advanced Input Validation**: Handles variations like "shi/si", "tsu/tu", "wo/o" with smart normalization  
📊 **Real-time Feedback**: Immediate correct/incorrect response as you type  
🏆 **Detailed Results**: View assessment results with player scoring and answer breakdowns  
🔗 **Shareable Links**: Pass room code via URL parameters for easy joining  

## Technology Stack

- **Frontend**: React 18 + Vite
- **Backend**: Express.js + Socket.io
- **Real-time Communication**: Socket.io WebSockets
- **Build Tool**: Vite
- **Package Manager**: npm

## Project Structure

```
ganbatte/
├── server/                    # Express + Socket.io backend
│   ├── index.js              # Main server file with room management & socket handlers
│   └── package.json
├── client/                    # React frontend with Vite
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx          # Entry point
│       ├── App.jsx           # Main app component with state management
│       ├── App.css
│       ├── index.css
│       └── components/
│           ├── RoomSelector.jsx       # Room creation & joining UI
│           ├── RoomSelector.css
│           ├── RoomLobby.jsx          # Waiting room for players
│           ├── RoomLobby.css
│           ├── Assessment.jsx         # Flashcard assessment interface
│           ├── Assessment.css
│           ├── Results.jsx            # Results & scoring display
│           └── Results.css
└── package.json              # Root workspace configuration
```

## Setup & Installation

### Prerequisites
- **Node.js** v14 or higher
- **npm** (comes with Node.js)

### Installation Steps

1. **Navigate to the project directory**
```bash
cd ganbatte
```

2. **Install root dependencies**
```bash
npm install
```

3. **Install server dependencies**
```bash
cd server && npm install && cd ..
```

4. **Install client dependencies**
```bash
cd client && npm install && cd ..
```

## Running the Application

### Development Mode (Recommended)

Run both server and client concurrently:

```bash
npm run dev
```

**Output:**
- **Server**: Running on `http://localhost:3001`
- **Client**: Running on `http://localhost:5173` (Vite dev server)

### Individual Commands

**Start server only** (file watching enabled):
```bash
npm run server:dev
```

**Start client only** (Vite dev server):
```bash
npm run client:dev
```

**Build for production**:
```bash
npm run build
```

**Start production server**:
```bash
npm start
```

## How to Play

1. **Start the App**: Open `http://localhost:5173` in your browser
2. **Choose Your Role**:
   - Click **Create Room** to host a new assessment
   - Click **Join Room** to join an existing room by entering a room code
3. **Invite a Friend**:
   - Share the room code displayed on the lobby screen
   - Or share the URL with the room code: `http://localhost:5173?room=ROOMCODE`
4. **Take the Assessment**:
   - When both players are ready, the assessment starts
   - A Kana character appears on screen
   - Type the romaji (Latin characters) for that character
   - Press Enter or click Submit to move to the next card
5. **View Results**:
   - After all cards are completed, see your performance
   - Results show correct/incorrect counts for each player
   - Option to review answers and take another assessment

## Romaji Input Rules

The app supports flexible romaji input with smart normalization:

- **Case-insensitive**: "KA" = "ka" = "Ka"
- **Whitespace-tolerant**: "k a" = "ka"
- **Alternative spellings**:
  - "shi" or "si" both accepted for しゆ
  - "chi" or "ti" both accepted for ちゆ
  - "tsu" or "tu" both accepted for つゆ
  - "fu" or "hu" both accepted for ふゆ
  - "wo" automatically normalized to "o"
- **Long vowels**: Supports multiple romanization patterns

## API & Socket Events

### Server Socket Events

- `create-room`: Create a new assessment room
- `join-room`: Join an existing room with code
- `get-room`: Retrieve current room data
- `set-cards`: Set custom card deck for a room
- `start-assessment`: Begin the assessment
- `submit-answer`: Submit an answer for a card
- `get-assessment-results`: Fetch final results

### Client Events Received

- `room-created`: Emitted when a room is successfully created
- `player-joined`: Emitted when a player joins the room
- `assessment-started`: Emitted when assessment begins
- `next-card`: Emitted when advancing to next card
- `assessment-completed`: Emitted when all cards are answered
- `cards-updated`: Emitted when card deck is updated

## Development Notes

- The server generates random 6-character room codes
- Each room stores up to 2 players
- Kana cards are generated with associated romaji answers
- Input tokenization splits complex romaji into syllables for validation
- Results are computed in real-time as answers are submitted

### Start Production Server
```bash
npm start
```

## How to Use

1. **Open the app** in your browser at http://localhost:5173
2. **Create a Room** or **Join a Room**:
   - Click "Create Room" to start a new assessment
   - Share the displayed room code with your friend
   - They can click "Join Room" and enter the code
3. **Start Assessment** once both players have joined
4. **View Kana Character** displayed as a large character on the flashcard
5. **Type the Romaji** (Latin characters) in the input field
6. **Submit Answer** to get feedback
7. **View Results** - see both players' answers after completion

## API Endpoints

### REST API
- `GET /api/kana-cards` - Get all kana cards with kana and romaji

### WebSocket Events

**Client → Server:**
- `create-room` - Create a new room
- `join-room` - Join an existing room
- `start-assessment` - Start the assessment
- `submit-answer` - Submit answer for current card
- `next-card` - Move to next card

**Server → Client:**
- `room-created` - Room created successfully
- `player-joined` - A player joined the room
- `assessment-started` - Assessment has started
- `answer-submitted` - An answer was submitted
- `card-updated` - Move to next card
- `assessment-completed` - Assessment completed
- `player-left` - A player left the room

## Kana Cards Included

The app includes Hiragana and Katakana:
- **Hiragana**: あ, い, う, え, お, か, き, く, け, こ, さ, し, す, せ, そ
- **Katakana**: ア, イ, ウ, エ, オ

## Customization

### Adding More Kana Cards
Edit `server/index.js` in the `getKanaCards()` function to add more cards:

```javascript
function getKanaCards() {
  return [
    { kana: 'あ', romaji: 'a', hiragana: true },
    // Add more cards here
  ];
}
```

### Styling
Customize colors and styles by editing the CSS files in `client/src/`.

## Technologies Used

- **Backend**: Express.js, Socket.io
- **Frontend**: React 18, Vite
- **Styling**: CSS3
- **Communication**: WebSockets (Socket.io)

## Future Enhancements

- [ ] Add more kana characters (full hiragana/katakana sets)
- [ ] Difficulty levels (beginner, intermediate, advanced)
- [ ] Score calculation and leaderboards
- [ ] User authentication
- [ ] Database persistence
- [ ] Mobile app version
- [ ] Sound effects and animations

## License

MIT

## Author

Archit Nautiyal
