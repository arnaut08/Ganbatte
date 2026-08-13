# Ganbatte 頑張って - Kana Reading Assessment

A real-time, multiplayer web app for testing Kana reading skills. Two players can join a room and go through flashcards together, typing the romaji for each Kana character.

## Features

✨ **Socket Connection**: Automatic socket connection when opening the app
🚪 **Room Management**: Create a room and share the code with a friend
👥 **Multiplayer**: Two players can join the same room for a shared assessment
🃏 **Flashcard Assessment**: Flash card style interface with Kana characters
📝 **Romaji Input**: Type the romaji (Latin characters) to answer each card
📊 **Real-time Feedback**: Immediate feedback on correct/incorrect answers
🏆 **Results**: View assessment results and answers at the end

## Project Structure

```
ganbatte/
├── server/              # Express + Socket.io backend
│   ├── index.js        # Main server file
│   └── package.json
├── client/             # React frontend
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── components/
│   │       ├── RoomSelector.jsx
│   │       ├── RoomLobby.jsx
│   │       ├── Assessment.jsx
│   │       ├── Results.jsx
│   │       └── (respective CSS files)
│   ├── vite.config.js
│   └── package.json
└── package.json        # Root package for workspace scripts
```

## Setup & Installation

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation

1. **Clone/Navigate to the project directory**
```bash
cd ganbatte
```

2. **Install dependencies for both server and client**
```bash
npm install
```

This will install the root dependencies and prepare both server and client.

3. **Install server dependencies**
```bash
cd server
npm install
```

4. **Install client dependencies**
```bash
cd client
npm install
cd ..
```

## Running the App

### Development Mode
Run both server and client simultaneously:

```bash
npm run dev
```

This will start:
- **Server**: http://localhost:3001
- **Client**: http://localhost:5173

### Server Only
```bash
npm run server:dev
```

### Client Only
```bash
npm run client:dev
```

### Production Build
```bash
npm run build
```

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
